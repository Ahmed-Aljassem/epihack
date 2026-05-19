from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import surveys_col, responses_col
from app.schemas.schemas import SurveyResponseCreate, SurveyResponseOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/responses", tags=["Responses"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/", response_model=SurveyResponseOut, status_code=status.HTTP_201_CREATED)
async def submit_response(
    payload: SurveyResponseCreate,
    current_user: dict = Depends(get_current_user),
):
    # Verify survey exists and is active
    survey = await surveys_col().find_one({"_id": ObjectId(payload.survey_id)})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if survey["status"] != "active":
        raise HTTPException(status_code=400, detail="Survey is not currently active")

    now = datetime.now(timezone.utc)
    doc = {
        **payload.model_dump(),
        "user_id": str(current_user["_id"]),
        "submitted_at": now,
    }
    result = await responses_col().insert_one(doc)
    doc["_id"] = result.inserted_id

    # Increment survey response counter
    await surveys_col().update_one(
        {"_id": ObjectId(payload.survey_id)},
        {"$inc": {"response_count": 1}},
    )

    return _serialize(doc)


@router.get("/survey/{survey_id}", response_model=list[SurveyResponseOut])
async def get_responses_for_survey(
    survey_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    cursor = (
        responses_col()
        .find({"survey_id": survey_id})
        .sort("submitted_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


@router.get("/me", response_model=list[SurveyResponseOut])
async def my_responses(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    cursor = (
        responses_col()
        .find({"user_id": str(current_user["_id"])})
        .sort("submitted_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]
