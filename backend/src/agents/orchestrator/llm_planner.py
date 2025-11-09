import json
import os
from typing import Any, Dict, List, Tuple, Optional

import requests

from src.agents.news_agent.ingestion import ingest_news
from src.agents.analysis_agent.grok_reasoner import answer_with_grok
from src.agents.behavioral_agent.behavioral_agent import (
    fetch_transactions_for_user,
    analyze_trading_style,
    rank_coins_by_similarity,
)

TOOLS_DESCRIPTION = """
Available tools:
1) news_agent(token) -> Fetches latest social/news posts for the token. Returns docs.
2) reasoning_agent(question) -> Uses Grok with cached docs to answer financial questions.
3) behavioral_agent(user_id) -> Reads user transaction history, summarizes persona and recommends tokens.
When you have sufficient information, respond with action "final_answer".
Return JSON:
{
  "action": "tool_name or final_answer",
  "params": {...},
  "thought": "reasoning",
  "candidate_tools": [
     {"name":"news_agent","score":0.72,"reason":"..."},
     {"name":"reasoning_agent","score":0.55,"reason":"..."}
  ],
  "message": "optional final answer"
}
Scores must be between 0 and 1.
"""


def _call_grok(system_prompt: str, user_prompt: str, max_tokens: int = 400) -> str:
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing XAI_API_KEY for orchestration.")
    model = os.getenv("XAI_MODEL", "grok-3-mini")

    resp = requests.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": max_tokens,
        },
        timeout=20,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Grok planner status {resp.status_code}: {resp.text}")
    data = resp.json()
    return (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""


def _summarize_state(state: Dict[str, Any]) -> str:
    notes: List[str] = []
    if state.get("docs"):
        notes.append(f"- Cached {len(state['docs'])} news documents for {state.get('token')}.")
    if state.get("analysis"):
        notes.append("- Latest reasoning answer cached.")
    if state.get("persona"):
        notes.append("- Behavioral persona identified.")
    if not notes:
        return "No tools have run yet."
    return "\n".join(notes)


def _execute_tool(
    name: str,
    params: Dict[str, Any],
    state: Dict[str, Any],
) -> Tuple[str, Dict[str, Any]]:
    if name == "news_agent":
        token = params.get("token") or state.get("token")
        if not token:
            return "news_agent requires a token parameter.", state
        docs = ingest_news(token, top_k=params.get("top_k", 4))
        state["token"] = token
        state["docs"] = docs
        return f"Fetched {len(docs)} docs for {token}.", state

    if name == "reasoning_agent":
        question = params.get("question")
        docs = state.get("docs")
        if not question:
            return "reasoning_agent requires a 'question' parameter.", state
        if not docs:
            return "No cached docs to reason over. Run news_agent first.", state
        result = answer_with_grok(question=question, docs=docs)
        state["analysis"] = result
        return f"Answer: {result['answer']}", state

    if name == "behavioral_agent":
        user_id = params.get("user_id") or state.get("user_id")
        if not user_id:
            return "behavioral_agent requires user_id.", state
        resolved_user, txs = fetch_transactions_for_user(user_id)
        if not txs:
            return f"No transactions found for {resolved_user}.", state
        style = analyze_trading_style(txs)
        recs = rank_coins_by_similarity(style)
        top = recs[0] if recs else {}
        state["persona"] = {"summary": style, "top": top, "user_id": resolved_user}
        return f"Persona summary generated. Top match: {top.get('symbol')} ({top.get('trader_type')}).", state

    return f"Unknown tool '{name}'.", state


def _parse_action(raw: str) -> Dict[str, Any]:
    text = raw.strip()
    if "```" in text:
        # attempt to extract json block
        start = text.find("```")
        end = text.rfind("```")
        if start != -1 and end != -1 and end > start:
            text = text[start + 3 : end]
            if text.strip().startswith("json"):
                text = text[text.find("\n") + 1 :]
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    raise ValueError(f"Unable to parse planner response as JSON: {raw}")


def _planner_loop(
    goal: str,
    token: Optional[str],
    user_id: Optional[str],
    max_steps: int,
    stop_score: float,
):
    state: Dict[str, Any] = {
        "token": token,
        "user_id": user_id,
        "docs": [],
        "analysis": None,
        "persona": None,
        "steps": [],
    }

    system_prompt = (
        "You are an orchestration planner. Decide which tool to run next. "
        "Always respond with JSON: {\"action\": \"tool_name\", \"params\": {...}, \"thought\": \"...\"}. "
        "Valid actions: news_agent, reasoning_agent, behavioral_agent, final_answer."
    )

    for step in range(max_steps):
        context = _summarize_state(state)
        user_prompt = (
            f"User goal: {goal}\n"
            f"Preferred token (optional): {token or 'unspecified'}\n"
            f"User id (optional): {user_id or 'unspecified'}\n"
            f"Current context:\n{context}\n\n"
            f"{TOOLS_DESCRIPTION}\n"
            "Respond with the next action."
        )
        raw = _call_grok(system_prompt, user_prompt)
        try:
            action_obj = _parse_action(raw)
        except ValueError as exc:
            state["steps"].append({"action": "error", "thought": str(exc), "result": raw})
            break

        candidate_tools = action_obj.get("candidate_tools") or []
        best_score = 0.0
        if isinstance(candidate_tools, list):
            for cand in candidate_tools:
                try:
                    score = float(cand.get("score", 0))
                    if score > best_score:
                        best_score = score
                except (TypeError, ValueError):
                    continue

        action = (action_obj.get("action") or "").lower()
        thought = action_obj.get("thought", "")
        params = action_obj.get("params") or {}

        if best_score < stop_score and action not in {"final_answer"}:
            action = "final_answer"
            thought = thought or "Confidence too low to call another tool."

        if action == "final_answer":
            message = action_obj.get("message") or thought or "Completed."
            yield {
                "type": "final",
                "goal": goal,
                "final_answer": message,
                "context": {
                    "analysis": state.get("analysis"),
                    "persona": state.get("persona"),
                },
            }
            return

        result_summary, state = _execute_tool(action, params, state)
        step_entry = {
            "step": step + 1,
            "action": action,
            "thought": thought,
            "result": result_summary,
        }
        if candidate_tools:
            step_entry["candidate_tools"] = candidate_tools
        step_entry["score"] = best_score
        state["steps"].append(step_entry)
        yield {"type": "step", "data": step_entry}

    final_answer = (
        state.get("analysis", {}).get("answer")
        if state.get("analysis")
        else "Plan ended without a final answer."
    )
    yield {
        "type": "final",
        "goal": goal,
        "final_answer": final_answer,
        "context": {
            "analysis": state.get("analysis"),
            "persona": state.get("persona"),
        },
    }


def run_orchestration(
    goal: str,
    token: Optional[str],
    user_id: Optional[str],
    max_steps: int = 4,
    stop_score: float = 0.55,
) -> Dict[str, Any]:
    final_payload: Dict[str, Any] | None = None
    steps: List[Dict[str, Any]] = []
    for event in _planner_loop(goal, token, user_id, max_steps, stop_score):
        if event["type"] == "step":
            steps.append(event["data"])
        elif event["type"] == "final":
            final_payload = event
            break
    if not final_payload:
        raise RuntimeError("Planner failed to produce a final answer.")
    final_payload["steps"] = steps
    return final_payload


def orchestration_stream(
    goal: str,
    token: Optional[str],
    user_id: Optional[str],
    max_steps: int = 4,
    stop_score: float = 0.55,
):
    yield json.dumps({"type": "status", "message": "Planner started."}) + "\n"
    for event in _planner_loop(goal, token, user_id, max_steps, stop_score):
        yield json.dumps(event) + "\n"
