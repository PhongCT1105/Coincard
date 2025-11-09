from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from pydantic import BaseModel

from src.agents.orchestrator.llm_planner import run_orchestration, orchestration_stream

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
