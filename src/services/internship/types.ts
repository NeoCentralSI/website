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
    companyResponseNotes?: string | null;
    members?: { id: string; name: string; nim: string; role: string; status: string }[];
    proposedStartDate?: string;
    proposedEndDate?: string;
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
    companyResponseNotes?: string | null;
    companyResponseStatus?: string | null;
    isSigned?: boolean;
    isAssignmentSigned?: boolean;
    proposalSekdepNotes?: string | null;
    academicYearName?: string;
    proposedStartDate?: string;
    proposedEndDate?: string;
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
    supervisorLetter?: {
        id: string;
        fileName: string;
        filePath: string;
    };
    finalScore?: number | null;
    finalGrade?: string | null;
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
    proposedStartDate?: string;
    proposedEndDate?: string;
    newCompany?: {
        companyName: string;
        address: string;
        email?: string;
        phone?: string;
        alasan?: string;
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
    companyResponseNotes?: string | null;
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
    proposedStartDate?: string;
    proposedEndDate?: string;
    startDatePlanned?: string;
    endDatePlanned?: string;
    startDateActual?: string;
    endDateActual?: string;
}

export interface CompanyStatsItem {
    id: string;
    companyName: string;
    address: string;
    status: string;
    proposalCount: number;
    internCount: number;
}

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
    proposedStartDate?: string;
    proposedEndDate?: string;
    academicYearName?: string;
    updatedAt: string;
}

export interface DocumentVerificationDetail {
    document: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    status: 'SUBMITTED' | 'APPROVED' | 'REVISION_NEEDED' | null;
    notes?: string | null;
    uploadedAt?: string | null;
}

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
        fieldSupervisorEmail: string | null;
    };
    logbookProgress: {
        filled: number;
        total: number;
    };
    guidanceProgress: {
        filled: number;
        total: number;
    };
    assessment: {
        lecturerStatus: string;
        fieldStatus: string;
        finalScore: number | null;
        finalGrade: string | null;
        isLogbookLocked: boolean;
    };
    logbooks: any[];
    guidanceSessions: any[];
    seminars: any[];
    lecturerScores: any[];
    fieldScores: any[];
    reportingDocuments: {
        report: DocumentVerificationDetail;
        completionCertificate: DocumentVerificationDetail;
        companyReceipt: DocumentVerificationDetail;
        logbookDocument: DocumentVerificationDetail;
        reportFinal?: DocumentVerificationDetail;
        fieldAssessmentDocument?: DocumentVerificationDetail;
    };
    status: string;
    academicYearName: string;
    createdAt: string;
}

export interface AdminAssignmentProposalItem extends AdminApprovedProposalItem {
    status: string;
    companyResponseFile: { id: string; fileName: string; filePath: string } | null;
    members: {
        id: string;
        name: string;
        nim: string;
        status: string;
        role: string;
        isCoordinator: boolean;
    }[];
    startDatePlanned?: string;
    endDatePlanned?: string;
    proposedStartDate?: string;
    proposedEndDate?: string;
    appLetterNumber?: string;
    companyResponseNotes?: string | null;
}

export interface InternshipTemplate {
    id: string;
    name: string;
    type: "HTML" | "DOCX";
    content: string | null;
    filePath: string | null;
}

export interface InternshipPendingLetter {
    id: string;
    type: 'APPLICATION' | 'ASSIGNMENT' | 'LECTURER_ASSIGNMENT';
    documentNumber: string;
    coordinatorName?: string;
    coordinatorNim?: string;
    coordinatorStudentId?: string;
    coordinatorStatus?: string;
    lecturerName?: string;
    lecturerNip?: string;
    companyName?: string;
    members?: { studentId: string; name: string; nim: string; status: string }[];
    memberCount?: number;
    acceptedMemberCount?: number;
    period: {
        start: string;
        end: string;
    } | null;
    createdAt: string;
    signedById: string | null;
    document: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
}

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
        fieldSupervisorEmail: string | null;
        unitSection: string | null;
        actualStartDate: string | null;
        actualEndDate: string | null;
        isLogbookLocked: boolean;
        logbookLockedAt: string | null;
        activeAssessmentUrl?: string | null;
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
        },
        supervisor?: {
            user: {
                fullName: string;
            }
        } | null;
        seminars?: {
            id: string;
            status: string;
            date: string | null;
            time: string | null;
            room?: {
                name: string;
            } | null;
            link: string | null;
            moderatorStudent?: {
                user: {
                    fullName: string;
                }
            } | null;
        }[];
        reportDocumentId?: string | null;
        logbookDocumentId?: string | null;
        reportStatus?: 'SUBMITTED' | 'APPROVED' | 'REVISION_NEEDED' | null;
        reportNotes?: string | null;
        reportUploadedAt?: string | null;
        reportFinalDocId?: string | null;
        reportFinalStatus?: 'SUBMITTED' | 'APPROVED' | 'REVISION_NEEDED' | null;
        reportFinalNotes?: string | null;
        reportFinalUploadedAt?: string | null;
        completionCertificateDocId?: string | null;
        companyReceiptDocId?: string | null;
        finalNumericScore?: number | null;
        finalGrade?: string | null;
        lecturerAssessmentStatus?: string | null;
        fieldAssessmentStatus?: string | null;
        reportDocument?: { id: string; fileName: string; filePath: string } | null;
        reportFeedbackDocument?: { id: string; fileName: string; filePath: string } | null;
        completionCertificateDoc?: { id: string; fileName: string; filePath: string } | null;
        companyReceiptDoc?: { id: string; fileName: string; filePath: string } | null;
        companyReportDoc?: { id: string; fileName: string; filePath: string } | null;
        logbookDocument?: { id: string; fileName: string; filePath: string } | null;
        reportFinalDoc?: { id: string; fileName: string; filePath: string } | null;
        reportFinalTitle?: string | null;
    } | null;
    logbooks: InternshipLogbookItem[];
}

