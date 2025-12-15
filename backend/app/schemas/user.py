from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
import re

# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole
    phone: Optional[str] = Field(None, min_length=10, max_length=15)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[\d\s\-\(\)]{10,}$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    password: Optional[str] = Field(None, min_length=8)

class UserInDB(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Profile schemas
class StudentProfileBase(BaseModel):
    student_id: str = Field(..., min_length=5, max_length=20)
    major: str = Field(..., min_length=2, max_length=100)
    year: int = Field(..., ge=1, le=6)  # 1-6 years (including masters)
    institution: str = Field(..., min_length=2, max_length=200)

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: UUID
    user_id: UUID
    academic_status: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LecturerProfileBase(BaseModel):
    department: str = Field(..., min_length=2, max_length=100)
    institution: str = Field(..., min_length=2, max_length=200)
    employee_id: Optional[str] = Field(None, min_length=3, max_length=20)
    title: Optional[str] = Field(None, min_length=2, max_length=50)
    office_location: Optional[str] = None
    office_hours: Optional[dict] = None

class LecturerProfileCreate(LecturerProfileBase):
    pass

class LecturerProfileResponse(LecturerProfileBase):
    id: UUID
    user_id: UUID
    is_verified: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Authentication schemas
class StudentRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    student_id: str = Field(..., min_length=5, max_length=20)
    major: str = Field(..., min_length=2, max_length=100)
    year: int = Field(..., ge=1, le=6)
    institution: str = Field(..., min_length=2, max_length=200)
    
    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+?[\d\s\-\(\)]{10,}$', v):
            raise ValueError('Invalid phone number format')
        return v

class LecturerRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    department: str = Field(..., min_length=2, max_length=100)
    institution: str = Field(..., min_length=2, max_length=200)
    employee_id: Optional[str] = Field(None, min_length=3, max_length=20)
    title: Optional[str] = Field(None, min_length=2, max_length=50)
    
    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+?[\d\s\-\(\)]{10,}$', v):
            raise ValueError('Invalid phone number format')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserInDB):
    student_profile: Optional[StudentProfileResponse] = None
    lecturer_profile: Optional[LecturerProfileResponse] = None
    
    class Config:
        from_attributes = True