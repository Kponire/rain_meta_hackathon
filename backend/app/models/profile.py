from sqlalchemy import Boolean, Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(String, unique=True, index=True, nullable=False)  # University ID
    major = Column(String, nullable=False)
    year = Column(Integer, nullable=False)  # 1, 2, 3, 4 for undergraduate
    institution = Column(String, nullable=False)
    enrollment_year = Column(Integer)  # Year started
    gpa = Column(String)  # Can be null initially
    academic_status = Column(String, default="active")  # active, probation, graduated
    student_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="student_profile")

class LecturerProfile(Base):
    __tablename__ = "lecturer_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String, nullable=False)
    institution = Column(String, nullable=False)
    employee_id = Column(String, unique=True, index=True)
    title = Column(String)
    is_verified = Column(Boolean, default=False)
    #verification_document_url = Column(String)  # URL to verification document
    lecturer_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="lecturer_profile")