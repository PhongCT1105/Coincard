import os
from dotenv import load_dotenv
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    app_env: str = "dev"
    api_port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000"]  

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # Snowflake Config
    SNOWFLAKE_USER: str = os.getenv("SNOWFLAKE_USER")
    SNOWFLAKE_PASSWORD: str = os.getenv("SNOWFLAKE_PASSWORD")
    SNOWFLAKE_ACCOUNT: str = os.getenv("SNOWFLAKE_ACCOUNT")
    SNOWFLAKE_WAREHOUSE: str = "PROJECT_COINCARD"
    SNOWFLAKE_DATABASE: str = "PROJECT_DB"
    SNOWFLAKE_SCHEMA: str = "CORE"
    SNOWFLAKE_ROLE: str = "PROJECT_ANALYST"

settings = Settings()
