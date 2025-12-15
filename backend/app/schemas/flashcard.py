from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FlashcardBase(BaseModel):
    front: str = Field(..., min_length=5)
    back: str = Field(..., min_length=5)
    category: str
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")

class FlashcardGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3)
    num_flashcards: int = Field(10, ge=5, le=50)
    level: str = Field("beginner", pattern="^(beginner|intermediate|advanced)$")
    categories: Optional[List[str]] = None

class FlashcardGenerateResponse(BaseModel):
    flashcards: List[FlashcardBase]
    study_plan: Dict[str, Any]
    estimated_study_time: int  # minutes
    difficulty_distribution: Dict[str, int]