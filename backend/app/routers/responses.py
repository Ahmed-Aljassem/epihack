from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.config import get_settings
from app.schemas.schemas import SurveyResponseCreate, SurveyResponseOut
from app.utils.auth import get_current_user
from app.utils.dynamo import client as db

settings = get_settings()
router = APIRouter(prefix="/api/responses", tags=["Responses"])
RESPONSES = settings.DYNAMO_RESPONSES_TABLE
SURVEYS = settings.DYNAMO_SURVEYS_TABLE


def _to_out(doc: dict) -> SurveyResponseOut:
    return SurveyResponseOut(**{**doc, "id": doc["response_id"]})


@router.post("/", response_model=SurveyResponseOut, status_code=status.HTTP_201_CREATED)
async def submit_response(
    payload: SurveyResponseCreate,
    current_user: dict = Depends(get_current_user),
):
    survey = db.get_item(SURVEYS, {"survey_id": payload.survey_id})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if survey["status"] != "active":
        raise HTTPException(status_code=400, detail="Survey is not currently active")

    doc = {
        **payload.model_dump(),
        "response_id": str(uuid4()),
        "user_id": current_user["sub"],
        "category": survey["category"],
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    db.put_item(RESPONSES, doc)
    db.increment_field(SURVEYS, {"survey_id": payload.survey_id}, "response_count")
    return _to_out(doc)


@router.get("/survey/{survey_id}", response_model=list[SurveyResponseOut])
async def get_responses_for_survey(
    survey_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    docs = db.scan(RESPONSES, {"survey_id": survey_id})
    docs.sort(key=lambda d: d.get("submitted_at", ""), reverse=True)
    return [_to_out(d) for d in docs[skip : skip + limit]]


@router.get("/me", response_model=list[SurveyResponseOut])
async def my_responses(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    docs = db.scan(RESPONSES, {"user_id": current_user["sub"]})
    docs.sort(key=lambda d: d.get("submitted_at", ""), reverse=True)
    return [_to_out(d) for d in docs[skip : skip + limit]]
