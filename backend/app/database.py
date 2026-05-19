from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger
from app.config import get_settings

settings = get_settings()

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    # Verify connection
    await _client.admin.command("ping")
    logger.info("✅ Connected to MongoDB")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("🔌 MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("Database not initialized — call connect_db() first.")
    return _client[settings.DB_NAME]


# ── Collection helpers ──────────────────────────────────────────

def users_col():
    return get_db()["users"]

def surveys_col():
    return get_db()["surveys"]

def responses_col():
    return get_db()["responses"]

def alerts_col():
    return get_db()["alerts"]

def locations_col():
    return get_db()["locations"]
