from sqlalchemy import Boolean, Column, Integer, String, Text, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class MaterialType(str, enum.Enum):
    TEXT = "text"
    PDF = "pdf"
    POWERPOINT = "powerpoint"
    VIDEO = "video"
    IMAGE = "image"

class CourseMaterial(Base):
    __tablename__ = "course_materials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    material_type = Column(Enum(MaterialType), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    file_url = Column(String)  # URL to Supabase storage
    user_metadata = Column(JSON)  # Additional metadata (page count, duration, etc.)
    is_ai_generated = Column(Boolean, default=False)
    generation_prompt = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="materials")

class VideoAnalysis(Base):
    __tablename__ = "video_analyses"
    
    title = Column(String, nullable=False)
    video_url = Column(String, nullable=False)
    source_type = Column(String)  # youtube, upload
    transcript = Column(Text)
    summary = Column(Text)
    key_points = Column(JSON)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    duration = Column(Integer)  # in seconds
    analysis_type = Column(String)  # summary, transcription, explanation
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")