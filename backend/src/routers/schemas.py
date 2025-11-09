from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List

class Asset(BaseModel):
    symbol: str
    amount: float

class Portfolio(BaseModel):
    user_id: str
    usd_balance: float
    assets: List[Asset]

class TransactionRequest(BaseModel):
    user_id: str
    symbol: str
    transaction_type: str
    amount_coin: float
    price_per_coin: float

# A single record from TRANSACTION_HISTORY
class TransactionRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    transaction_id: int
    user_id: str
    symbol: str
    transaction_type: str
    amount_coin: float
    price_per_coin: float
    total_usd: float
    timestamp: datetime

class UserBalance(BaseModel):
    user_id: str
    usd_balance: float