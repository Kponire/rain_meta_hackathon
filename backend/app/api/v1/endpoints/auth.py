from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.models.user import User, UserRole
from app.models.profile import StudentProfile, LecturerProfile
from app.schemas.user import (
    UserResponse,
    Token,
    LoginRequest,
    StudentRegisterRequest,
    LecturerRegisterRequest
)
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register/student") # response_model=UserResponse)
async def register_student(
    user_data: StudentRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new student account with profile."""
    print(user_data)
    print("Password length:", len(user_data.password))
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if student_id already exists
    existing_student = db.query(StudentProfile).filter(
        StudentProfile.student_id == user_data.student_id
    ).first()
    
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    full_name = f"{user_data.first_name} {user_data.last_name}"
    
    user = User(
        email=user_data.email,
        full_name=full_name,
        hashed_password=hashed_password,
        role=UserRole.STUDENT,
        phone=user_data.phone
    )
    
    db.add(user)
    db.flush()  # Get user ID without committing
    
    # Create student profile
    student_profile = StudentProfile(
        user_id=user.id,
        student_id=user_data.student_id,
        major=user_data.major,
        year=user_data.year,
        institution=user_data.institution,
        enrollment_year=datetime.now().year
    )
    
    db.add(student_profile)
    db.commit()
    db.refresh(user)
    
    logger.info(f"New student registered: {user.email} (ID: {user_data.student_id})")
    
    return "Registration Successful" #return user

@router.post("/register/lecturer") # response_model=UserResponse)
async def register_lecturer(
    user_data: LecturerRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new lecturer account with profile."""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if employee_id already exists (if provided)
    if user_data.employee_id:
        existing_lecturer = db.query(LecturerProfile).filter(
            LecturerProfile.employee_id == user_data.employee_id
        ).first()
        
        if existing_lecturer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee ID already registered"
            )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    full_name = f"{user_data.first_name} {user_data.last_name}"
    
    user = User(
        email=user_data.email,
        full_name=full_name,
        hashed_password=hashed_password,
        role=UserRole.LECTURER,
        phone=user_data.phone
    )
    
    db.add(user)
    db.flush()  # Get user ID without committing
    
    # Create lecturer profile
    lecturer_profile = LecturerProfile(
        user_id=user.id,
        department=user_data.department,
        institution=user_data.institution,
        employee_id=user_data.employee_id,
        title=user_data.title,
        is_verified=False  # Default to unverified
    )
    
    db.add(lecturer_profile)
    db.commit()
    db.refresh(user)
    
    logger.info(f"New lecturer registered: {user.email} (Dept: {user_data.department})")
    
    return "Registration Successful" #return user

@router.post("/login") # response_model=Token)
async def login(payload: dict, db: Session = Depends(get_db)):
    """Login user and return access token."""
    email = payload.get("email")
    password = payload.get("password")
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=1440)  # 24 hours
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "email": user.email},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User logged in: {user.email}")
    
    return {
        "access_token": access_token,
        "message": "Login Suceessful",
        "role": user.role.value
    }

@router.get("/me") # response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information with profile."""
    # return current_user
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.full_name.split()[0],
        "last_name": current_user.full_name.split()[1] if len(current_user.full_name.split()) > 1 else "",
        "role": current_user.role.value,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.put("/me/student-profile")
async def update_student_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update student profile (students only)."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update student profile"
        )
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    allowed_fields = {"major", "year", "institution", "gpa", "academic_status"}
    update_dict = {k: v for k, v in profile_data.items() if k in allowed_fields and v is not None}
    
    for field, value in update_dict.items():
        setattr(current_user.student_profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Student profile updated successfully", "profile": current_user.student_profile}

@router.put("/me/lecturer-profile")
async def update_lecturer_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update lecturer profile (lecturers only)."""
    if current_user.role != UserRole.LECTURER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers can update lecturer profile"
        )
    
    if not current_user.lecturer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer profile not found"
        )
    
    allowed_fields = {"department", "institution", "employee_id", "title", 
                     "office_location", "office_hours", "qualifications", 
                     "areas_of_expertise"}
    update_dict = {k: v for k, v in profile_data.items() if k in allowed_fields and v is not None}
    
    for field, value in update_dict.items():
        setattr(current_user.lecturer_profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Lecturer profile updated successfully", "profile": current_user.lecturer_profile}