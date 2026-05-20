from datetime import datetime, timezone
<<<<<<< HEAD
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import surveys_col, responses_col
from app.schemas.schemas import SurveyCreate, SurveyOut
from app.models.enums import SurveyStatus, SurveyCategory, UserRole
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])
=======
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.config import get_settings
from app.schemas.schemas import SurveyCreate, SurveyOut
from app.models.enums import SurveyStatus, SurveyCategory, UserRole
from app.utils.auth import get_current_user, require_role
from app.utils.dynamo import client as db

settings = get_settings()
router = APIRouter(prefix="/api/surveys", tags=["Surveys"])
TABLE = settings.DYNAMO_SURVEYS_TABLE
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92

EDITOR_ROLES = (UserRole.EPIDEMIOLOGIST, UserRole.HEALTH_WORKER, UserRole.ADMIN)


<<<<<<< HEAD
def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc
=======
def _to_out(doc: dict) -> SurveyOut:
    return SurveyOut(**{**doc, "id": doc["survey_id"]})
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92


@router.get("/", response_model=list[SurveyOut])
async def list_surveys(
    category: SurveyCategory | None = None,
    status: SurveyStatus = SurveyStatus.ACTIVE,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
<<<<<<< HEAD
    query: dict = {"status": status}
    if category:
        query["category"] = category

    cursor = surveys_col().find(query).sort("created_at", -1).skip(skip).limit(limit)
    surveys = await cursor.to_list(length=limit)
    return [_serialize(s) for s in surveys]
=======
    filters: dict = {"status": status}
    if category:
        filters["category"] = category
    docs = db.scan(TABLE, filters)
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return [_to_out(d) for d in docs[skip : skip + limit]]
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92


@router.post("/", response_model=SurveyOut, status_code=status.HTTP_201_CREATED)
async def create_survey(
    payload: SurveyCreate,
    current_user: dict = Depends(require_role(*EDITOR_ROLES)),
):
<<<<<<< HEAD
    now = datetime.now(timezone.utc)
    doc = {
        **payload.model_dump(),
        "status": SurveyStatus.ACTIVE,
        "response_count": 0,
        "created_by": str(current_user["_id"]),
        "created_at": now,
        "updated_at": now,
    }
    result = await surveys_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)
=======
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **payload.model_dump(),
        "survey_id": str(uuid4()),
        "status": SurveyStatus.ACTIVE,
        "response_count": 0,
        "created_by": current_user["sub"],
        "created_at": now,
        "updated_at": now,
    }
    db.put_item(TABLE, doc)
    return _to_out(doc)
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92


@router.get("/{survey_id}", response_model=SurveyOut)
async def get_survey(survey_id: str):
<<<<<<< HEAD
    doc = await surveys_col().find_one({"_id": ObjectId(survey_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _serialize(doc)
=======
    doc = db.get_item(TABLE, {"survey_id": survey_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _to_out(doc)
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92


@router.patch("/{survey_id}/status")
async def update_status(
    survey_id: str,
    new_status: SurveyStatus,
    current_user: dict = Depends(require_role(*EDITOR_ROLES)),
):
<<<<<<< HEAD
    result = await surveys_col().update_one(
        {"_id": ObjectId(survey_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")
=======
    if not db.get_item(TABLE, {"survey_id": survey_id}):
        raise HTTPException(status_code=404, detail="Survey not found")
    db.update_item(
        TABLE,
        {"survey_id": survey_id},
        {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()},
    )
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
    return {"message": f"Status updated to {new_status}"}


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(
    survey_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
):
<<<<<<< HEAD
    await surveys_col().delete_one({"_id": ObjectId(survey_id)})
=======
    db.delete_item(TABLE, {"survey_id": survey_id})
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
