from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import SessionCreate, SessionResponse
from crud import log_study_session, get_sessions_by_user
from typing import List

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])


@router.post("/{user_id}", response_model=SessionResponse)
def log_session(user_id: int, session: SessionCreate, db: Session = Depends(get_db)):
    return log_study_session(db, user_id, session)


@router.get("/{user_id}", response_model=List[SessionResponse])
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    return get_sessions_by_user(db, user_id)
