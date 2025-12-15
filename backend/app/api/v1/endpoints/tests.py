from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.security import get_current_user, require_lecturer, require_student
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.models.assessment import Test, TestAttempt, TestType
from app.schemas.test import (
    TestCreate,
    TestResponse,
    TestGenerateRequest,
    TestGenerateResponse,
    TestAttemptStart,
    TestAttemptSubmit,
    TestAttemptResponse
)
from app.services.llm_service import LLMService
import json


router = APIRouter()
llm_service = LLMService()

@router.get("/students/tests", response_model=List[TestResponse])
async def get_student_tests(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get all published tests for courses the student is enrolled in."""
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()
    
    course_ids = [e.course_id for e in enrollments]
    
    tests = db.query(Test).filter(
        Test.course_id.in_(course_ids),
        Test.is_published == True
    ).all()
    
    for test in tests:
        course = db.query(Course).filter(Course.id == test.course_id).first()
        try:
            setattr(test, "course_title", course.title if course else "Unknown")
        except Exception:
            pass
            
        attempt = db.query(TestAttempt).filter(
            TestAttempt.test_id == test.id,
            TestAttempt.student_id == current_user.id
        ).order_by(TestAttempt.submitted_at.desc()).first()
        
        if attempt:
            try:
                attempt_data = {
                    "id": str(attempt.id),
                    "status": "graded" if attempt.is_completed and attempt.score is not None else ("submitted" if attempt.is_completed else "in_progress"),
                    "score": attempt.score,
                    "started_at": attempt.started_at.isoformat() if attempt.started_at else None
                }
                setattr(test, "attempt", attempt_data)
            except Exception:
                pass

    return tests

@router.post("/courses/{course_id}/tests/generate", response_model=TestGenerateResponse)
async def generate_test(
    course_id: UUID,
    request: TestGenerateRequest,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Generate test questions using AI."""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    test_data = await llm_service.generate_test(
        request.topic,
        request.test_type.value,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        context=request.course_context
    )
    
    return TestGenerateResponse(
        questions=test_data.get("questions", []),
        answers=test_data.get("answers", {}),
        estimated_duration=test_data.get("estimated_duration", 60),
        difficulty_level=request.difficulty
    )

@router.post("/courses/{course_id}/tests", response_model=TestResponse)
async def create_test(
    course_id: UUID,
    test_data: TestCreate,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Create a new test."""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    if test_data.start_time >= test_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )
    
    test = Test(
        **test_data.dict(),
        course_id=course_id,
        lecturer_id=current_user.id,
        is_published=False
    )
    
    db.add(test)
    db.commit()
    db.refresh(test)
    try:
        setattr(test, "course_title", course.title)
    except Exception:
        pass
    
    return test

@router.put("/tests/{test_id}/publish")
async def publish_test(
    test_id: UUID,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Publish a test for students."""
    test = db.query(Test).filter(
        Test.id == test_id,
        Test.lecturer_id == current_user.id
    ).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or unauthorized"
        )
    
    if test.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test is already published"
        )
    
    test.is_published = True
    db.commit()
    
    return {"message": "Test published successfully"}

@router.get("/courses/{course_id}/tests", response_model=List[TestResponse])
async def get_course_tests(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tests for a course."""

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if current_user.role == UserRole.STUDENT:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enrolled in this course"
            )
        
        tests = db.query(Test).filter(
            Test.course_id == course_id,
            Test.is_published == True
        ).all()
    else:
        tests = db.query(Test).filter(
            Test.course_id == course_id
        ).all()

    for t in tests:
        try:
            setattr(t, "course_title", course.title)
        except Exception:
            pass
    
    return tests

@router.post("/tests/{test_id}/start", response_model=TestAttemptResponse)
async def start_test_attempt(
    test_id: UUID,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Start a test attempt."""
    test = db.query(Test).filter(
        Test.id == test_id,
        Test.is_published == True
    ).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or not published"
        )
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == test.course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    now = datetime.now(timezone.utc)
    if now < test.start_time or now > test.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test is not available at this time"
        )
    
    existing_attempt = db.query(TestAttempt).filter(
        TestAttempt.test_id == test_id,
        TestAttempt.student_id == current_user.id,
        TestAttempt.is_completed == False
    ).first()
    
    if existing_attempt:
        time_elapsed = now - existing_attempt.started_at
        if time_elapsed.total_seconds() > test.duration * 60:
            existing_attempt.is_completed = True
            db.commit()
        else:
            return existing_attempt
    
    attempt = TestAttempt(
        test_id=test_id,
        student_id=current_user.id
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return attempt

@router.post("/attempts/{attempt_id}/submit", response_model=TestAttemptResponse)
async def submit_test_attempt(
    attempt_id: UUID,
    submission: TestAttemptSubmit,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Submit test attempt."""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.student_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found or unauthorized"
        )
    
    if attempt.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt already submitted"
        )
    
    test = db.query(Test).filter(Test.id == attempt.test_id).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    now = datetime.utcnow()
    time_elapsed = now - attempt.started_at
    
    if time_elapsed.total_seconds() > test.duration * 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test time has expired"
        )
    
    score = await calculate_test_score(test, submission.answers)
    
    attempt.answers = [answer.dict() for answer in submission.answers]
    attempt.score = score
    attempt.submitted_at = now
    attempt.is_completed = True
    
    db.commit()
    db.refresh(attempt)
    
    return attempt

async def calculate_test_score(test: Test, answers: List) -> float:
    """Calculate score for test attempt."""
    if not test.questions:
        return 0.0
    
    total_questions = len(test.questions)
    correct_answers = 0
    
    for answer in answers:
        question = next((q for q in test.questions if q.get("id") == answer.question_id), None)
        if question and question.get("correct_answer") == answer.answer:
            correct_answers += 1
    
    return (correct_answers / total_questions) * 100 if total_questions > 0 else 0.0

@router.get("/tests/{test_id}/attempts", response_model=List[TestAttemptResponse])
async def get_test_attempts(
    test_id: UUID,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Get all attempts for a test (lecturer only)."""
    test = db.query(Test).filter(
        Test.id == test_id,
        Test.lecturer_id == current_user.id
    ).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or unauthorized"
        )
    
    attempts = db.query(TestAttempt).filter(
        TestAttempt.test_id == test_id
    ).all()
    
    return attempts