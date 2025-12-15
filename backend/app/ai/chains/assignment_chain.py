from typing import List, Dict, Any
from langchain_classic.chains.llm import LLMChain
from langchain_classic.prompts import PromptTemplate
from langchain_classic.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

class AssignmentQuestion(BaseModel):
    """Pydantic model for assignment question."""
    question: str = Field(..., description="The question text")
    question_type: str = Field(..., description="Type of question")
    points: int = Field(..., description="Points for this question")
    difficulty: str = Field(..., description="Difficulty level")
    expected_answer_length: str = Field(..., description="Expected answer length")

class AssignmentStructure(BaseModel):
    """Pydantic model for assignment structure."""
    title: str = Field(..., description="Assignment title")
    instructions: str = Field(..., description="Assignment instructions")
    questions: List[AssignmentQuestion] = Field(..., description="List of questions")
    total_points: int = Field(..., description="Total points")
    estimated_time: int = Field(..., description="Estimated time in minutes")
    learning_objectives: List[str] = Field(..., description="Learning objectives")

class AssignmentChain:
    """Chain for generating assignment structures."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.parser = PydanticOutputParser(pydantic_object=AssignmentStructure)
        
        self.prompt = PromptTemplate(
            template="""
            Create an assignment on topic: {topic}
            
            Course context: {course_context}
            Difficulty: {difficulty}
            Question types: {question_types}
            Number of questions: {num_questions}
            
            {format_instructions}
            
            Create a comprehensive assignment.
            """,
            input_variables=["topic", "course_context", "difficulty", "question_types", "num_questions"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            output_parser=self.parser,
            verbose=True
        )
    
    async def generate_assignment(
        self,
        topic: str,
        course_context: str = "",
        difficulty: str = "medium",
        question_types: List[str] = None,
        num_questions: int = 5
    ) -> AssignmentStructure:
        """Generate assignment structure."""
        if question_types is None:
            question_types = ["essay", "short_answer"]
        
        try:
            result = await self.chain.arun(
                topic=topic,
                course_context=course_context,
                difficulty=difficulty,
                question_types=", ".join(question_types),
                num_questions=num_questions
            )
            return result
        except Exception as e:
            logger.error(f"Assignment chain error: {e}")
            # Return fallback assignment
            return AssignmentStructure(
                title=f"Assignment on {topic}",
                instructions="Complete all questions",
                questions=[
                    AssignmentQuestion(
                        question=f"Explain {topic}",
                        question_type="essay",
                        points=20,
                        difficulty=difficulty,
                        expected_answer_length="500 words"
                    )
                ],
                total_points=100,
                estimated_time=60,
                learning_objectives=[f"Understand {topic}"]
            )

class RubricCriterion(BaseModel):
    """Pydantic model for rubric criterion."""
    criterion: str = Field(..., description="Criterion name")
    description: str = Field(..., description="Criterion description")
    weight: int = Field(..., description="Weight percentage")
    levels: Dict[str, str] = Field(..., description="Performance levels")

class RubricChain:
    """Chain for generating grading rubrics."""
    
    def __init__(self):
        self.llm_service = LLMService()
        
        self.prompt = PromptTemplate(
            template="""
            Create a grading rubric for: {assignment_title}
            
            Assignment description: {assignment_description}
            Number of criteria: {num_criteria}
            
            Create a detailed rubric with criteria, descriptions, weights, and performance levels.
            
            Return as structured JSON.
            """,
            input_variables=["assignment_title", "assignment_description", "num_criteria"]
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            verbose=True
        )
    
    async def generate_rubric(
        self,
        assignment_title: str,
        assignment_description: str = "",
        num_criteria: int = 4
    ) -> Dict[str, Any]:
        """Generate grading rubric."""
        try:
            result = await self.chain.arun(
                assignment_title=assignment_title,
                assignment_description=assignment_description,
                num_criteria=num_criteria
            )
            
            # Parse result to extract rubric
            # This is simplified - actual implementation would parse JSON
            
            return {
                "rubric": {
                    "title": f"Rubric for {assignment_title}",
                    "criteria": [
                        {
                            "criterion": "Content Accuracy",
                            "description": "Correctness and relevance of content",
                            "weight": 25,
                            "levels": {
                                "Excellent": "All information accurate and highly relevant",
                                "Good": "Most information accurate and relevant",
                                "Fair": "Some inaccuracies or irrelevant content",
                                "Poor": "Numerous inaccuracies or mostly irrelevant"
                            }
                        }
                    ]
                }
            }
        except Exception as e:
            logger.error(f"Rubric chain error: {e}")
            return {"error": str(e)}