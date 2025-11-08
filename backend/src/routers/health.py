# routers/health.py
from fastapi import APIRouter, Depends
from src.deps import get_settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
def check_health(cfg = Depends(get_settings)):
    return {
        "status": "ok",
        "environment": cfg.app_env,
        "port": cfg.api_port
    }
