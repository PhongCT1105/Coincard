from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

from src.agents.analysis_agent.grok_reasoner import chat_with_grok
from src.stores.chat_store import (
    append_message,
    create_session,
    get_history,
    get_session,
    upsert_docs,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatDoc(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    title: Optional[str] = None
    context: str
    link: Optional[str] = None


class ChatRequest(BaseModel):
    token: str
    message: str
    session_id: Optional[str] = None
    docs: Optional[List[ChatDoc]] = None
    token_budget_tokens: Optional[int] = 3800
    model_answer_tokens: Optional[int] = 500


@router.post("/")
def chat(req: ChatRequest):
    docs_payload = [doc.model_dump(exclude_none=True) for doc in (req.docs or [])]

    if req.session_id:
        session = get_session(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Unknown session_id. Start a new session first.")
        docs = docs_payload or session["docs"]
        if not docs:
            raise HTTPException(status_code=400, detail="Attach docs to continue this session.")
        if docs_payload:
            upsert_docs(req.session_id, docs)
        session_id = req.session_id
    else:
        if not docs_payload:
            raise HTTPException(status_code=400, detail="Docs are required to start a chat session.")
        session_id = create_session(req.token, docs_payload)
        docs = docs_payload

    append_message(session_id, "user", req.message)
    history_for_llm = list(get_history(session_id))

    result = chat_with_grok(
        docs=docs,
        chat_history=history_for_llm,
        token_budget_tokens=req.token_budget_tokens or 3800,
        model_answer_tokens=req.model_answer_tokens or 500,
    )

    append_message(session_id, "assistant", result["answer"])
    history = list(get_history(session_id))

    return {
        "session_id": session_id,
        "token": req.token.upper(),
        "answer": result["answer"],
        "sources": result["sources"],
        "history": history,
    }
