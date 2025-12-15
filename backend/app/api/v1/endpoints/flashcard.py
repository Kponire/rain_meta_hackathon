from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_student
from app.models.user import User
from app.schemas.flashcard import (
    FlashcardGenerateRequest,
    FlashcardGenerateResponse,
    FlashcardBase
)
from app.ai.chains.flashcard_chain import FlashcardChain, StudyPlanChain
import json
import math

router = APIRouter()
flashcard_chain = FlashcardChain()
study_plan_chain = StudyPlanChain()

@router.post("/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(
    request_body: dict = Body(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Generate flashcards for self-study."""
    try:
        topic = request_body.get("topic")
        if not topic:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing topic")
        num_flashcards = request_body.get("num_flashcards") or request_body.get("count") or 10
        try:
            num_flashcards = int(num_flashcards)
        except Exception:
            num_flashcards = 10

        level = request_body.get("level")
        if not level:
            diff = request_body.get("difficulty")
            if diff in ("easy", "medium", "hard"):
                mapping = {"easy": "beginner", "medium": "intermediate", "hard": "advanced"}
                level = mapping.get(diff, "beginner")
            else:
                level = "beginner"

        # categories: accept list or comma-separated string
        categories = request_body.get("categories") or request_body.get("category")
        if isinstance(categories, str):
            categories = [c.strip() for c in categories.split(",") if c.strip()]
        if categories is None:
            categories = ["concepts", "definitions", "examples"]

        # Generate flashcards using AI
        flashcard_set = await flashcard_chain.generate_flashcards(
            topic=topic,
            num_flashcards=num_flashcards,
            level=level,
            categories=categories,
        )

        flashcards_clean = []
        difficulty_distribution = {}
        for fc in flashcard_set.flashcards:
            if hasattr(fc, "dict"):
                data = fc.dict()
            else:
                data = dict(fc)

            # Normalize difficulty: chain may output beginner/intermediate/advanced
            raw_diff = (data.get("difficulty") or "").lower()
            diff_map = {"beginner": "easy", "intermediate": "medium", "advanced": "hard"}
            if raw_diff in diff_map:
                difficulty = diff_map[raw_diff]
            elif raw_diff in ("easy", "medium", "hard"):
                difficulty = raw_diff
            else:
                difficulty = "medium"

            # Keep only allowed fields for FlashcardBase
            cleaned = {
                "front": data.get("front", ""),
                "back": data.get("back", ""),
                "category": data.get("category", "general"),
                "difficulty": difficulty,
            }
            flashcards_clean.append(cleaned)

            difficulty_distribution[difficulty] = difficulty_distribution.get(difficulty, 0) + 1

        if len(flashcards_clean) > num_flashcards:
            flashcards_clean = flashcards_clean[:num_flashcards]

        return FlashcardGenerateResponse(
            flashcards=flashcards_clean,
            study_plan=flashcard_set.study_plan,
            estimated_study_time=flashcard_set.estimated_study_time,
            difficulty_distribution=difficulty_distribution,
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate flashcards: {str(e)}"
        )

@router.post("/study-plan")
async def generate_study_plan(
    request_body: dict = Body(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Generate personalized study plan.
    """
    try:
        topics = request_body.get("topics") or request_body.get("topic")
        if isinstance(topics, list):
            topic_str = ", ".join([t for t in topics if t])
        elif isinstance(topics, str):
            topic_str = topics
        else:
            topic_str = "general"

        duration_days = request_body.get("duration_days") or request_body.get("days") or 28
        try:
            duration_days = int(duration_days)
        except Exception:
            duration_days = 28
        weeks = max(1, math.ceil(duration_days / 7))

        daily_time = request_body.get("daily_time_minutes") or request_body.get("available_time") or 60
        try:
            daily_time = int(daily_time)
        except Exception:
            daily_time = 60

        level = request_body.get("difficulty") or request_body.get("level") or "beginner"

        study_plan = await study_plan_chain.generate_study_plan(
            topic=topic_str,
            available_time=daily_time,
            weeks=weeks,
            level=level,
        )

        return study_plan

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate study plan: {str(e)}"
        )

@router.get("/history")
async def get_flashcard_history(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get user's flashcard generation history."""
    return {"message": "History endpoint - implement database storage"}