import snowflake.connector
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import sys
import hashlib
import uuid
from src.deps import get_db_connection

router = APIRouter()

# --- Pydantic Model ---
class UserCredentials(BaseModel):
    username: str
    password: str

@router.post("/signin", tags=["Authentication"])
def signin_user(credentials: UserCredentials, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /auth/signin for user: {credentials.username}")

    query = """
    SELECT USER_ID, USERNAME, BALANCE, PASSWORD 
    FROM PORTFOLIOS
    WHERE USERNAME = %s;
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            print(f"[{datetime.now()}] Executing Snowflake query for user...")
            cur.execute(query, (credentials.username,))
            user_record = cur.fetchone()
            if not user_record: # 1. Check if user exists
                print(f"[{datetime.now()}] Auth failure: User '{credentials.username}' not found.")
                raise HTTPException(status_code=401, detail="Invalid username or password")

            stored_hash = user_record["PASSWORD"] # 2. Check the password
            incoming_hash = hashlib.sha256(credentials.password.encode('utf-8')).hexdigest()
            is_password_match = (incoming_hash == stored_hash)
            print(f"Line 39 auth.py: is_password_match = {is_password_match}")

            if not is_password_match:
                print(f"[{datetime.now()}] Auth failure: Invalid password for user '{credentials.username}'.")
                raise HTTPException(status_code=401, detail="Invalid username or password")

            # 3. Authentication Success!
            print(f"[{datetime.now()}] Auth success for user: {user_record['USERNAME']}")            
            return {
                "message": "Sign in successful",
                "user": {
                    "user_id": user_record["USER_ID"],
                    "username": user_record["USERNAME"],
                    "balance": user_record["BALANCE"]
                },
                "fetched_at": datetime.now().isoformat()
            }
    except snowflake.connector.Error as e:
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database query error")
    except Exception as e:
        print(f"[{datetime.now()}] ERROR processing request: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="An internal server error occurred")

@router.post("/signup", tags=["Authentication"])
def signup_user(credentials: UserCredentials, db: snowflake.connector.SnowflakeConnection = Depends(get_db_connection)):
    print(f"[{datetime.now()}] API call received for /auth/signup for user: {credentials.username}")
    
    # --- Generate the password hash ---
    hashed_password_str = hashlib.sha256(credentials.password.encode('utf-8')).hexdigest()
    default_balance = 100000.00
    new_user_id = str(uuid.uuid4())
    
    query = """
    INSERT INTO PORTFOLIOS (USER_ID, USERNAME, PASSWORD, BALANCE)
    VALUES (%s, %s, %s, %s);
    """

    try:
        with db.cursor(snowflake.connector.DictCursor) as cur:
            # Check if user already exists
            cur.execute("SELECT USERNAME FROM PORTFOLIOS WHERE USERNAME = %s", (credentials.username,))
            if cur.fetchone():
                print(f"[{datetime.now()}] Signup failure: User '{credentials.username}' already exists.")
                raise HTTPException(status_code=400, detail="Username already exists")

            # If not, create the new user
            print(f"[{datetime.now()}] Creating new user: {credentials.username}")
            cur.execute(query, (new_user_id, credentials.username, hashed_password_str, default_balance))
            
            cur.execute('SELECT USER_ID, USERNAME, BALANCE FROM PORTFOLIOS WHERE USERNAME = %s', (credentials.username,))
            new_user = cur.fetchone()

            print(f"[{datetime.now()}] Successfully created user: {new_user['USERNAME']}")
            return {
                "message": "Sign up successful",
                "user": new_user,
                "fetched_at": datetime.now().isoformat()
            }
    except snowflake.connector.Error as e:
        if e.errno == 2627 or "unique constraint" in str(e).lower():
            print(f"[{datetime.now()}] Signup failure (race condition): User '{credentials.username}' already exists.")
            raise HTTPException(status_code=400, detail="Username already exists")
        print(f"[{datetime.now()}] ERROR executing query: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Database query error")
    except Exception as e:
        print(f"[{datetime.now()}] ERROR processing request: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="An internal server error occurred")