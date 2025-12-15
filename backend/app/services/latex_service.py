from typing import Dict, Any, Optional
import subprocess
import tempfile
import os
from pathlib import Path
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

class LaTeXService:
    """Service for LaTeX processing and manipulation"""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    async def format_latex(self, latex_code: str) -> Dict[str, Any]:
        """Format and clean LaTeX code"""
        prompt = f"""
        Format and clean this LaTeX code for better readability and structure:
        
        {latex_code}
        
        Rules:
        1. Add proper indentation
        2. Organize imports/packages
        3. Fix common LaTeX errors
        4. Add comments for complex sections
        5. Ensure proper escaping
        6. Optimize code structure
        
        Return only the formatted LaTeX code.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        formatted = response.content
        
        # Validate with actual LaTeX compilation
        is_valid = await self._validate_latex(formatted)
        
        return {
            "formatted_code": formatted,
            "is_valid": is_valid,
            "original_length": len(latex_code),
            "formatted_length": len(formatted)
        }
    
    async def solve_latex_problem(self, problem: str) -> Dict[str, Any]:
        """Solve LaTeX-related problems or equations"""
        prompt = f"""
        Solve this LaTeX problem or generate LaTeX code:
        
        Problem: {problem}
        
        Provide:
        1. Solution in LaTeX format
        2. Step-by-step explanation
        3. Alternative approaches if applicable
        4. Common pitfalls to avoid
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        # Extract LaTeX code from response
        latex_solution = self._extract_latex_from_text(response.content)
        
        return {
            "solution": latex_solution,
            "explanation": response.content,
            "problem": problem
        }
    
    async def explain_latex(self, latex_code: str) -> Dict[str, Any]:
        """Explain LaTeX code and its components"""
        prompt = f"""
        Explain this LaTeX code in detail:
        
        {latex_code}
        
        Cover:
        1. What does this code do?
        2. Breakdown of each command and package
        3. Common use cases
        4. Potential improvements
        5. Related LaTeX concepts
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        
        return {
            "explanation": response.content,
            "original_code": latex_code,
            "components": await self._extract_components(latex_code)
        }
    
    async def generate_latex_from_text(self, text: str, doc_type: str = "article") -> Dict[str, Any]:
        """Generate LaTeX document from plain text"""
        prompt = f"""
        Convert this text into a properly formatted LaTeX {doc_type} document:
        
        {text}
        
        Include:
        1. Proper document class and packages
        2. Title, author, date
        3. Sections and subsections
        4. Mathematical formatting if needed
        5. References/bibliography if needed
        6. Clean, compilable code
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        latex_code = response.content
        
        # Validate compilation
        is_valid = await self._validate_latex(latex_code)
        
        # Generate PDF preview
        pdf_path = None
        if is_valid:
            pdf_path = await self._compile_latex_to_pdf(latex_code)
        
        return {
            "latex_code": latex_code,
            "is_valid": is_valid,
            "pdf_preview_url": pdf_path,
            "doc_type": doc_type
        }
    
    async def _validate_latex(self, latex_code: str) -> bool:
        """Validate LaTeX code by attempting to compile it"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_file = Path(tmpdir) / "document.tex"
            tex_file.write_text(latex_code)
            
            try:
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", str(tex_file)],
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                return result.returncode == 0 and "error" not in result.stdout.lower()
            except:
                return False
    
    async def _compile_latex_to_pdf(self, latex_code: str) -> Optional[str]:
        """Compile LaTeX to PDF and return path"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_file = Path(tmpdir) / "document.tex"
            pdf_file = Path(tmpdir) / "document.pdf"
            tex_file.write_text(latex_code)
            
            try:
                subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", str(tex_file)],
                    cwd=tmpdir,
                    capture_output=True,
                    timeout=30
                )
                
                if pdf_file.exists():
                    # In production, upload to Supabase and return URL
                    return str(pdf_file)
            except Exception as e:
                logger.error(f"LaTeX compilation error: {e}")
            
            return None
    
    def _extract_latex_from_text(self, text: str) -> str:
        """Extract LaTeX code from text response"""
        # Simple extraction - look for \begin{document}...\end{document}
        import re
        pattern = r'\\begin\{document\}.*?\\end\{document\}'
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            return matches[0]
        
        # Fallback: return text between ```latex ``` or ``` ``` blocks
        code_block_pattern = r'```(?:latex)?\s*(.*?)\s*```'
        matches = re.findall(code_block_pattern, text, re.DOTALL)
        
        if matches:
            return matches[0]
        
        return text
    
    async def _extract_components(self, latex_code: str) -> Dict[str, Any]:
        """Extract components from LaTeX code"""
        components = {
            "packages": [],
            "commands": [],
            "environments": [],
            "references": [],
            "figures": [],
            "tables": []
        }
        
        import re
        
        # Extract packages
        package_pattern = r'\\usepackage(?:\[.*?\])?\{([^}]+)\}'
        components["packages"] = re.findall(package_pattern, latex_code)
        
        # Extract custom commands
        command_pattern = r'\\newcommand\{\\([^}]+)\}'
        components["commands"] = re.findall(command_pattern, latex_code)
        
        # Extract environments
        env_pattern = r'\\begin\{([^}]+)\}'
        components["environments"] = re.findall(env_pattern, latex_code)
        
        return components