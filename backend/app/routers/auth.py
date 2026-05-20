import hmac
import hashlib
import base64

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings

settings = get_settings()

# ── Cognito Identity Provider client ────────────────────────────
_cognito = boto3.client(
    "cognito-idp",
    region_name=settings.DYNAMO_REGION,
    aws_access_key_id=settings.DYNAMO_ACCESS_KEY_ID,
    aws_secret_access_key=settings.DYNAMO_SECRET_ACCESS_KEY,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _secret_hash(username: str) -> str | None:
    """Compute SECRET_HASH required by Cognito app clients that have a client secret."""
    if not settings.COGNITO_CLIENT_SECRET:
        return None
    msg = (username + settings.COGNITO_CLIENT_ID).encode("utf-8")
    key = settings.COGNITO_CLIENT_SECRET.encode("utf-8")
    sig = hmac.new(key, msg=msg, digestmod=hashlib.sha256).digest()
    return base64.b64encode(sig).decode()


def _auth_params(username: str, extra: dict) -> dict:
    params = {"USERNAME": username, **extra}
    h = _secret_hash(username)
    if h:
        params["SECRET_HASH"] = h
    return params


# ── Request / Response models ────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "citizen"

class ConfirmRequest(BaseModel):
    email: str
    code: str


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate with Cognito and return tokens."""
    try:
        resp = _cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters=_auth_params(req.email, {"PASSWORD": req.password}),
            ClientId=settings.COGNITO_CLIENT_ID,
        )
        result = resp["AuthenticationResult"]
        return {
            "id_token":      result["IdToken"],
            "access_token":  result["AccessToken"],
            "refresh_token": result["RefreshToken"],
        }
    except _cognito.exceptions.NotAuthorizedException:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except _cognito.exceptions.UserNotConfirmedException:
        raise HTTPException(status_code=403, detail="Please confirm your email before signing in")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/register")
async def register(req: RegisterRequest):
    """Create a new Cognito user. Returns whether email confirmation is needed."""
    try:
        sh = _secret_hash(req.email)
        kwargs = dict(
            ClientId=settings.COGNITO_CLIENT_ID,
            Username=req.email,
            Password=req.password,
            UserAttributes=[
                {"Name": "email",       "Value": req.email},
                {"Name": "name",        "Value": req.name},
                {"Name": "custom:role", "Value": req.role},
            ],
        )
        if sh:
            kwargs["SecretHash"] = sh
        resp = _cognito.sign_up(**kwargs)
        return {"needs_confirmation": not resp["UserConfirmed"]}
    except _cognito.exceptions.UsernameExistsException:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm")
async def confirm(req: ConfirmRequest):
    """Confirm a user's email address with the verification code."""
    try:
        sh = _secret_hash(req.email)
        kwargs = dict(
            ClientId=settings.COGNITO_CLIENT_ID,
            Username=req.email,
            ConfirmationCode=req.code,
        )
        if sh:
            kwargs["SecretHash"] = sh
        _cognito.confirm_sign_up(**kwargs)
        return {"confirmed": True}
    except _cognito.exceptions.CodeMismatchException:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    except _cognito.exceptions.ExpiredCodeException:
        raise HTTPException(status_code=400, detail="Verification code has expired — request a new one")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
