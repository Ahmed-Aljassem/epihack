from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings

# Absolute path to .env in the project root, regardless of working directory
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AWS credentials (shared by DynamoDB and S3)
    DYNAMO_ACCESS_KEY_ID: str = ""
    DYNAMO_SECRET_ACCESS_KEY: str = ""
    DYNAMO_REGION: str = "us-east-2"

    # DynamoDB tables
    DYNAMO_SURVEYS_TABLE: str = "epihack_surveys"
    DYNAMO_REPORTS_TABLE: str = "epihack_reports"

    # To be implemented
    DYNAMO_RESPONSES_TABLE: str = "epihack_responses"
    DYNAMO_ALERTS_TABLE: str = "epihack_alerts"

    # Cognito OIDC
    COGNITO_AUTHORITY: str = "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YoX88Tklu"
    COGNITO_CLIENT_ID: str = "6mbhoc1p6d1egrfq4o2hu2a9sc"
    COGNITO_CLIENT_SECRET: str = ""
    COGNITO_REDIRECT_URI: str = "https://d84l1y8p4kdic.cloudfront.net"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # S3
    S3_IMAGES_BUCKET: str = "epihack"

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
        env_file = str(_ENV_FILE)
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()