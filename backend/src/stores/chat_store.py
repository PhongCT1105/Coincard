import time
import uuid
from typing import Dict, List, Optional, TypedDict

MAX_HISTORY_CHARS = 6000


class ChatMessage(TypedDict):
    role: str   # "user" or "assistant"
    content: str


class ChatSession(TypedDict):
    token: str
    docs: List[Dict]
    history: List[ChatMessage]
    updated_at: float


_sessions: Dict[str, ChatSession] = {}


def _trim_history(history: List[ChatMessage]) -> None:
    """Trim history from the front until total chars fits limit."""
    if not history:
        return
    total = sum(len(m.get("content", "")) for m in history)
    while total > MAX_HISTORY_CHARS and len(history) > 2:
        removed = history.pop(0)
        total -= len(removed.get("content", ""))


def create_session(token: str, docs: List[Dict]) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "token": token.upper(),
        "docs": docs,
        "history": [],
        "updated_at": time.time(),
    }
    return session_id


def get_session(session_id: str) -> Optional[ChatSession]:
    return _sessions.get(session_id)


def upsert_docs(session_id: str, docs: List[Dict]) -> None:
    session = _sessions.get(session_id)
    if not session or not docs:
        return
    session["docs"] = docs
    session["updated_at"] = time.time()


def append_message(session_id: str, role: str, content: str) -> None:
    session = _sessions.get(session_id)
    if not session:
        return
    session["history"].append({"role": role, "content": content})
    _trim_history(session["history"])
    session["updated_at"] = time.time()


def get_history(session_id: str) -> List[ChatMessage]:
    session = _sessions.get(session_id)
    if not session:
        return []
    return session["history"]
