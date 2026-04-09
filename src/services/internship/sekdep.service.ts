import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { 
    SekdepRegistrationItem, 
    InternshipProposalDetail, 
    CompanyStatsItem, 
    InternshipListItem,
    SekdepInternshipDetail,
    LecturerWorkloadItem,
    SekdepSupervisorLetterDetail,
    InternshipTemplate,
    GuidanceQuestion,
    GuidanceCriteria,
    InternshipCpmk,
    InternshipAssessmentRubric
} from "./types";

export const getSekdepProposals = async (academicYearId?: string): Promise<{ success: boolean; data: SekdepRegistrationItem[] }> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSALS);
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYear=${academicYearId}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getSekdepPendingProposals = async (
    academicYearId?: string,
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<{ success: boolean; data: SekdepRegistrationItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (academicYearId && academicYearId !== 'all') params.append('academicYear', academicYearId);
    if (q) params.append('q', q);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSALS)}/pending?${params.toString()}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar pengajuan" }));
        throw new Error(errorData.message || "Gagal memuat daftar pengajuan");
    }
    return res.json();
};

export const getSekdepPendingResponses = async (
    academicYearId?: string,
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<{ success: boolean; data: SekdepRegistrationItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (academicYearId && academicYearId !== 'all') params.append('academicYear', academicYearId);
    if (q) params.append('q', q);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSALS)}/responses?${params.toString()}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar balasan" }));
        throw new Error(errorData.message || "Gagal memuat daftar balasan");
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

export const createSekdepCompany = async (body: any, role: 'sekdep' | 'kadep' = 'sekdep'): Promise<{ success: boolean; message: string; data: any }> => {
    const endpoint = role === 'kadep' ? API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.COMPANIES : API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANIES;
    const res = await apiRequest(getApiUrl(endpoint), {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambahkan perusahaan" }));
        throw new Error(errorData.message || "Gagal menambahkan perusahaan");
    }
    return res.json();
};

export const updateSekdepCompany = async (id: string, body: any, role: 'sekdep' | 'kadep' = 'sekdep'): Promise<{ success: boolean; message: string; data: any }> => {
    const endpoint = role === 'kadep' ? API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.COMPANY_DETAIL(id) : API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_DETAIL(id);
    const res = await apiRequest(getApiUrl(endpoint), {
        method: "PUT",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui perusahaan" }));
        throw new Error(errorData.message || "Gagal memperbarui perusahaan");
    }
    return res.json();
};

export const deleteSekdepCompany = async (id: string, role: 'sekdep' | 'kadep' = 'sekdep'): Promise<{ success: boolean; message: string }> => {
    const endpoint = role === 'kadep' ? API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.COMPANY_DETAIL(id) : API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_DETAIL(id);
    const res = await apiRequest(getApiUrl(endpoint), {
        method: "DELETE",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghapus perusahaan" }));
        throw new Error(errorData.message || "Gagal menghapus perusahaan");
    }
    return res.json();
};

export const respondToSekdepProposal = async (id: string, response: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL', notes?: string): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.PROPOSAL_DETAIL(id)) + '/respond';
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify({ response, notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal merespon proposal" }));
        throw new Error(errorData.message || "Gagal merespon proposal");
    }
    return res.json();
};

export const getSekdepInternshipList = async (
    academicYearId?: string,
    status?: string,
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    supervisorId?: string
): Promise<{ success: boolean; data: InternshipListItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (academicYearId && academicYearId !== 'all') params.append('academicYear', academicYearId);
    if (status && status !== 'all') params.append('status', status);
    if (q) params.append('q', q);
    if (supervisorId) params.append('supervisorId', supervisorId);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.INTERNSHIPS)}?${params.toString()}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar mahasiswa" }));
        throw new Error(errorData.message || "Gagal memuat daftar mahasiswa");
    }
    return res.json();
};

export const bulkAssignSupervisor = async (
    internshipIds: string[],
    supervisorId: string
): Promise<{ success: boolean; message: string }> => {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.INTERNSHIPS)}/bulk-assign`;
    const res = await apiRequest(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ internshipIds, supervisorId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menetapkan pembimbing" }));
        throw new Error(errorData.message || "Gagal menetapkan pembimbing");
    }
    return res.json();
};

export const getSekdepInternshipDetail = async (id: string): Promise<{ success: boolean; data: SekdepInternshipDetail }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.INTERNSHIPS_DETAIL(id));
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail pelaksanaan KP" }));
        throw new Error(errorData.message || "Gagal memuat detail pelaksanaan KP");
    }
    return res.json();
};

export const verifyInternshipDocument = async (
    id: string,
    documentType: 'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument',
    status: 'APPROVED' | 'REVISION_NEEDED',
    notes?: string
): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.VERIFY_DOCUMENT(id));
    const res = await apiRequest(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentType, status, notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memverifikasi dokumen" }));
        throw new Error(errorData.message || "Gagal memverifikasi dokumen");
    }
    return res.json();
};

export const bulkVerifyInternshipDocuments = async (
    id: string,
    documents: Array<{ documentType: 'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument', status?: 'APPROVED' | 'REVISION_NEEDED', notes?: string }>,
    status?: 'APPROVED' | 'REVISION_NEEDED',
    notes?: string
): Promise<{ success: boolean; message: string; results: Array<{ documentType: string; status: string; success: boolean }> }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.VERIFY_DOCUMENTS_BULK(id));
    const res = await apiRequest(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents, status, notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memverifikasi dokumen" }));
        throw new Error(errorData.message || "Gagal memverifikasi dokumen");
    }
    return res.json();
};

export const sendFieldAssessmentRequest = async (
    internshipId: string
): Promise<{ success: boolean; message: string; email: string; expiresAt: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.SEND_FIELD_ASSESSMENT(internshipId));
    const res = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal mengirim link penilaian" }));
        throw new Error(errorData.message || "Gagal mengirim link penilaian");
    }
    return res.json();
};

export const getSekdepLecturerWorkload = async (
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    academicYearId?: string
): Promise<{ success: boolean; data: LecturerWorkloadItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (academicYearId && academicYearId !== 'all') params.append('academicYearId', academicYearId);

    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.LECTURERS_WORKLOAD)}?${params.toString()}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar beban kerja dosen" }));
        throw new Error(errorData.message || "Gagal memuat daftar beban kerja dosen");
    }
    return res.json();
};

export const getSekdepSupervisorLetterDetail = async (supervisorId: string): Promise<{ success: boolean; data: SekdepSupervisorLetterDetail }> => {
    const url = getApiUrl(`/insternship/sekdep/lecturers/${supervisorId}/supervisor-letter`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail surat tugas dosen" }));
        throw new Error(errorData.message || "Gagal memuat detail surat tugas dosen");
    }
    return res.json();
};

export const updateSekdepSupervisorLetter = async (
    supervisorId: string, 
    data: { documentNumber: string; startDate: string; endDate: string; internshipIds: string[] }
): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/sekdep/lecturers/${supervisorId}/supervisor-letter`);
    const res = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan surat tugas dosen" }));
        throw new Error(errorData.message || "Gagal menyimpan surat tugas dosen");
    }
    return res.json();
};

