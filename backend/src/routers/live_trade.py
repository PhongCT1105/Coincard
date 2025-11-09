from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.agents.news_agent.ingestion import ingest_news
from src.agents.analysis_agent.grok_reasoner import live_trade_recommendation

router = APIRouter(prefix="/live-trade", tags=["Live Trade"])


class LiveTradeRequest(BaseModel):
    token: str
    prompt: Optional[str] = None
    top_k: int = 6


@router.post("/decision")
def live_trade_decision(req: LiveTradeRequest):
    token = req.token.upper()
    docs = ingest_news(token, top_k=req.top_k)
    if not docs:
        raise HTTPException(status_code=404, detail="No news context available for this token.")

    recommendation = live_trade_recommendation(token, docs, question=req.prompt)
    return {
        "token": token,
        "trade_plan": recommendation["trade_plan"],
        "analysis": recommendation["analysis"],
    }
