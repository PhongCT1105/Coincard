import snowflake.connector
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import sys
from src.deps import get_db_connection

router = APIRouter()

@router.get("/top-20-coins", tags=["crypto"])
def get_top_20_coins(db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /top-20-coins")

    query = """
    SELECT NAME, PRICE, MARKET_CAP, CHANGE, THUMB_IMAGE, SYMBOL, VOLUME, TIMESTAMP
    FROM CRYPTO
    ORDER BY TIMESTAMP DESC, MARKET_CAP DESC, PRICE DESC, CHANGE DESC, NAME ASC
    LIMIT 20;
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing Snowflake query...")
            cur.execute(query)
            results = cur.fetchall()
            
            print(f"[{datetime.now()}] Query successful. Returning {len(results)} records.")
            return {"data": results, "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to execute database query")

# --- more crypto APIs here ---
#
# @router.get("/coin/{coin_name}", tags=["Crypto"])
# def get_coin_details(coin_name: str):
#     # ... logic to get one coin
#     pass