import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "@/services/auth.service";

export type CplScoreSource = "SIA" | "manual";
export type CplScoreStatus = "calculated" | "verified" | "finalized";

export interface StudentCplScore {
    studentId: string;
    cplId: string;
    score: number;
    source: CplScoreSource;
    status: CplScoreStatus;
    inputBy: string | null;
    inputAt: string | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
    finalizedAt: string | null;
    updatedAt: string | null;
    student: {
        id: string;
        fullName: string | null;
        identityNumber: string | null;
        email: string | null;
    } | null;
    cpl: {
        id: string;
        code: string | null;
        description: string;
        minimalScore: number;
        isActive: boolean;
    } | null;
}

export interface StudentCplScoreFilters {
    studentId?: string;
    cplId?: string;
    source?: "SIA" | "MANUAL";
    status?: CplScoreStatus;
}

export interface CreateStudentCplScorePayload {
    studentId: string;
    cplId: string;
    score: number;
}

export interface UpdateStudentCplScorePayload {
    score: number;
}

export interface StudentCplImportFailedRow {
    row: number;
    studentId: string | null;
    cplCode: string | null;
    error: string;
}

export interface StudentCplImportResult {
    total: number;
    success: number;
    failed: number;
    failedRows: StudentCplImportFailedRow[];
}

const buildQuery = (filters: StudentCplScoreFilters) => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append("studentId", filters.studentId);
    if (filters.cplId) params.append("cplId", filters.cplId);
    if (filters.source) params.append("source", filters.source);
    if (filters.status) params.append("status", filters.status);
    return params.toString();
};

export const getStudentCplScores = async (
    filters: StudentCplScoreFilters
): Promise<{ data: StudentCplScore[]; total: number }> => {
    const query = buildQuery(filters);
    const endpoint = query
        ? `${API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE}?${query}`
        : API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE;
    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil data nilai CPL mahasiswa");
    }
    const result = await response.json();
    return { data: result.data ?? [], total: result.total ?? 0 };
};

export const getStudentCplScoreDetail = async (studentId: string, cplId: string): Promise<StudentCplScore> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId))
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil detail nilai CPL mahasiswa");
    }
    const result = await response.json();
    return result.data;
};

export const createStudentCplScore = async (
    payload: CreateStudentCplScorePayload
): Promise<StudentCplScore> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE), {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menambahkan nilai CPL manual");
    }
    const result = await response.json();
    return result.data;
};

export const updateStudentCplScore = async (
    studentId: string,
    cplId: string,
    payload: UpdateStudentCplScorePayload
): Promise<StudentCplScore> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId)),
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengubah nilai CPL manual");
    }
    const result = await response.json();
    return result.data;
};

export const deleteStudentCplScore = async (studentId: string, cplId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId)),
        {
            method: "DELETE",
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus nilai CPL manual");
    }
};

export const importStudentCplScores = async (file: File): Promise<StudentCplImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.IMPORT), {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal import nilai CPL manual");
    }
    const result = await response.json();
    return result.data;
};

const downloadBlob = async (endpoint: string, fallbackName: string) => {
    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        let message = "Gagal mengunduh file";
        try {
            const error = await response.json();
            message = error.message || message;
        } catch {
            // noop
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || fallbackName;
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const downloadStudentCplTemplate = async () => {
    await downloadBlob(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.TEMPLATE, "student-cpl-score-template.xlsx");
};

export const exportStudentCplScores = async () => {
    await downloadBlob(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.EXPORT, "student-cpl-scores.xlsx");
};
