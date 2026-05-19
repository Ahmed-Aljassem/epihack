from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "epidemic_radar"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Alert engine
    ALERT_RESPONSE_THRESHOLD: int = 10
    ALERT_ANOMALY_Z_SCORE: float = 2.5
    ALERT_SCAN_INTERVAL_MINUTES: int = 15

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
