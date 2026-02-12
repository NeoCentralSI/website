import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

export interface InternshipProposalItem {
    id: string;
    nama: string;
    nim: string;
    koordinatorAtauMember: string;
    namaCompany: string;
    dokumenProposal: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    dokumenSuratPermohonan: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    status: string;
    memberStatus?: string;
    [key: string]: unknown;
}

export interface InternshipProposalMember {
    id: string;
    studentId: string;
    proposalId: string;
    status: string;
    student: {
        user: {
            fullName: string;
            identityNumber: string;
        }
    }
}

export interface InternshipProposalDetail {
    id: string;
    coordinatorId: string;
    coordinator: {
        user: {
            fullName: string;
            identityNumber: string;
        }
    };
    status: string;
    targetCompany: {
        companyName: string;
        address?: string;
    };
    proposalDocument: {
        id: string;
        fileName: string;
        filePath: string;
    };
    members: InternshipProposalMember[];
    applicationLetters: any[];
    createdAt: string;
    updatedAt: string;
}

export interface CompanyItem {
    id: string;
    companyName: string;
    address: string;
    email: string;
    phone: string;
    status?: string;
}

export interface StudentItem {
    id: string;
    fullName: string;
    identityNumber: string;
    skscompleted: number;
}

export interface SubmitProposalBody {
    coordinatorId: string;
    proposalDocumentId: string;
    academicYearId: string;
    targetCompanyId?: string;
    newCompany?: {
        companyName: string;
        address: string;
        email?: string;
        phone?: string;
    };
    memberIds?: string[];
}

export interface SekdepInternshipProposalItem {
    id: string;
    coordinatorName: string;
    coordinatorNim: string;
    companyName: string;
    status: string;
    memberCount: number;
    createdAt: string;
}

export interface CompanyStatsItem {
    id: string;
    companyName: string;
    address: string;
    status: string;
    proposalCount: number;
    internCount: number;
}

export const getStudentProposals = async (): Promise<{ success: boolean; data: InternshipProposalItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.PROPOSALS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getCompanies = async (): Promise<{ success: boolean; data: CompanyItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.COMPANIES));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar perusahaan" }));
        throw new Error(errorData.message || "Gagal memuat daftar perusahaan");
    }
    return res.json();
};

export const getEligibleStudents = async (): Promise<{ success: boolean; data: StudentItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ELIGIBLE_STUDENTS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar mahasiswa" }));
        throw new Error(errorData.message || "Gagal memuat daftar mahasiswa");
    }
    return res.json();
};

export const submitProposal = async (body: SubmitProposalBody): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.SUBMIT_PROPOSAL), {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal mengajukan proposal");
    }
    return res.json();
};

export const uploadInternshipDocument = async (file: File): Promise<{ success: boolean; documentId: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("module", "internship");

    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPLOAD), {
        method: "POST",
        body: fd,
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal mengunggah dokumen");
    }
    const result = await res.json();
    return {
        success: result.success,
        documentId: result.data.id,
    };
};

export const getProposalDetail = async (id: string): Promise<{ success: boolean; data: InternshipProposalDetail }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.PROPOSALS) + `/${id}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail proposal" }));
        throw new Error(errorData.message || "Gagal memuat detail proposal");
    }
    return res.json();
};

export const respondToInvitation = async (proposalId: string, response: 'ACCEPTED' | 'REJECTED'): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.RESPOND_INVITATION(proposalId));
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ response }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal merespon undangan" }));
        throw new Error(errorData.message || "Gagal merespon undangan");
    }
    return res.json();
};

// Sekdep Methods
export const getSekdepProposals = async (): Promise<{ success: boolean; data: SekdepInternshipProposalItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSALS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getSekdepProposalDetail = async (id: string): Promise<{ success: boolean; data: InternshipProposalDetail }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSAL_DETAIL(id)));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail proposal" }));
        throw new Error(errorData.message || "Gagal memuat detail proposal");
    }
    return res.json();
};

export const getCompanyStats = async (): Promise<{ success: boolean; data: CompanyStatsItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_STATS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat statistik perusahaan" }));
        throw new Error(errorData.message || "Gagal memuat statistik perusahaan");
    }
    return res.json();
};

export const createSekdepCompany = async (body: any): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANIES), {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambahkan perusahaan" }));
        throw new Error(errorData.message || "Gagal menambahkan perusahaan");
    }
    return res.json();
};

export const updateSekdepCompany = async (id: string, body: any): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_DETAIL(id)), {
        method: "PUT",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui perusahaan" }));
        throw new Error(errorData.message || "Gagal memperbarui perusahaan");
    }
    return res.json();
};

export const deleteSekdepCompany = async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_DETAIL(id)), {
        method: "DELETE",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghapus perusahaan" }));
        throw new Error(errorData.message || "Gagal menghapus perusahaan");
    }
    return res.json();
};
