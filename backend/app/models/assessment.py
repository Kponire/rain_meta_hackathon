from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Enum, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class AssignmentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    instructions = Column(Text)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    lecturer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime(timezone=True))
    max_score = Column(Float, default=100.0)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    is_ai_generated = Column(Boolean, default=False)
    generation_prompt = Column(Text)
    questions = Column(JSON)  # Structured questions from AI
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="assignments")
    lecturer = relationship("User")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text)  # Text submission
    file_url = Column(String)  # File submission URL
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True))
    score = Column(Float)
    feedback = Column(Text)
    ai_feedback = Column(Text)
    is_graded = Column(Boolean, default=False)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

class TestType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT_BASED = "text_based"
    MIXED = "mixed"

class Test(Base):
    __tablename__ = "tests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    lecturer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    test_type = Column(Enum(TestType), nullable=False)
    duration = Column(Integer)  # in minutes
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    is_published = Column(Boolean, default=False)
    questions = Column(JSON)  # Structured questions from AI
    answers = Column(JSON)  # AI-generated answers (hidden from students)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="tests")
    lecturer = relationship("User")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

class TestAttempt(Base):
    __tablename__ = "test_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True))
    answers = Column(JSON)
    score = Column(Float)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    test = relationship("Test", back_populates="attempts")
    student = relationship("User", back_populates="test_attempts")