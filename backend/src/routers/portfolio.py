import snowflake.connector
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import sys
from src.deps import get_db_connection
from src.routers.schemas import TransactionRequest, Portfolio, Asset, TransactionRecord, UserBalance
from typing import List

router = APIRouter()

def _get_user_portfolio(user_id: str, cur: snowflake.connector.cursor.SnowflakeCursor) -> dict:
    cur.execute("""
        MERGE INTO PORTFOLIOS p
        USING (SELECT %s AS USER_ID) AS src
        ON p.USER_ID = src.USER_ID
        WHEN NOT MATCHED THEN
            INSERT (USER_ID, BALANCE) VALUES (%s, 100000.00);
    """, (user_id, user_id))
    
    cur.execute("SELECT BALANCE FROM PORTFOLIOS WHERE USER_ID = %s", (user_id,))
    usd_balance = float(cur.fetchone()[0])
    
    cur.execute("SELECT SYMBOL, AMOUNT FROM PORTFOLIO_ASSETS WHERE USER_ID = %s AND AMOUNT > 0", (user_id,))
    assets = cur.fetchall()
    
    return {
        "user_id": user_id,
        "usd_balance": usd_balance,
        "assets": [{"symbol": symbol, "amount": amount} for symbol, amount in assets]
    }

# --- HELPER: Get current asset amount ---
def _get_asset_amount(user_id: str, symbol: str, cur: snowflake.connector.cursor.SnowflakeCursor) -> float:
    cur.execute("SELECT AMOUNT FROM PORTFOLIO_ASSETS WHERE USER_ID = %s AND SYMBOL = %s", (user_id, symbol))
    result = cur.fetchone()
    return result[0] if result else 0.0

@router.get("/{user_id}", response_model=Portfolio, tags=["portfolio"])
def get_user_portfolio(user_id: str, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    try:
        with db.cursor() as cur:
            portfolio_data = _get_user_portfolio(user_id, cur)
            return portfolio_data
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR in get_user_portfolio: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database error")

# --- ROUTE 2: Get Transaction History ---
@router.get("/{user_id}/history", response_model=List[TransactionRecord], tags=["portfolio"])
def get_transaction_history(user_id: str, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            cur.execute("SELECT * FROM TRANSACTION_HISTORY WHERE USER_ID = %s ORDER BY TIMESTAMP DESC", (user_id,))
            history = cur.fetchall()

            processed_history = []
            for row in history:
                processed_history.append(
                    TransactionRecord(
                        transaction_id=row["TRANSACTION_ID"],
                        user_id=row["USER_ID"],
                        symbol=row["SYMBOL"],
                        transaction_type=row["TRANSACTION_TYPE"],
                        amount_coin=row["AMOUNT_COIN"],
                        price_per_coin=row["PRICE_PER_COIN"],
                        total_usd=row["TOTAL_USD"],
                        timestamp=row["TIMESTAMP"]
                    )
                )
            return processed_history
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR in get_transaction_history: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database error")

# --- Execute a Transaction ---
@router.post("/transact", response_model=Portfolio, tags=["portfolio"])
def execute_transaction(tx: TransactionRequest, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    total_usd = tx.amount_coin * tx.price_per_coin

    try:
        with db.cursor() as cur:
            # === 1. START DATABASE TRANSACTION ===
            cur.execute("BEGIN TRANSACTION")

            # === 2. Get current state (and lock rows for update) ===
            portfolio_data = _get_user_portfolio(tx.user_id, cur)
            current_usd = portfolio_data["usd_balance"]
            current_coin_amount = _get_asset_amount(tx.user_id, tx.symbol, cur)

            new_usd_balance = current_usd
            new_coin_amount = current_coin_amount

            # === 3. Business Logic ===
            if tx.transaction_type.upper() == "BUY":
                if current_usd < total_usd:
                    cur.execute("ROLLBACK")
                    raise HTTPException(status_code=400, detail="Insufficient USD balance")
                
                new_usd_balance = current_usd - total_usd
                new_coin_amount = current_coin_amount + tx.amount_coin
            elif tx.transaction_type.upper() == "SELL":
                if current_coin_amount < tx.amount_coin:
                    cur.execute("ROLLBACK")
                    raise HTTPException(status_code=400, detail=f"Insufficient {tx.symbol} balance")
                
                new_usd_balance = current_usd + total_usd
                new_coin_amount = current_coin_amount - tx.amount_coin
            else:
                cur.execute("ROLLBACK")
                raise HTTPException(status_code=400, detail="Invalid transaction_type. Must be 'BUY' or 'SELL'.")

            # === 4. Update Balance ===            
            cur.execute("UPDATE PORTFOLIOS SET BALANCE = %s, LAST_UPDATED = CURRENT_TIMESTAMP() WHERE USER_ID = %s", (new_usd_balance, tx.user_id))
            
            # Upsert (update/insert) asset balance
            cur.execute("""
                MERGE INTO PORTFOLIO_ASSETS t
                USING (SELECT %s AS USER_ID, %s AS SYMBOL, %s AS AMOUNT) AS s
                ON (t.USER_ID = s.USER_ID AND t.SYMBOL = s.SYMBOL)
                WHEN MATCHED THEN
                    UPDATE SET t.AMOUNT = s.AMOUNT, t.LAST_UPDATED = CURRENT_TIMESTAMP()
                WHEN NOT MATCHED THEN
                    INSERT (USER_ID, SYMBOL, AMOUNT, LAST_UPDATED)
                    VALUES (s.USER_ID, s.SYMBOL, s.AMOUNT, CURRENT_TIMESTAMP());
            """, (tx.user_id, tx.symbol, new_coin_amount))
            
            # Log the transaction
            cur.execute("""
                INSERT INTO TRANSACTION_HISTORY 
                    (USER_ID, SYMBOL, TRANSACTION_TYPE, AMOUNT_COIN, PRICE_PER_COIN, TOTAL_USD)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (tx.user_id, tx.symbol, tx.transaction_type.upper(), tx.amount_coin, tx.price_per_coin, total_usd))
            
            # === 5. COMMIT TRANSACTION ===
            cur.execute("COMMIT")
            
            # === 6. Get the final, updated portfolio to return to the user ===
            print(f"[{datetime.now()}] Transaction successful for {tx.user_id}")
            return _get_user_portfolio(tx.user_id, cur)
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR in transaction: {e}. ROLLING BACK.", file=sys.stderr)
        with db.cursor() as cur:
            cur.execute("ROLLBACK")
        raise HTTPException(status_code=500, detail="Database transaction failed")
    
@router.get("/{user_id}/balance", response_model=UserBalance, tags=["portfolio"])
def get_user_balance(user_id: str, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            cur.execute("SELECT BALANCE FROM PORTFOLIOS WHERE USER_ID = %s", (user_id,))
            user_record = cur.fetchone()
            if not user_record:
                print(f"[{datetime.now()}] ERROR in get_user_balance: User not found {user_id}", file=sys.stderr)
                raise HTTPException(status_code=404, detail="User not found")
                
            return UserBalance(user_id=user_id, usd_balance=user_record["BALANCE"])
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR in get_user_balance: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database error")