export const exportLecturerWorkloadPdf = async (): Promise<void> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.LECTURERS_WORKLOAD_EXPORT);
    const res = await apiRequest(url);
    if (!res.ok) {
        throw new Error("Gagal mengekspor PDF");
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Daftar_Bimbingan_KP.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
};

export const getSekdepInternshipTemplate = async (
    name: string
): Promise<{ success: boolean; data: InternshipTemplate }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.TEMPLATES_GET(name));
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat template" }));
        throw new Error(errorData.message || "Gagal memuat template");
    }
    return res.json();
};

export const saveSekdepInternshipTemplate = async (
    name: string,
    file?: File | null
): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.TEMPLATES_SAVE);
    const formData = new FormData();
    formData.append("name", name);
    if (file) formData.append("file", file);

    const res = await apiRequest(url, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan template" }));
        throw new Error(errorData.message || "Gagal menyimpan template");
    }
    return res.json();
};

export const getGuidanceQuestions = async (academicYearId?: string): Promise<GuidanceQuestion[]> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_QUESTIONS);
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYearId=${academicYearId}`;
    }
    const res = await apiRequest(url);
    const json = await res.json();
    return json.data;
};

export const createGuidanceQuestion = async (data: { weekNumber: number; questionText: string; orderIndex?: number; academicYearId?: string }) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_QUESTIONS);
    const res = await apiRequest(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return res.json();
};

export const updateGuidanceQuestion = async (id: string, data: Partial<{ weekNumber: number; questionText: string; orderIndex: number }>) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_QUESTION_DETAIL(id));
    const res = await apiRequest(url, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return res.json();
};

export const deleteGuidanceQuestion = async (id: string) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_QUESTION_DETAIL(id));
    const res = await apiRequest(url, { method: 'DELETE' });
    return res.json();
};

export const getGuidanceCriteria = async (academicYearId?: string): Promise<GuidanceCriteria[]> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_CRITERIA);
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYearId=${academicYearId}`;
    }
    const res = await apiRequest(url);
    const json = await res.json();
    return json.data;
};

export const createGuidanceCriteria = async (data: { criteriaName: string; weekNumber: number; inputType: 'EVALUATION' | 'TEXT'; orderIndex?: number; options?: string[]; academicYearId?: string }) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_CRITERIA);
    const res = await apiRequest(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return res.json();
};

export const updateGuidanceCriteria = async (id: string, data: Partial<{ criteriaName: string; weekNumber: number; inputType: 'EVALUATION' | 'TEXT'; orderIndex: number; options?: string[] }>) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_CRITERIA_DETAIL(id));
    const res = await apiRequest(url, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return res.json();
};

export const deleteGuidanceCriteria = async (id: string) => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.GUIDANCE_CRITERIA_DETAIL(id));
    const res = await apiRequest(url, { method: 'DELETE' });
    return res.json();
};

