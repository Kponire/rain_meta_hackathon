from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from uuid import UUID
from datetime import datetime

class VideoAnalysisBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    video_url: str
    source_type: str = Field(..., pattern="^(youtube|upload)$")
    analysis_type: str = Field(..., pattern="^(summary|transcription|explanation)$")
    course_id: Optional[UUID] = None

class VideoAnalysisCreate(VideoAnalysisBase):
    pass

class VideoAnalysisResponse(BaseModel):
    id: UUID
    title: str
    video_url: str
    source_type: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_points: Optional[List[Dict[str, Any]]] = None
    duration: Optional[int] = None
    analysis_type: str
    user_id: UUID
    course_id: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True

class YouTubeProcessRequest(BaseModel):
    url: HttpUrl
    analysis_type: str = Field("summary", pattern="^(summary|transcription|explanation)$")

class VideoUploadRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    analysis_type: str = Field("summary", pattern="^(summary|transcription|explanation)$")
    course_id: Optional[UUID] = None

class VideoExplainRequest(BaseModel):
    video_analysis_id: UUID
    question: str = Field(..., min_length=5)

class VideoExplainResponse(BaseModel):
    explanation: str
    relevant_segments: Optional[List[Dict[str, Any]]] = None
    confidence_score: float = Field(..., ge=0, le=1)