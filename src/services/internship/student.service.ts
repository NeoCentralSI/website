import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { 
    InternshipProposalItem, 
    SubmitProposalBody, 
    CompanyItem, 
    StudentItem,
    StudentLogbookData,
    SeminarScheduleData,
    UpcomingSeminarItem,
    StudentGuidance
} from "./types";

export const getStudentProposals = async (academicYearId?: string): Promise<{ success: boolean; data: InternshipProposalItem[] }> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.PROPOSALS);
    if (academicYearId) {
        url += `?academicYear=${academicYearId}`;
    }
    const res = await apiRequest(url);
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

export const getWorkingDaysCount = async (startDate: string, endDate: string): Promise<{ success: boolean; data: number }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.REGISTRATION + "/working-days") + `?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghitung hari kerja" }));
        throw new Error(errorData.message || "Gagal menghitung hari kerja");
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

export const updateProposal = async (id: string, body: SubmitProposalBody): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.PROPOSALS) + `/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memperbarui proposal");
    }
    return res.json();
};

export const deleteProposal = async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.PROPOSALS) + `/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menghapus proposal");
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

export const submitCompanyResponse = async (proposalId: string, documentId: string, acceptedMemberIds?: string[]): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.SUBMIT_COMPANY_RESPONSE(proposalId));
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId, acceptedMemberIds }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah surat balasan" }));
        throw new Error(errorData.message || "Gagal mengunggah surat balasan");
    }
    return res.json();
};

export const getStudentLogbooks = async (): Promise<{ success: boolean; data: StudentLogbookData }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.LOGBOOK));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat logbook" }));
        throw new Error(errorData.message || "Gagal memuat logbook");
    }
    return res.json();
};

export const updateLogbookEntry = async (id: string, activityDescription: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPDATE_LOGBOOK(id)), {
        method: "PUT",
        body: JSON.stringify({ activityDescription }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui logbook" }));
        throw new Error(errorData.message || "Gagal memperbarui logbook");
    }
    return res.json();
};

export const updateInternshipDetails = async (body: { fieldSupervisorName: string; fieldSupervisorEmail: string; unitSection: string }): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPDATE_DETAILS), {
        method: "PUT",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui informasi KP" }));
        throw new Error(errorData.message || "Gagal memperbarui informasi KP");
    }
    return res.json();
};

export const submitCompletionCertificate = async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/certificate";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah sertifikat" }));
        throw new Error(errorData.message || "Gagal mengunggah sertifikat");
    }
    return res.json();
};

export const submitCompanyReceipt = async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/receipt";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah tanda terima" }));
        throw new Error(errorData.message || "Gagal mengunggah tanda terima");
    }
    return res.json();
};

export const submitLogbookDocument = async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/logbook-doc";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah logbook" }));
        throw new Error(errorData.message || "Gagal mengunggah logbook");
    }
    return res.json();
};

export const submitInternshipReport = async (title: string, documentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/report";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ title, documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah laporan" }));
        throw new Error(errorData.message || "Gagal mengunggah laporan");
    }
    return res.json();
};

export const submitFinalFixReport = async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/final-fix-report";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah laporan final" }));
        throw new Error(errorData.message || "Gagal mengunggah laporan final");
    }
    return res.json();
};

export const submitCompanyReport = async (documentId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data?: { 
        assessmentInfo?: { 
            assessmentUrl: string;
            message: string;
            email: string;
            expiresAt: string;
        } 
    } 
}> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.ACTIVITY) + "/company-report";
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunggah laporan akhir instansi" }));
        throw new Error(errorData.message || "Gagal mengunggah laporan akhir instansi");
    }
    return res.json();
};

export const registerSeminar = async (data: SeminarScheduleData): Promise<{ success: boolean; message: string; data: any }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.REGISTER_SEMINAR);
    const res = await apiRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengajukan seminar" }));
        throw new Error(errorData.message || "Gagal mengajukan seminar");
    }
    return res.json();
};

export const getUpcomingSeminars = async (): Promise<UpcomingSeminarItem[]> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPCOMING_SEMINARS);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat jadwal seminar" }));
        throw new Error(errorData.message || "Gagal memuat jadwal seminar");
    }
    const json = await res.json();
    return json.data;
};

export const updateSeminarProposal = async (seminarId: string, data: SeminarScheduleData): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPDATE_SEMINAR(seminarId));
    const res = await apiRequest(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui jadwal seminar" }));
        throw new Error(errorData.message || "Gagal memperbarui jadwal seminar");
    }
    return res.json();
};

export const approveSeminar = async (seminarId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.APPROVE_SEMINAR(seminarId));
    const res = await apiRequest(url, { method: "POST" });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui seminar" }));
        throw new Error(errorData.message || "Gagal menyetujui seminar");
    }
    return res.json();
};

export const rejectSeminar = async (seminarId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.REJECT_SEMINAR(seminarId));
    const res = await apiRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menolak seminar" }));
        throw new Error(errorData.message || "Gagal menolak seminar");
    }
    return res.json();
};

export const registerSeminarAudience = async (seminarId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(`/insternship/activity/seminars/${seminarId}/audience`), {
        method: "POST"
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mendaftar seminar" }));
        throw new Error(errorData.message || "Gagal mendaftar seminar");
    }
    return res.json();
};

export const unregisterSeminarAudience = async (seminarId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(`/insternship/activity/seminars/${seminarId}/audience`), {
        method: "DELETE"
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal membatalkan pendaftaran" }));
        throw new Error(errorData.message || "Gagal membatalkan pendaftaran");
    }
    return res.json();
};

export const getStudentGuidance = async (): Promise<StudentGuidance> => {
    const url = getApiUrl('/insternship/activity/guidance');
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat bimbingan" }));
        throw new Error(errorData.message || "Gagal memuat bimbingan");
    }
    const json = await res.json();
    return json.data;
};

export const submitGuidanceResponse = async (data: { weekNumber: number; answers: Record<string, string> }) => {
    const url = getApiUrl('/insternship/activity/guidance/submit');
    const res = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengirim bimbingan" }));
        throw new Error(errorData.message || "Gagal mengirim bimbingan");
    }
    return res.json();
};

export const downloadLogbookPdf = async (): Promise<Blob> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.LOGBOOK) + "/download");
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunduh PDF" }));
        throw new Error(errorData.message || "Gagal mengunduh PDF");
    }
    return res.blob();
};

export const downloadLogbookDocx = async (): Promise<Blob> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.LOGBOOK) + "/download-docx");
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunduh DOCX" }));
        throw new Error(errorData.message || "Gagal mengunduh DOCX");
    }
    return res.blob();
};
