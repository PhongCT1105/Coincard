from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.agents.news_agent.ingestion import ingest_news

router = APIRouter(prefix="/news", tags=["News"])

class NewsRequest(BaseModel):
    token: str
    top_k: Optional[int] = 3


@router.post("/")
def fetch_news(req: NewsRequest):
    """
    Fetch latest posts for a token, including individual sentiment scores.
    Redis caching has been removed; callers should retain any documents they
    need client-side and pass them back to /ask when requesting suggestions.
    """
    results = ingest_news(req.token, req.top_k or 3)
    if not results:
        raise HTTPException(status_code=404, detail="No posts found.")

    # Extract per-post sentiment scores
    sentiment_scores = [r.get("sentiment_score", 0.0) for r in results]

    return {
        "count": len(results),
        "results": results,             # full posts with sentiment data
        "sentiment_scores": sentiment_scores  # list of scores per post
    }
