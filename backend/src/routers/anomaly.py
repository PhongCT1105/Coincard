import snowflake.connector
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import sys
from src.deps import get_db_connection

router = APIRouter()

@router.get("/latest-anomaly-prediction", tags=["Anomaly Detection"])
def get_latest_anomaly_prediction(db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /latest-anomaly-prediction")

    query = """
    SELECT * FROM COIN_PRICE_ANOMALY_PREDICTIONS
    ORDER BY TS DESC
    LIMIT 1;
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing Snowflake query for latest prediction...")
            cur.execute(query)
            result = cur.fetchone() # only expect 1 row
            if not result:
                print(f"[{datetime.now()}] Query successful. No anomaly predictions found.")
                return {"data": None, "message": "No anomaly prediction data found."}

            print(f"[{datetime.now()}] Query successful. Returning 1 record.")
            return {"data": result, "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to execute database query")

@router.get("/all-anomalies", tags=["Anomaly Detection"])
def get_all_anomalies(db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    """Retrieves all records that have been flagged as an anomaly"""
    print(f"[{datetime.now()}] API call received for /all-anomalies")

    query = """
    SELECT * FROM COIN_PRICE_ANOMALY_PREDICTIONS
    WHERE IS_ANOMALY = TRUE
    ORDER BY TS DESC;
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing Snowflake query for all anomalies...")
            cur.execute(query)
            results = cur.fetchall()
            
            print(f"[{datetime.now()}] Query successful. Returning {len(results)} anomaly records.")
            return {"data": results, "fetched_at": datetime.now().isoformat()}
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to execute database query")