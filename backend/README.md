# Agentic AI Education Platform - Backend

## Overview

A sophisticated, production-ready backend for an AI-powered educational platform that transforms how educators teach and students learn. Built with FastAPI, PostgreSQL, and cutting-edge AI technologies, this platform provides intelligent automation for course management, content generation, grading, and personalized learning assistance.

## Key Features

### **AI-Powered Automation**
- **Course Generation**: AI creates comprehensive course materials, assignments, and tests
- **Smart Grading**: Automated assignment grading with detailed, personalized feedback
- **Video Analysis**: Automatic transcription, summarization, and key point extraction from educational videos
- **LaTeX Processing**: Format, solve, explain, and generate technical documents
- **Flashcard Generation**: AI creates personalized study materials for students

### **For Educators**
- One-click course material generation using AI
- Automated test and assignment creation
- Real-time student performance analytics
- Bulk student management tools
- AI-assisted grading with detailed feedback

### **For Students**
- 24/7 AI study assistant
- Personalized learning paths and flashcards
- Video content summarization and analysis
- Assignment submission with auto-grading
- Performance tracking and improvement suggestions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Agentic AI Platform                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   AI     │  │  Course  │  │  Video   │  │  LaTeX   │    │
│  │  Agents  │  │  Agent   │  │  Agent   │  │  Agent   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│               FastAPI Backend (Python)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │ Courses  │  │Assignments│  │  Tests   │    │
│  │ Service  │  │ Service  │  │  Service  │  │ Service  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│               PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Users │ Courses │ Assignments │ Tests │ Analytics  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### **Backend Framework**
- **FastAPI** - Modern, fast web framework for building APIs with Python 3.7+
- **SQLAlchemy 2.0** - Python SQL toolkit and ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation and settings management

### **Database**
- **PostgreSQL 15** - Primary relational database
- **Supabase** - PostgreSQL hosting + file storage
- **UUID v4** - All primary and foreign keys use UUID for security

### **AI/ML Stack**
- **Meta Llama 4 Maverick 17B 128E** - Primary LLM for content generation
- **LangChain** - Framework for developing applications powered by language models
- **Groq API** - High-performance LLM inference
- **HuggingFace Transformers** - NLP models for specialized tasks
- **YouTube API** - Video content analysis
- **SpeechRecognition** - Audio transcription

### **Security & Authentication**
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **Role-based access control** (Student, Lecturer, Admin)

### **File Processing**
- **PyPDF2** - PDF text extraction
- **PDF2Image** - PDF to image conversion
- **MoviePy** - Video processing
- **LaTeX Compilation** - Document processing

### **Infrastructure**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** (Optional) - Reverse proxy
- **Redis** (Planned) - Caching layer

## Project Structure

```
ai-edu-platform/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── core/                      # Core configuration and utilities
│   │   ├── config.py              # Application configuration
│   │   ├── security.py            # Authentication and security
│   │   └── database.py            # Database configuration
│   ├── models/                    # SQLAlchemy models
│   │   ├── user.py               # User models (Student/Lecturer)
│   │   ├── course.py             # Course and enrollment models
│   │   ├── content.py            # Course materials and video analysis
│   │   └── assessment.py         # Assignments, tests, submissions
│   ├── schemas/                   # Pydantic schemas (request/response)
│   │   ├── user.py               # User-related schemas
│   │   ├── course.py             # Course schemas
│   │   ├── assignment.py         # Assignment schemas
│   │   ├── test.py               # Test schemas
│   │   ├── video.py              # Video processing schemas
│   │   └── latex.py              # LaTeX processing schemas
│   ├── api/                       # API endpoints
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py       # Authentication endpoints
│   │   │   │   ├── courses.py    # Course management
│   │   │   │   ├── assignments.py # Assignment endpoints
│   │   │   │   ├── tests.py      # Test endpoints
│   │   │   │   ├── video_processing.py # Video processing
│   │   │   │   └── latex_processor.py # LaTeX processing
│   │   │   └── api.py            # API router configuration
│   │   └── dependencies.py       # FastAPI dependencies
│   ├── services/                  # Business logic services
│   │   ├── llm_service.py        # LLM integration service
│   │   ├── grading_service.py    # Automated grading
│   │   ├── video_service.py      # Video processing service
│   │   ├── latex_service.py      # LaTeX processing service
│   │   └── file_processor.py     # File upload and processing
│   ├── ai/                       # AI agents and chains
│   │   ├── agents/
│   │   │   ├── course_agent.py   # Course generation agent
│   │   │   ├── assignment_agent.py # Assignment generation agent
│   │   │   └── grading_agent.py  # Intelligent grading agent
│   │   └── chains/               # LangChain chains
│   │       ├── course_chain.py   # Course generation chains
│   │       ├── assignment_chain.py # Assignment chains
│   │       └── flashcard_chain.py # Flashcard generation chains
│   └── utils/                    # Utility functions
│       ├── pdf_processor.py      # PDF processing utilities
│       └── powerpoint_generator.py # PowerPoint generation
├── alembic/                      # Database migrations
│   ├── versions/                 # Migration files
│   ├── env.py                    # Migration environment
│   └── alembic.ini              # Alembic configuration
├── tests/                        # Test suite
├── .env.example                  # Environment variables template
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
└── README.md                    # This file
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Redis (optional, for caching)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-edu-platform.git
cd ai-edu-platform
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up Database
```bash
# Create PostgreSQL database
createdb ai_edu_db

