from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import (
    get_current_user,
    get_current_lecturer,
    get_current_student,
    get_current_admin
)
from app.models.user import User

def get_db() -> Generator:
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Role-specific dependencies
def require_lecturer(current_user: User = Depends(get_current_user)) -> User:
    """Require lecturer role."""
    if current_user.role.value != "lecturer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lecturer access required"
        )
    return current_user

def require_student(current_user: User = Depends(get_current_user)) -> User:
    """Require student role."""
    if current_user.role.value != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Course-specific dependencies
async def get_course_for_lecturer(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lecturer)
):
    """Get course if user is the lecturer."""
    from app.models.course import Course
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    return course

async def get_course_for_student(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Get course if student is enrolled."""
    from app.models.course import Course, Enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.is_active == True
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    return enrollment.course