export const getInternshipCpmks = async (academicYearId?: string): Promise<InternshipCpmk[]> => {
    let url = getApiUrl('/insternship/sekdep/cpmk');
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYearId=${academicYearId}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat data CPMK" }));
        throw new Error(errorData.message || "Gagal memuat data CPMK");
    }
    const json = await res.json();
    return json.data;
};

export const getInternshipCpmkById = async (id: string): Promise<InternshipCpmk> => {
    const url = getApiUrl(`/insternship/sekdep/cpmk/${id}`);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail CPMK" }));
        throw new Error(errorData.message || "Gagal memuat detail CPMK");
    }
    const json = await res.json();
    return json.data;
};

export const createInternshipCpmk = async (data: Partial<InternshipCpmk> & { academicYearId?: string }): Promise<InternshipCpmk> => {
    const url = getApiUrl('/insternship/sekdep/cpmk');
    const res = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambah CPMK" }));
        throw new Error(errorData.message || "Gagal menambah CPMK");
    }
    const json = await res.json();
    return json.data;
};

export const updateInternshipCpmk = async (id: string, data: Partial<InternshipCpmk>): Promise<InternshipCpmk> => {
    const url = getApiUrl(`/insternship/sekdep/cpmk/${id}`);
    const res = await apiRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui CPMK" }));
        throw new Error(errorData.message || "Gagal memperbarui CPMK");
    }
    const json = await res.json();
    return json.data;
};

export const deleteInternshipCpmk = async (id: string): Promise<void> => {
    const url = getApiUrl(`/insternship/sekdep/cpmk/${id}`);
    const res = await apiRequest(url, { method: 'DELETE' });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghapus CPMK" }));
        throw new Error(errorData.message || "Gagal menghapus CPMK");
    }
};

export const createInternshipRubric = async (data: Partial<InternshipAssessmentRubric>): Promise<InternshipAssessmentRubric> => {
    const url = getApiUrl('/insternship/sekdep/rubrics');
    const res = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambah rubrik" }));
        throw new Error(errorData.message || "Gagal menambah rubrik");
    }
    const json = await res.json();
    return json.data;
};

export const updateInternshipRubric = async (id: string, data: Partial<InternshipAssessmentRubric>): Promise<InternshipAssessmentRubric> => {
    const url = getApiUrl(`/insternship/sekdep/rubrics/${id}`);
    const res = await apiRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui rubrik" }));
        throw new Error(errorData.message || "Gagal memperbarui rubrik");
    }
    const json = await res.json();
    return json.data;
};

export const deleteInternshipRubric = async (id: string): Promise<void> => {
    const url = getApiUrl(`/insternship/sekdep/rubrics/${id}`);
    const res = await apiRequest(url, { method: 'DELETE' });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghapus rubrik" }));
        throw new Error(errorData.message || "Gagal menghapus rubrik");
    }
};

export const bulkUpdateInternshipRubrics = async (cpmkId: string, rubrics: Partial<InternshipAssessmentRubric>[]): Promise<{ success: boolean; message: string }> => {
    const url = getApiUrl(`/insternship/sekdep/cpmk/${cpmkId}/rubrics/bulk`);
    const res = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubrics })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan rubrik secara massal" }));
        throw new Error(errorData.message || "Gagal menyimpan rubrik secara massal");
    }
    return res.json();
};

/**
 * Duplicates all CPMKs and their rubrics from one academic year to another.
 */
export const copyInternshipCpmks = async (fromYearId: string, toYearId: string): Promise<{ success: boolean; data: any }> => {
  const url = getApiUrl('/insternship/sekdep/cpmk/copy');
  const res = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromYearId, toYearId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal menduplikasi CPMK" }));
    throw new Error(errorData.message || "Gagal menduplikasi CPMK");
  }
  return res.json();
};

/**
 * Duplicates all guidance questions and lecturer criteria from one academic year to another.
 */
export const copyInternshipGuidance = async (fromYearId: string, toYearId: string): Promise<{ success: boolean; data: any }> => {
  const url = getApiUrl('/insternship/sekdep/guidance/copy');
  const res = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromYearId, toYearId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal menduplikasi data bimbingan" }));
    throw new Error(errorData.message || "Gagal menduplikasi data bimbingan");
  }
  return res.json();
};

export const getCompanyStats = async (
    role: 'admin' | 'sekdep' | 'kadep' = 'sekdep',
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string
): Promise<{ success: boolean; data: CompanyStatsItem[]; total: number }> => {
    let endpoint = API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.COMPANY_STATS;
    if (role === 'admin') endpoint = API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.COMPANY_STATS;
    else if (role === 'kadep') endpoint = API_CONFIG.ENDPOINTS.INTERNSHIP_KADEP.COMPANY_STATS;

    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (status && status !== 'all') params.append('status', status);

    const res = await apiRequest(`${getApiUrl(endpoint)}?${params.toString()}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat statistik perusahaan" }));
        throw new Error(errorData.message || "Gagal memuat statistik perusahaan");
    }
    return res.json();
};
