import json
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.assessment import Assignment, AssignmentSubmission, AssignmentStatus
from app.services.llm_service import LLMService
from app.services.grading_service import GradingService
from app.models.course import Enrollment

router = APIRouter()
llm_service = LLMService()
grading_service = GradingService()

@router.get("/students/assignments")
async def get_student_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all published assignments for courses the student is enrolled in."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    # Get all course enrollments for the student
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()
    
    course_ids = [e.course_id for e in enrollments]
    
    # Get published assignments for these courses
    assignments = db.query(Assignment).filter(
        Assignment.course_id.in_(course_ids),
        Assignment.status == AssignmentStatus.PUBLISHED
    ).all()
    
    # Fetch submission status for each assignment
    result = []
    for assignment in assignments:
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.student_id == current_user.id
        ).first()
        
        # Get course title
        course = db.query(Course).filter(Course.id == assignment.course_id).first()
        
        assign_dict = {
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "due_date": assignment.due_date,
            "max_score": assignment.max_score,
            "status": assignment.status,
            "course_title": course.title if course else "Unknown Course",
            "submission_status": "pending", 
            "score": None
        }
        
        if submission:
            assign_dict["submission_status"] = "submitted"
            if submission.is_graded:
                 assign_dict["submission_status"] = "graded"
                 assign_dict["score"] = submission.score
        
        result.append(assign_dict)
        
    return result

@router.post("/courses/{course_id}/assignments/generate")
async def generate_assignment(
    course_id: UUID,
    topic: str = Form(...),
    difficulty: str = Form("medium"),
    question_types: str = Form("essay,short_answer"),
    num_questions: int = Form(5),
    save: bool = Form(False),
    preview: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate assignment using AI."""
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

    if save and preview:
        try:
            assignment_data = json.loads(preview)
        except Exception:
            # If preview parsing fails, fall back to generating live
            assignment_data = await llm_service.generate_assignment(
                topic,
                context=f"Course: {course.title}",
                difficulty=difficulty,
                question_types=question_types.split(","),
                num_questions=num_questions
            )
    else:
        # Generate assignment using AI
        assignment_data = await llm_service.generate_assignment(
            topic,
            context=f"Course: {course.title}",
            difficulty=difficulty,
            question_types=question_types.split(","),
            num_questions=num_questions
        )

    # If this is only a preview, return the generated content without saving
    if not save:
        return {
            "message": "Assignment preview generated",
            "preview": assignment_data
        }

    # Persist the generated assignment when `save` is True
    assignment = Assignment(
        title=f"AI Generated: {topic}",
        description=assignment_data.get("description", f"Assignment on {topic}"),
        instructions=assignment_data.get("instructions", "Complete all questions"),
        course_id=course_id,
        lecturer_id=current_user.id,
        is_ai_generated=True,
        generation_prompt=topic,
        questions=assignment_data.get("questions", []),
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Assignment generated and saved successfully",
        "assignment": assignment,
        "preview": assignment_data
    }


@router.get("/lecturers/{lecturer_id}/assignments")
async def get_lecturer_assignments(
    lecturer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return assignments created by the lecturer.
    """
    # Only allow the lecturer themselves or admins to view this list
    if current_user.id != lecturer_id and getattr(current_user, "role", None) != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these assignments"
        )

    assignments = db.query(Assignment).filter(
        Assignment.lecturer_id == lecturer_id,
        Assignment.is_ai_generated == True
    ).all()

    return {
        "lecturer_id": lecturer_id,
        "assignments": assignments,
        "total": len(assignments)
    }


@router.get("/courses/{course_id}/assignments")
async def get_course_assignments(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all assignments for a given course.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if current_user.id != course.lecturer_id and getattr(current_user, "role", None) != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view assignments for this course"
        )

    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()

    return assignments

@router.post("/assignments/{assignment_id}/publish")
async def publish_assignment(
    assignment_id: UUID,
    due_date: Optional[datetime] = Form(None),
    max_score: float = Form(100.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish assignment to students"""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.lecturer_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or unauthorized"
        )
    
    assignment.status = AssignmentStatus.PUBLISHED
    assignment.due_date = due_date
    assignment.max_score = max_score
    
    db.commit()
    
    return {
        "message": "Assignment published successfully",
        "assignment": assignment
    }

@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: UUID,
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit assignment (student endpoint)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )
    
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.status == AssignmentStatus.PUBLISHED
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or not published"
        )
    
    # Check if student is enrolled in the course
    from app.models.course import Enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == assignment.course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Check if already submitted
    existing_submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already submitted this assignment"
        )
    
    # Process file upload if provided
    file_url = None
    if file:
        from app.services.file_processor import FileProcessor
        processor = FileProcessor()
        file_content = await processor.process_upload(file)
        file_url = await processor.upload_to_supabase(
                file_content,
                f"assignments/{assignment_id}/submissions/{current_user.id}/{file.filename}"
            )
    
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        content=content,
        file_url=file_url
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Auto-grade if possible
    if content and assignment.questions:
        try:
            grade_result = await grading_service.grade_submission(
                assignment, content, submission.id
            )
            
            submission.score = grade_result["score"]
            submission.feedback = grade_result["feedback"]
            submission.ai_feedback = grade_result["ai_feedback"]
            submission.is_graded = True
            submission.graded_at = datetime.utcnow()
            
            db.commit()
        except Exception as e:
            # Log error but don't fail submission
            print(f"Auto-grading failed: {e}")
    
    return {
        "message": "Assignment submitted successfully",
        "submission": submission
    }

@router.post("/submissions/{submission_id}/grade")
async def grade_submission_manual(
    submission_id: UUID,
    score: float = Form(...),
    feedback: str = Form(...),
    ai_feedback: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually grade submission (lecturer endpoint)"""
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Verify lecturer owns the assignment
    assignment = db.query(Assignment).filter(
        Assignment.id == submission.assignment_id,
        Assignment.lecturer_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to grade this submission"
        )
    
    submission.score = score
    submission.feedback = feedback
    submission.ai_feedback = ai_feedback
    submission.is_graded = True
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Submission graded successfully",
        "submission": submission
    }

@router.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for an assignment (lecturer endpoint)"""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.lecturer_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or unauthorized"
        )
    
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()
    
    return {
        "assignment": assignment,
        "submissions": submissions,
        "total_submissions": len(submissions),
        "graded_count": len([s for s in submissions if s.is_graded])
    }