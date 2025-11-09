from fastapi import APIRouter, HTTPException, Query

from src.agents.behavioral_agent.behavioral_agent import (
    analyze_trading_style,
    fetch_transactions_for_user,
    rank_coins_by_similarity,
)

router = APIRouter(prefix="/behavioral", tags=["Behavioral"])


@router.get("/transactions")
def get_transactions(user_id: str = Query(..., description="User ID in Snowflake")):
    resolved, rows = fetch_transactions_for_user(user_id)
    if not rows:
        raise HTTPException(status_code=404, detail="No transactions found for user or fallback.")
    return {"user_id": resolved, "count": len(rows), "transactions": rows}


@router.get("/style")
def get_style_recommendations(user_id: str = Query(..., description="User ID in Snowflake")):
    resolved, rows = fetch_transactions_for_user(user_id)
    if not rows:
        raise HTTPException(status_code=404, detail="No transactions found for user or fallback.")

    try:
        analysis = analyze_trading_style(rows)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    print("🎯 Behavioral analysis summary (Grok):")
    print(analysis)

    recommendations = rank_coins_by_similarity(analysis)
    return {
        "user_id": resolved,
        "analysis": analysis,
        "recommendations": recommendations,
    }
