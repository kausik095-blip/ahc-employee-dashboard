from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AHC Employee Dashboard API"
    environment: str = "development"

    database_url: str = "postgresql+psycopg://ahc:ahc_password@localhost:5432/ahc_db"

    jwt_secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    hr_api_url: str = "http://localhost:8000/mock-hr/ahc-updates"
    hr_api_key: str = "mock-hr-api-key"

    hospital_webhook_secret: str = "hospital-webhook-secret"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
