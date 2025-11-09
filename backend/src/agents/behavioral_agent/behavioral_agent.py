from __future__ import annotations

import json
import math
import os
import sys
import requests
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import snowflake.connector
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.deps import get_db_connection

DB_PATH = Path(__file__).with_name("db.json")
_behavior_db: Optional[List[Dict[str, Any]]] = None


@contextmanager
def open_db():
    """Reuse FastAPI's generator dependency in scripts/agents."""
    gen = get_db_connection()
    conn = next(gen)
    try:
        yield conn
    finally:
        try:
            next(gen)
        except StopIteration:
            pass


def _call_grok(system_prompt: str, user_prompt: str, max_tokens: int = 450) -> str:
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing XAI_API_KEY for Grok.")
    model = os.getenv("XAI_MODEL", "grok-3-mini")

    try:
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.25,
                "max_tokens": max_tokens,
            },
            timeout=20,
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"Grok request failed: {exc}") from exc

    if resp.status_code != 200:
        raise RuntimeError(f"Grok status {resp.status_code}: {resp.text}")

    data = resp.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return (content or "").strip()


def _query_transactions_for_user(user_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT
            TRANSACTION_ID,
            USER_ID,
            SYMBOL,
            TRANSACTION_TYPE,
            AMOUNT_COIN,
            PRICE_PER_COIN,
            TOTAL_USD,
            "TIMESTAMP" AS TIMESTAMP
        FROM TRANSACTION_HISTORY
        WHERE USER_ID = %s
        ORDER BY "TIMESTAMP" DESC
    """
    try:
        with open_db() as db:
            with db.cursor(snowflake.connector.DictCursor) as cur:
                cur.execute(sql, (user_id,))
                return [dict(r) for r in cur.fetchall()]
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ❌ Snowflake error in _query_transactions_for_user: {e}", file=sys.stderr)
        return []


def fetch_transactions_for_user(user_id: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Fetch the user's history, falling back to U01 if no rows exist."""
    target = (user_id or "").upper() or "U01"
    rows = _query_transactions_for_user(target)
    if rows:
        return target, rows
    if target != "U01":
        fallback = _query_transactions_for_user("U01")
        return "U01", fallback
    return target, []


def get_all_transactions(limit: Optional[int] = None, offset: int = 0) -> Dict[str, Any]:
    """Existing helper for API pagination."""
    base_sql = """
        SELECT
            TRANSACTION_ID,
            USER_ID,
            SYMBOL,
            TRANSACTION_TYPE,
            AMOUNT_COIN,
            PRICE_PER_COIN,
            TOTAL_USD,
            "TIMESTAMP" AS TIMESTAMP
        FROM TRANSACTION_HISTORY
        ORDER BY "TIMESTAMP" DESC
    """
    sql = base_sql
    params: List[Any] = []
    if limit is not None:
        sql += " LIMIT %s"
        params.append(int(limit))
        if offset:
            sql += " OFFSET %s"
            params.append(int(offset))

    try:
        with open_db() as db:
            with db.cursor(snowflake.connector.DictCursor) as cur:
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
                return {"data": [dict(r) for r in rows], "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ❌ Snowflake error in get_all_transactions: {e}", file=sys.stderr)
        return {"data": [], "fetched_at": datetime.now().isoformat(), "error": "Snowflake query failed"}


def _format_transactions_for_prompt(transactions: List[Dict[str, Any]]) -> str:
    lines = []
    for t in transactions[:120]:
        ts = t.get("TIMESTAMP")
        lines.append(
            f"{ts} | {t.get('TRANSACTION_TYPE')} | {t.get('AMOUNT_COIN')} {t.get('SYMBOL')} @ "
            f"${t.get('PRICE_PER_COIN')} (total ${t.get('TOTAL_USD')})"
        )
    return "\n".join(lines)


def analyze_trading_style(transactions: List[Dict[str, Any]]) -> str:
    if not transactions:
        raise ValueError("No transactions provided for analysis.")

    tx_text = _format_transactions_for_prompt(transactions)
    system_prompt = (
        "You are an expert behavioral finance analyst. From raw transaction logs, infer the user's trader persona, "
        "risk tolerance, typical holding period, preferred assets, and execution habits. Surface any noticeable "
        "patterns like momentum chasing, dip buying, or leverage usage."
    )
    user_prompt = (
        "Here is a chronological subset of the user's recent transactions:\n"
        f"{tx_text}\n\n"
        "Summarize their trading style in 3-5 sentences. Mention risk appetite, time horizon, favorite assets, "
        "and any behavioral cues (e.g., chasing breakouts, mean reversion, panic selling)."
    )
    return _call_grok(system_prompt, user_prompt)


def _load_behavior_db() -> List[Dict[str, Any]]:
    global _behavior_db
    if _behavior_db is None:
        with DB_PATH.open("r", encoding="utf-8") as f:
            _behavior_db = json.load(f)
    return _behavior_db


def rank_coins_by_similarity(style_summary: str) -> List[Dict[str, Any]]:
    entries = _load_behavior_db()
    if not style_summary or not entries:
        return []

    texts = [style_summary] + [entry["summary"] for entry in entries]
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(texts)
    user_vec = matrix[:1]
    coin_vecs = matrix[1:]
    sims = cosine_similarity(user_vec, coin_vecs).flatten()

    if sims.size == 0:
        return []

    min_sim = sims.min()
    max_sim = sims.max()
    range_sim = max(max_sim - min_sim, 1e-9)

    ranked = []
    for entry, score in sorted(zip(entries, sims), key=lambda x: x[1], reverse=True):
        sim_value = float(score)
        norm = max((sim_value - min_sim) / range_sim, 0.0)
        boosted = math.pow(norm, 0.35)  # concave scaling so leaders push toward 1
        ranked.append({
            "symbol": entry["symbol"],
            "summary": entry["summary"],
            "trader_type": entry.get("trader_type"),
            "similarity": sim_value,
            "relevance": round(boosted, 4),
        })
    return ranked


if __name__ == "__main__":
    user, txs = fetch_transactions_for_user("U01")
    print(f"Loaded {len(txs)} transactions for {user}")
    analysis = analyze_trading_style(txs)
    print("Style Summary:\n", analysis)
    print("Top matches:\n", rank_coins_by_similarity(analysis)[:3])
