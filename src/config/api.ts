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
      MICROSOFT_EXCHANGE: '/auth/microsoft/exchange',
    },
    PROFILE: {
      UPLOAD_AVATAR: '/profile/avatar',
      DELETE_AVATAR: '/profile/avatar',
      SERVE_AVATAR: (fileName: string) => `/profile/avatar/${fileName}`,
      LECTURER_DATA: '/profile/lecturer-data',
    },
    CURRICULUM: {
      BASE: '/curriculums',
      BY_ID: (id: string) => `/curriculums/${id}`,
    },
    CPL: {
      BASE: '/cpls',
      BY_ID: (id: string) => `/cpls/${id}`,
      TOGGLE: (id: string) => `/cpls/${id}/toggle`,
      EXPORT_ALL_SCORES: '/cpls/export',
      STUDENTS: (id: string) => `/cpls/${id}/students`,
      STUDENT_OPTIONS: (id: string) => `/cpls/${id}/students/options`,
      STUDENT_BY_ID: (id: string, studentId: string) => `/cpls/${id}/students/${studentId}`,
      STUDENT_IMPORT: (id: string) => `/cpls/${id}/students/import`,
      STUDENT_EXPORT: (id: string) => `/cpls/${id}/students/export`,
    },
    CPMK: {
      BASE: '/cpmks',
      BY_ID: (id: string) => `/cpmks/${id}`,
      COPY_TEMPLATE: '/cpmks/copy-template',
      HIERARCHY: '/cpmks/hierarchy',
    },
    THESIS_CPMK: {
      BASE: '/thesis-cpmks',
      BY_ID: (id: string) => `/thesis-cpmks/${id}`,
    },
    SEMINAR_RUBRIC: {
      CPMKS: '/seminar-rubrics/cpmks',
      CRITERIA: '/seminar-rubrics/criteria',
      CRITERIA_BY_ID: (criteriaId: string) => `/seminar-rubrics/criteria/${criteriaId}`,
      CPMK_CONFIG: (cpmkId: string) => `/seminar-rubrics/cpmk/${cpmkId}`,
      CRITERIA_RUBRICS: (criteriaId: string) => `/seminar-rubrics/criteria/${criteriaId}/rubrics`,
      RUBRIC_BY_ID: (rubricId: string) => `/seminar-rubrics/rubrics/${rubricId}`,
      CRITERIA_REORDER: '/seminar-rubrics/criteria/reorder',
      RUBRICS_REORDER: '/seminar-rubrics/rubrics/reorder',
      WEIGHT_SUMMARY: '/seminar-rubrics/weight-summary',
    },
    DEFENCE_RUBRIC: {
      CPMKS: (role: string) => `/defence-rubrics/cpmks?role=${role}`,
      CRITERIA: '/defence-rubrics/criteria',
      CRITERIA_BY_ID: (criteriaId: string) => `/defence-rubrics/criteria/${criteriaId}`,
      CPMK_CONFIG: (cpmkId: string, role: string) => `/defence-rubrics/cpmk/${cpmkId}?role=${role}`,
      CRITERIA_RUBRICS: (criteriaId: string) => `/defence-rubrics/criteria/${criteriaId}/rubrics`,
      RUBRIC_BY_ID: (rubricId: string) => `/defence-rubrics/rubrics/${rubricId}`,
      CRITERIA_REORDER: '/defence-rubrics/criteria/reorder',
      RUBRICS_REORDER: '/defence-rubrics/rubrics/reorder',
      WEIGHT_SUMMARY: (role: string) => `/defence-rubrics/weight-summary?role=${role}`,
    },
    RUBRIC_METOPEN: {
      CPMKS: (role: string) => `/rubric-metopen/cpmks?role=${role}`,
      CPMKS_ALL: '/rubric-metopen/cpmks/all',
      CPMKS_CREATE: '/rubric-metopen/cpmks',
      CPMK_BY_ID: (cpmkId: string) => `/rubric-metopen/cpmks/${cpmkId}`,
      CRITERIA: '/rubric-metopen/criteria',
      CRITERIA_BY_ID: (criteriaId: string) => `/rubric-metopen/criteria/${criteriaId}`,
      CPMK_CONFIG: (cpmkId: string, role: string) => `/rubric-metopen/cpmk/${cpmkId}?role=${role}`,
      CRITERIA_RUBRICS: (criteriaId: string) => `/rubric-metopen/criteria/${criteriaId}/rubrics`,
      RUBRIC_BY_ID: (rubricId: string) => `/rubric-metopen/rubrics/${rubricId}`,
      CRITERIA_REORDER: '/rubric-metopen/criteria/reorder',
      RUBRICS_REORDER: '/rubric-metopen/rubrics/reorder',
      WEIGHT_SUMMARY: (role: string) => `/rubric-metopen/weight-summary?role=${role}`,
    },
    EXIT_SURVEY: {
      BASE: '/exit-surveys',
      BY_ID: (id: string) => `/exit-surveys/${id}`,
      TOGGLE: (id: string) => `/exit-surveys/${id}/toggle`,
      DUPLICATE: (id: string) => `/exit-surveys/${id}/duplicate`,
      RESPONSES: (id: string) => `/exit-surveys/${id}/responses`,
      RESPONSES_EXPORT_PDF: (id: string) => `/exit-surveys/${id}/responses/export.pdf`,
      RESPONSES_EXPORT_EXCEL: (id: string) => `/exit-surveys/${id}/responses/export.xlsx`,
      QUESTIONS: (formId: string) => `/exit-surveys/${formId}/questions`,
      QUESTION_BY_ID: (formId: string, questionId: string) => `/exit-surveys/${formId}/questions/${questionId}`,
    },
    YUDISIUM_REQUIREMENTS: {
      BASE: '/yudisium-requirements',
      BY_ID: (id: string) => `/yudisium-requirements/${id}`,
      TOGGLE: (id: string) => `/yudisium-requirements/${id}/toggle`,
      MOVE_TOP: (id: string) => `/yudisium-requirements/${id}/move-top`,
      MOVE_BOTTOM: (id: string) => `/yudisium-requirements/${id}/move-bottom`,
    },
    YUDISIUM: {
      BASE: '/yudisiums',
      ANNOUNCEMENTS: '/yudisiums/announcements',
      REPOSITORY: '/yudisiums/repository',
      BY_ID: (id: string) => `/yudisiums/${id}`,
      
      // Student (/me)
      ME_OVERVIEW: '/yudisiums/me/overview',
      ME_EXIT_SURVEY: '/yudisiums/me/exit-survey',
      ME_REQUIREMENTS: '/yudisiums/me/requirements',
      ME_REQUIREMENTS_UPLOAD: '/yudisiums/me/requirements/upload',
      ME_CPL_REPORT: '/yudisiums/me/cpl-report',
      ME_CERTIFICATE: '/yudisiums/me/certificate',

      // Participants & Validation
      PARTICIPANTS: (yudisiumId: string) => `/yudisiums/${yudisiumId}/participants`,
      PARTICIPANT_OPTIONS: (yudisiumId: string) => `/yudisiums/${yudisiumId}/participants/options`,
      PARTICIPANTS_IMPORT: (yudisiumId: string) => `/yudisiums/${yudisiumId}/participants/import`,
      PARTICIPANT_DETAIL: (yudisiumId: string, participantId: string) => `/yudisiums/${yudisiumId}/participants/${participantId}`,
      PARTICIPANT_REQUIREMENTS: (yudisiumId: string, participantId: string) => `/yudisiums/${yudisiumId}/participants/${participantId}/requirements`,
      DELETE_PARTICIPANT: (yudisiumId: string, participantId: string) => `/yudisiums/${yudisiumId}/participants/${participantId}`,
      VERIFY_DOCUMENT: (yudisiumId: string, participantId: string, requirementId: string) =>
        `/yudisiums/${yudisiumId}/participants/${participantId}/requirements/${requirementId}/verify`,

      // CPL (Lecturer / GKM)
      CPL_SCORES: (yudisiumId: string, participantId: string) => `/yudisiums/${yudisiumId}/participants/${participantId}/cpl-scores`,
      CPL_REPORT: (yudisiumId: string, participantId: string) => `/yudisiums/${yudisiumId}/participants/${participantId}/cpl-report`,
      VALIDATE_CPL: (yudisiumId: string, participantId: string, cplId: string) =>
        `/yudisiums/${yudisiumId}/participants/${participantId}/cpl/${cplId}/validate`,
      REPAIR_CPL: (yudisiumId: string, participantId: string, cplId: string) =>
        `/yudisiums/${yudisiumId}/participants/${participantId}/cpl/${cplId}/repair`,

      // Actions
      EXPORT_PARTICIPANTS: (yudisiumId: string) => `/yudisiums/${yudisiumId}/export-participants`,
      FINALIZE: (yudisiumId: string) => `/yudisiums/${yudisiumId}/finalize`,
      OPTIONS_ROOMS: '/yudisiums/options/rooms',
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
      GENERATE_LOG: '/thesisGuidance/student/guidance/generate-log',
      // My Thesis
      MY_THESIS: '/thesisGuidance/student/my-thesis',
      UPDATE_THESIS_TITLE: '/thesisGuidance/student/my-thesis/title',
      THESIS_HISTORY: '/thesisGuidance/student/thesis-history',
      PROPOSE_THESIS: '/thesisGuidance/student/propose-thesis',
      // Proposal Versioning
      PROPOSAL_UPLOAD: '/thesisGuidance/student/proposal/upload',
      PROPOSAL_VERSIONS: '/thesisGuidance/student/proposal/versions',
      PROPOSAL_STATUS: '/thesisGuidance/student/proposal/status',
      PROPOSAL_SUBMIT_FINAL: '/thesisGuidance/student/proposal/submit-final',
      // Pembimbing 2 Request
      AVAILABLE_SUPERVISORS_2: '/thesisGuidance/student/available-supervisors-2',
      REQUEST_SUPERVISOR_2: '/thesisGuidance/student/request-supervisor-2',
      PENDING_SUPERVISOR_2: '/thesisGuidance/student/pending-supervisor-2-request',
      CANCEL_SUPERVISOR_2: '/thesisGuidance/student/cancel-supervisor-2-request',
      METOPEN_INFORMAL_LOGS: '/thesisGuidance/student/metopen/informal-logs',
    },
    THESIS_LECTURER: {
      BASE: '/thesisGuidance/lecturer',
      MY_STUDENTS: '/thesisGuidance/lecturer/my-students',
      MY_STUDENTS_DETAIL: (thesisId: string) => `/thesisGuidance/lecturer/my-students/${thesisId}`,
      REQUESTS: '/thesisGuidance/lecturer/requests',
      SCHEDULED: '/thesisGuidance/lecturer/scheduled',
      REQUEST_REJECT: (guidanceId: string) => `/thesisGuidance/lecturer/requests/${guidanceId}/reject`,
      REQUEST_APPROVE: (guidanceId: string) => `/thesisGuidance/lecturer/requests/${guidanceId}/approve`,
      REQUEST_CANCEL: (guidanceId: string) => `/thesisGuidance/lecturer/requests/${guidanceId}/cancel`,
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
      REJECT_SUMMARY: (guidanceId: string) => `/thesisGuidance/lecturer/guidance/${guidanceId}/reject-summary`,
      // Guidance Detail
      GUIDANCE_DETAIL: (guidanceId: string) => `/thesisGuidance/lecturer/guidance/${guidanceId}`,
      // Pembimbing 2 Requests
    SUPERVISOR2_REQUESTS: '/thesisGuidance/lecturer/supervisor2-requests',
    SUPERVISOR2_APPROVE: (requestId: string) => `/thesisGuidance/lecturer/supervisor2-requests/${requestId}/approve`,
    SUPERVISOR2_REJECT: (requestId: string) => `/thesisGuidance/lecturer/supervisor2-requests/${requestId}/reject`,
    // Persetujuan akhir Pembimbing 2 oleh KaDep (F2-5 / OQ-2.2)
    KADEP_SUPERVISOR2_REQUESTS: '/thesisGuidance/kadep/supervisor2-requests',
    KADEP_SUPERVISOR2_APPROVE: (requestId: string) => `/thesisGuidance/kadep/supervisor2-requests/${requestId}/approve`,
    KADEP_SUPERVISOR2_REJECT: (requestId: string) => `/thesisGuidance/kadep/supervisor2-requests/${requestId}/reject`,
        STUDENT_PROPOSAL_VERSIONS: (thesisId: string) => `/thesisGuidance/lecturer/students/${thesisId}/proposal/versions`,
        STUDENT_INFORMAL_LOGS: (thesisId: string) =>
          `/thesisGuidance/lecturer/students/${thesisId}/metopen/informal-logs`,
      },
    THESIS_MONITORING: {
      DASHBOARD: '/thesisGuidance/monitoring/dashboard',
      // Transfer endpoints removed per SIMPTA canon v2.1 refactor — Path C escalation replaces pergantian
    },
    THESIS_SEMINAR: {
      // --- Shared / Global ---
      BASE: '/thesis-seminars',
      BY_ID: (id: string) => `/thesis-seminars/${id}`,
      INVITATION_LETTER: (id: string) => `/thesis-seminars/${id}/invitation-letter`,
      ASSESSMENT_RESULT: (id: string) => `/thesis-seminars/${id}/assessment-result`,
      OPTIONS_THESES: '/thesis-seminars/options/theses',
      OPTIONS_LECTURERS: '/thesis-seminars/options/lecturers',
      OPTIONS_STUDENTS: '/thesis-seminars/options/students',
      OPTIONS_ROOMS: '/thesis-seminars/options/rooms',
      EXPORT: '/thesis-seminars/export',
      IMPORT: '/thesis-seminars/import',

      // --- Student Specific ---
      ME_OVERVIEW: '/thesis-seminars/me/overview',
      ME_ATTENDANCE: '/thesis-seminars/me/attendance',
      ME_HISTORY: '/thesis-seminars/me/history',
      ANNOUNCEMENTS: '/thesis-seminars/announcements',

      // --- Lecturer/Kadep Lists ---
      LECTURER_SUPERVISED: '/thesis-seminars?view=supervised_students',
      LECTURER_EXAMINER_REQUESTS: '/thesis-seminars?view=examiner_requests',
      LECTURER_ASSIGNMENT_LIST: '/thesis-seminars?view=assignment',

      // --- Scheduling ---
      SCHEDULING_DATA: (id: string) => `/thesis-seminars/${id}/scheduling-data`,
      SCHEDULE: (id: string) => `/thesis-seminars/${id}/schedule`,
      FINALIZE_SCHEDULE: (id: string) => `/thesis-seminars/${id}/schedule/finalize`,
      CANCEL: (id: string) => `/thesis-seminars/${id}/cancel`,

      // --- Documents ---
      DOCUMENT_TYPES: '/thesis-seminars/documents/types',
      DOCUMENTS: (id: string) => `/thesis-seminars/${id}/documents`,
      DOCUMENT_BY_TYPE: (id: string, typeId: string) => `/thesis-seminars/${id}/documents/${typeId}`,
      VERIFY_DOCUMENT: (id: string, typeId: string) => `/thesis-seminars/${id}/documents/${typeId}/verify`,

      // --- Examiners & Assignment ---
      ELIGIBLE_EXAMINERS: (id: string) => `/thesis-seminars/${id}/eligible-examiners`,
      EXAMINERS: (id: string) => `/thesis-seminars/${id}/examiners`,
      RESPOND_ASSIGNMENT: (id: string, examinerId: string) => `/thesis-seminars/${id}/examiners/${examinerId}/respond`,

      // --- Assessment & Finalization ---
      ASSESSMENT: (id: string) => `/thesis-seminars/${id}/assessment`,
      FINALIZATION_DATA: (id: string) => `/thesis-seminars/${id}/finalization`,
      FINALIZE: (id: string) => `/thesis-seminars/${id}/finalize`,

      // --- Revisions ---
      REVISIONS: (id: string) => `/thesis-seminars/${id}/revisions`,
      REVISION_BY_ID: (id: string, revId: string) => `/thesis-seminars/${id}/revisions/${revId}`,
      APPROVE_REVISION: (id: string, revId: string) => `/thesis-seminars/${id}/revisions/${revId}`,
      UNAPPROVE_REVISION: (id: string, revId: string) => `/thesis-seminars/${id}/revisions/${revId}`,
      FINALIZE_REVISIONS: (id: string) => `/thesis-seminars/${id}/revisions/finalize`,
      UNFINALIZE_REVISIONS: (id: string) => `/thesis-seminars/${id}/revisions/unfinalize`,

      // --- Audiences ---
      AUDIENCES: (id: string) => `/thesis-seminars/${id}/audiences`,
      AUDIENCE_BY_ID: (id: string, studentId: string) => `/thesis-seminars/${id}/audiences/${studentId}`,
      AUDIENCE_REGISTER: (id: string) => `/thesis-seminars/${id}/audience-register`,
      APPROVE_AUDIENCE: (id: string, studentId: string) => `/thesis-seminars/${id}/audiences/${studentId}/approve`,
      UNAPPROVE_AUDIENCE: (id: string, studentId: string) => `/thesis-seminars/${id}/audiences/${studentId}/unapprove`,
      TOGGLE_AUDIENCE_PRESENCE: (id: string, studentId: string) => `/thesis-seminars/${id}/audiences/${studentId}/presence`,
      AUDIENCES_OPTIONS: (id: string) => `/thesis-seminars/${id}/audiences/options/students`,
      AUDIENCES_EXPORT: (id: string) => `/thesis-seminars/${id}/audiences/export`,
      AUDIENCES_IMPORT: (id: string) => `/thesis-seminars/${id}/audiences/import`,
    },
    THESIS_DEFENCE: {
      // --- Shared / Global ---
      BASE: '/thesis-defences',
      BY_ID: (id: string) => `/thesis-defences/${id}`,
      INVITATION_LETTER: (id: string) => `/thesis-defences/${id}/invitation-letter`,
      ASSESSMENT_RESULT: (id: string) => `/thesis-defences/${id}/assessment-result`,


      // --- Student Specific ---
      ME_OVERVIEW: '/thesis-defences/me/overview',
      ME_HISTORY: '/thesis-defences/me/history',

      // --- Lecturer/Kadep Lists (view-based filters) ---
      LECTURER_SUPERVISED: '/thesis-defences?view=supervised_students',
      LECTURER_EXAMINER_REQUESTS: '/thesis-defences?view=examiner_requests',
      LECTURER_ASSIGNMENT_LIST: '/thesis-defences?view=assignment',

      // --- Scheduling ---
      SCHEDULING_DATA: (id: string) => `/thesis-defences/${id}/scheduling-data`,
      SCHEDULE: (id: string) => `/thesis-defences/${id}/schedule`,

      // --- Documents ---
      DOCUMENT_TYPES: '/thesis-defences/documents/types',
      DOCUMENTS: (id: string) => `/thesis-defences/${id}/documents`,
      DOCUMENT_BY_TYPE: (id: string, typeId: string) => `/thesis-defences/${id}/documents/${typeId}`,
      VERIFY_DOCUMENT: (id: string, typeId: string) => `/thesis-defences/${id}/documents/${typeId}/verify`,

      // --- Examiners & Assignment ---
      ELIGIBLE_EXAMINERS: (id: string) => `/thesis-defences/${id}/eligible-examiners`,
      EXAMINERS: (id: string) => `/thesis-defences/${id}/examiners`,
      RESPOND_ASSIGNMENT: (id: string, examinerId: string) => `/thesis-defences/${id}/examiners/${examinerId}/respond`,

      // --- Assessment & Finalization ---
      ASSESSMENT: (id: string) => `/thesis-defences/${id}/assessment`,
      ASSESSMENT_VIEW: (id: string) => `/thesis-defences/${id}/assessment-view`,
      FINALIZATION_DATA: (id: string) => `/thesis-defences/${id}/finalization`,
      FINALIZE: (id: string) => `/thesis-defences/${id}/finalize`,

      // --- Revisions ---
      REVISIONS: (id: string) => `/thesis-defences/${id}/revisions`,
      REVISION_BY_ID: (id: string, revId: string) => `/thesis-defences/${id}/revisions/${revId}`,
      APPROVE_REVISION: (id: string, revId: string) => `/thesis-defences/${id}/revisions/${revId}`,
      UNAPPROVE_REVISION: (id: string, revId: string) => `/thesis-defences/${id}/revisions/${revId}`,
      FINALIZE_REVISIONS: (id: string) => `/thesis-defences/${id}/revisions/finalize`,
      UNFINALIZE_REVISIONS: (id: string) => `/thesis-defences/${id}/revisions/unfinalize`,
    },
    LECTURER_AVAILABILITY: {
      BASE: '/lecturer-availabilities',
      BY_ID: (id: string) => `/lecturer-availabilities/${id}`,
    },
    INTERNSHIP_STUDENT: {
      BASE: '/insternship/registration',
      PROPOSALS: '/insternship/registration/proposals',
      RESPOND_INVITATION: (id: string) => `/insternship/registration/proposals/${id}/respond`,
      COMPANIES: '/insternship/registration/companies',
      ELIGIBLE_STUDENTS: '/insternship/registration/eligible-students',
      SUBMIT_PROPOSAL: '/insternship/registration/submit',
      SUBMIT_COMPANY_RESPONSE: (proposalId: string) => `/insternship/registration/proposals/${proposalId}/company-response`,
      LOGBOOK: '/insternship/activity/logbook',
      HISTORY: '/insternship/activity/history',
      UPDATE_LOGBOOK: (id: string) => `/insternship/activity/logbook/${id}`,
      UPDATE_DETAILS: '/insternship/activity/details',
      ACTIVITY: '/insternship/activity',
      REGISTER_SEMINAR: '/insternship/activity/register-seminar',
      UPCOMING_SEMINARS: '/insternship/activity/seminars',
      UPDATE_SEMINAR: (id: string) => `/insternship/activity/seminar/${id}`,
      APPROVE_SEMINAR: (id: string) => `/insternship/activity/guidance/lecturer/seminar/${id}/approve`,
      REJECT_SEMINAR: (id: string) => `/insternship/activity/guidance/lecturer/seminar/${id}/reject`,
      UPLOAD: '/documents/upload',
      VERIFY_FINAL_REPORT: (internshipId: string) => `/insternship/activity/guidance/lecturer/students/${internshipId}/verify-report`,
    },
    INTERNSHIP_OVERVIEW: {
      COMPANIES: '/insternship/overview/companies',
      REPORTS: '/insternship/overview/reports',
      STATS: '/insternship/overview/stats',
    },
    INTERNSHIP_SEKDEP: {
      BASE: '/insternship/sekdep',
      PROPOSALS: '/insternship/sekdep/proposals',
      PROPOSAL_DETAIL: (id: string) => `/insternship/sekdep/proposals/${id}`,
      COMPANY_STATS: '/insternship/sekdep/companies/stats',
      COMPANIES: '/insternship/sekdep/companies',
      COMPANY_DETAIL: (id: string) => `/insternship/sekdep/companies/${id}`,
      COMPANY_RESPONSES: '/insternship/sekdep/company-responses',
      VERIFY_COMPANY_RESPONSE: (id: string) => `/insternship/sekdep/company-responses/${id}/verify`,
      INTERNSHIPS: '/insternship/sekdep/internships',
      GRADE_RECAP: '/insternship/sekdep/grade-recap',
      INTERNSHIPS_DETAIL: (id: string) => `/insternship/sekdep/internships/${id}`,
      VERIFY_DOCUMENT: (id: string) => `/insternship/sekdep/internships/${id}/verify-document`,
      VERIFY_DOCUMENTS_BULK: (id: string) => `/insternship/sekdep/internships/${id}/verify-documents-bulk`,
      UPDATE_FIELD_INFO: (id: string) => `/insternship/sekdep/internships/${id}/field-info`,
      SEND_FIELD_ASSESSMENT: (id: string) => `/insternship/sekdep/internships/${id}/send-field-assessment`,
      LECTURERS_WORKLOAD: '/insternship/sekdep/lecturers/workload',
      LECTURERS_WORKLOAD_EXPORT: '/insternship/sekdep/lecturers/workload/export',
      GUIDANCE_QUESTIONS: '/insternship/sekdep/guidance/questions',
      GUIDANCE_QUESTION_DETAIL: (id: string) => `/insternship/sekdep/guidance/questions/${id}`,
      GUIDANCE_CRITERIA: '/insternship/sekdep/guidance/criteria',
      GUIDANCE_CRITERIA_DETAIL: (id: string) => `/insternship/sekdep/guidance/criteria/${id}`,
      TEMPLATES_GET: (name: string) => `/insternship/sekdep/templates/${name}`,
      TEMPLATES_PREVIEW: (name: string) => `/insternship/sekdep/templates/${name}/preview`,
      TEMPLATES_SAVE: '/insternship/sekdep/templates',
      MONITORING_STATS: '/insternship/monitoring/stats',
      MONITORING_LIST: '/insternship/monitoring/list',
    },
    INTERNSHIP_KADEP: {
      BASE: '/internship/kadep',
      COMPANY_STATS: '/internship/kadep/companies/stats',
      COMPANIES: '/internship/kadep/companies',
      COMPANY_DETAIL: (id: string) => `/internship/kadep/companies/${id}`,
      PENDING_LETTERS: '/internship/kadep/pending-letters',
      APPROVE_LETTER: '/internship/kadep/approve-letter',
    },
    INTERNSHIP_ADMIN: {
      BASE: '/insternship/admin',
      COMPANY_STATS: '/insternship/admin/companies/stats',
      APPROVED_PROPOSALS: '/insternship/admin/proposals/approved',
      APPROVED_PROPOSAL_DETAIL: (id: string) => `/insternship/admin/proposals/${id}`,
      UPDATE_LETTER: (id: string) => `/insternship/admin/proposals/${id}/letter`,
      ASSIGNMENT_PROPOSALS: '/insternship/admin/proposals/assignments',
      ASSIGNMENT_PROPOSAL_DETAIL: (id: string) => `/insternship/admin/proposals/${id}/assignment`,
      UPDATE_ASSIGNMENT_LETTER: (id: string) => `/insternship/admin/proposals/${id}/assignment-letter`,
      VERIFY_COMPANY_RESPONSE: (id: string) => `/insternship/admin/company-responses/${id}/verify`,
      UPLOAD_COMPANY_RESPONSE: (id: string) => `/insternship/admin/proposals/${id}/company-response`,
      HOLIDAYS: '/insternship/holidays',
    },
    INTERNSHIP_TEMPLATES: {
      GET: (name: string) => `/internship/templates/${name}`,
      PREVIEW: (name: string) => `/internship/templates/${name}/preview`,
      SAVE: '/internship/templates',
    },
    INTERNSHIP_PUBLIC: {
      VERIFY_LETTER: (id: string) => `/internship/public/verify-letter/${id}`,
    },
    METOPEN: {
      ELIGIBILITY: '/metopen/eligibility',
      /** Mahasiswa: status pengesahan judul + dokumen (read-only). */
      ME_PROPOSAL_APPROVAL: '/metopen/me/proposal-approval',
      /** Mahasiswa: snapshot eligibility seminar tanpa side effect sync. */
      ME_SEMINAR_ELIGIBILITY: '/metopen/me/seminar-eligibility',
      /** Mahasiswa: sinkron promosi/release TA-04 awal + ringkasan status. */
      ME_PROPOSAL_QUEUE_SYNC: '/metopen/me/proposal-queue/sync',
      /** Mahasiswa: riwayat penilaian TA-03 sejak skor tersedia, termasuk sebelum TA-04. */
      ME_ASSESSMENT_HISTORY: '/metopen/me/assessment-history',
      /** BR-23: Arsip Metopel mahasiswa pasca promosi aktif — read-only single source of truth. */
      ME_ARCHIVE: '/metopen/me/archive',
      /** KC-20260709-06: endpoint tetap ada tetapi menolak unduh mahasiswa (403). */
      ME_TITLE_APPROVAL_DOCUMENT: '/metopen/me/archive/title-approval-document',
      /** KaDep/Admin: antre judul menunggu pengesahan. */
      KADEP_PENDING_TITLE_REPORTS: (academicYearId?: string) =>
        academicYearId
          ? `/metopen/kadep/title-reports/pending?academicYearId=${academicYearId}`
          : '/metopen/kadep/title-reports/pending',
      KADEP_TITLE_REPORT_REVIEW: (thesisId: string) =>
        `/metopen/kadep/thesis/${thesisId}/title-report/review`,
      /** Legacy: thesis aktif/TA-04 awal yang belum terhubung ke Formulir TA-04 batch resmi. */
      KADEP_TITLE_REPORTS_MISSING_DOCUMENT: (academicYearId?: string) =>
        academicYearId
          ? `/metopen/kadep/title-reports/missing-document?academicYearId=${academicYearId}`
          : '/metopen/kadep/title-reports/missing-document',
      /** Riwayat TA-04 awal + legacy accepted/rejected antar-periode. */
      KADEP_TITLE_REPORTS_HISTORY: (academicYearId?: string) =>
        academicYearId
          ? `/metopen/kadep/title-reports/history?academicYearId=${academicYearId}`
          : '/metopen/kadep/title-reports/history',
      /** Legacy: endpoint per-thesis tidak lagi menerbitkan dokumen resmi. */
      KADEP_TITLE_REPORT_REGENERATE: (thesisId: string) =>
        `/metopen/kadep/thesis/${thesisId}/title-report/regenerate`,
      /** KaDep unduh Formulir TA-04 PDF untuk thesis yang sudah terhubung ke batch. */
      KADEP_TITLE_REPORT_DOCUMENT: (thesisId: string) =>
        `/metopen/kadep/thesis/${thesisId}/title-report/document`,
    },
    ASSESSMENT: {
      // TA-03A: Supervisor scoring of Metopen proposal
      SUPERVISOR_SCORING_QUEUE: '/assessment/supervisor/queue',
      SUPERVISOR_SCORING_HISTORY: '/assessment/supervisor/history',
      SUPERVISOR_SUBMIT_SCORE: (thesisId: string) => `/assessment/supervisor/${thesisId}/score`,
      // BR-20: Pembimbing 2 co-sign endpoint
      SUPERVISOR_CO_SIGN: (thesisId: string) => `/assessment/supervisor/${thesisId}/co-sign`,
      // BR-20: Klasifikasi role caller (P1/P2/null) untuk UI
      SUPERVISOR_CONTEXT: (thesisId: string) => `/assessment/supervisor/${thesisId}/context`,
      SUPERVISOR_GET_SCORE: (thesisId: string) => `/assessment/supervisor/${thesisId}/score`,
      // TA-03B: Metopen lecturer scoring
      METOPEN_SCORING_QUEUE: '/assessment/metopen/queue',
      METOPEN_SCORING_HISTORY: '/assessment/metopen/history',
      METOPEN_ATTENDANCE_LATEST: '/assessment/metopen/attendance/latest',
      /** F-4.2: dry-run pratinjau dampak auto-zero sebelum commit. */
      METOPEN_ATTENDANCE_PREVIEW: '/assessment/metopen/attendance/preview',
      METOPEN_ATTENDANCE_UPLOAD: '/assessment/metopen/attendance/upload',
      METOPEN_ATTENDANCE_ELIGIBILITY: (thesisId: string) => `/assessment/metopen/attendance/eligibility/${thesisId}`,
      METOPEN_SCORES_EXPORT: '/assessment/metopen/scores/export',
      // Koordinator dashboard: monitoring progress per mahasiswa eligible Metopen.
      METOPEN_MONITORING: '/assessment/metopen/monitoring',
      METOPEN_SUBMIT_SCORE: (thesisId: string) => `/assessment/metopen/${thesisId}/score`,
      METOPEN_PUBLISH: (thesisId: string) => `/assessment/metopen/${thesisId}/publish`,
      // Shared: Get criteria by assessment form code
      CRITERIA: (formCode: string) => `/assessment/criteria/${formCode}`,
    },
    ADVISOR_REQUEST: {
      ACCESS_STATE: '/advisorRequest/access-state',
      SUBMIT: '/advisorRequest',
      CATALOG: '/advisorRequest/catalog',
      MY_REQUESTS: '/advisorRequest/my',
      WITHDRAW: (id: string) => `/advisorRequest/${id}/withdraw`,
      LECTURER_INBOX: '/advisorRequest/inbox',
      KADEP_INBOX: '/advisorRequest/kadep-queue',
      DETAIL: (id: string) => `/advisorRequest/${id}`,
      LECTURER_DECISION: (id: string) => `/advisorRequest/${id}/respond`,
      KADEP_DECISION: (id: string) => `/advisorRequest/${id}/decide`,
      ASSIGN: (id: string) => `/advisorRequest/${id}/assign`,
    },
    QUOTA: {
      BROWSE: '/quota/browse',
      LECTURER_DETAIL: (lecturerId: string) => `/quota/browse/${lecturerId}`,
      CHECK: (lecturerId: string) => `/quota/check/${lecturerId}`,
      SCIENCE_GROUPS: '/quota/science-groups',
      TOPICS: '/quota/topics',
      DEFAULT_CONFIG: '/quota/config/default',
      LECTURER_CONFIG: (lecturerId: string) => `/quota/config/lecturer/${lecturerId}`,
      DELETE_LECTURER_CONFIG: (quotaId: string) => `/quota/config/lecturer/${quotaId}`,
      ACCEPTING_REQUESTS: '/quota/accepting-requests',
      MONITORING: '/quota/monitoring',
    },
  },
  TIMEOUT: 10000, // 10 detik
};

// Helper function untuk membuat full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
