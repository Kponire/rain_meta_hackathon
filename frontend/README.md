# Agentic AI Education Platform - Frontend

A modern, AI-powered educational platform built with Next.js 15, TypeScript, and Mantine UI v7. This platform enables lecturers to create and manage courses with AI assistance while providing students with intelligent learning tools.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Mantine UI](https://img.shields.io/badge/Mantine-7.0-339af0)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### For Lecturers
- **AI Course Material Generation**: Create comprehensive course content with AI assistance
- **Smart Assignment Creation**: Generate assignments with customizable difficulty and question types
- **Automated Grading**: AI-powered grading with detailed feedback
- **Student Progress Tracking**: Monitor performance with analytics dashboards
- **Course Management**: Full CRUD operations for courses, materials, and assessments

### For Students
- **Interactive Learning**: Access course materials, assignments, and tests
- **AI Study Assistant**: Get instant help with concepts and questions
- **Flashcard Generator**: Create personalized study materials
- **Video Understanding**: Process YouTube videos and local files for summaries
- **LaTeX Support**: Format, solve, and explain mathematical expressions
- **Progress Analytics**: Track your learning journey with detailed insights

### Core Features
- **Dark/Light Mode**: Seamless theme switching with persisted preferences
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Real-time Updates**: Live notifications and progress tracking
- **Secure Authentication**: JWT-based auth with role-based access control
- **File Management**: Support for PDFs, PowerPoints, videos, and images

## 🚀 Tech Stack

### Core
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **Mantine UI v7** - Component library
- **Framer Motion** - Animations

### State Management & Data
- **React Context API** - Authentication state
- **Axios** - API client
- **React Hooks** - Component state management

### Styling & UI
- **Mantine Charts** - Data visualization
- **React Icons** - Icon library
- **CSS Variables** - Theme customization
- **Glassmorphism** - Modern UI effects

### Tools & Utilities
- **TipTap** - Rich text editor
- **React Katex** - LaTeX rendering
- **Day.js** - Date handling
- **Mantine Dropzone** - File uploads

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend API running (see backend README)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/                # Login page
│   │   └── register/             # Registration pages
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── student/              # Student dashboard
│   │   └── lecturer/             # Lecturer dashboard
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── AnimatedButton.tsx
│   │   ├── GlassCard.tsx
│   │   └── LoadingSkeleton.tsx
│   ├── navigation/               # Navigation components
│   │   ├── DashboardSidebar.tsx
│   │   └── DashboardTopBar.tsx
│   ├── lecturer/                 # Lecturer-specific components
│   │   ├── AIGenerateAssignment.tsx
│   │   ├── AIGenerateMaterials.tsx
│   │   ├── CreateCourseModal.tsx
│   │   └── ...
│   └── features/                 # Feature components
│       ├── FlashcardGenerator.tsx
│       ├── VideoUnderstanding.tsx
│       ├── LatexGenerator.tsx
│       └── AnalyticsDashboard.tsx
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Authentication context
├── lib/                          # Utilities and libraries
│   ├── api/                      # API client
│   │   └── client.ts             # Axios configuration
│   └── utils/                    # Helper functions
├── types/                        # TypeScript types
│   └── index.ts                  # Global type definitions
├── theme/                        # Mantine theme
│   └── index.ts                  # Theme configuration
└── styles/                       # Global styles
    └── globals.css               # CSS variables and utilities
```

## 🎨 Key Components

### Authentication
- **Login Page**: Split layout with brand showcase
- **Registration**: Multi-step forms for students and lecturers
- **Role-based Access**: Automatic routing based on user role

### Lecturer Dashboard
- **Course Materials**: AI generation and manual uploads
- **Assignment Management**: Create, publish, and grade assignments
- **Student Tracking**: View submissions and provide feedback
- **Analytics**: Course performance and student insights

### Student Dashboard
- **Course Access**: View materials and enrolled courses
- **Self Study**: Generate flashcards and study plans
- **Assignments**: Submit work and view grades
- **AI Assistant**: Interactive chat for learning support

### Shared Components
- **Video Understanding**: Process and analyze video content
- **LaTeX Generator**: Mathematical expression handling
- **Analytics Dashboard**: Performance visualization
- **Notifications**: Real-time updates and alerts

## 🚦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing (if configured)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 📊 Performance Optimization

- **Code Splitting**: Route-based automatic splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Component-level lazy loading
- **Caching**: API response caching
- **Skeleton Screens**: Loading placeholders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new files
- Follow ESLint rules
- Use functional components with hooks
- Write descriptive commit messages

## 🔒 Security

- JWT token-based authentication
- HTTP-only cookies for session management
- XSS protection through React
- CSRF token validation
- Role-based access control

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

**Built with ❤️ for modern education**