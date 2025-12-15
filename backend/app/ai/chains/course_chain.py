from typing import List, Dict, Any
from langchain_classic.chains import LLMChain
from langchain_classic.prompts import PromptTemplate
from langchain_classic.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

class CourseStructure(BaseModel):
    """Pydantic model for course structure."""
    title: str = Field(..., description="Course title")
    modules: List[str] = Field(..., description="List of module titles")
    learning_objectives: List[str] = Field(..., description="Learning objectives")
    prerequisites: List[str] = Field(..., description="Prerequisites")
    duration_hours: int = Field(..., description="Estimated duration in hours")

class CourseChain:
    """Chain for generating course structures."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.parser = PydanticOutputParser(pydantic_object=CourseStructure)
        
        self.prompt = PromptTemplate(
            template="""
            Generate a course structure for: {topic}
            
            Target audience: {audience}
            Level: {level}
            Duration: {duration} weeks
            
            {format_instructions}
            
            Provide a comprehensive course structure.
            """,
            input_variables=["topic", "audience", "level", "duration"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            output_parser=self.parser,
            verbose=True
        )
    
    async def generate_course_structure(
        self,
        topic: str,
        audience: str = "college students",
        level: str = "undergraduate",
        duration: int = 12
    ) -> CourseStructure:
        """Generate course structure."""
        try:
            result = await self.chain.arun(
                topic=topic,
                audience=audience,
                level=level,
                duration=duration
            )
            return result
        except Exception as e:
            logger.error(f"Course chain error: {e}")
            # Return fallback structure
            return CourseStructure(
                title=f"Course on {topic}",
                modules=[f"Introduction to {topic}", f"Advanced {topic}"],
                learning_objectives=[f"Understand {topic}", f"Apply {topic} concepts"],
                prerequisites=["Basic knowledge"],
                duration_hours=36
            )

class ModuleContent(BaseModel):
    """Pydantic model for module content."""
    module_title: str = Field(..., description="Module title")
    lessons: List[Dict[str, str]] = Field(..., description="List of lessons with title and content")
    activities: List[str] = Field(..., description="Learning activities")
    assessments: List[str] = Field(..., description="Assessment methods")
    resources: List[str] = Field(..., description="Learning resources")

class ModuleChain:
    """Chain for generating module content."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.parser = PydanticOutputParser(pydantic_object=ModuleContent)
        
        self.prompt = PromptTemplate(
            template="""
            Generate content for module: {module_title}
            
            Course context: {course_context}
            Duration: {duration} hours
            
            {format_instructions}
            
            Create detailed module content.
            """,
            input_variables=["module_title", "course_context", "duration"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(
            llm=self.llm_service.llm,
            prompt=self.prompt,
            output_parser=self.parser,
            verbose=True
        )
    
    async def generate_module_content(
        self,
        module_title: str,
        course_context: str = "",
        duration: int = 3
    ) -> ModuleContent:
        """Generate module content."""
        try:
            result = await self.chain.arun(
                module_title=module_title,
                course_context=course_context,
                duration=duration
            )
            return result
        except Exception as e:
            logger.error(f"Module chain error: {e}")
            # Return fallback content
            return ModuleContent(
                module_title=module_title,
                lessons=[{"title": "Introduction", "content": f"Content for {module_title}"}],
                activities=["Discussion", "Exercise"],
                assessments=["Quiz", "Assignment"],
                resources=["Textbook", "Online materials"]
            )