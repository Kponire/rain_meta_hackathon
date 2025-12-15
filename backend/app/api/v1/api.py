from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    courses,
    assignments,
    tests,
    video_processing,
    latex_processor,
    flashcard,
    analytics,
    profiles
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(tests.router, prefix="/tests", tags=["Tests"])
api_router.include_router(video_processing.router, prefix="/video", tags=["Video Processing"])
api_router.include_router(latex_processor.router, prefix="/latex", tags=["LaTeX Processing"])
api_router.include_router(flashcard.router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])