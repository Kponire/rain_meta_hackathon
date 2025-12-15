from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.models.content import CourseMaterial, MaterialType
from app.services.llm_service import LLMService
from app.services.file_processor import FileProcessor
from app.ai.agents.course_agent import CourseAgent
import json

router = APIRouter()
llm_service = LLMService()
course_agent = CourseAgent()
file_processor = FileProcessor()


@router.get("/")
async def list_courses(
    include_unpublished: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List courses. By default returns only published courses. If
    `include_unpublished` is True, only admins may request unpublished
    courses."""
    query = db.query(Course)
    if not include_unpublished:
        query = query.filter(Course.is_published == True)
    else:
        # only admins may list unpublished courses
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view unpublished courses",
            )

    courses = query.order_by(Course.created_at.desc()).all()
    return {"courses": courses, "total": len(courses)}

@router.post("/")
async def create_course(
    title: str = Form(...),
    code: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course"""
    if current_user.role != UserRole.LECTURER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers can create courses"
        )
    
    # Check if course code exists
    existing_course = db.query(Course).filter(Course.code == code).first()
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course code already exists"
        )
    
    course = Course(
        title=title,
        code=code,
        description=description,
        lecturer_id=current_user.id,
        is_published=True
    )
    
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return {
        "message": "Course created successfully",
        "course": course
    }

@router.post("/{course_id}/materials/generate")
async def generate_course_material(
    course_id: UUID,
    topic: str = Form(...),
    level: str = Form("undergraduate"),
    audience: str = Form("college students"),
    generate_powerpoint: bool = Form(False),
    save: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate course material using AI.
    """
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )

    # Generate content using agent (fast, returns preview)
    result = await course_agent.generate_course_from_topic(
        topic,
        level=level,
        audience=audience
    )

    generated_content = result.get("generated_content")
    # If not saving, return preview immediately so UI can show it dynamically
    if not save:
        return {
            "preview": generated_content,
            "key_concepts": result.get("key_concepts"),
            "powerpoint_available": bool(result.get("powerpoint"))
        }

    # Otherwise persist the material and optionally upload generated PPT
    material = CourseMaterial(
        title=f"AI Generated: {topic}",
        content=generated_content,
        material_type=MaterialType.TEXT,
        course_id=course_id,
        is_ai_generated=True,
        generation_prompt=topic,
        metadata={
            "generation_metadata": {
                "level": level,
                "audience": audience
            },
            "key_concepts": result.get("key_concepts")
        }
    )

    # If a powerpoint was generated and requested, upload it and attach URL
    if generate_powerpoint and result.get("powerpoint"):
        ppt_blob = result.get("powerpoint")
        # try to determine filename
        ppt_filename = result.get("powerpoint_filename") or f"{topic}.pptx"
        try:
            ppt_url = await file_processor.upload_to_supabase(
                ppt_blob,
                f"courses/{course_id}/materials/{ppt_filename}"
            )
            # store ppt url in file_url field
            material.file_url = ppt_url
            # also record in metadata
            material.metadata = {**(material.metadata or {}), "powerpoint_file_url": ppt_url}
        except Exception:
            pass

    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "message": "Material saved successfully",
        "material": material,
        "generated_content": generated_content
    }

@router.post("/{course_id}/materials/upload")
async def upload_course_material(
    course_id: UUID,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload course material (PDF, images, etc.)"""
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    # Process file
    file_content = await file_processor.process_upload(file)
    
    # Determine material type
    material_type = MaterialType.TEXT
    if file.filename.endswith('.pdf'):
        material_type = MaterialType.PDF
    elif file.filename.endswith(('.ppt', '.pptx')):
        material_type = MaterialType.POWERPOINT
    elif file.filename.endswith(('.mp4', '.avi', '.mov')):
        material_type = MaterialType.VIDEO
    elif file.filename.endswith(('.jpg', '.jpeg', '.png', '.gif')):
        material_type = MaterialType.IMAGE
    
    # Upload to Supabase storage
    file_url = await file_processor.upload_to_supabase(
        file_content,
        f"courses/{course_id}/materials/{file.filename}"
    )
    
    # Extract text from PDF if applicable
    content = ""
    if material_type == MaterialType.PDF:
        content = await file_processor.extract_pdf_text(file_content)
    
    # Save to database
    material = CourseMaterial(
        title=title,
        content=content,
        material_type=material_type,
        course_id=course_id,
        file_url=file_url,
        metadata={
            "filename": file.filename,
            "size": len(file_content),
            "content_type": file.content_type
        }
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    
    return {
        "message": "Material uploaded successfully",
        "material": material
    }

@router.get("/{course_id}/materials")
async def get_course_materials(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all materials for a course"""
    # Check enrollment/ownership
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user is enrolled or lecturer
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
    
    materials = db.query(CourseMaterial).filter(
        CourseMaterial.course_id == course_id
    ).order_by(CourseMaterial.created_at.desc()).all()
    
    return {
        "course": course,
        "materials": materials
    }

@router.post("/{course_id}/enroll")
async def enroll_in_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll student in a course"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can enroll in courses"
        )
    
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_published == True
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not published"
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course_id
    )
    
    db.add(enrollment)
    db.commit()
    
    return {
        "message": "Successfully enrolled in course",
        "enrollment": enrollment
    }

@router.get("/students/courses")
async def get_student_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses student is enrolled in"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).all()
    
    courses = [enrollment.course for enrollment in enrollments]
    
    return {
        "courses": courses,
        "total_enrolled": len(courses)
    }


@router.get("/lecturers/{lecturer_id}/courses")
async def get_lecturer_courses(
    lecturer_id: UUID,
    include_unpublished: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return list of courses created by a lecturer and the total count."""
    # Authorization: only the lecturer themself or admins may view full list
    if current_user.role != UserRole.ADMIN and current_user.id != lecturer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this lecturer's courses"
        )

    query = db.query(Course).filter(Course.lecturer_id == lecturer_id)
    if not include_unpublished:
        query = query.filter(Course.is_published == True)

    courses = query.order_by(Course.created_at.desc()).all()
    total = len(courses)

    return {
        "lecturer_id": lecturer_id,
        "total_courses": total,
        "courses": courses
    }