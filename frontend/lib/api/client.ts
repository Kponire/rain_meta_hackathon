import axios, { AxiosInstance, AxiosError } from "axios";
import { notifications } from "@mantine/notifications";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    const message =
      (error.response?.data as any)?.detail || "An error occurred";
    notifications.show({
      title: "Error",
      message,
      color: "red",
    });
  }

  // Auth endpoints
  auth = {
    registerStudent: (data: RegisterStudentData) =>
      this.client.post("/api/v1/auth/register/student", data),

    registerLecturer: (data: RegisterLecturerData) =>
      this.client.post("/api/v1/auth/register/lecturer", data),

    login: (credentials: LoginCredentials) =>
      this.client.post("/api/v1/auth/login", credentials),

    getMe: () => this.client.get("/api/v1/auth/me"),

    updateProfile: (data: Partial<UserProfile>) =>
      this.client.put("/api/v1/auth/me", data),

    changePassword: (data: PasswordChangeData) =>
      this.client.put("/api/v1/auth/me/password", data),

    logout: () => this.client.post("/api/v1/auth/logout"),
  };

  // Courses endpoints
  courses = {
    create: (data: CreateCourseData | FormData) => {
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        return this.client.post("/api/v1/courses/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return this.client.post("/api/v1/courses/", data);
    },

    generateMaterials: (
      courseId: string,
      data: GenerateMaterialsData | FormData
    ) => {
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        return this.client.post(
          `/api/v1/courses/${courseId}/materials/generate`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }
      return this.client.post(
        `/api/v1/courses/${courseId}/materials/generate`,
        data
      );
    },

    uploadMaterials: (courseId: string, formData: FormData) =>
      this.client.post(
        `/api/v1/courses/${courseId}/materials/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      ),

    getMaterials: (courseId: string) =>
      this.client.get(`/api/v1/courses/${courseId}/materials`),

    enroll: (courseId: string) =>
      this.client.post(`/api/v1/courses/${courseId}/enroll`),

    getStudentCourses: () =>
      this.client.get("/api/v1/courses/students/courses"),

    // Get all published courses. Optionally include unpublished (admin only)
    getAll: (include_unpublished: boolean = false) =>
      this.client.get(`/api/v1/courses`, { params: { include_unpublished } }),

    getLecturerCourses: (lecturer_id: string, include_unpublished: boolean) =>
      this.client.get(`/api/v1/courses/lecturers/${lecturer_id}/courses`),

    update: (courseId: string, data: Partial<CreateCourseData>) =>
      this.client.put(`/api/v1/courses/${courseId}`, data),

    delete: (courseId: string) =>
      this.client.delete(`/api/v1/courses/${courseId}`),

    //getEnrollments: (courseId: string) =>
    //  this.client.get(`/api/v1/courses/${courseId}/enrollments`),
    getEnrollments: (courseId: string) =>
      this.client.get(`/api/v1/courses/students/courses`),

    updateEnrollmentStatus: (enrollmentId: string, status: string) =>
      this.client.put(`/api/v1/courses/enrollments/${enrollmentId}/status`, {
        status,
      }),
  };

  // Assignments endpoints
  assignments = {
    generate: (courseId: string, data: GenerateAssignmentData | FormData) => {
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        return this.client.post(
          `/api/v1/assignments/courses/${courseId}/assignments/generate`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      return this.client.post(
        `/api/v1/assignments/courses/${courseId}/assignments/generate`,
        data
      );
    },

    create: (courseId: string, data: CreateAssignmentData) =>
      this.client.post(
        `/api/v1/assignments/courses/${courseId}/assignments`,
        data
      ),

    publish: (assignmentId: string, data?: any | FormData) => {
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        return this.client.put(
          `/api/v1/assignments/assignments/${assignmentId}/publish`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      return this.client.put(
        `/api/v1/assignments/${assignmentId}/publish`,
        data || {}
      );
    },

    getAll: (courseId: string) =>
      this.client.get(`/api/v1/assignments/courses/${courseId}/assignments`),

    submit: (assignmentId: string, formData: FormData) =>
      this.client.post(`/api/v1/assignments/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    grade: (submissionId: string, data: GradeSubmissionData) =>
      this.client.post(`/api/v1/submissions/${submissionId}/grade`, data),

    getSubmissions: (assignmentId: string) =>
      this.client.get(`/api/v1/assignments/${assignmentId}/submissions`),

    getStudentAssignments: () =>
      this.client.get("/api/v1/assignments/students/assignments"),

    getById: (assignmentId: string) =>
      this.client.get(`/api/v1/assignments/${assignmentId}`),

    update: (assignmentId: string, data: Partial<CreateAssignmentData>) =>
      this.client.put(`/api/v1/assignments/${assignmentId}`, data),

    delete: (assignmentId: string) =>
      this.client.delete(`/api/v1/assignments/${assignmentId}`),

    autoGradeAll: (assignmentId: string) =>
      this.client.post(`/api/v1/assignments/${assignmentId}/auto-grade-all`),
  };

  // Tests endpoints
  tests = {
    generate: (courseId: string, data: GenerateTestData) =>
      this.client.post(
        `/api/v1/tests/courses/${courseId}/tests/generate`,
        data
      ),

    create: (courseId: string, data: CreateTestData) =>
      this.client.post(`/api/v1/tests/courses/${courseId}/tests`, data),

    publish: (testId: string) =>
      this.client.put(`/api/v1/tests/tests/${testId}/publish`),

    getAll: (courseId: string) =>
      this.client.get(`/api/v1/tests/courses/${courseId}/tests`),

    start: (testId: string) =>
      this.client.post(`/api/v1/tests/tests/${testId}/start`),

    submit: (attemptId: string, data: SubmitTestData) =>
      this.client.post(`/api/v1/tests/attempts/${attemptId}/submit`, data),

    getAttempts: (testId: string) =>
      this.client.get(`/api/v1/tests/tests/${testId}/attempts`),

    getById: (testId: string) =>
      this.client.get(`/api/v1/tests/tests/${testId}`),

    getStudentTests: () => this.client.get("/api/v1/tests/students/tests"),

    update: (testId: string, data: Partial<CreateTestData>) =>
      this.client.put(`/api/v1/tests/tests/${testId}`, data),

    delete: (testId: string) =>
      this.client.delete(`/api/v1/tests/tests/${testId}`),
  };

  // Video Processing endpoints
  video = {
    processYoutube: (data: ProcessYoutubeData) =>
      this.client.post("/api/v1/video/youtube/process", data),

    uploadAndProcess: (formData: FormData) =>
      this.client.post("/api/v1/video/upload/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    explain: (data: ExplainVideoData) =>
      this.client.post("/api/v1/video/explain", data),

    getAnalyses: () => this.client.get("/api/v1/video/analyses"),

    getAnalysis: (analysisId: string) =>
      this.client.get(`/api/v1/video/analyses/${analysisId}`),

    deleteAnalysis: (analysisId: string) =>
      this.client.delete(`/api/v1/video/analyses/${analysisId}`),

    extractKeyPoints: (analysisId: string) =>
      this.client.post(
        `/api/v1/video/analyses/${analysisId}/extract-key-points`
      ),

    generateSummary: (analysisId: string) =>
      this.client.post(`/api/v1/video/analyses/${analysisId}/generate-summary`),
  };

  // LaTeX Processing endpoints
  latex = {
    format: (data: LatexProcessData) =>
      this.client.post("/api/v1/latex/format", data),

    solve: (data: LatexProcessData) =>
      this.client.post("/api/v1/latex/solve", data),

    explain: (data: LatexProcessData) =>
      this.client.post("/api/v1/latex/explain", data),

    generate: (data: GenerateLatexData) =>
      this.client.post("/api/v1/latex/generate", data),

    getHistory: () => this.client.get("/api/v1/latex/history"),

    getPreview: (processingId: string) =>
      this.client.get(`/api/v1/latex/preview/${processingId}`),

    compile: (data: CompileLatexData) =>
      this.client.post("/api/v1/latex/compile", data),
  };

  // Flashcards endpoints
  flashcards = {
    generate: (data: GenerateFlashcardsData) =>
      this.client.post("/api/v1/flashcards/generate", data),

    createStudyPlan: (data: StudyPlanData) =>
      this.client.post("/api/v1/flashcards/study-plan", data),

    getHistory: () => this.client.get("/api/v1/flashcards/history"),

    review: (flashcardSetId: string, data: ReviewData) =>
      this.client.post(`/api/v1/flashcards/${flashcardSetId}/review`, data),

    getProgress: (flashcardSetId: string) =>
      this.client.get(`/api/v1/flashcards/${flashcardSetId}/progress`),

    fromMaterial: (data: FlashcardsFromMaterialData) =>
      this.client.post("/api/v1/flashcards/from-material", data),

    fromVideo: (data: FlashcardsFromVideoData) =>
      this.client.post("/api/v1/flashcards/from-video", data),
  };

  // Analytics endpoints
  analytics = {
    getCoursePerformance: (courseId: string) =>
      this.client.get(`/api/v1/analytics/courses/${courseId}/performance`),

    getStudentProgress: (studentId: string) =>
      this.client.get(`/api/v1/analytics/students/${studentId}/progress`),

    getPlatformOverview: () =>
      this.client.get("/api/v1/analytics/platform/overview"),

    getCourseEngagement: (courseId: string) =>
      this.client.get(`/api/v1/analytics/courses/${courseId}/engagement`),

    getStudentActivity: (studentId: string) =>
      this.client.get(`/api/v1/analytics/students/${studentId}/activity`),

    getAssignmentInsights: (assignmentId: string) =>
      this.client.get(`/api/v1/analytics/assignments/${assignmentId}/insights`),

    exportCourseData: (courseId: string, format: string) =>
      this.client.post(`/api/v1/analytics/courses/${courseId}/export`, {
        format,
      }),

    getAIUsage: () => this.client.get("/api/v1/analytics/ai-usage"),
  };

  // AI Agents endpoints
  ai = {
    generateCompleteCourse: (data: GenerateCompleteCourseData) =>
      this.client.post("/api/v1/ai/courses/generate-complete", data),

    generateAssignmentWithRubric: (data: GenerateAssignmentRubricData) =>
      this.client.post("/api/v1/ai/assignments/generate-with-rubric", data),

    intelligentGrade: (data: IntelligentGradeData) =>
      this.client.post("/api/v1/ai/grading/intelligent-grade", data),

    enhanceContent: (data: EnhanceContentData) =>
      this.client.post("/api/v1/ai/content/enhance", data),

    createStudyPlan: (data: AIStudyPlanData) =>
      this.client.post("/api/v1/ai/study/plan", data),

    chatAssist: (data: ChatAssistData) =>
      this.client.post("/api/v1/ai/chat/assist", data),

    getAnalyticsInsights: (data: AnalyticsInsightsData) =>
      this.client.post("/api/v1/ai/analytics/insights", data),
  };

  // Notifications endpoints
  notifications = {
    getAll: () => this.client.get("/api/v1/notifications"),

    markAsRead: (notificationId: string) =>
      this.client.put(`/api/v1/notifications/${notificationId}/read`),

    markAllAsRead: () => this.client.put("/api/v1/notifications/read-all"),

    getSettings: () => this.client.get("/api/v1/notifications/settings"),

    updateSettings: (data: NotificationSettingsData) =>
      this.client.put("/api/v1/notifications/settings", data),
  };

  // Export/Import endpoints
  export = {
    backupCourse: (courseId: string) =>
      this.client.post(`/api/v1/export/courses/${courseId}/backup`),

    importCourse: (formData: FormData) =>
      this.client.post("/api/v1/import/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    exportStudentProgress: (studentId: string) =>
      this.client.post(`/api/v1/export/student/${studentId}/progress-report`),

    exportGradebook: (courseId: string) =>
      this.client.post(`/api/v1/export/courses/${courseId}/gradebook`),
  };

  // Utilities
  utils = {
    upload: (formData: FormData) =>
      this.client.post("/api/v1/utils/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    convert: (data: ConvertData) =>
      this.client.post("/api/v1/utils/convert", data),

    search: (query: string) =>
      this.client.get("/api/v1/utils/search", { params: { q: query } }),
  };
}

export const apiClient = new APIClient();

// Type definitions
export interface RegisterStudentData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  student_id?: string;
  major?: string;
  year?: number;
  institution?: string;
}

export interface RegisterLecturerData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  institution: string;
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "lecturer" | "admin";
  created_at: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  code: string;
  credits?: number;
  department?: string;
  semester?: string;
  year?: number;
}

export interface GenerateMaterialsData {
  topic: string;
  n_slides?: number;
  language?: string;
  include_images?: boolean;
  difficulty_level?: string;
}

export interface GenerateAssignmentData {
  topic: string;
  difficulty?: string;
  question_count?: number;
  instructions?: string;
  limit_to_materials?: boolean;
  material_ids?: string[];
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  rubric?: any;
}

export interface GradeSubmissionData {
  score: number;
  feedback: string;
  rubric_scores?: any;
}

export interface GenerateTestData {
  topic: string;
  test_type: "multiple_choice" | "text_based" | "mixed";
  num_questions: number;
  difficulty?: string;
  course_context?: string;
}

export interface CreateTestData {
  title: string;
  description: string;
  test_type: "multiple_choice" | "text_based" | "mixed";
  start_time: string;
  end_time: string;
  duration: number;
  questions?: any[];
  answers?: any;
}

export interface SubmitTestData {
  answers: any[];
}

export interface ProcessYoutubeData {
  url: string;
  analysis_type: "summarize" | "transcribe" | "explain";
}

export interface ExplainVideoData {
  analysis_id: string;
  question: string;
}

export interface LatexProcessData {
  content: string;
  action: "format" | "solve" | "explain";
}

export interface GenerateLatexData {
  description: string;
  type?: string;
}

export interface CompileLatexData {
  latex_code: string;
}

export interface GenerateFlashcardsData {
  topic: string;
  count?: number;
  difficulty?: string;
  course_id?: string;
}

export interface StudyPlanData {
  topics: string[];
  duration_days: number;
  daily_time_minutes: number;
}

export interface ReviewData {
  card_id: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface FlashcardsFromMaterialData {
  material_id: string;
  count?: number;
}

export interface FlashcardsFromVideoData {
  analysis_id: string;
  count?: number;
}

export interface GenerateCompleteCourseData {
  title: string;
  description: string;
  topics: string[];
  duration_weeks: number;
}

export interface GenerateAssignmentRubricData {
  assignment_id: string;
  criteria: string[];
}

export interface IntelligentGradeData {
  submission_id: string;
  use_rubric: boolean;
}

export interface EnhanceContentData {
  content: string;
  enhancement_type: string;
}

export interface AIStudyPlanData {
  student_id: string;
  goals: string[];
  timeline: string;
}

export interface ChatAssistData {
  message: string;
  context?: any;
}

export interface AnalyticsInsightsData {
  data_type: string;
  data_id: string;
}

export interface NotificationSettingsData {
  email_notifications: boolean;
  push_notifications: boolean;
  assignment_reminders: boolean;
  grade_notifications: boolean;
}

export interface ConvertData {
  file_url: string;
  target_format: string;
}
