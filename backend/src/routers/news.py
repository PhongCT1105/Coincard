# src/routers/news.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.agents.news_agent.ingestion import ingest_news

router = APIRouter(prefix="/news", tags=["News"])

# Request schema
class NewsRequest(BaseModel):
    token: str

@router.post("/")
def fetch_news(req: NewsRequest):
    """
    Fetch recent news posts from X related to a given token.
    Example body: {"token": "BTC"}
    """
    try:
        results = ingest_news(req.token, 3)
        if not results:
            raise HTTPException(status_code=404, detail="No posts found.")
        return {"count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
