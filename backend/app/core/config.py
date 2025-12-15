from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Agentic AI Education Platform"
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        if isinstance(v, list):
            return v
        return v
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    print(DATABASE_URL)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    SUPABASE_BUCKET: str = os.getenv("SUPABASE_BUCKET", "course-materials")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # LLM Configuration
    LLM_MODEL: str = "meta-llama/llama-4-maverick-17b-128e-instruct"
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv("HUGGINGFACE_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    LLM_PROVIDER: str = "groq"  # groq, huggingface, openai
    
    # External APIs
    PRESENTON_API_KEY: Optional[str] = os.getenv("PRESENTON_API_KEY")
    YOUTUBE_API_KEY: Optional[str] = os.getenv("YOUTUBE_API_KEY")
    WIKIPEDIA_API_USER_AGENT: str = "AI-Edu-Platform/1.0"
    
    # Video Processing
    VIDEO_PROCESSING_TIMEOUT: int = 300
    MAX_VIDEO_SIZE_MB: int = 500
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()