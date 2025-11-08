# src/agents/analysis_agent/grok_reasoner.py
import os
import re
import json
import requests
from typing import List, Dict, Tuple
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

# --------- Simple local test ---------
if __name__ == "__main__":
    sample_docs = [
        {
            "id": "demo-1",
            "title": "BTC whales trim holdings",
            "context": (
                "Large Bitcoin wallets moved coins to exchanges after a 12% rally, "
                "signaling profit taking and possible near-term volatility."
            ),
            "link": "https://example.com/btc-whales",
        }
    ]

    result = answer_with_grok("Is BTC momentum weakening?", sample_docs)

    print("=== Model Answer ===")
    print(result["answer"])
    print("\n=== Sources ===")
    print(json.dumps(result["sources"], indent=2, ensure_ascii=False))
