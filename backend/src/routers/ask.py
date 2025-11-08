from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional

from src.agents.analysis_agent.grok_reasoner import answer_with_grok


router = APIRouter(prefix="/ask", tags=["Ask"])


class DocumentPayload(BaseModel):
    """Minimal context required for Grok; extra keys are forwarded unchanged."""

    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    title: Optional[str] = None
    context: str
    link: Optional[str] = None


class AskReq(BaseModel):
    token: str
    question: str
    documents: List[DocumentPayload]
    token_budget_tokens: Optional[int] = 3800
    model_answer_tokens: Optional[int] = 500

    @field_validator("documents")
    @classmethod
    def _require_documents(cls, value: List[DocumentPayload]):
        if not value:
            raise ValueError("Provide at least one document for context.")
        return value


@router.post("/")
def ask(req: AskReq):
    docs = [doc.model_dump(exclude_none=True) for doc in req.documents]

    result = answer_with_grok(
        question=req.question,
        docs=docs,
        token_budget_tokens=req.token_budget_tokens or 3800,
        model_answer_tokens=req.model_answer_tokens or 500,
    )

    return {
        "token": req.token.upper(),
        "answer": result["answer"],
        "sources": result["sources"],
    }
