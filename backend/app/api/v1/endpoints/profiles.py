from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, require_lecturer, require_admin
from app.models.user import User, UserRole
from app.models.profile import StudentProfile, LecturerProfile
from app.schemas.user import StudentProfileResponse, LecturerProfileResponse
import logging

router = APIRouter()

# Student Profile Endpoints
@router.get("/students/{student_id}/profile", response_model=StudentProfileResponse)
async def get_student_profile(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student profile by student ID."""
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.student_id == student_id
    ).first()
    
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    if current_user.role == UserRole.STUDENT and current_user.id != student_profile.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other student's profile"
        )
    
    return student_profile

@router.get("/students/profiles/search")
async def search_student_profiles(
    query: Optional[str] = None,
    major: Optional[str] = None,
    year: Optional[int] = None,
    institution: Optional[str] = None,
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    """Search student profiles (lecturers only)."""
    filters = []
    
    if query:
        filters.append(
            (StudentProfile.student_id.ilike(f"%{query}%")) |
            (User.full_name.ilike(f"%{query}%"))
        )
    
    if major:
        filters.append(StudentProfile.major.ilike(f"%{major}%"))
    
    if year:
        filters.append(StudentProfile.year == year)
    
    if institution:
        filters.append(StudentProfile.institution.ilike(f"%{institution}%"))
    
    query = db.query(StudentProfile).join(User)
    
    if filters:
        from sqlalchemy import or_, and_
        query = query.filter(and_(*filters))
    
    profiles = query.limit(50).all()
    
    return {"profiles": profiles, "count": len(profiles)}

# Lecturer Profile Endpoints
@router.get("/lecturers/{lecturer_id}/profile", response_model=LecturerProfileResponse)
async def get_lecturer_profile(
    lecturer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lecturer profile by user ID."""
    lecturer_profile = db.query(LecturerProfile).filter(
        LecturerProfile.user_id == lecturer_id
    ).first()
    
    if not lecturer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer profile not found"
        )
    
    # Authorization: Users can see lecturer profiles
    return lecturer_profile

@router.get("/lecturers/profiles/search")
async def search_lecturer_profiles(
    query: Optional[str] = None,
    department: Optional[str] = None,
    institution: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search lecturer profiles."""
    filters = []
    
    if query:
        filters.append(
            (LecturerProfile.employee_id.ilike(f"%{query}%")) |
            (User.full_name.ilike(f"%{query}%")) |
            (LecturerProfile.title.ilike(f"%{query}%"))
        )
    
    if department:
        filters.append(LecturerProfile.department.ilike(f"%{department}%"))
    
    if institution:
        filters.append(LecturerProfile.institution.ilike(f"%{institution}%"))
    
    query = db.query(LecturerProfile).join(User)
    
    if filters:
        from sqlalchemy import or_, and_
        query = query.filter(and_(*filters))
    
    profiles = query.limit(50).all()
    
    return {"profiles": profiles, "count": len(profiles)}

@router.put("/lecturers/{lecturer_id}/verify")
async def verify_lecturer(
    lecturer_id: UUID,
    verified: bool = True,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Verify lecturer (admin only)."""
    lecturer_profile = db.query(LecturerProfile).filter(
        LecturerProfile.user_id == lecturer_id
    ).first()
    
    if not lecturer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer profile not found"
        )
    
    lecturer_profile.is_verified = verified
    
    db.commit()
    
    return {
        "message": f"Lecturer {'verified' if verified else 'unverified'} successfully",
        "is_verified": verified
    }

# Bulk Operations
@router.post("/students/bulk-import")
async def bulk_import_students(
    students_data: List[dict],
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Bulk import students (admin only)."""
    imported = []
    errors = []
    
    for i, student_data in enumerate(students_data):
        try:
            # Validate required fields
            required_fields = ["first_name", "last_name", "email", "student_id", "major", "year", "institution"]
            for field in required_fields:
                if field not in student_data:
                    errors.append(f"Row {i+1}: Missing required field '{field}'")
                    continue
            
            # Check if student already exists
            existing_user = db.query(User).filter(User.email == student_data["email"]).first()
            if existing_user:
                errors.append(f"Row {i+1}: Email already exists")
                continue
            
            existing_student = db.query(StudentProfile).filter(
                StudentProfile.student_id == student_data["student_id"]
            ).first()
            if existing_student:
                errors.append(f"Row {i+1}: Student ID already exists")
                continue
            
            # Create user
            username = f"{student_data['first_name'].lower()}.{student_data['last_name'].lower()}"
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{student_data['first_name'].lower()}.{student_data['last_name'].lower()}{counter}"
                counter += 1
            
            # Generate temporary password (could be sent via email)
            temp_password = "changeme123"  # In production, generate random password
            
            user = User(
                email=student_data["email"],
                username=username,
                full_name=f"{student_data['first_name']} {student_data['last_name']}",
                hashed_password=get_password_hash(temp_password),
                role=UserRole.STUDENT,
                phone=student_data.get("phone"),
                is_active=False  # Requires first login to activate
            )
            
            db.add(user)
            db.flush()
            
            # Create student profile
            profile = StudentProfile(
                user_id=user.id,
                student_id=student_data["student_id"],
                major=student_data["major"],
                year=student_data["year"],
                institution=student_data["institution"],
                enrollment_year=datetime.now().year
            )
            
            db.add(profile)
            imported.append({
                "email": student_data["email"],
                "student_id": student_data["student_id"],
                "temp_password": temp_password  # In production, don't return this
            })
            
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    
    db.commit()
    
    return {
        "imported_count": len(imported),
        "error_count": len(errors),
        "imported": imported,
        "errors": errors
    }