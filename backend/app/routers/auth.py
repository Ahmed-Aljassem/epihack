from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from app.config import get_settings

settings = get_settings()

_oauth = OAuth()
_oauth.register(
    name="oidc",
    authority=settings.COGNITO_AUTHORITY,
    client_id=settings.COGNITO_CLIENT_ID,
    client_secret=settings.COGNITO_CLIENT_SECRET,
    server_metadata_url=f"{settings.COGNITO_AUTHORITY}/.well-known/openid-configuration",
    client_kwargs={"scope": "phone openid email"},
)

cognito_router = APIRouter(tags=["Authentication"])


@cognito_router.get("/")
async def index(request: Request):
    user = request.session.get("user")
    if user:
        return {"message": f"Hello, {user['email']}", "logout": "/logout"}
    return {"message": "Welcome! Please login.", "login": "/login"}


@cognito_router.get("/login")
async def cognito_login(request: Request):
    return await _oauth.oidc.authorize_redirect(request, settings.COGNITO_REDIRECT_URI)


@cognito_router.get("/authorize")
async def cognito_authorize(request: Request):
    token = await _oauth.oidc.authorize_access_token(request)
    request.session["user"] = dict(token["userinfo"])
    return RedirectResponse(url="/")


@cognito_router.get("/logout")
async def cognito_logout(request: Request):
    request.session.pop("user", None)
    return RedirectResponse(url="/")
