import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

export interface InternshipProposalItem {
    id: string;
    nama: string;
    nim: string;
    koordinatorAtauMember: string;
    namaCompany: string;
    targetCompanyId?: string;
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
    academicYearName?: string;
    isSigned?: boolean;
    isAssignmentSigned?: boolean;
    memberStatus?: string;
    responseStatus?: string;
    dokumenSuratBalasan?: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    dokumenSuratTugas?: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    proposalSekdepNotes?: string | null;
    companyResponseSekdepNotes?: string | null;
    members?: { id: string; name: string; nim: string; role: string; status: string }[];
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
    targetCompanyId: string;
    status: string;
    targetCompany: {
        companyName: string;
        companyAddress?: string;
    };
    proposalDocument: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    internships: {
        id: string;
        studentId: string;
        status: string;
        student: {
            user: {
                fullName: string;
                identityNumber: string;
            }
        }
    }[];
    appLetterDoc: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    companyResponseDoc: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    assignLetterDoc: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    companyResponseSekdepNotes?: string | null;
    companyResponseStatus?: string | null;
    isSigned?: boolean;
    isAssignmentSigned?: boolean;
    proposalSekdepNotes?: string | null;
    academicYearName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InternshipListItem {
    id: string;
    nim: string;
    name: string;
    companyName: string;
    academicYearName: string;
    supervisorName: string;
    fieldSupervisorName: string;
    logbookProgress: {
        filled: number;
        total: number;
    };
    status: string;
    createdAt: string;
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

export interface SekdepRegistrationItem {
    id: string;
    coordinatorName: string;
    coordinatorNim: string;
    companyName: string;
    status: string;
    proposalSekdepNotes?: string | null;
    companyResponseSekdepNotes?: string | null;
    sekdepNotes?: string | null;
    academicYearName?: string;
    memberCount: number;
    acceptedMemberCount: number;
    members?: { id: string; name: string; nim: string; role: string; status: string }[];
    createdAt: string;
    updatedAt?: string;
    isSigned?: boolean;
    isAssignmentSigned?: boolean;
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
    dokumenSuratBalasan?: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    dokumenSuratTugas?: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
}

export interface CompanyStatsItem {
    id: string;
    companyName: string;
    address: string;
    status: string;
    proposalCount: number;
    internCount: number;
}

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

// Sekdep Methods
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

/**
 * Fetch all companies with stats for admin/sekdep/kadep.
 */
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



export const verifyCompanyResponse = async (id: string, status: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY', notes?: string, acceptedMemberIds?: string[]): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.VERIFY_COMPANY_RESPONSE(id)), {
        method: "POST",
        body: JSON.stringify({ status, notes, acceptedMemberIds }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memverifikasi surat balasan" }));
        throw new Error(errorData.message || "Gagal memverifikasi surat balasan");
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

export interface AdminApprovedProposalItem {
    id: string;
    coordinatorName: string;
    coordinatorNim: string;
    companyName: string;
    companyAddress?: string;
    members: { name: string; nim: string; isCoordinator: boolean }[];
    letterNumber: string;
    letterFile: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    period: {
        start: string;
        end: string;
    } | null;
    isSigned: boolean;
    updatedAt: string;
}

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
/**
 * Fetch list of internships for Sekdep with filters and pagination.
 */
export const getSekdepInternshipList = async (
    academicYearId?: string,
    status?: string,
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<{ success: boolean; data: InternshipListItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (academicYearId && academicYearId !== 'all') params.append('academicYear', academicYearId);
    if (status && status !== 'all') params.append('status', status);
    if (q) params.append('q', q);
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

/**
 * Assign supervisor to multiple internships in bulk.
 */
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

export interface SekdepInternshipDetail {
    id: string;
    student: {
        nim: string;
        name: string;
        enrollmentYear?: number;
    };
    company: {
        name: string;
        address: string;
        unitSection: string;
    };
    supervisor: {
        name: string;
        fieldSupervisor: string;
    };
    logbookProgress: {
        filled: number;
        total: number;
    };
    guidanceProgress: {
        filled: number;
        total: number;
    };
    seminar: {
        id: string;
        status: string;
    } | null;
    assessment: {
        lecturerStatus: string;
        fieldStatus: string;
        finalScore: number | null;
        finalGrade: string | null;
    };
    status: string;
    academicYearName: string;
    createdAt: string;
}

export const getSekdepInternshipDetail = async (id: string): Promise<{ success: boolean; data: SekdepInternshipDetail }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.INTERNSHIPS_DETAIL(id));
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail pelaksanaan KP" }));
        throw new Error(errorData.message || "Gagal memuat detail pelaksanaan KP");
    }
    return res.json();
};

export interface AdminAssignmentProposalItem extends AdminApprovedProposalItem {
    responseId?: string;
}

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

export interface InternshipTemplate {
    id: string;
    name: string;
    type: "HTML" | "DOCX";
    content: string | null;
    filePath: string | null;
}

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
        // Note: apiRequest handles headers, but for FormData we must let the browser set it
        headers: file ? {} : { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menyimpan template" }));
        throw new Error(errorData.message || "Gagal menyimpan template");
    }
    return res.json();
};

export interface InternshipPendingLetter {
    id: string;
    type: 'APPLICATION' | 'ASSIGNMENT';
    documentNumber: string;
    coordinatorName: string;
    coordinatorNim: string;
    coordinatorStudentId: string;
    coordinatorStatus: string;
    companyName: string;
    members: { studentId: string; name: string; nim: string; status: string }[];
    acceptedMemberCount: number;
    createdAt: string;
    signedById: string | null;
    document: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
}

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

export const verifyInternshipLetter = async (id: string) => {
    const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_PUBLIC.VERIFY_LETTER(id)));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Dokumen tidak valid atau tidak ditemukan." }));
        throw new Error(errorData.message || "Gagal memverifikasi surat");
    }
    return res.json();
};
export interface InternshipLogbookItem {
    id: string;
    internshipId: string;
    activityDate: string;
    activityDescription: string;
    internshipNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface StudentLogbookData {
    internship: {
        id: string;
        fieldSupervisorName: string | null;
        unitSection: string | null;
        student?: {
            user: {
                fullName: string;
                identityNumber: string;
            }
        };
        proposal: {
            targetCompany: {
                companyName: string;
            }
        }
    } | null;
    logbooks: InternshipLogbookItem[];
}

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

export const updateInternshipDetails = async (body: { fieldSupervisorName: string; unitSection: string }): Promise<{ success: boolean; message: string }> => {
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
export interface LecturerWorkloadItem {
    id: string;
    name: string;
    nip: string;
    activeInternshipCount: number;
}

export const getSekdepLecturerWorkload = async (
    q?: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<{ success: boolean; data: LecturerWorkloadItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.LECTURERS_WORKLOAD)}?${params.toString()}`;
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar beban kerja dosen" }));
        throw new Error(errorData.message || "Gagal memuat daftar beban kerja dosen");
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
    link.setAttribute('download', 'Daftar_Bimbingan_KP.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

// ==================== Guidance Master Data ====================

export interface GuidanceQuestion {
    id: string;
    weekNumber: number;
    questionText: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface GuidanceCriteria {
    id: string;
    criteriaName: string;
    weekNumber: number;
    inputType: 'EVALUATION' | 'TEXT';
    orderIndex: number;
    options: { id: string; optionText: string; orderIndex: number }[];
    createdAt: string;
    updatedAt: string;
}

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

// ==================== Student Guidance ====================

export interface StudentGuidanceQuestion {
    id: string;
    questionText: string;
    answer: string;
}

export interface StudentGuidanceTimeline {
    weekNumber: number;
    startDate: string;
    endDate: string;
    status: 'NOT_AVAILABLE' | 'OPEN' | 'LATE' | 'SUBMITTED' | 'APPROVED';
    questions: StudentGuidanceQuestion[];
    lecturerEvaluation: {
        criteriaId: string;
        criteriaName: string;
        evaluationValue: string | null;
        answerText: string;
        inputType: 'EVALUATION' | 'TEXT';
    }[];
}

export interface StudentGuidance {
    internshipId: string;
    supervisorName: string | null;
    currentWeek: number;
    timeline: StudentGuidanceTimeline[];
}

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

// ==================== Lecturer Guidance API ====================

export interface LecturerSupervisedStudent {
    internshipId: string;
    studentName: string;
    studentNim: string;
    companyName: string;
    startDate: string;
    endDate: string;
    status: string;
    progress: {
        totalWeeks: number;
        submittedCount: number;
        approvedCount: number;
    }
}

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

export interface LecturerGuidanceTimeline {
    internshipId: string;
    studentName: string;
    studentNim: string;
    currentWeek: number;
    timeline: {
        weekNumber: number;
        startDate: string;
        endDate: string;
        status: 'NOT_AVAILABLE' | 'OPEN' | 'LATE' | 'SUBMITTED' | 'APPROVED';
        submissionDate: string | null;
    }[];
}

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

export interface GuidanceWeekDetail {
    internshipId: string;
    studentName: string;
    studentNim: string;
    weekNumber: number;
    sessionStatus: 'NOT_AVAILABLE' | 'SUBMITTED' | 'LATE' | 'APPROVED';
    submissionDate: string | null;
    studentAnswers: {
        questionText: string;
        answerText: string;
    }[];
    lecturerEvaluation: {
        criteriaId: string;
        criteriaName: string;
        inputType: 'EVALUATION' | 'TEXT';
        options: { id: string; optionText: string; orderIndex: number }[];
        evaluationValue: string | null;
        answerText: string;
    }[];
}

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

export interface SubmitEvaluationBody {
    status: 'APPROVED';
    evaluations: Record<string, {
        evaluationValue?: string | null;
        answerText?: string;
    }>;
}

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
// ==================== CPMK & Rubric Management API ====================

export interface InternshipAssessmentRubric {
    id: string;
    cpmkId: string;
    levelName?: string;
    rubricLevelDescription: string;
    minScore: number;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
}

export interface InternshipCpmk {
    id: string;
    code: string;
    name: string;
    weight: number;
    assessorType: 'LECTURER' | 'FIELD';
    createdAt: string;
    updatedAt: string;
    rubrics?: InternshipAssessmentRubric[];
}

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
