from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import CourseCreate, CourseResponse
from crud import get_courses_by_user, create_course, delete_course
from typing import List

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/{user_id}", response_model=List[CourseResponse])
def list_courses(user_id: int, db: Session = Depends(get_db)):
    return get_courses_by_user(db, user_id)


@router.post("/{user_id}", response_model=CourseResponse)
def add_course(user_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    return create_course(db, user_id, course)


@router.delete("/{user_id}/{course_id}")
def remove_course(user_id: int, course_id: int, db: Session = Depends(get_db)):
    course = delete_course(db, course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": f"Course '{course.course_name}' deleted successfully"}
