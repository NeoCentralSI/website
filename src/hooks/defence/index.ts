export {
  useStudentDefenceOverview,
  useStudentDefenceHistory,
  useStudentDefenceDetail,
  useStudentDefenceAssessment,
  useStudentDefenceRevisions,
  useCurrentStudentDefenceRevisions,
  useDefenceDocumentTypes,
  useStudentDefenceDocuments,
  useUploadDefenceDocument,
  useCreateDefenceRevision,
  useCreateCurrentDefenceRevision,
  useSaveDefenceRevisionAction,
  useSubmitDefenceRevisionAction,
  useSubmitCurrentDefenceRevisionAction,
  useCancelDefenceRevisionSubmit,
  useDeleteDefenceRevision,
} from './useStudentDefence';

export {
  useAdminDefenceList,
  useAdminDefenceDetail,
  useValidateDefenceDocument,
  useDefenceSchedulingData,
  useSetDefenceSchedule,
} from './useAdminDefence';

export {
  useDefenceExaminerRequests,
  useSupervisedStudentDefences,
  useLecturerDefenceDetail,
  useRespondDefenceExaminerAssignment,
  useDefenceAssignmentList,
  useDefenceEligibleExaminers,
  useAssignDefenceExaminers,
  useDefenceAssessmentForm,
  useSubmitDefenceAssessment,
  useDefenceFinalizationData,
  useFinalizeDefenceBySupervisor,
  useDefenceRevisionBoard,
  useApproveDefenceRevision,
  useUnapproveDefenceRevision,
  useFinalizeDefenceRevisions,
} from './useLecturerDefence';
