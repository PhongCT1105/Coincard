# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.settings import settings
from src.routers import health

# Create FastAPI app
app = FastAPI(title="Replica Coinbase API", version="0.1.0")

# Add CORS middleware (allows frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)

# Root route
@app.get("/")
def home():
    return {"message": "Replica Coinbase API running", "env": settings.app_env}
