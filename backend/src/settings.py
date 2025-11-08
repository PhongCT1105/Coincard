# src/settings.py
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- App ---
    app_env: str = "dev"
    api_port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000"]

    # --- Snowflake (use BaseSettings to read env instead of os.getenv) ---
    SNOWFLAKE_USER: str | None = None
    SNOWFLAKE_PASSWORD: str | None = None
    SNOWFLAKE_ACCOUNT: str | None = None
    SNOWFLAKE_WAREHOUSE: str = "PROJECT_COINCARD"
    SNOWFLAKE_DATABASE: str = "PROJECT_DB"
    SNOWFLAKE_SCHEMA: str = "CORE"
    SNOWFLAKE_ROLE: str = "PROJECT_ANALYST"

    # Pydantic v2 settings
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",         # <- prevents extra_forbidden for unrelated envs
    )

settings = Settings()
