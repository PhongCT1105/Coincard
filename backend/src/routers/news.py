from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.agents.news_agent.ingestion import ingest_news
from src.stores.selection_store import new_run_id, save_docs, set_latest_run

router = APIRouter(prefix="/news", tags=["News"])

class NewsRequest(BaseModel):
    token: str
    top_k: Optional[int] = 3

@router.post("/")
def fetch_news(req: NewsRequest):
    results = ingest_news(req.token, req.top_k or 3)
    if not results:
        raise HTTPException(status_code=404, detail="No posts found.")
    run_id = new_run_id()
    save_docs(run_id, results)
    set_latest_run(req.token, run_id)   # ← remember latest run for this token
    return {"run_id": run_id, "count": len(results), "results": results}
