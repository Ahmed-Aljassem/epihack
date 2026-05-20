from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from app.config import get_settings
from app.utils.auth import get_current_user

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


@cognito_router.get("/login")
async def cognito_login(request: Request):
    """Redirect the browser to the Cognito hosted login UI."""
    return await _oauth.oidc.authorize_redirect(request, settings.COGNITO_REDIRECT_URI)


@cognito_router.get("/authorize")
async def cognito_authorize(request: Request):
    """
    Cognito calls this after the user authenticates.
    Exchanges the auth code for tokens, then redirects the frontend
    with the id_token in the URL fragment (never sent to any server).
    The SPA reads it via window.location.hash and stores it locally.
    """
    token = await _oauth.oidc.authorize_access_token(request)
    id_token: str = token["id_token"]
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/callback#token={id_token}")


@cognito_router.get("/logout")
async def cognito_logout():
    """
    Stateless logout: redirect the user back to the frontend,
    where the SPA discards the stored token.
    For full Cognito session revocation add:
      COGNITO_LOGOUT_URL = https://<domain>.auth.<region>.amazoncognito.com/logout
        ?client_id=<id>&logout_uri=<frontend>
    and redirect there instead.
    """
    return RedirectResponse(url=settings.FRONTEND_URL)


@cognito_router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Return the current user's identity from their Cognito id_token claims."""
    return {
        "sub": current_user["sub"],
        "email": current_user.get("email"),
        "phone": current_user.get("phone_number"),
        "groups": current_user.get("cognito:groups", []),
    }
