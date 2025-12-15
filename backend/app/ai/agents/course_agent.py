from typing import List, Dict, Any
from langchain_classic.tools import Tool
from langchain_classic.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
import wikipediaapi
from app.services.llm_service import LLMService
from app.utils.powerpoint_generator import PowerPointGenerator
import logging

logger = logging.getLogger(__name__)

class CourseAgent:
    """AI Agent for course material generation and enhancement"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.wiki_api = wikipediaapi.Wikipedia(
            language='en',
            user_agent='AI-Edu-Platform/1.0'
        )
        self.powerpoint_gen = PowerPointGenerator()
        self.tools = self._create_tools()
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for the agent"""
        return [
            Tool(
                name="wikipedia_search",
                func=self._search_wikipedia,
                description="Search Wikipedia for information on a topic"
            ),
            Tool(
                name="generate_content",
                func=self._generate_content,
                description="Generate educational content using LLM"
            ),
            Tool(
                name="create_powerpoint",
                func=self._create_powerpoint,
                description="Create PowerPoint presentation from content"
            ),
            Tool(
                name="extract_key_concepts",
                func=self._extract_key_concepts,
                description="Extract key concepts from text"
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create ReAct agent"""
        prompt = PromptTemplate.from_template(
            """You are an AI course creation assistant. Help generate comprehensive course materials.
            
            Task: {task}
            Topic: {topic}
            Additional Context: {context}
            
            Use available tools to research, generate content, and create presentations.
            Think step by step."""
        )
        
        return None  # Placeholder
    
    def _search_wikipedia(self, query: str) -> str:
        """Search Wikipedia for information"""
        try:
            page = self.wiki_api.page(query)
            if page.exists():
                return page.summary[:1000]  # Limit length
            return f"No Wikipedia page found for: {query}"
        except Exception as e:
            logger.error(f"Wikipedia search error: {e}")
            return f"Error searching Wikipedia: {str(e)}"
    
    async def _generate_content(self, topic: str, **kwargs) -> str:
        """Generate content using LLM"""
        result = await self.llm_service.generate_course_material(topic, **kwargs)
        return result["content"]
    
    async def _create_powerpoint(self, content: str, **kwargs) -> Dict[str, Any]:
        """Create PowerPoint presentation"""
        return await self.powerpoint_gen.generate(content, **kwargs)
    
    def _extract_key_concepts(self, text: str) -> List[str]:
        return []
    
    async def generate_course_from_topic(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate complete course material from topic"""
        # Step 1: Research topic
        wiki_content = self._search_wikipedia(topic)
        
        # Step 2: Generate comprehensive content
        generated_content = await self._generate_content(
            topic,
            context=wiki_content,
            **kwargs
        )
        
        # Step 3: Create PowerPoint
        ppt_result = await self._create_powerpoint(
            generated_content,
            title=topic,
            **kwargs.get("presentation_options", {})
        )
        
        return {
            "topic": topic,
            "research_content": wiki_content,
            "generated_content": generated_content,
            "powerpoint": ppt_result,
            "key_concepts": self._extract_key_concepts(generated_content)
        }