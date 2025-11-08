import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.settings import settings
from src.routers import health, crypto, portfolio
import snowflake.connector
from datetime import datetime
from src.routers import news

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
app.include_router(crypto.router, prefix="/crypto")
app.include_router(portfolio.router, prefix="/portfolio")
app.include_router(news.router)


# Root route
@app.get("/")
def home():
    return {"message": "Replica Coinbase API running", "env": settings.app_env}