from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from app.models.assessment import TestType

class TestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    test_type: TestType
    duration: int = Field(..., ge=5, le=180)  # minutes
    start_time: datetime
    end_time: datetime

class TestCreate(TestBase):
    questions: Optional[List[Dict[str, Any]]] = None
    answers: Optional[Dict[str, Any]] = None

class TestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, ge=5, le=180)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_published: Optional[bool] = None

class TestInDB(TestBase):
    id: UUID
    course_id: UUID
    lecturer_id: UUID
    is_published: bool
    questions: Optional[Any] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TestResponse(TestInDB):
    course_title: str
    attempt: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Test Generation
class TestGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3)
    test_type: TestType
    num_questions: int = Field(10, ge=5, le=50)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    course_context: Optional[str] = None

class TestGenerateResponse(BaseModel):
    questions: List[Dict[str, Any]]
    answers: Dict[str, Any]
    estimated_duration: int  # minutes
    difficulty_level: str

# Test Attempt
class TestAttemptStart(BaseModel):
    test_id: UUID

class TestAttemptAnswer(BaseModel):
    question_id: str
    answer: Any

class TestAttemptSubmit(BaseModel):
    answers: List[TestAttemptAnswer]

class TestAttemptResponse(BaseModel):
    id: UUID
    test_id: UUID
    student_id: UUID
    started_at: datetime
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    is_completed: bool
    
    class Config:
        from_attributes = True

class TestAttemptWithDetails(TestAttemptResponse):
    test_title: str
    student_name: str