import { ENV } from './env';

// Konfigurasi API
export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      UPDATE_PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/password',
      FORGOT_PASSWORD: '/auth/reset/request',
      RESET_PASSWORD: '/auth/reset/confirm',
      ACTIVATE_ACCOUNT: '/auth/verify/request',
      MICROSOFT_LOGIN: '/auth/microsoft/login',
      MICROSOFT_CALLBACK: '/auth/microsoft/callback',
    },
    USER: {
      PROFILE: '/user/profile',
    },
    NOTIFICATION: {
      BASE: '/notification',
      UNREAD_COUNT: '/notification/unread-count',
      CHECK_THESIS_DELETED: '/notification/check-thesis-deleted',
      MARK_ALL_READ: '/notification/read-all',
      MARK_READ: (id: string) => `/notification/${id}/read`,
      DELETE: (id: string) => `/notification/${id}`,
      DELETE_ALL: '/notification/all',
      FCM_REGISTER: '/notification/fcm/register',
      FCM_UNREGISTER: '/notification/fcm/unregister',
    },
    THESIS_STUDENT: {
      BASE: '/thesisGuidance/student',
      GUIDANCE_LIST: '/thesisGuidance/student/guidance',
      GUIDANCE_DETAIL: (id: string) => `/thesisGuidance/student/guidance/${id}`,
      GUIDANCE_REQUEST: '/thesisGuidance/student/guidance/request',
      GUIDANCE_RESCHEDULE: (id: string) => `/thesisGuidance/student/guidance/${id}/reschedule`,
      GUIDANCE_CANCEL: (id: string) => `/thesisGuidance/student/guidance/${id}/cancel`,
      GUIDANCE_NOTES: (id: string) => `/thesisGuidance/student/guidance/${id}/notes`,
      PROGRESS: '/thesisGuidance/student/progress',
      PROGRESS_COMPLETE: '/thesisGuidance/student/progress/complete',
      HISTORY: '/thesisGuidance/student/history',
      SUPERVISORS: '/thesisGuidance/student/supervisors',
      SUPERVISOR_AVAILABILITY: (supervisorId: string) => `/thesisGuidance/student/supervisors/${supervisorId}/availability`,
      // Session Summary
      NEEDS_SUMMARY: '/thesisGuidance/student/needs-summary',
      SUBMIT_SUMMARY: (guidanceId: string) => `/thesisGuidance/student/guidance/${guidanceId}/submit-summary`,
      COMPLETE_SESSION: (guidanceId: string) => `/thesisGuidance/student/guidance/${guidanceId}/complete`,
      COMPLETED_HISTORY: '/thesisGuidance/student/completed-history',
      EXPORT_GUIDANCE: (guidanceId: string) => `/thesisGuidance/student/guidance/${guidanceId}/export`,
      // My Thesis
      MY_THESIS: '/thesisGuidance/student/my-thesis',
      UPDATE_THESIS_TITLE: '/thesisGuidance/student/my-thesis/title',
    },
    THESIS_LECTURER: {
      BASE: '/thesisGuidance/lecturer',
      MY_STUDENTS: '/thesisGuidance/lecturer/my-students',
      MY_STUDENTS_DETAIL: (thesisId: string) => `/thesisGuidance/lecturer/my-students/${thesisId}`,
      REQUESTS: '/thesisGuidance/lecturer/requests',
      SCHEDULED: '/thesisGuidance/lecturer/scheduled',
      REQUEST_REJECT: (guidanceId: string) => `/thesisGuidance/lecturer/requests/${guidanceId}/reject`,
      REQUEST_APPROVE: (guidanceId: string) => `/thesisGuidance/lecturer/requests/${guidanceId}/approve`,
      PROGRESS_SUMMARY: '/thesisGuidance/lecturer/progress',
      PROGRESS_DETAIL: (studentId: string) => `/thesisGuidance/lecturer/progress/${studentId}`,
      PROGRESS_APPROVE_COMPONENTS: (studentId: string) => `/thesisGuidance/lecturer/progress/${studentId}/approve`,
      PROGRESS_FINAL_APPROVAL: (studentId: string) => `/thesisGuidance/lecturer/progress/${studentId}/final-approval`,
      FAIL_THESIS: (studentId: string) => `/thesisGuidance/lecturer/progress/${studentId}/fail`,
      FEEDBACK: (guidanceId: string) => `/thesisGuidance/lecturer/feedback/${guidanceId}`,
      GUIDANCE_HISTORY: (studentId: string) => `/thesisGuidance/lecturer/guidance-history/${studentId}`,
      SUPERVISOR_ELIGIBILITY: '/thesisGuidance/lecturer/supervisor/eligibility',
      // Session Summary Approval
      PENDING_APPROVAL: '/thesisGuidance/lecturer/pending-approval',
      APPROVE_SUMMARY: (guidanceId: string) => `/thesisGuidance/lecturer/guidance/${guidanceId}/approve-summary`,
      // Guidance Detail
      GUIDANCE_DETAIL: (guidanceId: string) => `/thesisGuidance/lecturer/guidance/${guidanceId}`,
    },
  },
  TIMEOUT: 10000, // 10 detik
};

// Helper function untuk membuat full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
