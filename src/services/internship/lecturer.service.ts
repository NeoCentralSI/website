import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { 
    LecturerSupervisedStudent, 
    LecturerGuidanceTimeline, 
    GuidanceWeekDetail, 
    SubmitEvaluationBody 
} from "./types";

export const getLecturerSupervisedStudents = async (): Promise<LecturerSupervisedStudent[]> => {
    const url = getApiUrl('/insternship/activity/guidance/lecturer/students');
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar mahasiswa bimbingan" }));
        throw new Error(errorData.message || "Gagal memuat daftar mahasiswa bimbingan");
    }
    const json = await res.json();
    return json.data;
};

export const getLecturerGuidanceTimeline = async (internshipId: string): Promise<LecturerGuidanceTimeline> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/students/${internshipId}`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat timeline bimbingan" }));
        throw new Error(errorData.message || "Gagal memuat timeline bimbingan");
    }
    const json = await res.json();
    return json.data;
};

export const getLecturerGuidanceWeekDetail = async (internshipId: string, weekNumber: string): Promise<GuidanceWeekDetail> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/students/${internshipId}/week/${weekNumber}`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail bimbingan" }));
        throw new Error(errorData.message || "Gagal memuat detail bimbingan");
    }
    const json = await res.json();
    return json.data;
};

export const submitLecturerEvaluation = async (internshipId: string, weekNumber: string, body: SubmitEvaluationBody): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/students/${internshipId}/week/${weekNumber}/evaluate`);
    const res = await apiRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengirim evaluasi" }));
        throw new Error(errorData.message || "Gagal mengirim evaluasi");
    }
    return res.json();
};

export const verifyFinalReportByLecturer = async (
    internshipId: string,
    status: 'APPROVED' | 'REVISION_NEEDED',
    notes?: string,
    file?: File
): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.VERIFY_FINAL_REPORT(internshipId));
    
    let body: FormData | string;
    let headers: HeadersInit;
    
    if (file) {
        const formData = new FormData();
        formData.append('status', status);
        if (notes) {
            formData.append('notes', notes);
        }
        formData.append('file', file);
        body = formData;
        headers = {};
    } else {
        body = JSON.stringify({ status, notes });
        headers = {
            'Content-Type': 'application/json',
        };
    }
    
    const res = await apiRequest(url, {
        method: 'PUT',
        headers,
        body,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memverifikasi laporan akhir" }));
        throw new Error(errorData.message || "Gagal memverifikasi laporan akhir");
    }
    return res.json();
};

export const validateSeminarAudience = async (seminarId: string, studentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${seminarId}/audience/${studentId}/validate`);
    const res = await apiRequest(url, { method: "POST" });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memvalidasi kehadiran" }));
        throw new Error(errorData.message || "Gagal memvalidasi kehadiran");
    }
    return res.json();
};

export const unvalidateSeminarAudience = async (seminarId: string, studentId: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${seminarId}/audience/${studentId}/unvalidate`);
    const res = await apiRequest(url, { method: "POST" });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal membatalkan validasi" }));
        throw new Error(errorData.message || "Gagal membatalkan validasi");
    }
    return res.json();
};

export const bulkValidateSeminarAudience = async (seminarId: string, studentIds: string[]): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${seminarId}/audience/bulk-validate`);
    const res = await apiRequest(url, { 
        method: "POST",
        body: JSON.stringify({ studentIds })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memvalidasi kehadiran secara massal" }));
        throw new Error(errorData.message || "Gagal memvalidasi kehadiran secara massal");
    }
    return res.json();
};

export const bulkApproveSeminars = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl('/insternship/activity/guidance/lecturer/seminar/bulk-approve');
    const res = await apiRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui seminar secara massal" }));
        throw new Error(errorData.message || "Gagal menyetujui seminar secara massal");
    }
    return res.json();
};
export const updateSeminarNotes = async (id: string, notes: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${id}/notes`);
    const res = await apiRequest(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan catatan seminar" }));
        throw new Error(errorData.message || "Gagal menyimpan catatan seminar");
    }
    return res.json();
};

export const completeSeminar = async (id: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${id}/complete`);
    const res = await apiRequest(url, { method: 'POST' });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyelesaikan seminar" }));
        throw new Error(errorData.message || "Gagal menyelesaikan seminar");
    }
    return res.json();
};

export const getInternshipAssessment = async (internshipId: string): Promise<{ success: boolean; data: any }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/assessment/${internshipId}`);
    const res = await apiRequest(url);
    if (!res.ok) {
        throw new Error("Gagal mengambil data penilaian");
    }
    return res.json();
};

export const submitLecturerAssessment = async (internshipId: string, scores: { chosenRubricId: string; score: number }[]): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/assessment/${internshipId}`);
    const res = await apiRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scores }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan penilaian" }));
        throw new Error(errorData.message || "Gagal menyimpan penilaian");
    }
    return res.json();
};

export const downloadBeritaAcara = async (id: string): Promise<Blob> => {
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/seminar/${id}/berita-acara`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengunduh berita acara" }));
        throw new Error(errorData.message || "Gagal mengunduh berita acara");
    }
    return res.blob();
};

export const getLecturerSupervisorLetter = async (academicYearId?: string): Promise<any> => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const url = getApiUrl(`/insternship/activity/guidance/lecturer/supervisor-letter${query}`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat surat tugas" }));
        throw new Error(errorData.message || "Gagal memuat surat tugas");
    }
    const json = await res.json();
    return json.data;
};
