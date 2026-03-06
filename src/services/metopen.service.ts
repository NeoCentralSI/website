import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  MetopenTemplate,
  MetopenTemplateAttachment,
  MetopenTask,
  MyTasksResponse,
  ProgressResponse,
  GateStatusResponse,
  GradingQueueItem,
  MonitoringSummaryResponse,
  CreateTemplateDto,
  UpdateTemplateDto,
  ReorderTemplatesDto,
  GradeDto,
  PublishTasksDto,
  PublishTasksResponse,
  EligibleStudent,
  MetopenClass,
  CreateClassDto,
  UpdateClassDto,
  PublishToClassDto,
  PublishToClassResponse,
  ClassTaskGroup,
  PublishStatItem,
  AcademicYear,
  AutoSyncResult,
} from '@/types/metopen.types';

const ENDPOINTS = API_CONFIG.ENDPOINTS.METOPEN;

// ==================== Eligibility ====================

export interface MetopelEligibility {
  semester: number;
  isMinSemester6: boolean;
  hasMetopenCourse: boolean;
  canAccess: boolean;
}

export const checkMetopelEligibility = async (): Promise<MetopelEligibility> => {
  const url = getApiUrl(ENDPOINTS.ELIGIBILITY);
  const response = await apiRequest(url);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Gagal memeriksa eligibilitas');
  }
  const result = await response.json();
  return result.data;
};

// ==================== Template Management ====================

export const metopenService = {
  getEligibleStudents: async (): Promise<EligibleStudent[]> => {
    const url = getApiUrl('/metopen/eligible-students');
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengambil daftar mahasiswa eligible');
    }
    const result = await response.json();
    return result.data;
  },

  // Templates
  getTemplates: async (params?: { isActive?: string; topicId?: string }): Promise<MetopenTemplate[]> => {
    const searchParams = new URLSearchParams();
    if (params?.isActive) searchParams.set('isActive', params.isActive);
    if (params?.topicId) searchParams.set('topicId', params.topicId);
    const query = searchParams.toString();
    const url = getApiUrl(ENDPOINTS.TEMPLATES + (query ? `?${query}` : ''));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat template');
    }
    const result = await response.json();
    return result.data;
  },

  getTemplateById: async (id: string): Promise<MetopenTemplate> => {
    const url = getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(id));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat detail template');
    }
    const result = await response.json();
    return result.data;
  },

  createTemplate: async (data: CreateTemplateDto): Promise<MetopenTemplate> => {
    const url = getApiUrl(ENDPOINTS.TEMPLATES);
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal membuat template');
    }
    const result = await response.json();
    return result.data;
  },

  updateTemplate: async (id: string, data: UpdateTemplateDto): Promise<MetopenTemplate> => {
    const url = getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(id));
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memperbarui template');
    }
    const result = await response.json();
    return result.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const url = getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(id));
    const response = await apiRequest(url, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menghapus template');
    }
  },

  reorderTemplates: async (data: ReorderTemplatesDto): Promise<void> => {
    const url = getApiUrl(ENDPOINTS.TEMPLATES_REORDER);
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengubah urutan template');
    }
  },

  // Template Attachments
  getTemplateAttachments: async (templateId: string): Promise<MetopenTemplateAttachment[]> => {
    const url = getApiUrl(`/metopen/templates/${templateId}/attachments`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat attachment');
    }
    const result = await response.json();
    return result.data;
  },

  uploadTemplateAttachment: async (templateId: string, file: File): Promise<MetopenTemplateAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const url = getApiUrl(`/metopen/templates/${templateId}/attachments`);
    const response = await apiRequest(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengunggah attachment');
    }
    const result = await response.json();
    return result.data;
  },

  uploadTemplateAttachmentsBatch: async (templateId: string, files: File[]): Promise<MetopenTemplateAttachment[]> => {
    if (!files.length) return [];
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    const url = getApiUrl(`/metopen/templates/${templateId}/attachments/batch`);
    const response = await apiRequest(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengunggah lampiran');
    }
    const result = await response.json();
    return result.data;
  },

  deleteTemplateAttachment: async (templateId: string, attachmentId: string): Promise<void> => {
    const url = getApiUrl(`/metopen/templates/${templateId}/attachments/${attachmentId}`);
    const response = await apiRequest(url, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menghapus attachment');
    }
  },

  // Publish Tasks
  publishTasks: async (data?: PublishTasksDto): Promise<PublishTasksResponse> => {
    const url = getApiUrl(ENDPOINTS.PUBLISH_TASKS);
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal publish tugas metopen');
    }
    const result = await response.json();
    return result.data;
  },

  updatePublishDeadline: async (data: { templateId: string; classId: string; deadline: string }): Promise<{ updatedCount: number }> => {
    const url = getApiUrl('/metopen/publish-tasks/deadline');
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memperbarui deadline');
    }
    const result = await response.json();
    return result.data;
  },

  deletePublishedTasks: async (data: { templateId: string; classId: string }): Promise<{ deletedCount: number; submittedCount: number }> => {
    const url = getApiUrl('/metopen/publish-tasks');
    const response = await apiRequest(url, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menghapus tugas yang dipublish');
    }
    const result = await response.json();
    return result.data;
  },

  // Publish Stats
  getPublishStats: async (): Promise<PublishStatItem[]> => {
    const url = getApiUrl('/metopen/publish-stats');
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat statistik publish');
    }
    const result = await response.json();
    return result.data;
  },

  // Student Tasks
  getMyTasks: async (): Promise<MyTasksResponse> => {
    const url = getApiUrl(ENDPOINTS.MY_TASKS);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat tugas');
    }
    const result = await response.json();
    return result.data;
  },

  getTaskDetail: async (milestoneId: string): Promise<MetopenTask> => {
    const url = getApiUrl(ENDPOINTS.TASK_DETAIL(milestoneId));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat detail tugas');
    }
    const result = await response.json();
    return result.data;
  },

  submitTask: async (milestoneId: string, data: { notes?: string; files?: File[] }): Promise<MetopenTask> => {
    const url = getApiUrl(ENDPOINTS.SUBMIT(milestoneId));
    const formData = new FormData();
    if (data.notes) formData.append('notes', data.notes);
    if (data.files?.length) {
      for (const f of data.files) formData.append('files', f);
    }

    const response = await apiRequest(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengirim tugas');
    }
    const result = await response.json();
    return result.data;
  },

  // Gate Status (Student)
  getMyGateStatus: async (): Promise<GateStatusResponse> => {
    const url = getApiUrl(ENDPOINTS.MY_GATE_STATUS);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat status gate');
    }
    const result = await response.json();
    return result.data;
  },

  // Grading Queue (Dosen)
  getGradingQueue: async (params?: { status?: string }): Promise<GradingQueueItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const url = getApiUrl(ENDPOINTS.GRADING_QUEUE + (query ? `?${query}` : ''));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat antrian penilaian');
    }
    const result = await response.json();
    return result.data;
  },

  gradeMilestone: async (milestoneId: string, data: GradeDto): Promise<MetopenTask> => {
    const url = getApiUrl(ENDPOINTS.GRADE(milestoneId));
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menilai tugas');
    }
    const result = await response.json();
    return result.data;
  },

  // Progress
  getProgress: async (thesisId: string): Promise<ProgressResponse> => {
    const url = getApiUrl(ENDPOINTS.PROGRESS(thesisId));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat progress');
    }
    const result = await response.json();
    return result.data;
  },

  // Gate Status
  getGateStatus: async (thesisId: string): Promise<GateStatusResponse> => {
    const url = getApiUrl(ENDPOINTS.GATE_STATUS(thesisId));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat status gate');
    }
    const result = await response.json();
    return result.data;
  },

  // Monitoring
  getMonitoringSummary: async (params?: { academicYearId?: string }): Promise<MonitoringSummaryResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.academicYearId) searchParams.set('academicYearId', params.academicYearId);
    const query = searchParams.toString();
    const url = getApiUrl(ENDPOINTS.MONITORING + (query ? `?${query}` : ''));
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat monitoring');
    }
    const result = await response.json();
    return result.data;
  },
};

