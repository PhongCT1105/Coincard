from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

from src.agents.analysis_agent.grok_reasoner import answer_with_grok

router = APIRouter(prefix="/ask", tags=["Ask"])

class AskDoc(BaseModel):
    """Document payload forwarded from the frontend."""
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    title: Optional[str] = None
    context: str
    link: Optional[str] = None

class AskReq(BaseModel):
    token: str
    question: str
    docs: List[AskDoc]
    token_budget_tokens: Optional[int] = 3800
    model_answer_tokens: Optional[int] = 500

@router.post("/")
def ask(req: AskReq):
    if not req.docs:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one document in the `docs` field."
        )

    docs = [doc.model_dump(exclude_none=True) for doc in req.docs]

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
