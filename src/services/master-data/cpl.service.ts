import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export interface Cpl {
    id: string;
    code: string;
    description: string;
    minimalScore: number;
    isActive: boolean;
    hasRelatedScores: boolean;
    studentCplScoreCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCplPayload {
    code: string;
    description: string;
    minimalScore: number;
    isActive?: boolean;
}

export type UpdateCplPayload = Partial<CreateCplPayload>;

export interface GetCplsParams {
    status?: 'active' | 'inactive' | 'all';
    search?: string;
    page?: number;
    limit?: number;
}

export type CplStudentScoreSource = 'SIA' | 'manual' | 'MANUAL';
export type CplStudentScoreStatus = 'draft' | 'pending' | 'finalized' | 'failed';

export interface CplStudentScore {
    cplId: string;
    studentId: string;
    score: number;
    source: CplStudentScoreSource;
    sourceLabel: string;
    status: CplStudentScoreStatus;
    result: 'Lulus' | 'Tidak Lulus';
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
    finalizedAt: string | null;
    verifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CplStudentOption {
    id: string;
    fullName: string | null;
    identityNumber: string | null;
    email: string | null;
}

export interface GetCplStudentsParams {
    search?: string;
    source?: 'SIA' | 'MANUAL';
    status?: CplStudentScoreStatus;
}

export interface CreateCplStudentScorePayload {
    studentId: string;
    score: number;
}

export interface UpdateCplStudentScorePayload {
    score: number;
}

export interface CplStudentImportResult {
    totalRows: number;
    successCount: number;
    failedCount: number;
    failedRows: Array<{ row: number; message: string }>;
}

const downloadResponseAsFile = async (response: Response, fallbackFileName: string): Promise<void> => {
    const blob = await response.blob();
    const header = response.headers.get('content-disposition') || '';
    const fileNameMatch = header.match(/filename="?([^\";]+)"?/i);
    const fileName = fileNameMatch?.[1] || fallbackFileName;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

export const getCpls = async (params: GetCplsParams = {}): Promise<{ data: Cpl[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.CPL.BASE)}${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPL');
    }
    const result = await response.json();
    return result; // result should be { success: true, data: [...], total: ... }
};

export const getCplById = async (id: string): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail CPL');
    }
    const result = await response.json();
    return result.data;
};

export const createCpl = async (payload: CreateCplPayload): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data CPL');
    }
    const result = await response.json();
    return result.data;
};

export const updateCpl = async (id: string, payload: UpdateCplPayload): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data CPL');
    }
    const result = await response.json();
    return result.data;
};

export const toggleCpl = async (id: string): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.TOGGLE(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah status CPL');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCpl = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data CPL');
    }
};

export const getCplStudents = async (
    cplId: string,
    params: GetCplStudentsParams = {}
): Promise<{ cpl: Cpl; data: CplStudentScore[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.source) queryParams.append('source', params.source);
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENTS(cplId))}${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil nilai CPL mahasiswa');
    }
    const result = await response.json();
    return {
        cpl: result.cpl,
        data: result.data ?? [],
        total: result.total ?? 0,
    };
};

export const getCplStudentOptions = async (cplId: string, search = ''): Promise<CplStudentOption[]> => {
    const queryString = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiRequest(
        getApiUrl(`${API_CONFIG.ENDPOINTS.CPL.STUDENT_OPTIONS(cplId)}${queryString}`)
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil opsi mahasiswa');
    }
    const result = await response.json();
    return result.data ?? [];
};

export const createCplStudentScore = async (
    cplId: string,
    payload: CreateCplStudentScorePayload
): Promise<CplStudentScore> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENTS(cplId)), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah nilai CPL mahasiswa');
    }
    const result = await response.json();
    return result.data;
};

export const updateCplStudentScore = async (
    cplId: string,
    studentId: string,
    payload: UpdateCplStudentScorePayload
): Promise<CplStudentScore> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENT_BY_ID(cplId, studentId)), {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah nilai CPL mahasiswa');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCplStudentScore = async (cplId: string, studentId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENT_BY_ID(cplId, studentId)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus nilai CPL mahasiswa');
    }
};

export const importCplStudentScores = async (
    cplId: string,
    file: File
): Promise<CplStudentImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENT_IMPORT(cplId)), {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal import nilai CPL mahasiswa');
    }
    const result = await response.json();
    return result.data;
};

export const exportCplStudentScores = async (cplId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.STUDENT_EXPORT(cplId)));
    if (!response.ok) {
        let message = 'Gagal export nilai CPL mahasiswa';
        try {
            const error = await response.json();
            message = error.message || message;
        } catch {
            // Ignore non-JSON export error bodies.
        }
        throw new Error(message);
    }

    await downloadResponseAsFile(response, `nilai-cpl-${cplId}.xlsx`);
};

export const exportAllCplStudentScores = async (): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.EXPORT_ALL_SCORES));
    if (!response.ok) {
        let message = 'Gagal export semua nilai CPL';
        try {
            const error = await response.json();
            message = error.message || message;
        } catch {
            // Ignore non-JSON export error bodies.
        }
        throw new Error(message);
    }

    await downloadResponseAsFile(response, 'nilai-cpl-semua.xlsx');
};
