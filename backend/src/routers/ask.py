from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union

from src.stores.selection_store import load_docs, get_latest_run
from src.agents.analysis_agent.grok_reasoner import answer_with_grok

router = APIRouter(prefix="/ask", tags=["Ask"])

class AskReq(BaseModel):
    token: str
    question: str
    run_id: Optional[str] = None
    # can be doc IDs or 1-based indices
    selected_ids: Optional[List[Union[str, int]]] = None
    token_budget_tokens: Optional[int] = 3800
    model_answer_tokens: Optional[int] = 500

@router.post("/")
def ask(req: AskReq):
    # Use explicit run_id, else fall back to 'latest run for this token'
    run_id = req.run_id or get_latest_run(req.token)
    if not run_id:
        raise HTTPException(
            status_code=400,
            detail="No run context. Call /news first (or pass token only and I will use the latest run for that token)."
        )

    docs = load_docs(run_id, req.selected_ids)
    if not docs:
        raise HTTPException(
            status_code=404,
            detail="No matching docs found for run_id/selection. "
                   "Tip: use indices like [1,3] or pass actual doc IDs from /news."
        )

    result = answer_with_grok(
        question=req.question,
        docs=docs,
        token_budget_tokens=req.token_budget_tokens or 3800,
        model_answer_tokens=req.model_answer_tokens or 500,
    )
    return {"token": req.token.upper(), "run_id": run_id, "answer": result["answer"], "sources": result["sources"]}
