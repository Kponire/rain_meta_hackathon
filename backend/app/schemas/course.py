from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserResponse

class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    is_published: Optional[bool] = None

class CourseInDB(CourseBase):
    id: UUID
    lecturer_id: UUID
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CourseResponse(CourseInDB):
    lecturer: UserResponse
    
    class Config:
        from_attributes = True

class CourseWithMaterials(CourseResponse):
    materials_count: int
    assignments_count: int
    enrollments_count: int

# Course Material Schemas
class MaterialBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: Optional[str] = None
    material_type: str

class MaterialCreate(MaterialBase):
    course_id: UUID

class MaterialResponse(MaterialBase):
    id: UUID
    course_id: UUID
    file_url: Optional[str] = None
    is_ai_generated: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MaterialWithContent(MaterialResponse):
    content: Optional[str] = None
    metadata: Optional[dict] = None