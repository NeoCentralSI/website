import { getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type { SupervisionClock, ThesisActivityLevel, ThesisLifecycleStatus, ThesisTerminationReason } from '@/lib/thesisLabels';

export interface SupervisorData {
    lecturerId: string;
    name?: string;
    roleId: string;
    roleName?: string;
}

export interface MasterDataThesis {
    id: string;
    title: string | null;
    /** Nilai turunan, baca-saja; null bila TA tidak berstatus Penelitian. */
    activityLevel: ThesisActivityLevel | null;
    supervisionClock?: SupervisionClock | null;
    startDate: string | null;
    status: ThesisLifecycleStatus;
    /** The student is on leave: the thesis is paused ("Cuti" badge). */
    isOnLeave?: boolean;
    terminationReason?: ThesisTerminationReason | null;
    terminationNote?: string | null;
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
        year: string;
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

export const importMasterDataTheses = async (rows: any[]): Promise<any> => {
    const response = await apiRequest(getApiUrl('/master-data-ta/import'), {
        method: 'POST',
        body: JSON.stringify({ rows }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengimport data tugas akhir");
    }
    const result = await response.json();
    return result.data;
};
