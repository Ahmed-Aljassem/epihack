from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import surveys_col, responses_col
from app.schemas.schemas import SurveyCreate, SurveyOut
from app.models.enums import SurveyStatus, SurveyCategory, UserRole
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])

EDITOR_ROLES = (UserRole.EPIDEMIOLOGIST, UserRole.HEALTH_WORKER, UserRole.ADMIN)


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=list[SurveyOut])
async def list_surveys(
    category: SurveyCategory | None = None,
    status: SurveyStatus = SurveyStatus.ACTIVE,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: dict = {"status": status}
    if category:
        query["category"] = category

    cursor = surveys_col().find(query).sort("created_at", -1).skip(skip).limit(limit)
    surveys = await cursor.to_list(length=limit)
    return [_serialize(s) for s in surveys]


@router.post("/", response_model=SurveyOut, status_code=status.HTTP_201_CREATED)
async def create_survey(
    payload: SurveyCreate,
    current_user: dict = Depends(require_role(*EDITOR_ROLES)),
):
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


@router.get("/{survey_id}", response_model=SurveyOut)
async def get_survey(survey_id: str):
    doc = await surveys_col().find_one({"_id": ObjectId(survey_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _serialize(doc)


@router.patch("/{survey_id}/status")
async def update_status(
    survey_id: str,
    new_status: SurveyStatus,
    current_user: dict = Depends(require_role(*EDITOR_ROLES)),
):
    result = await surveys_col().update_one(
        {"_id": ObjectId(survey_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")
    return {"message": f"Status updated to {new_status}"}


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(
    survey_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
):
    await surveys_col().delete_one({"_id": ObjectId(survey_id)})
