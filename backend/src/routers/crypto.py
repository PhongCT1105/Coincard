import snowflake.connector
from fastapi import APIRouter, HTTPException, Depends, Query
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

@router.get("/top-k-coins", tags=["crypto"])
def get_top_k_coins(
    k: int = Query(5, ge=1, le=20, description="Number of top coins to retrieve (1-20)"),
    db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)
):
    print(f"[{datetime.now()}] API call received for /top-k-coins with k={k}")

    query = f"""
    SELECT NAME, PRICE, MARKET_CAP, CHANGE, THUMB_IMAGE, SYMBOL, VOLUME, TIMESTAMP
    FROM CRYPTO
    ORDER BY TIMESTAMP DESC, MARKET_CAP DESC, PRICE DESC, CHANGE DESC, NAME ASC
    LIMIT {k};
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing Snowflake query...")
            cur.execute(query)
            results = cur.fetchall()

            print(f"[{datetime.now()}] Query successful. Returning {len(results)} records.")
            return {"data": results, "count": len(results), "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to execute database query")

@router.get("/coin/{symbol}", tags=["crypto"])
def get_coin_by_symbol(symbol: str, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /coin/{symbol}")

    query = """
    SELECT NAME, SYMBOL, PRICE, MARKET_CAP, CHANGE, THUMB_IMAGE, VOLUME, TIMESTAMP
    FROM CRYPTO
    WHERE UPPER(SYMBOL) = UPPER(%s)
    ORDER BY TIMESTAMP DESC
    LIMIT 1;
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing query for symbol={symbol}...")
            cur.execute(query, (symbol,))
            result = cur.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail=f"Coin with symbol '{symbol}' not found")

            print(f"[{datetime.now()}] Query successful for {symbol}")
            return {"data": result, "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query for {symbol}: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/coins/gainers-losers", tags=["crypto"])
def get_gainers_and_losers(
    limit: int = Query(5, ge=1, le=20, description="Number of top gainers and losers to return"),
    db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)
):
    print(f"[{datetime.now()}] API call received for /coins/gainers-losers with limit={limit}")

    gainers_query = f"""
    SELECT NAME, SYMBOL, PRICE, CHANGE, MARKET_CAP, TIMESTAMP
    FROM CRYPTO
    ORDER BY CHANGE DESC
    LIMIT {limit};
    """

    losers_query = f"""
    SELECT NAME, SYMBOL, PRICE, CHANGE, MARKET_CAP, TIMESTAMP
    FROM CRYPTO
    ORDER BY CHANGE ASC
    LIMIT {limit};
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Fetching top {limit} gainers...")
            cur.execute(gainers_query)
            gainers = cur.fetchall()

            print(f"[{datetime.now()}] Fetching top {limit} losers...")
            cur.execute(losers_query)
            losers = cur.fetchall()

            print(f"[{datetime.now()}] Query successful. Returning gainers and losers.")
            return {
                "data": {
                    "gainers": gainers,
                    "losers": losers
                },
                "fetched_at": datetime.now().isoformat()
            }
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing gainers/losers query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/coins/latest-timestamp", tags=["crypto"])
def get_latest_timestamp(db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /coins/latest-timestamp")

    query = "SELECT MAX(TIMESTAMP) AS LAST_UPDATED FROM CRYPTO;"

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing latest timestamp query...")
            cur.execute(query)
            result = cur.fetchone()

            print(f"[{datetime.now()}] Query successful. Latest timestamp: {result['LAST_UPDATED']}")
            return {
                "last_updated": result["LAST_UPDATED"],
                "fetched_at": datetime.now().isoformat()
            }
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR fetching latest timestamp: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to fetch latest timestamp")

@router.get("/coins/trending", tags=["ai", "crypto"])
def get_trending_coins(
    user_id: str = Query(None, description="Optional user ID to personalize trending list"),
    limit: int = Query(10, ge=1, le=50, description="Number of trending coins to return"),
    db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)
):
    print(f"[{datetime.now()}] API call received for /coins/trending user_id={user_id}, limit={limit}")

    if user_id:
        query = f"""
        SELECT NAME, SYMBOL, PRICE, MARKET_CAP, CHANGE, RELEVANCE_SCORE, TIMESTAMP
        FROM CRYPTO_TRENDING
        WHERE USER_ID = %s
        ORDER BY RELEVANCE_SCORE DESC, TIMESTAMP DESC
        LIMIT {limit};
        """
        params = (user_id,)
    else:
        query = f"""
        SELECT NAME, SYMBOL, PRICE, MARKET_CAP, CHANGE, RELEVANCE_SCORE, TIMESTAMP
        FROM CRYPTO_TRENDING
        ORDER BY RELEVANCE_SCORE DESC, TIMESTAMP DESC
        LIMIT {limit};
        """
        params = ()

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing trending query...")
            cur.execute(query, params)
            results = cur.fetchall()

            if not results:
                msg = f"No trending data found for user '{user_id}'" if user_id else "No trending data found"
                print(f"[{datetime.now()}] {msg}")
                raise HTTPException(status_code=404, detail=msg)

            print(f"[{datetime.now()}] Query successful. Returning {len(results)} trending coins.")
            return {
                "user_id": user_id or "global",
                "count": len(results),
                "data": results,
                "fetched_at": datetime.now().isoformat()
            }
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing trending query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to fetch trending coins")
