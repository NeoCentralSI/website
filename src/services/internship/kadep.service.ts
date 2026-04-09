import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { InternshipPendingLetter } from "./types";

export const getKadepPendingLetters = async (academicYearId?: string): Promise<{ success: boolean; data: { applicationLetters: InternshipPendingLetter[], assignmentLetters: InternshipPendingLetter[] } }> => {
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
    type: 'APPLICATION' | 'ASSIGNMENT',
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
