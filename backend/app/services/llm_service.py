from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpoint
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.documents import Document
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.llm = self._initialize_llm()
        self.prompts = self._initialize_prompts()
    
    def _initialize_llm(self):
        """Initialize LLM based on configuration"""
        if settings.LLM_PROVIDER == "groq":
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY not configured")
            return ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.LLM_MODEL,
                temperature=0.3
            )
        elif settings.LLM_PROVIDER == "huggingface":
            if not settings.HUGGINGFACE_API_KEY:
                raise ValueError("HUGGINGFACE_API_KEY not configured")
            return HuggingFaceEndpoint(
                endpoint_url=f"https://api-inference.huggingface.co/models/{settings.LLM_MODEL}",
                huggingfacehub_api_token=settings.HUGGINGFACE_API_KEY,
                task="text-generation"
            )
        elif settings.LLM_PROVIDER == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not configured")
            return ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model="gpt-4",
                temperature=0.3
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")
    
    def _initialize_prompts(self):
        """Initialize prompt templates"""
        return {
            "course_material": ChatPromptTemplate.from_template(
                """You are an expert course material generator. Generate comprehensive educational content.
                
                Topic: {topic}
                Course Level: {level}
                Target Audience: {audience}
                Additional Instructions: {instructions}
                
                Generate a detailed course material with the following structure:
                1. Introduction
                2. Key Concepts
                3. Detailed Explanations
                4. Examples
                5. Applications
                6. Summary
                7. Further Reading Suggestions
                
                Make it engaging, clear, and educational."""
            ),
            "assignment_generator": ChatPromptTemplate.from_template(
                """Generate an assignment for the following topic:
                
                Topic: {topic}
                Course Context: {context}
                Difficulty Level: {difficulty}
                Question Types: {question_types}
                Number of Questions: {num_questions}
                
                Generate a structured assignment with questions, instructions, and expected outcomes."""
            ),
            "test_generator": ChatPromptTemplate.from_template(
                """Generate a test with the following specifications:
                
                Topic: {topic}
                Test Type: {test_type}
                Number of Questions: {num_questions}
                Difficulty: {difficulty}
                
                For multiple choice questions, provide:
                1. Question
                2. Options (A, B, C, D)
                3. Correct Answer
                4. Explanation
                
                For text-based questions, provide:
                1. Question
                2. Expected Answer Points
                3. Scoring Rubric"""
            ),
            "flashcard_generator": ChatPromptTemplate.from_template(
                """Generate flashcards for self-study on the following topic:
                
                Topic: {topic}
                Number of Flashcards: {num_flashcards}
                Level: {level}
                
                Generate flashcards with:
                1. Front (Question/Concept)
                2. Back (Answer/Explanation)
                3. Category/Tag
                4. Difficulty Level"""
            ),
            "grading_rubric": ChatPromptTemplate.from_template(
                """Grade the following assignment submission:
                
                Assignment: {assignment}
                Student Submission: {submission}
                Rubric: {rubric}
                
                Provide:
                1. Overall Score (out of {max_score})
                2. Breakdown by criteria
                3. Detailed feedback
                4. Areas of improvement
                5. Strengths"""
            )
        }
    
    async def generate_course_material(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate course material from topic"""
        prompt = self.prompts["course_material"]
        chain = prompt | self.llm
        response = await chain.ainvoke({
            "topic": topic,
            "level": kwargs.get("level", "undergraduate"),
            "audience": kwargs.get("audience", "college students"),
            "instructions": kwargs.get("instructions", "")
        })
        return {"content": response.content, "metadata": kwargs}
    
    async def generate_assignment(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate assignment questions"""
        parser = JsonOutputParser()

        try:
            format_instructions = parser.get_format_instructions()
        except Exception:
            format_instructions = (
                "Return output as valid JSON with the following keys: `title`, `description`, "
                "`instructions`, `questions` (array of objects with keys: `question`, `type`, "
                "optional `options` array, optional `points`, optional `rubric`). Output ONLY valid JSON."
            )

        base_prompt = (
            "Generate an assignment for the following topic:\n\n"
            "Topic: {topic}\n"
            "Course Context: {context}\n"
            "Difficulty Level: {difficulty}\n"
            "Question Types: {question_types}\n"
            "Number of Questions: {num_questions}\n\n"
        )

        prompt_text = base_prompt + "\n" + format_instructions
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | self.llm | parser

        invoke_kwargs = {
            "topic": topic,
            "context": kwargs.get("context", ""),
            "difficulty": kwargs.get("difficulty", "medium"),
            "question_types": kwargs.get("question_types", ["essay", "short_answer"]),
            "num_questions": kwargs.get("num_questions", 5)
        }

        try:
            result = await chain.ainvoke(invoke_kwargs)
            return result
        except Exception as e:
            logger.warning(f"Assignment generation parser failed, retrying with stricter JSON-only instructions: {e}")

            # Retry with an explicit JSON-only instruction
            strict_instructions = (
                "YOU MUST RETURN A SINGLE, VALID JSON OBJECT AND NOTHING ELSE. "
                "The JSON must contain: `title` (string), `description` (string), `instructions` (string), "
                "and `questions` (an array). Each question must be an object with `question` (string) and may include "
                "`type`, `options` (array), `points` (number) and `rubric` (string). Do not include any markdown, explanation, or extra text."
            )

            prompt_text2 = base_prompt + "\n" + strict_instructions
            prompt2 = ChatPromptTemplate.from_template(prompt_text2)
            chain2 = prompt2 | self.llm | parser

            try:
                result = await chain2.ainvoke(invoke_kwargs)
                return result
            except Exception as e2:
                logger.error(f"Assignment generation failed after retry: {e2}")
                # Final fallback: return raw text from the LLM so frontend can still show something
                try:
                    response = await self.llm.ainvoke(f"Generate assignment questions about {topic}")
                    return {"questions": response.content, "instructions": "Answer all questions"}
                except Exception as final_e:
                    logger.error(f"Final fallback generation failed: {final_e}")
                    # Return an empty structure rather than raise so callers can handle gracefully
                    return {"questions": [], "instructions": ""}
    
    async def generate_test(self, topic: str, test_type: str, **kwargs) -> Dict[str, Any]:
        """Generate test questions and answers"""
        parser = JsonOutputParser()

        try:
            format_instructions = parser.get_format_instructions()
        except Exception:
            format_instructions = (
                "Return output as valid JSON with the following keys: `questions` (array of objects with keys: `question`, optional `type`, optional `options`, optional `points`, optional `rubric`) and optional `answers`. Output ONLY valid JSON. Do NOT include any introductory text, preamble, or explanation."
            )

        base_prompt = (
            "Generate a test with the following specifications:\n\n"
            "Topic: {topic}\n"
            "Test Type: {test_type}\n"
            "Number of Questions: {num_questions}\n"
            "Difficulty: {difficulty}\n\n"
        )

        tt = (test_type or "").lower()
        if "text" in tt:
            type_instructions = (
                "Test Type: text_based. Each question MUST be text-based. "
                "For every question include `question` (string), `expected_answer` (string or short list of points), "
                "and `rubric` (optional). DO NOT include `options` or `correct_answer` fields. "
                "Set the question `type` to `text_based`. Return ONLY valid JSON as specified."
            )
        elif "multi" in tt or "choice" in tt:
            type_instructions = (
                "Test Type: multiple_choice. Each question MUST include `question` (string), `options` (array), "
                "and `correct_answer`. Set the question `type` to `multiple_choice`. Return ONLY valid JSON as specified."
            )
        else:
            type_instructions = (
                "Specify the desired question format using 'test_type'. Follow the format instructions strictly and return ONLY valid JSON."
            )

        prompt_text = base_prompt + "\n" + type_instructions + "\n" + format_instructions
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | self.llm | parser

        invoke_kwargs = {
            "topic": topic,
            "test_type": test_type,
            "num_questions": kwargs.get("num_questions", 10),
            "difficulty": kwargs.get("difficulty", "medium")
        }

        try:
            result = await chain.ainvoke(invoke_kwargs)

            # Normalize possible wrapper shapes so we can reliably find `questions`.
            if isinstance(result, dict):
                if "questions" not in result:
                    if "test" in result and isinstance(result["test"], dict):
                        test_obj = result.pop("test")
                        # move questions/answers/estimated_duration up if present
                        if "questions" in test_obj:
                            result["questions"] = test_obj.pop("questions")
                        if "answers" in test_obj and "answers" not in result:
                            result["answers"] = test_obj.pop("answers")
                        if "estimated_duration" in test_obj and "estimated_duration" not in result:
                            result["estimated_duration"] = test_obj.pop("estimated_duration")
                        # if there are other useful keys, merge them
                        for k, v in test_obj.items():
                            if k not in result:
                                result[k] = v

                for wrapper in ("data", "result"):
                    if wrapper in result and isinstance(result[wrapper], dict):
                        inner = result.pop(wrapper)
                        if "questions" in inner and "questions" not in result:
                            result["questions"] = inner.get("questions")
                        if "answers" in inner and "answers" not in result:
                            result["answers"] = inner.get("answers")

            # Enforce/coerce question format to requested test_type as a safety net.
            try:
                req_tt = (test_type or "").lower()
                if isinstance(result, dict) and "questions" in result and isinstance(result["questions"], list):
                    for q in result["questions"]:
                        if not isinstance(q, dict):
                            continue

                        if "text" in req_tt:
                            if "options" in q:
                                correct = q.pop("correct_answer", None)
                                opts = q.pop("options", None)
                                if correct is None and isinstance(opts, list) and len(opts) > 0:
                                    correct = opts[0]
                                if correct is not None:
                                    q["expected_answer"] = correct
                            q["type"] = "text_based"
                        # Ensure multiple choice has required fields
                        elif "multi" in req_tt or "choice" in req_tt:
                            if "options" not in q and "correct_answer" in q:
                                q["options"] = [q.get("correct_answer")]
                            q["type"] = "multiple_choice"
            except Exception:
                logger.exception("Failed during post-processing/coercion of questions based on test_type")

            try:
                qs = result.get("questions") if isinstance(result, dict) else None
            except Exception:
                qs = None

            if qs is None or (isinstance(qs, list) and len(qs) == 0):
                logger.warning("LLM returned empty 'questions' array after normalization; retrying with strict instructions")
                raise Exception("Empty questions from LLM")

            return result
        except Exception as e:
            try:
                raw_prompt_filled = base_prompt.format(**invoke_kwargs) + "\n" + format_instructions
                raw_resp = await self.llm.ainvoke(raw_prompt_filled)
                raw_text = getattr(raw_resp, "content", raw_resp)
                logger.info(f"Raw LLM response (initial attempt): {raw_text}")
            except Exception:
                logger.exception("Failed to retrieve raw LLM response for initial attempt")

            logger.warning(f"Test generation parser failed or empty result, retrying with strict JSON-only instructions: {e}")

            strict_instructions = (
                "YOU MUST RETURN A SINGLE, VALID JSON OBJECT AND NOTHING ELSE. "
                "Do NOT include any preamble, introduction, or explanatory text — ONLY the JSON. "
                "The JSON must contain: `questions` (an array). Each question must be an object with `question` (string) and may include `type`, `options` (array), `points` (number), and `rubric` (string). Do not include markdown or extra text."
            )

            prompt_text2 = base_prompt + "\n" + strict_instructions
            prompt2 = ChatPromptTemplate.from_template(prompt_text2)
            chain2 = prompt2 | self.llm | parser

            try:
                result = await chain2.ainvoke(invoke_kwargs)
                return result
            except Exception as e2:
                # Capture raw response for strict retry too
                try:
                    raw_prompt_filled2 = base_prompt.format(**invoke_kwargs) + "\n" + strict_instructions
                    raw_resp2 = await self.llm.ainvoke(raw_prompt_filled2)
                    raw_text2 = getattr(raw_resp2, "content", raw_resp2)
                    logger.info(f"Raw LLM response (strict retry): {raw_text2}")
                except Exception:
                    logger.exception("Failed to retrieve raw LLM response for strict retry")

                logger.warning(f"Strict JSON retry failed, falling back to plain text parsing: {e2}")
                # Final fallback: ask the LLM for plain text and heuristically parse numbered questions
                try:
                    raw_prompt = f"Generate {invoke_kwargs['num_questions']} {test_type} questions about {topic}. Return a simple numbered list of questions with optional expected answer points and a short rubric after each question. Do not include any introductory line."
                    response = await self.llm.ainvoke(raw_prompt)
                    text = getattr(response, "content", response)
                    import re

                    parts = re.split(r"\n\s*(?=\d+[\.\)])", str(text))
                    questions = []
                    for p in parts:
                        p = p.strip()
                        if not p:
                            continue
                        qtext = re.sub(r"^\d+[\.)]\s*", "", p).strip()
                        questions.append({"question": qtext})

                    return {
                        "questions": questions,
                        "answers": {},
                        "estimated_duration": invoke_kwargs.get("num_questions", 10) * 2,
                    }
                except Exception as final_e:
                    logger.error(f"Final fallback generation failed: {final_e}")
                    return {"questions": [], "answers": {}, "estimated_duration": 0}
    
    async def generate_flashcards(self, topic: str, num_flashcards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards for self-study"""
        prompt = self.prompts["flashcard_generator"]
        parser = JsonOutputParser()
        chain = prompt | self.llm | parser
        
        result = await chain.ainvoke({
            "topic": topic,
            "num_flashcards": num_flashcards,
            "level": "beginner"
        })
        return result.get("flashcards", [])
    
    async def grade_assignment(self, assignment: Dict, submission: str, rubric: Dict) -> Dict[str, Any]:
        """Grade assignment using AI"""
        prompt = self.prompts["grading_rubric"]
        parser = JsonOutputParser()
        chain = prompt | self.llm | parser
        
        result = await chain.ainvoke({
            "assignment": assignment,
            "submission": submission,
            "rubric": rubric,
            "max_score": assignment.get("max_score", 100)
        })
        return result