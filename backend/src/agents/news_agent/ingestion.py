# news_agent/ingestion.py
import os
import re
import json
import requests
from typing import List, Dict
from dotenv import load_dotenv
from xdk import Client

# ------------ helpers ------------
URL_RE    = re.compile(r"https?://\S+")
HANDLE_RE = re.compile(r"@\w+")
HASH_RE   = re.compile(r"[#\$][A-Za-z0-9_]+")
EMOJI_RE  = re.compile(r"[\U00010000-\U0010ffff]")

def _strip_noise(text: str) -> str:
    """Remove links, handles, hashtags, emojis; collapse whitespace."""
    t = URL_RE.sub("", text)
    t = HANDLE_RE.sub("", t)
    t = HASH_RE.sub("", t)
    t = EMOJI_RE.sub("", t)
    return re.sub(r"\s+", " ", t).strip()

def _smart_trim(s: str, limit: int = 90) -> str:
    """Trim at word boundary and add ellipsis if needed."""
    s = s.strip()
    if len(s) <= limit:
        return s
    cut = s[:limit].rsplit(" ", 1)[0]
    return (cut if cut else s[:limit]).rstrip(".,;:-") + "…"

# ------------ title via xAI (simple, with fallback) ------------
def generate_title_with_xai(text: str) -> str:
    """
    Create a concise title using xAI; fall back to a local heuristic on any error.
    Env: XAI_API_KEY (required for remote), XAI_MODEL (optional; default: grok-3-mini)
    """
    api_key = os.getenv("XAI_API_KEY")
    model   = os.getenv("XAI_MODEL", "grok-3-mini")
    base    = _strip_noise(text).split("\n", 1)[0] or text.split("\n", 1)[0]
    fallback = _smart_trim(base)

    if not api_key:
        return fallback

    clean = _strip_noise(text) or text  # keep raw if all noise
    prompt = (
        "Write a concise, factual, news-style title (≤ 12 words) for this X post. "
        "No emojis, no hashtags, no tickers, no links.\n\nPost:\n" + clean
    )

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You write crisp, factual headlines."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 48,
            },
            timeout=15,
        )
        if resp.status_code != 200:
            return fallback
        data = resp.json()
        title = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        return _smart_trim(_strip_noise(title)) or fallback
    except Exception:
        return fallback

# ------------ fetch + rerank + shape ------------
def ingest_news(token: str, top_k: int = 6) -> List[Dict[str, str]]:
    """
    Fetch recent originals about `token`, title with xAI, return up to `top_k` items:
    [{title, context, link}]
    Env: BEARER_TOKEN (X API), XAI_API_KEY (optional)
    """
    load_dotenv()
    bearer = os.getenv("BEARER_TOKEN")
    if not bearer:
        raise RuntimeError("Missing BEARER_TOKEN in environment.")
    client = Client(bearer_token=bearer)

    neg_words = "-pump -signal -copytrading -copy -giveaway -airdrop -scalp -memecoin"
    query = f"({token} OR #{token} OR ${token}) lang:en has:links -is:retweet -is:quote -is:reply {neg_words}"

    resp = client.posts.search_recent(query=query, max_results=10)
    if not getattr(resp, "data", None):
        return []

    token_l = token.lower()

    def score(text: str) -> float:
        t = text.lower()
        return (
            min(len(text) / 280.0, 1.0) +            # length bonus
            (0.3 if "http" in t else 0.0) +          # link bonus
            0.4 * t.count(token_l) +                 # keyword hits
            (-0.4 if len(text) < 40 else 0.0)        # short penalty
        )

    seen, docs = set(), []
    for p in resp.data:
        pid = p.get("id")
        if not pid or pid in seen:
            continue
        seen.add(pid)
        text = (p.get("text") or "").strip()
        if text.lower().count("@") >= 3:
            continue
        if len(re.findall(r"[#\$][A-Za-z0-9_]+", text)) > 6:
            continue
        docs.append({"id": pid, "text": text, "score": score(text)})

    if not docs:
        return []

    docs.sort(key=lambda d: d["score"], reverse=True)
    top = docs[:top_k]

    out = []
    for d in top:
        out.append({
            "id":     d["id"],
            "title":   generate_title_with_xai(d["text"]),
            "context": d["text"],
            "link":    f"https://x.com/i/web/status/{d['id']}",
        })
    return out

if __name__ == "__main__":
    result = ingest_news("BTC", top_k=6)
    print(json.dumps(result, indent=2, ensure_ascii=False))
