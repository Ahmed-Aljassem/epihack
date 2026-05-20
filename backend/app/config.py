from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # DynamoDB tables
    DYNAMO_USERS_TABLE: str = "epihack_users"
    DYNAMO_SURVEYS_TABLE: str = "epihack_surveys"
    DYNAMO_RESPONSES_TABLE: str = "epihack_responses"
    DYNAMO_ALERTS_TABLE: str = "epihack_alerts"

    # Cognito OIDC
    COGNITO_AUTHORITY: str = "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YoX88Tklu"
    COGNITO_CLIENT_ID: str = "6mbhoc1p6d1egrfq4o2hu2a9sc"
    COGNITO_CLIENT_SECRET: str = ""
    COGNITO_REDIRECT_URI: str = "https://d84l1y8p4kdic.cloudfront.net"

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
