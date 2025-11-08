import sys
from datetime import datetime

import snowflake.connector
from fastapi import HTTPException

from src.settings import settings

def get_settings():
    return settings

# --- 1. CONFIGURATION ---
SNOWFLAKE_CONFIG = {
    'user': settings.SNOWFLAKE_USER,
    'password': settings.SNOWFLAKE_PASSWORD,
    'account': settings.SNOWFLAKE_ACCOUNT,
    'warehouse': settings.SNOWFLAKE_WAREHOUSE,
    'database': settings.SNOWFLAKE_DATABASE,
    'schema': settings.SNOWFLAKE_SCHEMA,
    'role': settings.SNOWFLAKE_ROLE
}

# --- 2. THE DEPENDENCY ---
def get_db_connection():
    try:
        conn = snowflake.connector.connect(**SNOWFLAKE_CONFIG)
        print(f"[{datetime.now()}] Snowflake connection opened.")
        yield conn
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR: Could not connect to Snowflake: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to connect to database")
    finally:
        if 'conn' in locals() and not conn.is_closed():
            conn.close()
            print(f"[{datetime.now()}] Snowflake connection closed.")
