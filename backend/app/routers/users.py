"""
/api/users — user profile management.

Endpoints:
  PATCH  /api/users/me/profile     Update the extended profile fields from whiteboard
  GET    /api/users/{user_id}       Admin: fetch any user profile
  GET    /api/users                 Admin: list users (paginated)
  GET    /api/users/export/csv      Admin: export user list as CSV (Image 2 feature)
"""
import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.database import users_col
from app.schemas.schemas import UserOut, UserProfileUpdate
from app.models.enums import UserRole
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["Users"])


def _serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "role": doc["role"],
        "age": doc.get("age"),
        "sex": doc.get("sex"),
        "nationality": doc.get("nationality"),
        "notes": doc.get("notes"),
        "topics_interested": doc.get("topics_interested", []),
        "home_zips": doc.get("home_zips", []),
        "phone_num": doc.get("phone_num"),
        "is_outdoor_worker": doc.get("is_outdoor_worker"),
        "timezone": doc.get("timezone"),
        "event_id": doc.get("event_id"),
        "created_at": doc["created_at"],
    }


# ── Current user profile ──────────────────────────────────────────

@router.patch("/me/profile", response_model=UserOut)
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Partial update of the extended user profile.
    Only fields included in the request body are written;
    omitted fields stay unchanged (PATCH semantics).
    """
    # Only write fields explicitly set by the client (exclude unset)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    updates["updated_at"] = datetime.now(timezone.utc)

    await users_col().update_one(
        {"_id": current_user["_id"]},
        {"$set": updates},
    )

    updated = await users_col().find_one({"_id": current_user["_id"]})
    return UserOut(**_serialize_user(updated))


# ── Admin endpoints ───────────────────────────────────────────────

@router.get("/", response_model=list[UserOut])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: UserRole | None = None,
    _admin=Depends(require_role(UserRole.ADMIN)),
):
    query = {}
    if role:
        query["role"] = role
    cursor = users_col().find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [UserOut(**_serialize_user(d)) for d in docs]


@router.get("/export/csv")
async def export_users_csv(
    _admin=Depends(require_role(UserRole.ADMIN)),
):
    """
    Export all users as a downloadable CSV file.
    Matches the 'have export csv' feature from the mobile admin dashboard whiteboard.
    """
    cursor = users_col().find({}).sort("created_at", -1)
    users = await cursor.to_list(length=10_000)

    fieldnames = [
        "id", "name", "email", "role", "age", "sex",
        "nationality", "phone_num", "is_outdoor_worker",
        "topics_interested", "home_zips", "timezone",
        "fk_event_id", "created_at",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for u in users:
        row = _serialize_user(u)
        # Flatten list fields to semicolon-separated strings for CSV readability
        row["topics_interested"] = ";".join(row.get("topics_interested") or [])
        row["home_zips"] = ";".join(row.get("home_zips") or [])
        writer.writerow(row)

    output.seek(0)
    filename = f"epidemic_radar_users_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    _admin=Depends(require_role(UserRole.ADMIN)),
):
    doc = await users_col().find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**_serialize_user(doc))
