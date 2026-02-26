from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from agent import study_analysis_agent
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{user_id}")
async def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    """
    Main dashboard endpoint.
    Triggers the AI agent which:
    1. Fetches all courses for the user from DB
    2. Computes hours studied vs remaining per course
    3. Calls Gemini to generate risk level + summary
    4. Returns full analysis for frontend rendering
    """
    analysis = await study_analysis_agent(user_id, db)
    return {"user_id": user_id, "courses": analysis}
