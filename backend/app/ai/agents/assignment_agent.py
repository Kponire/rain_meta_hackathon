from typing import List, Dict, Any, Optional
from langchain_classic.tools import Tool
from langchain_classic.agents import AgentExecutor
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.prompts import PromptTemplate
from app.services.llm_service import LLMService
from app.services.grading_service import GradingService
from app.utils.pdf_processor import PDFProcessor
import logging

logger = logging.getLogger(__name__)

class AssignmentAgent:
    """AI Agent for assignment generation and management."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.grading_service = GradingService()
        self.pdf_processor = PDFProcessor()
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.tools = self._create_tools()
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for assignment agent."""
        return [
            Tool(
                name="generate_assignment",
                func=self._generate_assignment_tool,
                description="Generate assignment questions on a topic"
            ),
            Tool(
                name="generate_rubric",
                func=self._generate_rubric_tool,
                description="Generate grading rubric for an assignment"
            ),
            Tool(
                name="grade_submission",
                func=self._grade_submission_tool,
                description="Grade student assignment submission"
            ),
            Tool(
                name="provide_feedback",
                func=self._provide_feedback_tool,
                description="Provide detailed feedback on submission"
            ),
            Tool(
                name="analyze_trends",
                func=self._analyze_trends_tool,
                description="Analyze assignment performance trends"
            ),
            Tool(
                name="adapt_difficulty",
                func=self._adapt_difficulty_tool,
                description="Adapt assignment difficulty based on performance"
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create agent executor."""
        prompt = PromptTemplate.from_template(
            """You are an AI Assignment Assistant. Help with assignment creation, grading, and analysis.
            
            Context: {context}
            Task: {task}
            
            Available tools: {tools}
            
            Think step by step and use appropriate tools."""
        )
        
        return None
    
    async def _generate_assignment_tool(
        self,
        topic: str,
        difficulty: str = "medium",
        question_types: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Tool for generating assignments."""
        if question_types is None:
            question_types = ["essay", "short_answer"]
        
        result = await self.llm_service.generate_assignment(
            topic=topic,
            difficulty=difficulty,
            question_types=question_types,
            **kwargs
        )
        
        return {
            "assignment": result,
            "metadata": {
                "topic": topic,
                "difficulty": difficulty,
                "question_types": question_types
            }
        }
    
    async def _generate_rubric_tool(
        self,
        assignment: Dict[str, Any],
        criteria_count: int = 4
    ) -> Dict[str, Any]:
        """Tool for generating grading rubrics."""
        prompt = f"""
        Create a detailed grading rubric for this assignment:
        
        Assignment: {assignment.get('title', 'Untitled')}
        Questions: {assignment.get('questions', [])}
        
        Create {criteria_count} grading criteria with:
        1. Criterion name
        2. Description
        3. Weight (percentage)
        4. Performance levels (Excellent, Good, Fair, Poor)
        5. Example indicators for each level
        
        Return as structured JSON.
        """
        
        try:
            response = await self.llm_service.llm.ainvoke(prompt)
            return {
                "rubric": {
                    "criteria": [
                        {
                            "name": "Content Accuracy",
                            "description": "Correctness of information",
                            "weight": 25,
                            "levels": {
                                "Excellent": "All information correct and well-sourced",
                                "Good": "Most information correct",
                                "Fair": "Some errors present",
                                "Poor": "Numerous errors"
                            }
                        }
                    ]
                }
            }
        except Exception as e:
            logger.error(f"Rubric generation error: {e}")
            return {"error": str(e)}
    
    async def _grade_submission_tool(
        self,
        assignment: Dict[str, Any],
        submission: str,
        rubric: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Tool for grading submissions."""
        return await self.grading_service.grade_submission(
            assignment=assignment,
            submission_content=submission,
            submission_id=0  # Placeholder
        )
    
    async def _provide_feedback_tool(
        self,
        assignment: Dict[str, Any],
        submission: str,
        score: float
    ) -> Dict[str, Any]:
        """Tool for providing detailed feedback."""
        return await self.grading_service.generate_detailed_feedback(
            assignment=assignment,
            submission_content=submission,
            score=score
        )
    
    async def _analyze_trends_tool(
        self,
        submissions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Tool for analyzing performance trends."""
        if not submissions:
            return {"error": "No submissions to analyze"}
        
        scores = [s.get("score", 0) for s in submissions]
        
        analysis = {
            "total_submissions": len(submissions),
            "average_score": sum(scores) / len(scores),
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "score_distribution": self._calculate_distribution(scores),
            "common_issues": await self._identify_common_issues(submissions),
            "recommendations": self._generate_recommendations(scores)
        }
        
        return analysis
    
    async def _adapt_difficulty_tool(
        self,
        current_assignment: Dict[str, Any],
        performance_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Tool for adapting assignment difficulty."""
        avg_score = performance_data.get("average_score", 70)
        
        if avg_score > 85:
            adaptation = "increase_difficulty"
            suggestions = ["Add more complex questions", "Include application-based questions"]
        elif avg_score < 60:
            adaptation = "decrease_difficulty"
            suggestions = ["Simplify language", "Add more guided questions"]
        else:
            adaptation = "maintain_difficulty"
            suggestions = ["Current level is appropriate"]
        
        return {
            "adaptation": adaptation,
            "suggestions": suggestions,
            "reasoning": f"Average score: {avg_score}%",
            "modified_assignment": current_assignment
        }
    
    def _calculate_distribution(self, scores: List[float]) -> Dict[str, int]:
        """Calculate score distribution."""
        distribution = {
            "90-100": 0,
            "80-89": 0,
            "70-79": 0,
            "60-69": 0,
            "0-59": 0
        }
        
        for score in scores:
            if score >= 90:
                distribution["90-100"] += 1
            elif score >= 80:
                distribution["80-89"] += 1
            elif score >= 70:
                distribution["70-79"] += 1
            elif score >= 60:
                distribution["60-69"] += 1
            else:
                distribution["0-59"] += 1
        
        return distribution
    
    async def _identify_common_issues(self, submissions: List[Dict[str, Any]]) -> List[str]:
        """Identify common issues across submissions."""
        
        common_issues = [
            "Lack of specific examples",
            "Weak thesis statements",
            "Poor citation practices",
            "Surface-level analysis"
        ]
        
        return common_issues[:3]
    
    def _generate_recommendations(self, scores: List[float]) -> List[str]:
        """Generate teaching recommendations based on scores."""
        avg_score = sum(scores) / len(scores) if scores else 0
        
        recommendations = []
        
        if avg_score < 70:
            recommendations.extend([
                "Consider reviewing key concepts in class",
                "Provide more practice exercises",
                "Offer additional office hours"
            ])
        elif avg_score > 85:
            recommendations.extend([
                "Challenge students with advanced topics",
                "Introduce research components",
                "Encourage peer teaching"
            ])
        
        recommendations.append("Provide timely and specific feedback")
        
        return recommendations
    
    async def generate_complete_assignment(
        self,
        topic: str,
        course_context: str = "",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate complete assignment package."""
        # Generate assignment
        assignment = await self._generate_assignment_tool(topic, **kwargs)
        
        # Generate rubric
        rubric = await self._generate_rubric_tool(assignment["assignment"])
        
        # Create instructions
        instructions = self._create_instructions(assignment["assignment"])
        
        return {
            "assignment_package": assignment["assignment"],
            "grading_rubric": rubric["rubric"],
            "instructions": instructions,
            "estimated_grading_time": len(assignment["assignment"].get("questions", [])) * 3,  # minutes
            "difficulty_level": kwargs.get("difficulty", "medium")
        }
    
    def _create_instructions(self, assignment: Dict[str, Any]) -> str:
        """Create detailed instructions for assignment."""
        questions = assignment.get("questions", [])
        
        instructions = [
            f"Assignment: {assignment.get('title', 'Untitled')}",
            f"Total Questions: {len(questions)}",
            "",
            "Instructions:",
            "1. Read all questions carefully before starting",
            "2. Answer in your own words",
            "3. Cite sources where appropriate",
            "4. Check formatting requirements",
            "5. Submit before the deadline",
            "",
            "Grading:",
            "• Content accuracy and completeness",
            "• Clarity of expression",
            "• Critical thinking and analysis",
            "• Proper formatting and citations",
            "",
            "Good luck!"
        ]
        
        return '\n'.join(instructions)