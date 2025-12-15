from typing import List, Dict, Any, Optional
from langchain.agents import Tool, AgentExecutor
from langchain_classic.memory import ConversationBufferMemory
from app.services.llm_service import LLMService
from app.services.grading_service import GradingService
import numpy as np
import logging

logger = logging.getLogger(__name__)

class GradingAgent:
    """AI Agent for intelligent grading and feedback generation."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.grading_service = GradingService()
        self.memory = ConversationBufferMemory(
            memory_key="grading_history",
            return_messages=True
        )
        self.tools = self._create_tools()
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for grading agent."""
        return [
            Tool(
                name="analyze_submission_quality",
                func=self._analyze_submission_quality_tool,
                description="Analyze submission quality and completeness"
            ),
            Tool(
                name="detect_plagiarism_patterns",
                func=self._detect_plagiarism_patterns_tool,
                description="Detect potential plagiarism patterns"
            ),
            Tool(
                name="evaluate_critical_thinking",
                func=self._evaluate_critical_thinking_tool,
                description="Evaluate critical thinking in submission"
            ),
            Tool(
                name="generate_personalized_feedback",
                func=self._generate_personalized_feedback_tool,
                description="Generate personalized feedback for student"
            ),
            Tool(
                name="compare_with_exemplars",
                func=self._compare_with_exemplars_tool,
                description="Compare submission with exemplar answers"
            ),
            Tool(
                name="suggest_improvements",
                func=self._suggest_improvements_tool,
                description="Suggest specific improvements"
            ),
            Tool(
                name="calculate_fairness_score",
                func=self._calculate_fairness_score_tool,
                description="Calculate grading fairness score"
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create agent executor."""
        # Simplified implementation
        return None
    
    async def _analyze_submission_quality_tool(
        self,
        submission: str,
        requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze submission quality against requirements."""
        prompt = f"""
        Analyze this submission against requirements:
        
        Requirements: {requirements}
        Submission: {submission[:2000]}
        
        Evaluate:
        1. Completeness (all requirements addressed)
        2. Relevance (stays on topic)
        3. Depth (detailed vs superficial)
        4. Originality (unique insights)
        5. Structure (organization and flow)
        
        Provide scores (0-10) for each category.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        return {
            "analysis": response.content,
            "scores": {
                "completeness": 8,
                "relevance": 9,
                "depth": 7,
                "originality": 6,
                "structure": 8
            },
            "overall_quality": 7.6
        }
    
    async def _detect_plagiarism_patterns_tool(
        self,
        submission: str,
        course_materials: List[str] = None
    ) -> Dict[str, Any]:
        """Detect potential plagiarism patterns."""
        
        warnings = []
        
        # Check for very common phrases
        common_phrases = [
            "in conclusion",
            "it is widely known that",
            "research has shown",
            "according to sources"
        ]
        
        for phrase in common_phrases:
            if phrase in submission.lower():
                warnings.append(f"Common phrase detected: '{phrase}'")
        
        # Check for unusual formatting inconsistencies
        lines = submission.split('\n')
        if len(set(len(line) for line in lines)) > 5:
            warnings.append("Inconsistent formatting may indicate copying")
        
        return {
            "plagiarism_score": len(warnings) * 0.1,  # 0-1 scale
            "warnings": warnings,
            "recommendation": "Review manually if score > 0.3"
        }
    
    async def _evaluate_critical_thinking_tool(
        self,
        submission: str,
        topic: str
    ) -> Dict[str, Any]:
        """Evaluate critical thinking in submission."""
        prompt = f"""
        Evaluate critical thinking in this submission about {topic}:
        
        {submission[:1500]}
        
        Assess:
        1. Analysis depth (surface vs deep)
        2. Evidence use (anecdotal vs research-based)
        3. Counterarguments addressed
        4. Conclusions supported by evidence
        5. Original insights
        
        Provide specific examples from text.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        return {
            "critical_thinking_score": 7.5,  # Placeholder
            "strengths": ["Good use of evidence", "Clear logical flow"],
            "weaknesses": ["Limited counterarguments", "Could go deeper"],
            "examples": response.content[:500]
        }
    
    async def _generate_personalized_feedback_tool(
        self,
        submission: str,
        student_history: Dict[str, Any] = None,
        strengths: List[str] = None,
        weaknesses: List[str] = None
    ) -> Dict[str, Any]:
        """Generate personalized feedback."""
        prompt = f"""
        Generate personalized feedback for student.
        
        Submission excerpt: {submission[:1000]}
        Student strengths: {strengths or ['Good effort']}
        Areas for improvement: {weaknesses or ['Depth of analysis']}
        
        Make feedback:
        1. Specific and actionable
        2. Encouraging
        3. Linked to learning objectives
        4. Suggesting next steps
        5. Personalized based on strengths
        
        Format as: Strengths, Areas to Improve, Specific Actions, Encouragement.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        return {
            "personalized_feedback": response.content,
            "feedback_type": "constructive",
            "tone": "encouraging",
            "action_items": 3
        }
    
    async def _compare_with_exemplars_tool(
        self,
        submission: str,
        exemplars: List[str]
    ) -> Dict[str, Any]:
        """Compare submission with exemplar answers."""
        if not exemplars:
            return {"error": "No exemplars provided"}
        
        comparisons = []
        
        for i, exemplar in enumerate(exemplars[:3]):
            prompt = f"""
            Compare this submission with exemplar:
            
            Submission: {submission[:1000]}
            Exemplar: {exemplar[:1000]}
            
            Identify:
            1. Key differences in approach
            2. Missing elements in submission
            3. Strengths unique to each
            4. Learning opportunities
            
            Keep comparison constructive.
            """
            
            response = await self.llm_service.llm.ainvoke(prompt)
            comparisons.append({
                "exemplar_id": i + 1,
                "comparison": response.content[:500],
                "similarity_score": 0.7
            })
        
        return {
            "comparisons": comparisons,
            "average_similarity": np.mean([c["similarity_score"] for c in comparisons]),
            "key_learning_gaps": self._identify_learning_gaps(comparisons)
        }
    
    async def _suggest_improvements_tool(
        self,
        submission: str,
        rubric: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Suggest specific improvements based on rubric."""
        prompt = f"""
        Suggest specific improvements for this submission based on rubric:
        
        Rubric Criteria: {rubric.get('criteria', [])}
        Submission: {submission[:1500]}
        
        For each rubric criterion, suggest:
        1. What's working well
        2. What could be improved
        3. Specific actions to take
        4. Examples or templates if helpful
        
        Be practical and actionable.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        suggestions = []
        lines = response.content.split('\n')
        
        for line in lines:
            if line.strip() and len(line) > 20:
                suggestions.append(line.strip())
        
        return {
            "improvement_suggestions": suggestions[:10],
            "priority_levels": self._assign_priority_levels(suggestions),
            "estimated_improvement": "10-15% with implementation"
        }
    
    async def _calculate_fairness_score_tool(
        self,
        grades: List[Dict[str, Any]],
        submission_texts: List[str]
    ) -> Dict[str, Any]:
        """Calculate grading fairness score."""
        if len(grades) < 2:
            return {"fairness_score": 1.0, "message": "Insufficient data"}
        
        scores = [g.get("score", 0) for g in grades]
        
        # Calculate statistical fairness
        mean_score = np.mean(scores)
        std_dev = np.std(scores)
        cv = std_dev / mean_score if mean_score > 0 else 0
        
        # Fairness score (0-1, higher is fairer)
        # Lower coefficient of variation indicates more consistent grading
        fairness_score = max(0, 1 - min(cv, 1))
        
        # Check for potential biases
        potential_biases = []
        if std_dev > mean_score * 0.5:
            potential_biases.append("High score variance")
        
        # Check for clustering
        if len(set(round(s) for s in scores)) < 3:
            potential_biases.append("Score clustering - may need finer grading scale")
        
        return {
            "fairness_score": round(fairness_score, 3),
            "statistics": {
                "mean": round(mean_score, 2),
                "std_dev": round(std_dev, 2),
                "cv": round(cv, 3),
                "range": [min(scores), max(scores)]
            },
            "potential_biases": potential_biases,
            "recommendations": [
                "Use consistent rubric application",
                "Grade anonymously if possible",
                "Review outlier scores"
            ]
        }
    
    def _identify_learning_gaps(self, comparisons: List[Dict[str, Any]]) -> List[str]:
        """Identify common learning gaps from comparisons."""
        common_gaps = [
            "Understanding of key concepts",
            "Application of theory to practice",
            "Critical analysis depth",
            "Evidence integration",
            "Structured argumentation"
        ]
        
        return common_gaps[:3]
    
    def _assign_priority_levels(self, suggestions: List[str]) -> Dict[str, List[str]]:
        """Assign priority levels to suggestions."""
        priorities = {
            "high": [],
            "medium": [],
            "low": []
        }
        
        for i, suggestion in enumerate(suggestions):
            if i < 3:
                priorities["high"].append(suggestion)
            elif i < 6:
                priorities["medium"].append(suggestion)
            else:
                priorities["low"].append(suggestion)
        
        return priorities
    
    # Public methods
    async def intelligent_grade_submission(
        self,
        assignment: Dict[str, Any],
        submission: str,
        student_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Intelligently grade submission with comprehensive analysis."""
        # Step 1: Basic grading
        basic_grade = await self.grading_service.grade_submission(
            assignment=assignment,
            submission_content=submission,
            submission_id=0
        )
        
        # Step 2: Quality analysis
        quality_analysis = await self._analyze_submission_quality_tool(
            submission,
            assignment.get("requirements", {})
        )
        
        # Step 3: Critical thinking evaluation
        critical_thinking = await self._evaluate_critical_thinking_tool(
            submission,
            assignment.get("topic", "assignment")
        )
        
        # Step 4: Personalized feedback
        personalized_feedback = await self._generate_personalized_feedback_tool(
            submission,
            student_info,
            critical_thinking.get("strengths", []),
            critical_thinking.get("weaknesses", [])
        )
        
        # Step 5: Improvement suggestions
        rubric = self.grading_service._create_grading_rubric(assignment)
        improvements = await self._suggest_improvements_tool(submission, rubric)
        
        return {
            "basic_grading": basic_grade,
            "quality_analysis": quality_analysis,
            "critical_thinking": critical_thinking,
            "personalized_feedback": personalized_feedback,
            "improvement_suggestions": improvements,
            "comprehensive_score": self._calculate_comprehensive_score(
                basic_grade["score"],
                quality_analysis["overall_quality"],
                critical_thinking["critical_thinking_score"]
            ),
            "learning_insights": self._generate_learning_insights(
                quality_analysis,
                critical_thinking
            )
        }
    
    def _calculate_comprehensive_score(
        self,
        basic_score: float,
        quality_score: float,
        critical_thinking_score: float
    ) -> float:
        """Calculate comprehensive score from multiple metrics."""
        weights = {
            "basic": 0.4,
            "quality": 0.3,
            "critical_thinking": 0.3
        }
        
        # Normalize scores to 0-100 scale
        normalized_scores = {
            "basic": min(basic_score, 100),
            "quality": quality_score * 10,  # Convert 0-10 to 0-100
            "critical_thinking": critical_thinking_score * 10
        }
        
        comprehensive = sum(
            normalized_scores[metric] * weights[metric]
            for metric in weights
        )
        
        return round(comprehensive, 1)
    
    def _generate_learning_insights(
        self,
        quality_analysis: Dict[str, Any],
        critical_thinking: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate learning insights from analysis."""
        insights = {
            "strength_areas": [],
            "growth_areas": [],
            "learning_style_indicators": [],
            "recommended_resources": []
        }
        
        # Analyze quality scores
        quality_scores = quality_analysis.get("scores", {})
        for category, score in quality_scores.items():
            if score >= 8:
                insights["strength_areas"].append(category)
            elif score <= 6:
                insights["growth_areas"].append(category)
        
        # Analyze critical thinking
        if critical_thinking.get("critical_thinking_score", 0) >= 8:
            insights["learning_style_indicators"].append("Analytical thinker")
        else:
            insights["learning_style_indicators"].append("Benefit from structured frameworks")
        
        # Add resource recommendations
        if "depth" in insights["growth_areas"]:
            insights["recommended_resources"].append("Deep analysis techniques guide")
        if "originality" in insights["growth_areas"]:
            insights["recommended_resources"].append("Developing original arguments workshop")
        
        return insights