# src/agents/analysis_agent/grok_reasoner.py
import os
import re
import json
import requests
from typing import List, Dict, Tuple, Optional
from dotenv import load_dotenv

# --------- Config (env) ----------
load_dotenv()
XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_MODEL   = os.getenv("XAI_MODEL", "grok-3-mini")

# --------- Small helpers ----------
EMOJI_RE = re.compile(r"[\U00010000-\U0010ffff]")

def _strip_noise(text: str) -> str:
    """Light cleaner to keep answers/context tidy (docs already cleaned at ingestion)."""
    t = EMOJI_RE.sub("", text or "")
    return re.sub(r"\s+", " ", t).strip()

def _smart_trim(s: str, limit: int) -> str:
    s = (s or "").strip()
    if len(s) <= limit:
        return s
    cut = s[:limit].rsplit(" ", 1)[0]
    return (cut or s[:limit]).rstrip(".,;:-") + "…"

def _approx_tokens(s: str) -> int:
    # Very rough: ~4 chars ≈ 1 token; good enough for budgeting
    return max(1, len((s or "")) // 4)

def _format_history(history: List[Dict]) -> str:
    if not history:
        return ""
    lines = []
    for msg in history:
        role = "User" if msg.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {_strip_noise(msg.get('content', ''))}")
    return "\n".join(lines)

# --------- Dynamic context sizing ----------
def _choose_doc_char_budget(
    docs: List[Dict],
    total_ctx_tokens: int,
    sys_and_instr_tokens: int,
    reserve_answer_tokens: int = 500,
) -> Tuple[int, int]:
    """
    Decide how many docs and how many chars per doc we can include.
    Returns: (#docs_to_use, per_doc_char_limit)
    """
    available_tokens = max(250, total_ctx_tokens - sys_and_instr_tokens - reserve_answer_tokens)
    MAX_DOCS = min(12, len(docs))   # keep list manageable for the model
    MIN_PER_DOC_CHARS = 220         # still readable
    MAX_PER_DOC_CHARS = 700         # avoid bloat per doc

    for k in range(MAX_DOCS, 0, -1):
        available_chars = available_tokens * 4  # chars ≈ tokens*4
        per_doc_chars = available_chars // k
        if per_doc_chars >= MIN_PER_DOC_CHARS:
            return k, min(per_doc_chars, MAX_PER_DOC_CHARS)

    return 1, MIN_PER_DOC_CHARS  # worst case

def _build_context_dynamic(docs: List[Dict], total_ctx_tokens: int = 3800) -> Tuple[str, List[Dict], int]:
    """
    Build a numbered context string using a dynamic per-doc char budget.
    Returns: (context_text, sources_list, used_tokens_estimate)
      - sources_list: [{idx,id,title,link,snippet}]
    """
    sys_and_instr_tokens = 250  # approx cost for system/instructions

    n_keep, per_doc_chars = _choose_doc_char_budget(
        docs,
        total_ctx_tokens=total_ctx_tokens,
        sys_and_instr_tokens=sys_and_instr_tokens,
        reserve_answer_tokens=500,
    )

    items, used, total_chars = [], [], 0
    for i, d in enumerate(docs[:n_keep], start=1):
        title = d.get("title") or _strip_noise(d.get("context", ""))[:60]
        ctx   = _strip_noise(d.get("context", ""))
        link  = d.get("link")
        did   = d.get("id") or (link.split("/")[-1] if link else f"doc{i}")
        snip  = _smart_trim(ctx, per_doc_chars)

        block = f"[{i}] {title}\n{snip}\nLINK: {link or ''}\n"
        items.append(block)
        used.append({"idx": i, "id": did, "title": title, "link": link, "snippet": snip})
        total_chars += len(block)

    used_tokens_est = sys_and_instr_tokens + _approx_tokens("\n".join(items))
    return "\n".join(items), used, used_tokens_est

# --------- Main agent ----------
def answer_with_grok(
    question: str,
    docs: List[Dict],
    token_budget_tokens: int = 3800,
    model_answer_tokens: int = 500,
) -> Dict:
    """
    Dynamically sizes context to stay within token budget.
    Returns: {"answer": str, "sources": [ {idx,id,title,link,snippet} ]}
    """
    ctx, sources, used_ctx_tokens = _build_context_dynamic(
        docs,
        total_ctx_tokens=token_budget_tokens
    )
    if not sources:
        return {"answer": "I couldn’t find relevant context.", "sources": []}

    sys_prompt = (
        "You are a financial information assistant. "
        "Answer ONLY using the provided context. Do not add numbers you can’t justify from context. "
        "Be concise, risk-aware, and cite with bracket indices like [1], [2]."
    )
    user_prompt = (
        f"Question:\n{question}\n\n"
        f"Context (numbered sources):\n{ctx}\n\n"
        "Instructions:\n"
        "1) Use the context only; no external facts.\n"
        "2) Add inline citations like [1], [3] where appropriate.\n"
        "3) If context is insufficient, say what’s missing concisely.\n"
    )

    if not XAI_API_KEY:
        first = sources[0]
        other = f" [{sources[1]['idx']}]" if len(sources) > 1 else ""
        return {
            "answer": f"Model offline. From the snippets: {_smart_trim(first['snippet'], 220)} [{first['idx']}]"+other,
            "sources": sources
        }

def live_trade_recommendation(
    token: str,
    docs: List[Dict],
    question: Optional[str] = None,
) -> Dict:
    if not docs:
        return {
            "analysis": "Insufficient context to suggest a trade.",
            "trade_plan": {
                "side": "hold",
                "asset": token,
                "amount": 0,
                "confidence": 0.0,
                "notes": "No recent documents available.",
            },
        }

    ctx, sources, _ = _build_context_dynamic(docs)
    system_prompt = (
        "You are a live-trading strategist. Read the provided context and output a structured trade idea.\n"
        "Respond in STRICT JSON like:\n"
        "{\n"
        '  "analysis": "short reasoning with references like [1]",\n'
        '  "trade_plan": {\n'
        '     "side": "buy|sell|hold",\n'
        '     "asset": "TOKEN",\n'
        '     "amount": number_of_units,\n'
        '     "confidence": 0-1,\n'
        '     "notes": "execution notes"\n'
        "  }\n"
        "}"
    )
    live_question = question or f"Generate a tactical trade action for {token} right now."
    user_prompt = (
        f"Token: {token}\n"
        f"Objective: {live_question}\n\n"
        f"Context (numbered sources):\n{ctx}\n\n"
        "Rules:\n"
        "1) Use ONLY the provided context; cite indices in analysis.\n"
        "2) Amount is in units of the asset (e.g., 0.5 BTC). Choose a reasonable small number like 0.2 if unsure.\n"
        "3) If context is neutral or conflicting, choose HOLD with low confidence.\n"
    )

    if not XAI_API_KEY:
        return {
            "analysis": f"Model offline. Latest snippet: {_smart_trim(sources[0]['snippet'], 200)}",
            "trade_plan": {
                "side": "hold",
                "asset": token,
                "amount": 0,
                "confidence": 0.0,
                "notes": "Model unavailable.",
            },
        }

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": XAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.15,
                "max_tokens": 420,
            },
            timeout=20,
        )
        if resp.status_code != 200:
            raise RuntimeError(resp.text)
        data = resp.json()
        text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        cleaned = text.strip().strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        payload = json.loads(cleaned)
        analysis = payload.get("analysis") or "No analysis provided."
        trade_plan = payload.get("trade_plan") or {}
        trade_plan.setdefault("asset", token)
        if trade_plan.get("side") == "sell":
            trade_plan["side"] = "hold"
            trade_plan["amount"] = 0
            trade_plan["notes"] = "Sell signals are disabled; defaulting to hold."
        return {
            "analysis": _strip_noise(analysis),
            "trade_plan": trade_plan,
        }
    except Exception as e:
        return {
            "analysis": f"Live decision failed ({e}).",
            "trade_plan": {
                "side": "hold",
                "asset": token,
                "amount": 0,
                "confidence": 0.0,
                "notes": "Fallback hold recommendation.",
            },
        }

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": XAI_MODEL,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "max_tokens": model_answer_tokens,
            },
            timeout=20,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"xAI status {resp.status_code}: {resp.text}")
        data = resp.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        return {"answer": _strip_noise(content).strip(), "sources": sources}
    except Exception as e:
        first = sources[0]
        other = f" [{sources[1]['idx']}]" if len(sources) > 1 else ""
        return {
            "answer": f"Couldn’t reach the LLM ({e}). Summary: {_smart_trim(first['snippet'], 220)} [{first['idx']}]"+other,
            "sources": sources
        }