// ==================== Class Management ====================

export const metopenClassService = {
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const url = getApiUrl('/metopen/academic-years');
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat tahun akademik');
    }
    const result = await response.json();
    return result.data;
  },

  getClasses: async (academicYearId?: string): Promise<MetopenClass[]> => {
    const params = new URLSearchParams();
    if (academicYearId) params.set('academicYearId', academicYearId);
    const query = params.toString();
    const url = getApiUrl(`/metopen/classes${query ? `?${query}` : ''}`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat daftar kelas');
    }
    const result = await response.json();
    return result.data;
  },

  autoSyncClass: async (): Promise<AutoSyncResult> => {
    const url = getApiUrl('/metopen/classes/auto-sync');
    const response = await apiRequest(url, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal sync kelas dari SIA');
    }
    const result = await response.json();
    return result.data;
  },

  getClassById: async (classId: string): Promise<MetopenClass> => {
    const url = getApiUrl(`/metopen/classes/${classId}`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat detail kelas');
    }
    const result = await response.json();
    return result.data;
  },

  createClass: async (data: CreateClassDto): Promise<MetopenClass> => {
    const url = getApiUrl('/metopen/classes');
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal membuat kelas');
    }
    const result = await response.json();
    return result.data;
  },

  updateClass: async (classId: string, data: UpdateClassDto): Promise<MetopenClass> => {
    const url = getApiUrl(`/metopen/classes/${classId}`);
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengupdate kelas');
    }
    const result = await response.json();
    return result.data;
  },

  deleteClass: async (classId: string): Promise<void> => {
    const url = getApiUrl(`/metopen/classes/${classId}`);
    const response = await apiRequest(url, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menghapus kelas');
    }
  },

  enrollStudents: async (classId: string, studentIds: string[]): Promise<{ enrolled: number }> => {
    const url = getApiUrl(`/metopen/classes/${classId}/enroll`);
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menambahkan mahasiswa');
    }
    const result = await response.json();
    return result.data;
  },

  unenrollStudent: async (classId: string, studentId: string): Promise<void> => {
    const url = getApiUrl(`/metopen/classes/${classId}/students/${studentId}`);
    const response = await apiRequest(url, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal menghapus mahasiswa dari kelas');
    }
  },

  publishToClass: async (classId: string, data: PublishToClassDto): Promise<PublishToClassResponse> => {
    const url = getApiUrl(`/metopen/classes/${classId}/publish`);
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal publish tugas ke kelas');
    }
    const result = await response.json();
    return result.data;
  },

  getClassTasks: async (classId: string): Promise<ClassTaskGroup[]> => {
    const url = getApiUrl(`/metopen/classes/${classId}/tasks`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat tugas kelas');
    }
    const result = await response.json();
    return result.data;
  },

  getPublishedTemplateIds: async (classId: string): Promise<string[]> => {
    const url = getApiUrl(`/metopen/classes/${classId}/published-templates`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal memuat template yang sudah di-publish');
    }
    const result = await response.json();
    return result.data;
  },
};