# Run migrations
alembic upgrade head
```

### 5. Run the Application
```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Docker
docker-compose up -d
```

### 6. Access the Application
- API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/health

## API Documentation

The API is fully documented using OpenAPI/Swagger. Once running, access:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/register/student` - Register as student
- `POST /api/v1/auth/register/lecturer` - Register as lecturer
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info

#### Courses
- `POST /api/v1/courses/` - Create new course
- `POST /api/v1/courses/{course_id}/materials/generate` - AI generate course materials
- `POST /api/v1/courses/{course_id}/enroll` - Enroll in course
- `GET /api/v1/courses/{course_id}/materials` - Get course materials

#### Assignments
- `POST /api/v1/courses/{course_id}/assignments/generate` - AI generate assignment
- `POST /api/v1/assignments/{assignment_id}/submit` - Submit assignment
- `POST /api/v1/submissions/{submission_id}/grade` - Grade submission

#### Tests
- `POST /api/v1/courses/{course_id}/tests/generate` - AI generate test
- `POST /api/v1/tests/{test_id}/start` - Start test attempt
- `POST /api/v1/attempts/{attempt_id}/submit` - Submit test answers

#### Video Processing
- `POST /api/v1/video/youtube/process` - Process YouTube video
- `POST /api/v1/video/upload/process` - Process uploaded video
- `POST /api/v1/video/explain` - Explain video content

#### LaTeX Processing
- `POST /api/v1/latex/format` - Format LaTeX code
- `POST /api/v1/latex/solve` - Solve LaTeX problems
- `POST /api/v1/latex/generate` - Generate LaTeX documents

## Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Services
- **backend**: FastAPI application (port 8000)
- **db**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379, optional)

## 🧪 Testing

```bash
# Run all tests
pytest

# Run specific test module
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app tests/

# Run with verbose output
pytest -v
```

## Security Features

- **JWT Authentication** with refresh token support
- **Password hashing** using bcrypt
- **CORS** properly configured
- **SQL Injection protection** through SQLAlchemy
- **Rate limiting** (implemented via middleware)
- **Input validation** using Pydantic schemas
- **Environment-based configuration**
- **UUID-based identifiers** for all resources
- **Role-based access control** (RBAC)

## Database Schema

### Core Tables
- **users** - User accounts (students, lecturers, admins)
- **student_profiles** - Student-specific information
- **lecturer_profiles** - Lecturer-specific information
- **courses** - Course information
- **enrollments** - Student course enrollments
- **course_materials** - Course content and materials
- **assignments** - Course assignments
- **assignment_submissions** - Student submissions
- **tests** - Course tests
- **test_attempts** - Student test attempts
- **video_analyses** - Video analysis results
- **notifications** - User notifications

## AI Integration

### Available AI Agents
1. **Course Agent** - Generates complete course structures with materials
2. **Assignment Agent** - Creates assignments with questions and grading rubrics
3. **Grading Agent** - Automatically grades submissions with detailed feedback
4. **Video Agent** - Analyzes and summarizes video content
5. **Study Agent** - Creates personalized study materials and flashcards

### AI Models Used
- **Meta Llama 4 Maverick 17B** - Primary content generation
- **Groq Inference** - High-speed model serving
- **HuggingFace Models** - Specialized NLP tasks
- **Custom Fine-tuned Models** - Educational content optimization

## Deployment

### Production Deployment Steps

1. **Set up PostgreSQL database**
```bash
# Production PostgreSQL with replication
docker run --name postgres-prod \
  -e POSTGRES_PASSWORD=strongpassword \
  -e POSTGRES_DB=ai_edu_db \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15
```

2. **Configure environment variables**
```bash
# Production .env.production
DATABASE_URL=postgresql://user:password@host:5432/ai_edu_db
SECRET_KEY=your-production-secret-key
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

3. **Run database migrations**
```bash
alembic upgrade head
```

4. **Start the application**
```bash
# Using uvicorn with production settings
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

5. **Set up Nginx reverse proxy** (recommended)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring & Logging

```bash
# Enable structured logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Health check endpoint
GET /health

# Metrics endpoint (Prometheus compatible)
GET /metrics
```

## API Versioning

The API uses URL-based versioning:
- Current version: `v1`
- API prefix: `/api/v1`
- Backward compatibility maintained for at least 6 months

## Performance

- **Response Time**: < 100ms for most endpoints
- **Concurrent Users**: Supports 1000+ concurrent users
- **Database Queries**: Optimized with indexes and query caching
- **File Uploads**: Supports up to 500MB files with chunked uploads
- **AI Processing**: Async processing for long-running AI tasks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide
- Write unit tests for new features
- Update API documentation
- Add migration files for database changes
- Update requirements.txt for new dependencies

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email: support@campusedu.ai or open an issue in the GitHub repository.

## Acknowledgments

- **Meta AI** for the Llama models
- **FastAPI** team for the excellent web framework
- **SQLAlchemy** team for the ORM
- **LangChain** team for the AI framework
- All contributors and testers

---

**Built with ❤️ for the future of education**