from typing import Dict, Any, List, Optional
from app.services.llm_service import LLMService
from app.models.assessment import Assignment, AssignmentSubmission
import json
import logging

logger = logging.getLogger(__name__)

class GradingService:
    """Service for AI-powered assignment grading."""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    async def grade_submission(
        self,
        assignment: Assignment,
        submission_content: str,
        submission_id: int
    ) -> Dict[str, Any]:
        """Grade assignment submission using AI."""
        try:
            rubric = self._create_grading_rubric(assignment)
            
            grade_result = await self.llm_service.grade_assignment(
                assignment=assignment.questions,
                submission=submission_content,
                rubric=rubric
            )
            
            processed_result = self._process_grade_result(
                grade_result,
                assignment.max_score
            )
            
            logger.info(f"Graded submission {submission_id}: {processed_result['score']}/{assignment.max_score}")
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Grading failed for submission {submission_id}: {e}")
            return self._create_fallback_grade(assignment)
    
    async def grade_multiple_submissions(
        self,
        assignment: Assignment,
        submissions: List[AssignmentSubmission]
    ) -> List[Dict[str, Any]]:
        """Grade multiple submissions with comparative analysis."""
        results = []
        
        for submission in submissions:
            if submission.content:
                grade_result = await self.grade_submission(
                    assignment,
                    submission.content,
                    submission.id
                )
                results.append({
                    "submission_id": submission.id,
                    "student_id": submission.student_id,
                    **grade_result
                })
        
        if len(results) > 1:
            comparative_analysis = await self._analyze_comparative_results(results)
            for result in results:
                result["comparative_analysis"] = comparative_analysis.get(
                    str(result["submission_id"]), {}
                )
        
        return results
    
    async def generate_detailed_feedback(
        self,
        assignment: Assignment,
        submission_content: str,
        score: float
    ) -> Dict[str, Any]:
        """Generate detailed feedback for assignment."""
        prompt = f"""
        Generate detailed feedback for this assignment submission:
        
        Assignment: {assignment.title}
        Submission: {submission_content[:2000]}
        Score: {score}/{assignment.max_score}
        
        Provide:
        1. Overall assessment
        2. Strengths identified
        3. Areas for improvement
        4. Specific examples from submission
        5. Suggestions for next steps
        6. Learning resources recommendations
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        return {
            "detailed_feedback": response.content,
            "score_breakdown": self._create_score_breakdown(score, assignment.max_score)
        }
    
    def _create_grading_rubric(self, assignment: Assignment) -> Dict[str, Any]:
        """Create grading rubric based on assignment."""
        if assignment.questions and isinstance(assignment.questions, list):
            criteria = []
            for i, question in enumerate(assignment.questions):
                criteria.append({
                    "criterion": f"Q{i+1}: {question.get('question', 'Question')[:50]}",
                    "weight": 100 / len(assignment.questions),
                    "max_score": 100 / len(assignment.questions),
                    "description": "Accuracy and completeness of answer"
                })
        else:
            criteria = [
                {
                    "criterion": "Content Accuracy",
                    "weight": 40,
                    "max_score": 40,
                    "description": "Correctness of information and concepts"
                },
                {
                    "criterion": "Completeness",
                    "weight": 20,
                    "max_score": 20,
                    "description": "Thoroughness in addressing all requirements"
                },
                {
                    "criterion": "Clarity & Organization",
                    "weight": 20,
                    "max_score": 20,
                    "description": "Clear expression and logical structure"
                },
                {
                    "criterion": "Critical Thinking",
                    "weight": 20,
                    "max_score": 20,
                    "description": "Depth of analysis and original insights"
                }
            ]
        
        return {
            "assignment_id": assignment.id,
            "assignment_title": assignment.title,
            "max_score": assignment.max_score,
            "criteria": criteria,
            "grading_scale": {
                "A": (90, 100),
                "B": (80, 89),
                "C": (70, 79),
                "D": (60, 69),
                "F": (0, 59)
            }
        }
    
    def _process_grade_result(
        self,
        grade_result: Dict[str, Any],
        max_score: float
    ) -> Dict[str, Any]:
        """Process AI grading result."""
        if not isinstance(grade_result, dict):
            return self._create_fallback_grade_from_raw(grade_result, max_score)
        
        score = grade_result.get("overall_score", 0)
        
        score = max(0, min(score, max_score))
        
        return {
            "score": score,
            "feedback": grade_result.get("detailed_feedback", "Good work!"),
            "ai_feedback": grade_result.get("ai_feedback", "AI grading completed."),
            "breakdown": grade_result.get("breakdown", []),
            "areas_of_improvement": grade_result.get("areas_of_improvement", []),
            "strengths": grade_result.get("strengths", []),
            "grade_letter": self._calculate_grade_letter(score, max_score)
        }
    
    def _create_fallback_grade(self, assignment: Assignment) -> Dict[str, Any]:
        """Create fallback grade when AI grading fails."""
        return {
            "score": 0,
            "feedback": "Unable to grade automatically. Please review manually.",
            "ai_feedback": "Grading system encountered an error.",
            "breakdown": [],
            "areas_of_improvement": ["System error occurred"],
            "strengths": [],
            "grade_letter": "N/A"
        }
    
    def _create_fallback_grade_from_raw(
        self,
        raw_result: Any,
        max_score: float
    ) -> Dict[str, Any]:
        """Create fallback grade from raw result."""
        try:
            if isinstance(raw_result, str):
                # Look for score pattern
                import re
                score_match = re.search(r'(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)', raw_result)
                if score_match:
                    score = float(score_match.group(1))
                    score = max(0, min(score, max_score))
                else:
                    score = max_score * 0.7
            else:
                score = max_score * 0.7
            
            return {
                "score": score,
                "feedback": raw_result if isinstance(raw_result, str) else "AI graded assignment.",
                "ai_feedback": "Automatically graded with fallback method.",
                "breakdown": [{"criterion": "Overall", "score": score, "max_score": max_score}],
                "areas_of_improvement": ["Review assignment guidelines"],
                "strengths": ["Submission completed"],
                "grade_letter": self._calculate_grade_letter(score, max_score)
            }
        except:
            return self._create_fallback_grade_from_default(max_score)
    
    def _create_fallback_grade_from_default(self, max_score: float) -> Dict[str, Any]:
        """Create default fallback grade."""
        return {
            "score": max_score * 0.5,
            "feedback": "Please contact instructor for manual grading.",
            "ai_feedback": "Grading system temporarily unavailable.",
            "breakdown": [],
            "areas_of_improvement": [],
            "strengths": [],
            "grade_letter": "N/A"
        }
    
    def _calculate_grade_letter(self, score: float, max_score: float) -> str:
        """Calculate letter grade from score."""
        percentage = (score / max_score) * 100
        
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"
    
    def _create_score_breakdown(self, score: float, max_score: float) -> Dict[str, Any]:
        """Create score breakdown."""
        percentage = (score / max_score) * 100
        
        return {
            "raw_score": score,
            "max_score": max_score,
            "percentage": round(percentage, 2),
            "grade_letter": self._calculate_grade_letter(score, max_score),
            "performance_level": self._get_performance_level(percentage)
        }
    
    def _get_performance_level(self, percentage: float) -> str:
        """Get performance level from percentage."""
        if percentage >= 90:
            return "Excellent"
        elif percentage >= 80:
            return "Good"
        elif percentage >= 70:
            return "Satisfactory"
        elif percentage >= 60:
            return "Needs Improvement"
        else:
            return "Unsatisfactory"
    
    async def _analyze_comparative_results(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze comparative results across submissions."""
        if not results:
            return {}
        
        # Calculate statistics
        scores = [r["score"] for r in results]
        avg_score = sum(scores) / len(scores)
        max_score = max(scores)
        min_score = min(scores)
        
        comparative_analysis = {}
        
        for result in results:
            score = result["score"]
            
            # Calculate percentile
            better_than = sum(1 for s in scores if s < score) / len(scores) * 100
            
            comparative_analysis[str(result["submission_id"])] = {
                "score_vs_average": "above" if score > avg_score else "below",
                "average_difference": abs(score - avg_score),
                "percentile": round(better_than, 1),
                "relative_performance": self._get_relative_performance(score, avg_score),
                "class_rank": sorted(scores, reverse=True).index(score) + 1
            }
        
        return comparative_analysis
    
    def _get_relative_performance(self, score: float, average: float) -> str:
        """Get relative performance description."""
        difference = score - average
        difference_percent = (difference / average) * 100 if average > 0 else 0
        
        if difference_percent > 20:
            return "Significantly above average"
        elif difference_percent > 10:
            return "Above average"
        elif difference_percent > -10:
            return "Average"
        elif difference_percent > -20:
            return "Below average"
        else:
            return "Significantly below average"