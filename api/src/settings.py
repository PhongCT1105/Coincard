from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    app_env: str = "dev"
    api_port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()
