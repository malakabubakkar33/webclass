import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.');

    // Standalone local Vite dev server (port 5173) connects to backend on port 5000
    if (isLocalhost && port === '5173') {
      return `${protocol}//${hostname}:5000/api`;
    }

    // In production (e.g. smit-online.vercel.app), ALWAYS use relative /api
    // and ignore any accidental localhost value configured in VITE_API_URL
    if (!isLocalhost) {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return '/api';
    }
  }

  // Fallback
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s resilient timeout for cloud serverless cold starts & file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-flight deduplication and short TTL cache for static public endpoints
const requestCache = new Map<string, { time: number; promise: Promise<any> }>();

export const clearPublicCache = () => {
  requestCache.clear();
};

const cachedGet = (url: string, ttlMs = 3000) => {
  const cached = requestCache.get(url);
  const now = Date.now();
  if (cached && now - cached.time < ttlMs) {
    return cached.promise;
  }
  const promise = apiClient.get(url).catch((err) => {
    requestCache.delete(url);
    throw err;
  });
  requestCache.set(url, { time: now, promise });
  return promise;
};

// Interceptor to inject JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smit_token') || localStorage.getItem('webcraft_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401 unauth and clear token, and handle slow network timeouts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = 'The server is taking longer than expected to respond. Please check your network connection.';
    }
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && !window.location.pathname.includes('/teacher/setup')) {
        localStorage.removeItem('smit_token');
        localStorage.removeItem('smit_user');
        localStorage.removeItem('webcraft_token');
        localStorage.removeItem('webcraft_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (data: { identifier: string; password: string }) => {
    clearPublicCache();
    return apiClient.post('/auth/login', data);
  },
  signup: async (data: any) => {
    clearPublicCache();
    const res = await apiClient.post('/auth/signup', data);
    clearPublicCache();
    return res;
  },
  getTeacherSetupStatus: () => apiClient.get('/auth/teacher-setup-status'),
  setupTeacher: (data: { fullName: string; username: string; avatarUrl?: string; password: string; confirmPassword?: string }) =>
    apiClient.post('/auth/teacher-setup', data),
  uploadAvatar: (formData: FormData) =>
    apiClient.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data: any) => apiClient.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => apiClient.post('/auth/change-password', data),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  verifyOtp: (data: { email: string; otp: string }) => apiClient.post('/auth/verify-otp', data),
  resetPassword: (data: { email: string; otp: string; newPassword: string; confirmPassword?: string }) =>
    apiClient.post('/auth/reset-password', data),

  // Courses
  getCourses: () => apiClient.get('/courses'),
  getCourseById: (id: string) => apiClient.get(`/courses/${id}`),
  createCourse: (data: any) => apiClient.post('/courses', data),
  updateCourse: (id: string, data: any) => apiClient.put(`/courses/${id}`, data),
  deleteCourse: (id: string) => apiClient.delete(`/courses/${id}`),

  // Topics
  getTopicsByCourse: (courseId: string) => apiClient.get(`/topics/course/${courseId}`),
  createTopic: (data: { courseId: string; title: string; description?: string }) => apiClient.post('/topics', data),
  updateTopic: (id: string, data: { title: string; description?: string }) => apiClient.put(`/topics/${id}`, data),
  deleteTopic: (id: string) => apiClient.delete(`/topics/${id}`),

  // Videos
  getVideoById: (id: string) => apiClient.get(`/videos/${id}`),
  uploadVideoFile: (formData: FormData) => apiClient.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createVideo: (data: any) => apiClient.post('/videos', data),
  updateVideoProgress: (videoId: string, data: { completed: boolean; progressSeconds?: number }) =>
    apiClient.post(`/videos/${videoId}/progress`, data),
  deleteVideo: (id: string) => apiClient.delete(`/videos/${id}`),

  // Attendance
  getStudentAttendance: (studentId?: string) =>
    apiClient.get(studentId ? `/attendance/student/${studentId}` : '/attendance/student/summary'),
  getAttendanceByDate: (date: string) => apiClient.get(`/attendance/date?date=${date}`),
  saveAttendance: (data: { date: string; records: { studentId: string; status: 'present' | 'absent' | 'leave' }[] }) =>
    apiClient.post('/attendance/save', data),
  getAttendanceHistory: () => apiClient.get('/attendance/history'),
  startAttendanceSession: (data: { date: string; message?: string }) =>
    apiClient.post('/attendance/session/start', data),
  getActiveAttendanceSession: () => apiClient.get('/attendance/session/active'),
  acceptAttendanceRequest: (sessionId: string) =>
    apiClient.post('/attendance/session/accept', { sessionId }),
  approveStudentAttendance: (data: { sessionId: string; studentId: string }) =>
    apiClient.post('/attendance/session/approve-student', data),
  approveAllAcceptedAttendance: (sessionId: string) =>
    apiClient.post('/attendance/session/approve-all', { sessionId }),
  closeAttendanceSession: (sessionId: string) =>
    apiClient.post('/attendance/session/close', { sessionId }),

  // Students (Teacher)
  getStudents: () => apiClient.get('/students'),
  getStudentById: (id: string) => apiClient.get(`/students/${id}`),
  createStudent: async (data: any) => {
    clearPublicCache();
    const res = await apiClient.post('/students', data);
    clearPublicCache();
    return res;
  },
  toggleStudentStatus: async (id: string) => {
    clearPublicCache();
    const res = await apiClient.patch(`/students/${id}/toggle-status`);
    clearPublicCache();
    return res;
  },
  toggleStudentVisibility: async (id: string) => {
    clearPublicCache();
    const res = await apiClient.patch(`/students/${id}/toggle-visibility`);
    clearPublicCache();
    return res;
  },
  dropStudent: async (id: string, reason?: string) => {
    clearPublicCache();
    const res = await apiClient.post(`/students/${id}/drop`, { reason });
    clearPublicCache();
    return res;
  },
  sendAttendanceWarning: (id: string, percent?: number) => apiClient.post(`/students/${id}/send-warning`, { percent }),
  updateStudent: (id: string, data: any) => apiClient.put(`/students/${id}`, data),

  // Teacher Dashboard & Analytics
  getTeacherStats: () => apiClient.get('/teacher/dashboard-stats'),
  getTeacherAnalytics: () => apiClient.get('/teacher/analytics'),
  getTeacherActivities: (limit = 20) => apiClient.get(`/teacher/activities?limit=${limit}`),
  getClassSettings: () => apiClient.get('/teacher/class-settings'),
  updateClassSettings: (data: any) => apiClient.put('/teacher/class-settings', data),
  globalSearch: (q: string) => apiClient.get(`/teacher/search?q=${encodeURIComponent(q)}`),

  // Student Portal
  getStudentDashboard: () => apiClient.get('/students/dashboard'),
  getCourseRoadmap: (courseId: string) => apiClient.get(`/students/courses/${courseId}/roadmap`),

  // Assignments
  getAssignments: () => apiClient.get('/assignments'),
  getAssignmentById: (id: string) => apiClient.get(`/assignments/${id}`),
  submitAssignment: (id: string, formData: FormData) =>
    apiClient.post(`/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createAssignment: (data: any) => apiClient.post('/assignments', data),
  updateAssignment: (id: string, data: any) => apiClient.put(`/assignments/${id}`, data),
  deleteAssignment: (id: string) => apiClient.delete(`/assignments/${id}`),
  getAssignmentSubmissions: (id: string) => apiClient.get(`/assignments/${id}/submissions`),
  gradeSubmission: (assignmentId: string, data: any) =>
    apiClient.post(`/assignments/${assignmentId}/grade`, data),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  markNotificationRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.post('/notifications/read-all'),
  registerFCMToken: (token: string, deviceInfo?: string) => apiClient.post('/notifications/fcm-token', { token, deviceInfo }),

  // Public Endpoints (Cached for zero-latency instant transitions)
  getPublicStats: () => cachedGet('/public/stats', 15000),
  getPublicCourses: () => cachedGet('/public/courses', 15000),
  getPublicCourseById: (id: string) => cachedGet(`/public/courses/${id}`, 15000),
  getPublicStudents: () => cachedGet('/public/students', 15000),
  getPublicTopStudents: () => cachedGet('/public/top-students', 15000),
  getPublicTeacher: () => cachedGet('/public/teacher', 30000),
};
