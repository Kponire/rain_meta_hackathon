from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.content import VideoAnalysis
from app.schemas.video import (
    VideoAnalysisResponse,
    YouTubeProcessRequest,
    VideoUploadRequest,
    VideoExplainRequest,
    VideoExplainResponse
)
from app.services.video_service import VideoService
from app.services.file_processor import FileProcessor
import tempfile
import os

router = APIRouter()
video_service = VideoService()
file_processor = FileProcessor()

@router.post("/youtube/process", response_model=VideoAnalysisResponse)
async def process_youtube_video(
    request: YouTubeProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process YouTube video for analysis."""
    try:
        # Process YouTube video
        result = await video_service.process_youtube_video(str(request.url))
        
        # Save analysis to database
        analysis = VideoAnalysis(
            title=result["video_info"]["title"],
            video_url=str(request.url),
            source_type="youtube",
            transcript=result.get("transcript"),
            summary=result.get("summary"),
            key_points=result.get("key_points"),
            duration=result.get("duration"),
            analysis_type=request.analysis_type,
            user_id=current_user.id
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process YouTube video: {str(e)}"
        )

@router.post("/upload/process", response_model=VideoAnalysisResponse)
async def process_uploaded_video(
    title: str = Form(...),
    analysis_type: str = Form("summary"),
    course_id: Optional[UUID] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process uploaded video file."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a video"
        )
    
    # Validate file size (max 500MB)
    MAX_SIZE = 500 * 1024 * 1024
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer
    
    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is 500MB"
        )
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Process video
        result = await video_service.process_uploaded_video(tmp_path)
        
        # Upload to Supabase
        file_url = await file_processor.upload_to_supabase(
            content,
            f"videos/{current_user.id}/{file.filename}"
        )
        
        # Save analysis to database
        analysis = VideoAnalysis(
            title=title,
            video_url=file_url,
            source_type="upload",
            transcript=result.get("transcript"),
            summary=result.get("summary"),
            key_points=result.get("key_points"),
            duration=result.get("duration"),
            analysis_type=analysis_type,
            user_id=current_user.id,
            course_id=course_id
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process video: {str(e)}"
        )
    finally:
        # Cleanup temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.post("/explain", response_model=VideoExplainResponse)
async def explain_video_content(
    request: VideoExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explain video content based on user question."""
    analysis = db.query(VideoAnalysis).filter(
        VideoAnalysis.id == request.video_analysis_id,
        VideoAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video analysis not found or unauthorized"
        )
    
    if not analysis.transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript available for this video"
        )
    
    try:
        explanation = await video_service.explain_video(
            analysis.transcript,
            request.question
        )
        
        return VideoExplainResponse(
            explanation=explanation,
            confidence_score=0.85
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate explanation: {str(e)}"
        )

@router.get("/analyses", response_model=List[VideoAnalysisResponse])
async def get_video_analyses(
    course_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's video analyses."""
    query = db.query(VideoAnalysis).filter(
        VideoAnalysis.user_id == current_user.id
    )
    
    if course_id:
        query = query.filter(VideoAnalysis.course_id == course_id)
    
    analyses = query.order_by(VideoAnalysis.created_at.desc()).all()
    
    return analyses

@router.get("/analyses/{analysis_id}", response_model=VideoAnalysisResponse)
async def get_video_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific video analysis."""
    analysis = db.query(VideoAnalysis).filter(
        VideoAnalysis.id == analysis_id,
        VideoAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video analysis not found or unauthorized"
        )
    
    return analysis

@router.delete("/analyses/{analysis_id}")
async def delete_video_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete video analysis."""
    analysis = db.query(VideoAnalysis).filter(
        VideoAnalysis.id == analysis_id,
        VideoAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video analysis not found or unauthorized"
        )
    
    # Delete from Supabase if it's an uploaded file
    if analysis.source_type == "upload":
        try:
            await file_processor.delete_from_supabase(analysis.video_url)
        except:
            pass
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "Video analysis deleted successfully"}