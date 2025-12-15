from typing import List, Dict, Any
from langchain_classic.chains.llm import LLMChain
from langchain_classic.prompts import PromptTemplate
from langchain_classic.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

class Flashcard(BaseModel):
    """Pydantic model for flashcard."""
    front: str = Field(..., description="Front of flashcard (question/concept)")
    back: str = Field(..., description="Back of flashcard (answer/explanation)")
    category: str = Field(..., description="Category/topic")
    difficulty: str = Field(..., description="Difficulty level")
    tags: List[str] = Field(..., description="Tags for organization")

class FlashcardSet(BaseModel):
    """Pydantic model for flashcard set."""
    topic: str = Field(..., description="Flashcard set topic")
    flashcards: List[Flashcard] = Field(..., description="List of flashcards")
    study_plan: Dict[str, Any] = Field(..., description="Recommended study plan")
    estimated_study_time: int = Field(..., description="Estimated study time in minutes")

class FlashcardChain:
    """Chain for generating flashcards."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.parser = PydanticOutputParser(pydantic_object=FlashcardSet)
        
        self.prompt = PromptTemplate(
            template="""
            Create flashcards for topic: {topic}
            
            Number of flashcards: {num_flashcards}
            Level: {level}
            Categories: {categories}
            
            {format_instructions}
            
            Create effective flashcards for learning.
            """,
            input_variables=["topic", "num_flashcards", "level", "categories"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            output_parser=self.parser,
            verbose=True
        )
    
    async def generate_flashcards(
        self,
        topic: str,
        num_flashcards: int = 10,
        level: str = "beginner",
        categories: List[str] = None
    ) -> FlashcardSet:
        """Generate flashcard set."""
        if categories is None:
            categories = ["concepts", "definitions", "examples"]
        
        try:
            result = await self.chain.arun(
                topic=topic,
                num_flashcards=num_flashcards,
                level=level,
                categories=", ".join(categories)
            )
            return result
        except Exception as e:
            logger.error(f"Flashcard chain error: {e}")
            # Return fallback flashcards
            return FlashcardSet(
                topic=topic,
                flashcards=[
                    Flashcard(
                        front=f"What is {topic}?",
                        back=f"Definition of {topic}",
                        category="definition",
                        difficulty="easy",
                        tags=["basic"]
                    )
                ],
                study_plan={
                    "sessions": 3,
                    "cards_per_session": 10,
                    "spaced_repetition": True
                },
                estimated_study_time=30
            )

class StudyPlan(BaseModel):
    """Pydantic model for study plan."""
    topic: str = Field(..., description="Study topic")
    sessions: List[Dict[str, Any]] = Field(..., description="Study sessions")
    total_duration: int = Field(..., description="Total duration in hours")
    resources: List[str] = Field(..., description="Recommended resources")
    milestones: List[str] = Field(..., description="Learning milestones")

class StudyPlanChain:
    """Chain for generating study plans."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.parser = PydanticOutputParser(pydantic_object=StudyPlan)
        
        self.prompt = PromptTemplate(
            template="""
            Create a study plan for: {topic}
            
            Available time: {available_time} hours per week
            Weeks: {weeks}
            Level: {level}
            
            {format_instructions}
            
            Create an effective study plan.
            """,
            input_variables=["topic", "available_time", "weeks", "level"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            output_parser=self.parser,
            verbose=True
        )
    
    async def generate_study_plan(
        self,
        topic: str,
        available_time: int = 5,
        weeks: int = 4,
        level: str = "beginner"
    ) -> StudyPlan:
        """Generate study plan."""
        try:
            result = await self.chain.arun(
                topic=topic,
                available_time=available_time,
                weeks=weeks,
                level=level
            )
            return result
        except Exception as e:
            logger.error(f"Study plan chain error: {e}")
            # Return fallback study plan
            return StudyPlan(
                topic=topic,
                sessions=[
                    {
                        "week": 1,
                        "focus": "Basics",
                        "activities": ["Read overview", "Watch introductory videos"],
                        "duration": 2
                    }
                ],
                total_duration=available_time * weeks,
                resources=["Textbook", "Online course", "Practice exercises"],
                milestones=["Complete basics", "Apply concepts", "Master topic"]
            )