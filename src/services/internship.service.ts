// Barrel export for internship services
// This file re-exports all internship-related functions and types
// to maintain backward compatibility with existing imports

// Export all types
export type {
    AdminApprovedProposalItem,
    AdminAssignmentProposalItem, CompanyItem, CompanyStatsItem, GuidanceCriteria, GuidanceQuestion, GuidanceWeekDetail, InternshipAssessmentRubric, InternshipAssessmentScoreItem, InternshipCpmk, InternshipListItem, InternshipLogbookItem, InternshipPendingLetter, InternshipProposalDetail, InternshipProposalItem, InternshipTemplate, LecturerGuidanceTimeline, LecturerSupervisedStudent, LecturerWorkloadItem, OverviewCompanyItem,
    OverviewReportItem,
    OverviewStats, SekdepInternshipDetail, SekdepRegistrationItem, SekdepSupervisorLetterDetail, SeminarScheduleData, StudentGuidance, StudentInternshipHistoryItem, StudentItem,
    StudentLogbookData, SubmitEvaluationBody, SubmitProposalBody, UpcomingSeminarItem
} from './internship/types';

// Export student service functions
export {
    approveSeminar, deleteProposal, downloadLogbookDocx, downloadLogbookPdf, getCompanies,
    getEligibleStudents, getStudentGuidance, getStudentInternshipHistory, getStudentLogbooks, getStudentProposals, getUpcomingSeminars, getWorkingDaysCount, registerSeminar, registerSeminarAudience, rejectSeminar, respondToInvitation, submitCompanyReceipt, submitCompanyReport, submitCompanyResponse, submitCompletionCertificate, submitGuidanceResponse, submitInternshipReport, submitLogbookDocument, submitProposal, unregisterSeminarAudience, updateInternshipDetails, updateLogbookEntry, updateProposal, updateSeminarProposal, uploadInternshipDocument
} from './internship/student.service';

// Export admin service functions
export {
    adminUploadCompanyResponse, getAdminApprovedProposals, getAdminAssignmentLetterDetail, getAdminAssignmentProposals, getAdminProposalLetterDetail, getInternshipTemplate,
    saveInternshipTemplate, updateAdminAssignmentLetter, updateAdminProposalLetter, verifyCompanyResponse
} from './internship/admin.service';

// Export sekdep service functions
export {
    bulkAssignSupervisor, bulkUpdateInternshipRubrics, bulkVerifyInternshipDocuments, copyInternshipCpmks,
    copyInternshipGuidance, createGuidanceCriteria, createGuidanceQuestion, createInternshipCpmk, createInternshipRubric, createSekdepCompany, deleteGuidanceCriteria, deleteGuidanceQuestion, deleteInternshipCpmk, deleteInternshipRubric, deleteSekdepCompany, exportGradeRecapPdf, exportLecturerWorkloadPdf, getCompanyStats, getGuidanceCriteria, getGuidanceQuestions, getInternshipCpmkById, getInternshipCpmks, getSekdepInternshipDetail, getSekdepInternshipList, getSekdepInternshipTemplate, getSekdepLecturerWorkload, getSekdepPendingProposals,
    getSekdepPendingResponses,
    getSekdepProposalDetail, getSekdepProposals, getSekdepSupervisorLetterDetail, respondToSekdepProposal, saveSekdepInternshipTemplate, sendFieldAssessmentRequest, updateGuidanceCriteria, updateGuidanceQuestion, updateInternshipCpmk, updateInternshipRubric, updateSekdepCompany, updateSekdepInternshipFieldInfo, updateSekdepSupervisorLetter, verifyInternshipDocument
} from './internship/sekdep.service';

// Export kadep service functions
export {
    approveKadepLetter, getKadepPendingLetters
} from './internship/kadep.service';

// Export lecturer service functions
export {
    bulkApproveSeminars, bulkValidateSeminarAudience, completeSeminar,
    failSeminar, getInternshipAssessment, getLecturerAcademicYears,
    getLecturerGuidanceTimeline,
    getLecturerGuidanceWeekDetail, getLecturerSupervisedStudents, saveFinalReportFeedbackByLecturer, submitLecturerAssessment, submitLecturerEvaluation, unvalidateSeminarAudience, updateSeminarNotes, validateSeminarAudience, verifyFinalReportByLecturer
} from './internship/lecturer.service';


// Export public service functions
export {
    getOverviewCompanies,
    getOverviewReports,
    getOverviewStats, getSeminarDetail, verifyInternshipLetter
} from './internship/public.service';

