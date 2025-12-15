import PyPDF2
from pdf2image import convert_from_bytes
import io
from PIL import Image
from supabase import create_client, Client
from app.core.config import settings
import base64
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Utility for processing PDF files"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    async def extract_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n\n"
            
            return text
        except Exception as e:
            logger.error(f"PDF text extraction error: {e}")
            return ""
    
    async def extract_images(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract images from PDF and upload to Supabase"""
        images = []
        
        try:
            # Convert PDF pages to images
            pages = convert_from_bytes(pdf_bytes)
            
            for i, page in enumerate(pages):
                # Convert to bytes
                img_byte_arr = io.BytesIO()
                page.save(img_byte_arr, format='PNG')
                img_bytes = img_byte_arr.getvalue()
                
                # Upload to Supabase
                if self.supabase:
                    file_name = f"pdf_image_{i}_{hash(img_bytes)}.png"
                    file_path = f"pdf_images/{file_name}"
                    
                    self.supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                        file_path,
                        img_bytes,
                        {"content-type": "image/png"}
                    )
                    
                    # Get public URL
                    url = self.supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)
                    
                    images.append({
                        "page": i + 1,
                        "url": url,
                        "size": len(img_bytes),
                        "dimensions": page.size
                    })
        
        except Exception as e:
            logger.error(f"PDF image extraction error: {e}")
        
        return images
    
    async def process_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Process PDF comprehensively"""
        text = await self.extract_text(pdf_bytes)
        images = await self.extract_images(pdf_bytes)
        
        # Create PDF reader for metadata
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        metadata = {
            "num_pages": len(pdf_reader.pages),
            "extracted_text_length": len(text),
            "image_count": len(images),
            "has_images": len(images) > 0,
            "is_scanned": len(text.strip()) < 100 and len(images) > 0  # Heuristic for scanned PDFs
        }
        
        return {
            "text": text,
            "images": images,
            "metadata": metadata
        }
    
    async def replace_images_with_urls(self, pdf_text: str, images: List[Dict[str, Any]]) -> str:
        """Replace image references in text with Supabase URLs"""
        processed_text = pdf_text
        
        for i, image in enumerate(images):
            # Create image placeholder with URL
            image_placeholder = f"\n\n[Image {i+1}: {image['url']}]\n\n"
            
            # Simple heuristic: insert after every 1000 characters or at paragraph breaks
            # This can be enhanced based on PDF structure
            if i == 0:
                processed_text = image_placeholder + processed_text
            else:
                # Insert at reasonable intervals
                insert_pos = min(len(processed_text), (i + 1) * 1000)
                processed_text = processed_text[:insert_pos] + image_placeholder + processed_text[insert_pos:]
        
        return processed_text