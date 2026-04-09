import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { 
    AdminApprovedProposalItem, 
    AdminAssignmentProposalItem, 
    InternshipTemplate 
} from "./types";

export const verifyCompanyResponse = async (id: string, status: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY', notes?: string, acceptedMemberIds?: string[]): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.VERIFY_COMPANY_RESPONSE(id)), {
        method: "POST",
        body: JSON.stringify({ status, notes, acceptedMemberIds }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memverifikasi surat balasan" }));
        throw new Error(errorData.message || "Gagal memverifikasi surat balasan");
    }
    return res.json();
};

export const getAdminApprovedProposals = async (): Promise<{ success: boolean; data: AdminApprovedProposalItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.APPROVED_PROPOSALS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getAdminProposalLetterDetail = async (id: string): Promise<{ success: boolean; data: AdminApprovedProposalItem }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.APPROVED_PROPOSAL_DETAIL(id));
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat detail pengajuan");
    }
    return res.json();
};

export const updateAdminProposalLetter = async (id: string, body: { documentNumber: string, startDatePlanned?: string, endDatePlanned?: string }): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.UPDATE_LETTER(id));
    const res = await apiRequest(url, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui data surat pengantar" }));
        throw new Error(errorData.message || "Gagal memperbarui data surat pengantar");
    }
    return res.json();
};

export const getAdminAssignmentProposals = async (): Promise<{ success: boolean; data: AdminAssignmentProposalItem[] }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.ASSIGNMENT_PROPOSALS));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getAdminAssignmentLetterDetail = async (id: string): Promise<{ success: boolean; data: AdminAssignmentProposalItem }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.ASSIGNMENT_PROPOSAL_DETAIL(id));
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat detail pengajuan");
    }
    return res.json();
};

export const updateAdminAssignmentLetter = async (id: string, body: { documentNumber: string, startDateActual?: string, endDateActual?: string }): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.UPDATE_ASSIGNMENT_LETTER(id));
    const res = await apiRequest(url, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui data surat tugas" }));
        throw new Error(errorData.message || "Gagal memperbarui data surat tugas");
    }
    return res.json();
};

export const getInternshipTemplate = async (name: string): Promise<{ success: boolean; data: InternshipTemplate }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_TEMPLATES.GET(name)));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat template" }));
        throw new Error(errorData.message || "Gagal memuat template");
    }
    return res.json();
};

export const saveInternshipTemplate = async (name: string, content?: string | null, file?: File | null): Promise<{ success: boolean; message: string }> => {
    const fd = new FormData();
    fd.append("name", name);
    if (content) fd.append("content", content);
    if (file) fd.append("file", file);

    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_TEMPLATES.SAVE), {
        method: "POST",
        body: file ? fd : JSON.stringify({ name, content }),
        headers: file ? {} : { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan template" }));
        throw new Error(errorData.message || "Gagal menyimpan template");
    }
    return res.json();
};