def chat_with_grok(
    docs: List[Dict],
    chat_history: List[Dict],
    token_budget_tokens: int = 3800,
    model_answer_tokens: int = 500,
) -> Dict:
    """
    Conversational flow that reuses cached docs and prior turns.
    chat_history should already include the most recent user turn.
    """
    ctx, sources, _ = _build_context_dynamic(
        docs,
        total_ctx_tokens=token_budget_tokens
    )
    if not sources:
        return {"answer": "I couldn’t find relevant context.", "sources": []}

    latest_user = None
    for msg in reversed(chat_history):
        if msg.get("role") == "user":
            latest_user = msg
            break
    if not latest_user:
        raise ValueError("chat_history must include at least one user message.")

    history_block = _format_history(chat_history)

    sys_prompt = (
        "You are a financial research analyst. Use only the supplied news context when answering, "
        "keep a professional tone, and cite sources like [1], [2]."
    )
    user_prompt = (
        f"Conversation so far:\n{history_block}\n\n"
        f"Market context (numbered sources):\n{ctx}\n\n"
        "Instructions:\n"
        "1) Respond to the latest user request while staying consistent with the conversation history.\n"
        "2) Use the provided sources for facts; include inline citations.\n"
        "3) Summarize risks or missing data if the context does not cover the request."
    )

    if not XAI_API_KEY:
        first = sources[0]
        snippet = _smart_trim(first["snippet"], 180)
        return {
            "answer": f"Model offline. Latest question: {latest_user['content']}\nSummary: {snippet} [{first['idx']}]",
            "sources": sources,
        }

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": XAI_MODEL,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.25,
                "max_tokens": model_answer_tokens,
            },
            timeout=20,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"xAI status {resp.status_code}: {resp.text}")
        data = resp.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        return {"answer": _strip_noise(content).strip(), "sources": sources}
    except Exception as e:
        first = sources[0]
        other = f" [{sources[1]['idx']}]" if len(sources) > 1 else ""
        return {
            "answer": f"Couldn’t reach the LLM ({e}). Latest snippet: {_smart_trim(first['snippet'], 200)} [{first['idx']}]"+other,
            "sources": sources
        }

# --------- Simple local test ---------
if __name__ == "__main__":
    question = "What is the sentiment of the latest BTC accumulation news?"
    docs = [
        {
            "id": "sample-1",
            "title": "BTC whale accumulation tops $500M",
            "context": (
                "On-chain data from multiple analytics firms show BTC whales have accumulated "
                "more than $500M in the past seven days despite choppy price action."
            ),
            "link": "https://example.com/btc"
        },
        {
            "id": "sample-2",
            "title": "ETF flows slow down",
            "context": (
                "Spot ETF inflows cooled this week, but analysts say the pullback looks like "
                "consolidation after a strong July rally."
            ),
            "link": "https://example.com/etf"
        },
    ]

    print("🔍 Testing Grok Reasoner with inline sample docs...\n")
    result = answer_with_grok(question, docs)

    print("=== Model Answer ===")
    print(result["answer"])
    print("\n=== Sources ===")
    print(json.dumps(result["sources"], indent=2, ensure_ascii=False))
