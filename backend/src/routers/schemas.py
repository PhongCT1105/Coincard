from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# Data expected from the frontend when a user wants to make a trade
class TransactionRequest(BaseModel):
    user_id: str = Field(..., example="phong_test_user")
    coin_id: str = Field(..., example="bitcoin")
    transaction_type: str = Field(..., example="BUY") # 'BUY' or 'SELL'
    amount_coin: float = Field(..., gt=0, example=0.5) # Must be greater than 0
    price_per_coin: float = Field(..., gt=0, example=60000.00) # Current market price

# Represents a single asset holding
class Asset(BaseModel):
    coin_id: str
    amount: float

# Full portfolio of a user
class Portfolio(BaseModel):
    user_id: str
    usd_balance: float
    assets: List[Asset]

# A single record from TRANSACTION_HISTORY
class TransactionRecord(BaseModel):
    transaction_id: int
    user_id: str
    coin_id: str
    transaction_type: str
    amount_coin: float
    price_per_coin: float
    total_usd: float
    timestamp: datetime

    class Config:
        orm_mode = True # Allows mapping from database objects