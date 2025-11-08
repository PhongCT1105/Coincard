import os
from dotenv import load_dotenv
import snowflake.connector
import requests
import schedule
import time
import sys
from datetime import datetime

# --- 1. CONFIGURATION ---
load_dotenv()
SNOWFLAKE_CONFIG = {
    'user': os.getenv('SNOWFLAKE_USER'),
    'password': os.getenv('SNOWFLAKE_PASSWORD'),
    'account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'warehouse': 'PROJECT_COINCARD',
    'database': 'PROJECT_DB',
    'schema': 'CORE',
    'role': 'PROJECT_ANALYST' # The role we created
}

# --- 2. CoinGecko API Function ---
def fetch_coingecko_data():
    print(f"[{datetime.now()}] Fetching data from CoinGecko...")
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 20,  # top 20 cryptos
        "page": 1
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        processed_data = []
        for coin in data:
            name = coin["name"]
            price = coin["current_price"]
            market_cap = coin["market_cap"]
            change = coin["price_change_percentage_24h"]
            thumb_image = coin["image"]
            timestamp = datetime.now()
            
            processed_data.append((name, price, market_cap, change, thumb_image, timestamp))

        print(f"[{datetime.now()}] Successfully fetched {len(processed_data)} records.")
        return processed_data
    except requests.exceptions.RequestException as e:
        print(f"[{datetime.now()}] ERROR: Could not fetch from CoinGecko: {e}", file=sys.stderr)
        return None

def update_snowflake_data(new_data):
    if not new_data:
        print(f"[{datetime.now()}] No data to load, skipping Snowflake update.")
        return

    print(f"[{datetime.now()}] Connecting to Snowflake...")
    try:
        with snowflake.connector.connect(**SNOWFLAKE_CONFIG) as conn:
            with conn.cursor() as cur:
                print(f"[{datetime.now()}] Connection successful.")
                
                # 1. Create a temporary staging table to load new data into.
                cur.execute("""
                CREATE OR REPLACE TEMPORARY TABLE CRYPTO_PRICE_STAGE (
                    NAME VARCHAR(16777216),
                    PRICE FLOAT,
                    MARKET_CAP NUMBER(38, 0),
                    CHANGE FLOAT,
                    THUMB_IMAGE VARCHAR(1000),
                    TIMESTAMP TIMESTAMP_NTZ(9)
                )
                """)
                
                # 2. Insert Python data into the staging table.
                sql_insert = "INSERT INTO CRYPTO_PRICE_STAGE (NAME, PRICE, MARKET_CAP, CHANGE, THUMB_IMAGE, TIMESTAMP) VALUES (%s, %s, %s, %s, %s, %s)"
                cur.executemany(sql_insert, new_data)
                print(f"[{datetime.now()}] Loaded {cur.rowcount} rows into temporary stage.")

                # 3. MERGE
                merge_sql = """
                MERGE INTO CRYPTO AS target
                USING CRYPTO_PRICE_STAGE AS source
                ON target.NAME = source.NAME
                WHEN MATCHED THEN
                    UPDATE SET
                        target.PRICE = source.PRICE,
                        target.MARKET_CAP = source.MARKET_CAP,
                        target.CHANGE = source.CHANGE,
                        target.THUMB_IMAGE = source.THUMB_IMAGE,
                        target.TIMESTAMP = source.TIMESTAMP
                WHEN NOT MATCHED THEN
                    INSERT (NAME, PRICE, MARKET_CAP, CHANGE, THUMB_IMAGE, TIMESTAMP)
                    VALUES (source.NAME, source.PRICE, source.MARKET_CAP, source.CHANGE, source.THUMB_IMAGE, source.TIMESTAMP)
                """
                cur.execute(merge_sql)
                # For MERGE, rowcount is a tuple of (rows_inserted, rows_updated)
                merge_results = cur.fetchone()
                print(f"[{datetime.now()}] Snowflake merge complete.")
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR connecting or writing to Snowflake: {e}", file=sys.stderr)
        if e.errno == 250001: # Invalid credentials
            print("ERROR: Invalid Snowflake username or password. Check SNOWFLAKE_CONFIG.", file=sys.stderr)

# --- 4. Main Job and Scheduler ---
def main_job():
    print(f"\n--- [{datetime.now()}] Starting 10-min job ---")
    price_data = fetch_coingecko_data()
    update_snowflake_data(price_data)
    print(f"--- [{datetime.now()}] 10-min job finished. Sleeping... ---")

if __name__ == "__main__":
    print("--- Starting CoinGecko->Snowflake ETL service ---")

    main_job()

    schedule.every(10).minutes.do(main_job)
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n--- Service stopped by user ---")
        sys.exit(0)