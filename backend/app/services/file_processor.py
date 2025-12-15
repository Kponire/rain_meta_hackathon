import mimetypes
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from supabase import create_client, Client
from app.core.config import settings
import tempfile
import os
from pathlib import Path
import magic
from app.utils.pdf_processor import PDFProcessor
import logging

logger = logging.getLogger(__name__)

class FileProcessor:
    """Service for handling file uploads and processing."""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.pdf_processor = PDFProcessor()
        self.mime = magic.Magic(mime=True)
    
    async def process_upload(self, file: UploadFile) -> bytes:
        """Process uploaded file and return bytes."""
        try:
            content = await file.read()
            
            # Validate file type
            mime_type = self.mime.from_buffer(content)
            if not self._is_allowed_mime_type(mime_type, file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"File type not allowed: {mime_type}"
                )
            
            return content
            
        except Exception as e:
            logger.error(f"File processing error: {e}")
            raise
    
    async def upload_to_supabase(self, content: bytes, file_path: str) -> str:
        if not self.supabase:
            raise Exception("Supabase client not configured")

        try:
            content_type = self._get_content_type(file_path)

            try:
                self.supabase.storage.from_(settings.SUPABASE_BUCKET).remove([file_path])
            except Exception:
                pass

            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(content)
                tmp.flush()

                res = self.supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                    file_path,
                    tmp.name,
                    {
                        "cache-control": "3600",
                        "content-type": content_type,
                    }
                )

            url = self.supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)

            return url

        except Exception as e:
            logger.error(f"Supabase upload error: {e}")
            raise
    
    async def delete_from_supabase(self, file_url: str) -> bool:
        """Delete file from Supabase storage."""
        if not self.supabase:
            raise Exception("Supabase client not configured")
        
        try:
            # Extract file path from URL
            file_path = file_url.split(f"{settings.SUPABASE_BUCKET}/")[-1]
            
            # Delete file
            self.supabase.storage.from_(settings.SUPABASE_BUCKET).remove([file_path])
            
            logger.info(f"File deleted from Supabase: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Supabase delete error: {e}")
            return False
    
    async def extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF."""
        return await self.pdf_processor.extract_text(pdf_bytes)
    
    async def process_pdf_comprehensive(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Process PDF comprehensively (text + images)."""
        return await self.pdf_processor.process_pdf(pdf_bytes)
    
    def _is_allowed_mime_type(self, mime_type: str, filename: str) -> bool:
        """Check if MIME type is allowed."""
        allowed_mime_types = {
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/x-msvideo',
            'video/quicktime',
            'video/x-ms-wmv',
        }
        
        # Check by extension for additional safety
        allowed_extensions = {
            '.pdf', '.ppt', '.pptx', '.txt', '.md',
            '.jpg', '.jpeg', '.png', '.gif',
            '.mp4', '.avi', '.mov', '.wmv'
        }
        
        file_ext = Path(filename).suffix.lower()
        
        return mime_type in allowed_mime_types and file_ext in allowed_extensions
    
    # def _get_content_type(self, content: bytes) -> str:
    #     """Get content type from bytes."""
    #     return self.mime.from_buffer(content)
    def _get_content_type(self, filename: str) -> str:
        return mimetypes.guess_type(filename)[0] or "application/octet-stream"
    
    async def save_temp_file(self, content: bytes, suffix: str = "") -> str:
        """Save content to temporary file and return path."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(content)
            return tmp_file.name
    
    async def cleanup_temp_file(self, file_path: str) -> None:
        """Clean up temporary file."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
    
    async def get_file_info(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Get file information."""
        return {
            "filename": filename,
            "size": len(content),
            "mime_type": self.mime.from_buffer(content),
            "extension": Path(filename).suffix.lower(),
            "has_content": len(content) > 0
        }