export interface SeminarScheduleData {
    seminarDate: string;
    startTime: string;
    endTime: string;
    roomId: string;
    linkMeeting?: string;
    moderatorStudentId: string;
    memberInternshipIds?: string[];
}

export interface UpcomingSeminarItem {
    id: string;
    seminarDate: string;
    startTime: string;
    endTime: string;
    status: string;
    linkMeeting?: string;
    supervisorNotes?: string;
    room: { id: string; name: string; location?: string };
    moderatorStudentId: string;
    moderatorStudent: { user: { fullName: string } };
    internship: {
        id: string;
        student: { user: { fullName: string; identityNumber: string } };
        supervisor?: { user: { fullName: string } };
        proposal?: { targetCompany?: { companyName: string } };
    };
}

export interface LecturerWorkloadItem {
    id: string;
    name: string;
    nip: string;
    activeInternshipCount: number;
    supervisorLetterStatus: string;
}

export interface SekdepSupervisorLetterDetail {
    id: string;
    lecturerName: string;
    lecturerNip: string;
    assignedStudents: {
        internshipId: string;
        nim: string;
        name: string;
        companyName: string;
        documents: {
            appLetterDocNumber: string | null;
            assignLetterDocNumber: string | null;
            supLetterDocNumber: string | null;
            supLetterDocDateIssued: string | null;
            supLetterStartDate: string | null;
            supLetterEndDate: string | null;
            supLetterDocId: string | null;
            supLetterFile: {
                id: string;
                fileName: string;
                filePath: string;
            } | null;
        }
    }[];
}

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

export interface LecturerSupervisedStudent {
    internshipId: string;
    studentName: string;
    studentNim: string;
    companyName: string;
    academicYearName: string;
    startDate: string;
    endDate: string;
    status: string;
    progress: {
        totalWeeks: number;
        submittedCount: number;
        approvedCount: number;
    };
    report?: {
        status: string | null;
        title: string | null;
        notes: string | null;
        uploadedAt: string | null;
        document: {
            id: string;
            fileName: string;
            filePath: string;
        } | null;
    };
    seminar?: {
        id: string;
        status: string;
        seminarDate: string;
        startTime: string;
        endTime: string;
        room?: { name: string; location: string };
    } | null;
    finalScore?: number | null;
    finalGrade?: string | null;
}

export interface LecturerGuidanceTimeline {
    internshipId: string;
    studentName: string;
    studentNim: string;
    supervisorName?: string | null;
    currentWeek: number;
    report?: {
        status: string | null;
        title: string | null;
        notes: string | null;
        uploadedAt: string | null;
        document: {
            id: string;
            fileName: string;
            filePath: string;
        } | null;
        feedbackDocument: {
            id: string;
            fileName: string;
            filePath: string;
        } | null;
        feedbackDocumentId?: string | null;
    };
    seminars?: {
        id: string;
        roomId: string;
        seminarDate: string;
        startTime: string;
        endTime: string;
        status: string;
        room?: { name: string; capacity: number; location: string; };
        moderatorStudent?: { user: { fullName: string; } };
        audiences?: {
            studentId: string;
            validatedAt: string | null;
            createdAt: string;
            student: {
                user: {
                    fullName: string;
                    identityNumber: string;
                }
            }
        }[];
    }[];
    finalScore?: number | null;
    finalGrade?: string | null;
    timeline: {
        weekNumber: number;
        startDate: string;
        endDate: string;
        status: 'NOT_AVAILABLE' | 'OPEN' | 'LATE' | 'SUBMITTED' | 'APPROVED';
        submissionDate: string | null;
    }[];
}

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

export interface SubmitEvaluationBody {
    status: 'APPROVED';
    evaluations: Record<string, {
        evaluationValue?: string | null;
        answerText?: string;
    }>;
}

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

export interface OverviewCompanyItem {
    id: string;
    companyName: string;
    companyAddress: string;
    status: string;
    proposalCount: number;
    internCount: number;
}

export interface OverviewReportItem {
    id: string;
    reportTitle: string;
    studentName: string;
    nim: string;
    companyName: string;
    academicYear: string | null;
    supervisorName: string;
    uploadedAt: string | null;
    fileId: string | null;
}

export interface OverviewStats {
    totalCompanies: number;
    totalInterns: number;
    totalReports: number;
}

export interface InternshipMonitoringStats {
    totalActive: number;
    waitingVerification: number;
    overdue: number;
    completed: number;
    distribution: {
        PROPOSAL: number;
        ONGOING: number;
        GUIDANCE: number;
        SEMINAR: number;
        COMPLETED: number;
    };
}

export interface MonitoringStudentItem {
    id: string;
    name: string;
    nim: string;
    supervisor: string;
    endDate: string;
    daysPast: number;
    status: 'Aman' | 'Peringatan' | 'Terlambat';
    progress: {
        field: boolean;
        lecturer: boolean;
        seminar: boolean;
        report: boolean;
    };
}
