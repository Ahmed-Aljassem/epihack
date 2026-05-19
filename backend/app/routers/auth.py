from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
from app.database import users_col
from app.schemas.schemas import UserCreate, UserOut, TokenResponse
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "role": doc["role"],
        "created_at": doc["created_at"],
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    if await users_col().find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)
    doc = {
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": payload.role,
        "location": payload.location.model_dump() if payload.location else None,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await users_col().insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id), "role": payload.role})
    return TokenResponse(access_token=token, user=UserOut(**_serialize_user(doc)))


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await users_col().find_one({"email": form.username})
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserOut(**_serialize_user(user)))


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(**_serialize_user(current_user))
