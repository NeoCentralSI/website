// Barrel export for internship services
// This file re-exports all internship-related functions and types
// to maintain backward compatibility with existing imports

// Export all types
export type {
  InternshipProposalItem,
  SubmitProposalBody,
  CompanyItem,
  StudentItem,
  StudentLogbookData,
  SeminarScheduleData,
  UpcomingSeminarItem,
  StudentGuidance,
  AdminApprovedProposalItem,
  AdminAssignmentProposalItem,
  InternshipTemplate,
  SekdepRegistrationItem,
  InternshipProposalDetail,
  CompanyStatsItem,
  InternshipListItem,
  SekdepInternshipDetail,
  LecturerWorkloadItem,
  SekdepSupervisorLetterDetail,
  GuidanceQuestion,
  GuidanceCriteria,
  InternshipCpmk,
  InternshipAssessmentRubric,
  InternshipPendingLetter,
  LecturerSupervisedStudent,
  LecturerGuidanceTimeline,
  GuidanceWeekDetail,
  SubmitEvaluationBody,
  OverviewCompanyItem,
  OverviewReportItem,
  OverviewStats,
  InternshipLogbookItem
} from './internship/types';

// Export student service functions
export {
  getStudentProposals,
  getCompanies,
  getEligibleStudents,
  getWorkingDaysCount,
  submitProposal,
  updateProposal,
  deleteProposal,
  uploadInternshipDocument,
  respondToInvitation,
  submitCompanyResponse,
  getStudentLogbooks,
  updateLogbookEntry,
  updateInternshipDetails,
  submitCompletionCertificate,
  submitCompanyReceipt,
  submitLogbookDocument,
  submitInternshipReport,
  submitCompanyReport,
  registerSeminar,
  getUpcomingSeminars,
  updateSeminarProposal,
  approveSeminar,
  rejectSeminar,
  registerSeminarAudience,
  unregisterSeminarAudience,
  getStudentGuidance,
  submitGuidanceResponse,
  downloadLogbookPdf,
  downloadLogbookDocx
} from './internship/student.service';

// Export admin service functions
export {
  verifyCompanyResponse,
  getAdminApprovedProposals,
  getAdminProposalLetterDetail,
  updateAdminProposalLetter,
  getAdminAssignmentProposals,
  getAdminAssignmentLetterDetail,
  updateAdminAssignmentLetter,
  getInternshipTemplate,
  saveInternshipTemplate,
  adminUploadCompanyResponse
} from './internship/admin.service';

// Export sekdep service functions
export {
  getSekdepProposals,
  getSekdepPendingProposals,
  getSekdepPendingResponses,
  getSekdepProposalDetail,
  createSekdepCompany,
  updateSekdepCompany,
  deleteSekdepCompany,
  respondToSekdepProposal,
  getSekdepInternshipList,
  bulkAssignSupervisor,
  getSekdepInternshipDetail,
  verifyInternshipDocument,
  bulkVerifyInternshipDocuments,
  sendFieldAssessmentRequest,
  getSekdepLecturerWorkload,
  getSekdepSupervisorLetterDetail,
  updateSekdepSupervisorLetter,
  exportLecturerWorkloadPdf,
  getSekdepInternshipTemplate,
  saveSekdepInternshipTemplate,
  getGuidanceQuestions,
  createGuidanceQuestion,
  updateGuidanceQuestion,
  deleteGuidanceQuestion,
  getGuidanceCriteria,
  createGuidanceCriteria,
  updateGuidanceCriteria,
  deleteGuidanceCriteria,
  getInternshipCpmks,
  getInternshipCpmkById,
  createInternshipCpmk,
  updateInternshipCpmk,
  deleteInternshipCpmk,
  createInternshipRubric,
  updateInternshipRubric,
  deleteInternshipRubric,
  bulkUpdateInternshipRubrics,
  copyInternshipCpmks,
  copyInternshipGuidance,
  getCompanyStats
} from './internship/sekdep.service';

// Export kadep service functions
export {
  getKadepPendingLetters,
  approveKadepLetter
} from './internship/kadep.service';

// Export lecturer service functions
export {
  getLecturerSupervisedStudents,
  getLecturerGuidanceTimeline,
  getLecturerGuidanceWeekDetail,
  submitLecturerEvaluation,
  verifyFinalReportByLecturer,
  validateSeminarAudience,
  unvalidateSeminarAudience,
  bulkValidateSeminarAudience,
  bulkApproveSeminars,
  updateSeminarNotes,
  getInternshipAssessment,
  submitLecturerAssessment,
  downloadBeritaAcara
} from './internship/lecturer.service';


// Export public service functions
export {
  verifyInternshipLetter,
  getSeminarDetail,
  getOverviewCompanies,
  getOverviewReports,
  getOverviewStats
} from './internship/public.service';
