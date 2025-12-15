from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
#from app.models.content import LatexProcessing  # You'll need to create this model
from app.schemas.latex import (
    LaTeXFormatRequest,
    LaTeXFormatResponse,
    LaTeXResponse,
    LaTeXSolveRequest,
    LaTeXSolveResponse,
    LaTeXExplainRequest,
    LaTeXExplainResponse,
    LaTeXGenerateRequest,
    LaTeXGenerateResponse
)
from app.services.latex_service import LaTeXService
import json

router = APIRouter()
latex_service = LaTeXService()

# Create model for LaTeXProcessing if not exists
from sqlalchemy import Boolean, Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
from sqlalchemy.sql import func

class LatexProcessing:
    __tablename__ = "latex_processings"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    operation = Column(String, nullable=False)  # format, solve, explain, generate
    input_data = Column(Text, nullable=False)
    output_data = Column(Text)
    is_valid = Column(Boolean, default=True)
    metadata = Column(JSON)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

@router.post("/format", response_model=LaTeXFormatResponse)
async def format_latex(
    request: LaTeXFormatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Format and clean LaTeX code."""
    try:
        result = await latex_service.format_latex(request.latex_code)
        
        processing = LatexProcessing(
            operation="format",
            input_data=request.latex_code,
            output_data=result["formatted_code"],
            is_valid=result["is_valid"],
            metadata={
                "original_length": result["original_length"],
                "formatted_length": result["formatted_length"]
            },
            user_id=current_user.id
        )
        
        db.add(processing)
        db.commit()
        
        return LaTeXFormatResponse(
            formatted_code=result["formatted_code"],
            is_valid=result["is_valid"],
            changes_made=["Formatted indentation", "Organized packages"],
            validation_errors=None if result["is_valid"] else ["Compilation failed"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to format LaTeX: {str(e)}"
        )

@router.post("/solve", response_model=LaTeXSolveResponse)
async def solve_latex_problem(
    request: LaTeXSolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Solve LaTeX problem or equation."""
    try:
        result = await latex_service.solve_latex_problem(request.problem)
        
        processing = LatexProcessing(
            operation="solve",
            input_data=request.problem,
            output_data=result["solution"],
            metadata={
                "problem_type": "equation",
                "explanation_length": len(result["explanation"])
            },
            user_id=current_user.id
        )
        
        db.add(processing)
        db.commit()
        
        return LaTeXSolveResponse(
            solution=result["solution"],
            explanation=result["explanation"],
            alternative_approaches=result.get("alternative_approaches", []),
            common_pitfalls=result.get("common_pitfalls", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to solve LaTeX problem: {str(e)}"
        )

@router.post("/explain", response_model=LaTeXExplainResponse)
async def explain_latex(
    request: LaTeXExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explain LaTeX code."""
    try:
        result = await latex_service.explain_latex(request.latex_code)
        
        processing = LatexProcessing(
            operation="explain",
            input_data=request.latex_code,
            output_data=result["explanation"],
            metadata={
                "depth": request.depth,
                "components_count": len(result["components"]) if result.get("components") else 0
            },
            user_id=current_user.id
        )
        
        db.add(processing)
        db.commit()
        
        return LaTeXExplainResponse(
            explanation=result["explanation"],
            components=result.get("components", {}),
            related_concepts=["LaTeX commands", "Document structure", "Mathematical typesetting"],
            best_practices=["Use consistent indentation", "Comment complex sections", "Use packages wisely"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to explain LaTeX: {str(e)}"
        )

@router.post("/generate", response_model=LaTeXGenerateResponse)
async def generate_latex_document(
    request: LaTeXGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate LaTeX document from text."""
    try:
        result = await latex_service.generate_latex_from_text(
            request.text,
            request.doc_type
        )
        
        processing = LatexProcessing(
            operation="generate",
            input_data=request.text,
            output_data=result["latex_code"],
            is_valid=result["is_valid"],
            metadata={
                "doc_type": request.doc_type,
                "include_toc": request.include_toc,
                "include_bibliography": request.include_bibliography
            },
            user_id=current_user.id
        )
        
        db.add(processing)
        db.commit()
        
        return LaTeXGenerateResponse(
            latex_code=result["latex_code"],
            is_valid=result["is_valid"],
            pdf_preview_url=result.get("pdf_preview_url"),
            compilation_log="Compilation successful" if result["is_valid"] else "Compilation failed"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate LaTeX document: {str(e)}"
        )

@router.get("/history", response_model=List[LaTeXResponse])
async def get_latex_history(
    operation: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's LaTeX processing history."""
    query = db.query(LatexProcessing).filter(
        LatexProcessing.user_id == current_user.id
    )
    
    if operation:
        query = query.filter(LatexProcessing.operation == operation)
    
    history = query.order_by(LatexProcessing.created_at.desc()).limit(50).all()
    
    return history

@router.get("/preview/{processing_id}")
async def get_latex_preview(
    processing_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get LaTeX preview (PDF or image)."""
    processing = db.query(LatexProcessing).filter(
        LatexProcessing.id == processing_id,
        LatexProcessing.user_id == current_user.id
    ).first()
    
    if not processing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processing record not found or unauthorized"
        )
    
    if processing.operation == "generate" and processing.is_valid:
        try:
            pdf_path = await latex_service._compile_latex_to_pdf(processing.output_data)
            if pdf_path:
                return {"preview_url": pdf_path}
        except:
            pass
    
    return {"message": "Preview not available"}