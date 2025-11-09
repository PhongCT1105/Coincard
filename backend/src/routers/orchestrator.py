from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.agents.orchestrator.llm_planner import (
    orchestration_stream,
    run_orchestration,
)

router = APIRouter(prefix="/orchestrate", tags=["Orchestrator"])


class PlanRequest(BaseModel):
    goal: str
    token: str | None = None
    user_id: str | None = None
    max_steps: int | None = 4
    stop_score: float | None = 0.55


@router.post("/plan")
def orchestrate(req: PlanRequest):
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty.")
    result = run_orchestration(
        goal=req.goal.strip(),
        token=req.token,
        user_id=req.user_id,
        max_steps=req.max_steps or 4,
        stop_score=req.stop_score or 0.55,
    )
    return result


@router.post("/plan-stream")
def orchestrate_stream(req: PlanRequest):
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty.")

    generator = orchestration_stream(
        goal=req.goal.strip(),
        token=req.token,
        user_id=req.user_id,
        max_steps=req.max_steps or 4,
        stop_score=req.stop_score or 0.55,
    )
    return StreamingResponse(generator, media_type="application/jsonl")


@router.get("/plan-sse")
def orchestrate_sse(
    goal: str = Query(..., min_length=1),
    token: str | None = None,
    user_id: str | None = None,
    max_steps: int = Query(4, ge=1, le=10),
    stop_score: float = Query(0.55, ge=0.0, le=1.0),
):
    def event_gen():
        yield "event: status\ndata: Planner started\n\n"
        for chunk in orchestration_stream(
            goal=goal.strip(),
            token=token,
            user_id=user_id,
            max_steps=max_steps,
            stop_score=stop_score,
        ):
            payload = chunk.strip()
            if not payload:
                continue
            yield f"data: {payload}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
