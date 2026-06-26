import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { InternshipPendingLetter } from "./types";

export const getKadepPendingLetters = async (academicYearId?: string): Promise<{ success: boolean; data: { applicationLetters: InternshipPendingLetter[], assignmentLetters: InternshipPendingLetter[], supervisorLetters: InternshipPendingLetter[], pendingReplacements?: any[] } }> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.PENDING_LETTERS);
    if (academicYearId) {
        url += `?academicYear=${academicYearId}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar surat" }));
        throw new Error(errorData.message || "Gagal memuat daftar surat");
    }
    return res.json();
};

export const approveKadepLetter = async (
    id: string,
    type: 'APPLICATION' | 'ASSIGNMENT' | 'LECTURER_ASSIGNMENT',
    signaturePositions?: { x: number, y: number, pageNumber: number }[]
): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.APPROVE_LETTER), {
        method: "POST",
        body: JSON.stringify({ id, type, signaturePositions }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui surat" }));
        throw new Error(errorData.message || "Gagal menyetujui surat");
    }
    return res.json();
};

export const approveReplacementRequest = async (requestId: string) => {
    const res = await apiRequest(getApiUrl(`/insternship/kadep/replacement-request/${requestId}/approve`), {
        method: "PATCH"
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui" }));
        throw new Error(errorData.message || "Gagal menyetujui");
    }
    return res.json();
};

export const rejectReplacementRequest = async (requestId: string, notes?: string) => {
    const res = await apiRequest(getApiUrl(`/insternship/kadep/replacement-request/${requestId}/reject`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menolak" }));
        throw new Error(errorData.message || "Gagal menolak");
    }
    return res.json();
};
