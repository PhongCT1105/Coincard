from pydantic import BaseModel
from typing import Optional

class PricePoint(BaseModel):
    ts: str
    price: float

class Candle(BaseModel):
    ts: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class NewsItem(BaseModel):
    ts: str
    symbol: str
    title: str
    url: str
    source: str
    sentiment: Optional[float] = None  # -1..1
