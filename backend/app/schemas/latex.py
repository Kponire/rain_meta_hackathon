from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class LaTeXRequestBase(BaseModel):
    latex_code: str = Field(..., min_length=10)

class LaTeXFormatRequest(LaTeXRequestBase):
    pass

class LaTeXSolveRequest(BaseModel):
    problem: str = Field(..., min_length=10)

class LaTeXExplainRequest(LaTeXRequestBase):
    depth: str = Field("detailed", pattern="^(basic|detailed|comprehensive)$")

class LaTeXGenerateRequest(BaseModel):
    text: str = Field(..., min_length=50)
    doc_type: str = Field("article", pattern="^(article|report|book|beamer)$")
    include_toc: bool = False
    include_bibliography: bool = False

class LaTeXResponse(BaseModel):
    id: UUID
    operation: str
    input_data: str
    output_data: str
    is_valid: bool
    metadata: Optional[Dict[str, Any]] = None
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class LaTeXFormatResponse(BaseModel):
    formatted_code: str
    is_valid: bool
    changes_made: List[str]
    validation_errors: Optional[List[str]] = None

class LaTeXSolveResponse(BaseModel):
    solution: str
    explanation: str
    alternative_approaches: Optional[List[str]] = None
    common_pitfalls: Optional[List[str]] = None

class LaTeXExplainResponse(BaseModel):
    explanation: str
    components: Dict[str, Any]
    related_concepts: List[str]
    best_practices: List[str]

class LaTeXGenerateResponse(BaseModel):
    latex_code: str
    is_valid: bool
    pdf_preview_url: Optional[str] = None
    compilation_log: Optional[str] = None