from typing import Dict, Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user, require_lecturer, require_admin
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.assessment import Assignment, AssignmentSubmission, Test, TestAttempt
from app.models.content import CourseMaterial, VideoAnalysis
import json

router = APIRouter()

@router.get("/courses/{course_id}/performance")
async def get_course_performance(
    course_id: UUID,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Get performance analytics for a course."""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.lecturer_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or unauthorized"
        )
    
    # Get enrollment stats
    total_enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.is_active == True
    ).count()
    
    # Get assignment stats
    assignments = db.query(Assignment).filter(
        Assignment.course_id == course_id
    ).all()
    
    assignment_stats = []
    for assignment in assignments:
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment.id
        ).all()
        
        if submissions:
            graded = [s for s in submissions if s.is_graded]
            if graded:
                avg_score = sum(s.score for s in graded if s.score is not None) / len(graded)
                assignment_stats.append({
                    "assignment_id": assignment.id,
                    "title": assignment.title,
                    "total_submissions": len(submissions),
                    "graded_submissions": len(graded),
                    "average_score": round(avg_score, 2),
                    "completion_rate": (len(submissions) / total_enrolled) * 100 if total_enrolled > 0 else 0
                })
    
    # Get test stats
    tests = db.query(Test).filter(Test.course_id == course_id).all()
    
    test_stats = []
    for test in tests:
        attempts = db.query(TestAttempt).filter(
            TestAttempt.test_id == test.id
        ).all()
        
        if attempts:
            completed = [a for a in attempts if a.is_completed]
            if completed:
                avg_score = sum(a.score for a in completed if a.score is not None) / len(completed)
                test_stats.append({
                    "test_id": test.id,
                    "title": test.title,
                    "total_attempts": len(attempts),
                    "completed_attempts": len(completed),
                    "average_score": round(avg_score, 2),
                    "participation_rate": (len(attempts) / total_enrolled) * 100 if total_enrolled > 0 else 0
                })
    
    # Calculate overall performance
    all_scores = []
    for stats in assignment_stats + test_stats:
        if stats.get("average_score"):
            all_scores.append(stats["average_score"])
    
    overall_performance = sum(all_scores) / len(all_scores) if all_scores else 0
    
    return {
        "course": {
            "id": course.id,
            "title": course.title,
            "code": course.code
        },
        "enrollment": {
            "total": total_enrolled,
            "active": total_enrolled
        },
        "assignments": assignment_stats,
        "tests": test_stats,
        "overall_performance": round(overall_performance, 2),
        "calculated_at": datetime.utcnow().isoformat()
    }

@router.get("/students/{student_id}/progress")
async def get_student_progress(
    student_id: UUID,
    course_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student progress analytics."""
    # Authorization check
    if current_user.role.value == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other student's progress"
        )
    
    # Get student enrollments
    query = db.query(Enrollment).filter(Enrollment.student_id == student_id)
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
    
    enrollments = query.all()
    
    progress_data = []
    
    for enrollment in enrollments:
        course = enrollment.course
        
        # Get assignment submissions
        assignments = db.query(Assignment).filter(
            Assignment.course_id == course.id
        ).all()
        
        assignment_scores = []
        for assignment in assignments:
            submission = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.student_id == student_id
            ).first()
            
            if submission and submission.is_graded and submission.score is not None:
                assignment_scores.append({
                    "assignment_id": assignment.id,
                    "title": assignment.title,
                    "score": submission.score,
                    "max_score": assignment.max_score,
                    "percentage": (submission.score / assignment.max_score) * 100
                })
        
        # Get test attempts
        tests = db.query(Test).filter(Test.course_id == course.id).all()
        
        test_scores = []
        for test in tests:
            attempt = db.query(TestAttempt).filter(
                TestAttempt.test_id == test.id,
                TestAttempt.student_id == student_id
            ).first()
            
            if attempt and attempt.is_completed and attempt.score is not None:
                test_scores.append({
                    "test_id": test.id,
                    "title": test.title,
                    "score": attempt.score,
                    "is_completed": True
                })
        
        # Calculate course progress
        total_assignments = len(assignments)
        completed_assignments = len([s for s in assignment_scores])
        
        course_progress = {
            "course_id": course.id,
            "course_title": course.title,
            "enrolled_since": enrollment.enrolled_at.isoformat(),
            "assignment_progress": {
                "total": total_assignments,
                "completed": completed_assignments,
                "completion_rate": (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0,
                "average_score": sum(s["percentage"] for s in assignment_scores) / len(assignment_scores) if assignment_scores else 0
            },
            "test_performance": {
                "total_tests": len(tests),
                "attempted": len(test_scores),
                "average_score": sum(s["score"] for s in test_scores) / len(test_scores) if test_scores else 0
            },
            "overall_grade": _calculate_overall_grade(assignment_scores, test_scores)
        }
        
        progress_data.append(course_progress)
    
    return {
        "student_id": student_id,
        "progress": progress_data,
        "summary": _generate_progress_summary(progress_data)
    }

@router.get("/platform/overview")
async def get_platform_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get platform-wide analytics (admin only)."""
    # User statistics
    total_users = db.query(User).count()
    students = db.query(User).filter(User.role == "student").count()
    lecturers = db.query(User).filter(User.role == "lecturer").count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Course statistics
    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(Course.is_published == True).count()
    total_enrollments = db.query(Enrollment).count()
    
    # Content statistics
    total_materials = db.query(CourseMaterial).count()
    ai_generated_materials = db.query(CourseMaterial).filter(CourseMaterial.is_ai_generated == True).count()
    total_videos = db.query(VideoAnalysis).count()
    
    # Assessment statistics
    total_assignments = db.query(Assignment).count()
    total_tests = db.query(Test).count()
    total_submissions = db.query(AssignmentSubmission).count()
    graded_submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.is_graded == True).count()
    
    # Calculate growth (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    new_users = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    new_courses = db.query(Course).filter(Course.created_at >= thirty_days_ago).count()
    new_submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.submitted_at >= thirty_days_ago).count()
    
    return {
        "users": {
            "total": total_users,
            "students": students,
            "lecturers": lecturers,
            "active": active_users,
            "growth_30d": new_users
        },
        "courses": {
            "total": total_courses,
            "published": published_courses,
            "enrollments": total_enrollments,
            "growth_30d": new_courses
        },
        "content": {
            "materials": total_materials,
            "ai_generated": ai_generated_materials,
            "videos": total_videos
        },
        "assessments": {
            "assignments": total_assignments,
            "tests": total_tests,
            "submissions": total_submissions,
            "graded": graded_submissions,
            "grading_rate": (graded_submissions / total_submissions * 100) if total_submissions > 0 else 0,
            "growth_30d": new_submissions
        },
        "platform_health": {
            "active_rate": (active_users / total_users * 100) if total_users > 0 else 0,
            "engagement_rate": (total_enrollments / total_users * 100) if total_users > 0 else 0,
            "content_utilization": (total_materials / total_courses) if total_courses > 0 else 0
        },
        "calculated_at": datetime.utcnow().isoformat()
    }

# Helper methods
def _calculate_overall_grade(self, assignment_scores: List[Dict], test_scores: List[Dict]) -> Dict[str, Any]:
    """Calculate overall grade from assignments and tests."""
    if not assignment_scores and not test_scores:
        return {"grade": "N/A", "percentage": 0}
    
    all_scores = []
    weights = []
    
    # Add assignment scores (weight: 70%)
    for score in assignment_scores:
        all_scores.append(score["percentage"])
        weights.append(0.7 / len(assignment_scores) if assignment_scores else 0)
    
    # Add test scores (weight: 30%)
    for score in test_scores:
        all_scores.append(score["score"])  # Tests are already out of 100
        weights.append(0.3 / len(test_scores) if test_scores else 0)
    
    # Calculate weighted average
    weighted_avg = sum(score * weight for score, weight in zip(all_scores, weights))
    
    # Convert to letter grade
    if weighted_avg >= 90:
        grade = "A"
    elif weighted_avg >= 80:
        grade = "B"
    elif weighted_avg >= 70:
        grade = "C"
    elif weighted_avg >= 60:
        grade = "D"
    else:
        grade = "F"
    
    return {
        "grade": grade,
        "percentage": round(weighted_avg, 2),
        "weighted_components": {
            "assignments": len(assignment_scores),
            "tests": len(test_scores)
        }
    }

def _generate_progress_summary(self, progress_data: List[Dict]) -> Dict[str, Any]:
    """Generate summary of student progress."""
    if not progress_data:
        return {"message": "No progress data available"}
    
    total_courses = len(progress_data)
    completed_assignments = sum(p["assignment_progress"]["completed"] for p in progress_data)
    total_assignments = sum(p["assignment_progress"]["total"] for p in progress_data)
    
    avg_assignment_score = sum(p["assignment_progress"]["average_score"] for p in progress_data) / total_courses
    avg_overall_grade = sum(p["overall_grade"]["percentage"] for p in progress_data if "overall_grade" in p) / total_courses
    
    # Determine performance level
    if avg_overall_grade >= 85:
        performance = "Excellent"
    elif avg_overall_grade >= 75:
        performance = "Good"
    elif avg_overall_grade >= 65:
        performance = "Satisfactory"
    else:
        performance = "Needs Improvement"
    
    return {
        "total_courses": total_courses,
        "assignment_completion": {
            "completed": completed_assignments,
            "total": total_assignments,
            "rate": (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
        },
        "average_scores": {
            "assignments": round(avg_assignment_score, 2),
            "overall": round(avg_overall_grade, 2)
        },
        "performance_level": performance,
        "recommendations": self._generate_recommendations(progress_data, performance)
    }

def _generate_recommendations(self, progress_data: List[Dict], performance: str) -> List[str]:
    """Generate personalized recommendations."""
    recommendations = []
    
    if performance == "Needs Improvement":
        recommendations.extend([
            "Consider seeking help during office hours",
            "Review course materials more thoroughly",
            "Start assignments earlier to allow time for revisions"
        ])
    elif performance == "Satisfactory":
        recommendations.extend([
            "Focus on improving assignment quality",
            "Participate more in class discussions",
            "Set specific study goals for each week"
        ])
    elif performance == "Good":
        recommendations.extend([
            "Challenge yourself with additional readings",
            "Consider helping classmates who are struggling",
            "Explore advanced topics in the subject"
        ])
    else:  # Excellent
        recommendations.extend([
            "Consider becoming a teaching assistant",
            "Explore research opportunities in the field",
            "Mentor other students to reinforce your knowledge"
        ])
    
    # Add general recommendations
    recommendations.extend([
        "Maintain consistent study schedule",
        "Use flashcards for key concepts",
        "Review feedback carefully and apply it to future work"
    ])
    
    return recommendations[:5]