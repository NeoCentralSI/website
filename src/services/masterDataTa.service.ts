import { getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export interface SupervisorData {
    lecturerId: string;
    name?: string;
    roleId: string;
    roleName?: string;
}

export interface MasterDataThesis {
    id: string;
    title: string | null;
    rating: string;
    startDate: string | null;
    status: string;
    student: {
        id: string;
        nim: string;
        name: string;
    };
    topic: {
        id: string;
        name: string;
    } | null;
    academicYear: {
        id: string;
        semester: string;
        year: number;
    } | null;
    supervisors: SupervisorData[];
}

export const getMasterDataTheses = async (): Promise<MasterDataThesis[]> => {
    const response = await apiRequest(getApiUrl('/master-data-ta'));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil master data tugas akhir");
    }
    const result = await response.json();
    return result.data;
};

export const createMasterDataThesis = async (payload: any): Promise<any> => {
    const response = await apiRequest(getApiUrl('/master-data-ta'), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menambah master data tugas akhir");
    }
    const result = await response.json();
    return result.data;
};

export const updateMasterDataThesis = async (id: string, payload: any): Promise<any> => {
    const response = await apiRequest(getApiUrl(`/master-data-ta/${id}`), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal memperbarui master data tugas akhir");
    }
    const result = await response.json();
    return result.data;
};
