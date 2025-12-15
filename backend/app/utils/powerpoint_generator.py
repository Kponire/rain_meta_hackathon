from typing import Dict, Any, Optional
import requests
import json
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class PowerPointGenerator:
    """Utility for generating PowerPoint presentations."""
    
    def __init__(self):
        self.api_key = settings.PRESENTON_API_KEY
        self.base_url = "https://api.presenton.ai/api/v1"
    
    async def generate(
        self,
        content: str,
        title: str = "Presentation",
        num_slides: int = 1, # 10
        language: str = "English",
        template: str = "modern",
        export_as: str = "pptx"
    ) -> Dict[str, Any]:
        """Generate PowerPoint presentation from content."""
        if not self.api_key:
            logger.warning("Presenton API key not configured")
            return self._generate_fallback_presentation(content, title)
        
        try:
            url = f"{self.base_url}/ppt/presentation/generate"
            
            data = {
                "content": content[:50],  # Limit content size content[:5000]
                "n_slides": min(num_slides, 3),  # Limit slides (50 not 3)
                "language": language,
                "template": template,
                "export_as": export_as,
                "title": title
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract presentation URL or content
                presentation_data = self._extract_presentation_data(result)
                
                logger.info(f"Presentation generated: {title}")
                return presentation_data
            else:
                logger.error(f"Presenton API error: {response.status_code} - {response.text}")
                return self._generate_fallback_presentation(content, title)
                
        except Exception as e:
            logger.error(f"Presentation generation error: {e}")
            return self._generate_fallback_presentation(content, title)
    
    async def generate_from_outline(
        self,
        outline: list,
        title: str = "Presentation"
    ) -> Dict[str, Any]:
        """Generate presentation from outline."""
        # Convert outline to content
        content = self._outline_to_content(outline)
        
        return await self.generate(
            content=content,
            title=title,
            num_slides=len(outline)
        )
    
    async def customize_template(
        self,
        presentation_id: str,
        template: str,
        colors: Dict[str, str] = None,
        fonts: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Customize presentation template."""
        if not self.api_key:
            return {"error": "API key not configured"}
        
        try:
            url = f"{self.base_url}/ppt/presentation/customize"
            
            data = {
                "presentation_id": presentation_id,
                "template": template
            }
            
            if colors:
                data["colors"] = colors
            if fonts:
                data["fonts"] = fonts
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Template customization error: {response.status_code}")
                return {"error": "Customization failed"}
                
        except Exception as e:
            logger.error(f"Template customization error: {e}")
            return {"error": str(e)}
    
    def _extract_presentation_data(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Extract presentation data from API response."""
        if "presentation_url" in api_response:
            return {
                "presentation_url": api_response["presentation_url"],
                "presentation_id": api_response.get("presentation_id"),
                "slide_count": api_response.get("slide_count", 1), # 10
                "file_size": api_response.get("file_size"),
                "download_url": api_response.get("download_url")
            }
        elif "content" in api_response:
            # API returned presentation content directly
            return {
                "presentation_content": api_response["content"],
                "slide_count": api_response.get("slide_count", 1), #10
                "format": api_response.get("format", "pptx")
            }
        else:
            # Unknown response format
            return {
                "raw_response": api_response,
                "slide_count": 1, # 10
                "format": "pptx"
            }
    
    def _generate_fallback_presentation(self, content: str, title: str) -> Dict[str, Any]:
        """Generate fallback presentation when API fails."""
        # Create simple presentation structure
        slides = self._content_to_slides(content)
        
        return {
            "presentation_content": self._create_simple_pptx_structure(slides, title),
            "slide_count": len(slides),
            "format": "pptx",
            "is_fallback": True,
            "title": title
        }
    
    def _content_to_slides(self, content: str, max_slides: int = 3) -> list:
        """Convert content to slide structure."""
        # Simple content splitting
        paragraphs = content.split('\n\n')
        slides = []
        
        for i, para in enumerate(paragraphs[:max_slides]):
            if para.strip():
                slides.append({
                    "title": f"Slide {i+1}",
                    "content": para[:50], #500  # Limit content per slide
                    "bullet_points": self._extract_bullet_points(para)
                })
        
        return slides
    
    def _extract_bullet_points(self, text: str) -> list:
        """Extract bullet points from text."""
        bullet_points = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith(('•', '-', '*', '·')):
                bullet_points.append(line[1:].strip())
            elif line and len(line) < 100:  # Short lines as bullet points
                bullet_points.append(line)
        
        return bullet_points[:10]  # Limit bullet points
    
    def _create_simple_pptx_structure(self, slides: list, title: str) -> str:
        """Create simple PowerPoint structure in JSON format."""
        presentation = {
            "title": title,
            "slides": slides,
            "metadata": {
                "generator": "AI Education Platform",
                "version": "1.0",
                "template": "simple"
            }
        }
        
        return json.dumps(presentation, indent=2)
    
    def _outline_to_content(self, outline: list) -> str:
        """Convert outline to content string."""
        content = []
        
        for i, item in enumerate(outline):
            if isinstance(item, dict):
                title = item.get("title", f"Section {i+1}")
                points = item.get("points", [])
                content.append(f"{title}:")
                for point in points:
                    content.append(f"  • {point}")
            elif isinstance(item, str):
                content.append(item)
            content.append("")  # Empty line between sections
        
        return '\n'.join(content)