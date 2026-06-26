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
  useSubmitDefenceRevision,
  useSubmitDefenceRevisionAction,
  useSubmitCurrentDefenceRevisionAction,
  useCancelDefenceRevisionSubmit,
  useDeleteDefenceRevision,
} from './useStudentThesisDefence';

export {
  useAdminDefenceList,
  useAdminDefenceDetail,
  useVerifyDefenceDocument,
  useDefenceSchedulingData,
  useSetDefenceSchedule,
  useFinalizeDefenceSchedule,
  useDownloadInvitationLetter,
} from './useAdminThesisDefence';

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
  useUnfinalizeDefenceRevisions,
  useDownloadAssessmentResult,
} from './useLecturerThesisDefence';

import { useRole } from '@/hooks/shared/useRole';
import { useAdminDefenceDetail } from './useAdminThesisDefence';
import { useStudentDefenceDetail } from './useStudentThesisDefence';
import { useLecturerDefenceDetail } from './useLecturerThesisDefence';

export function useThesisDefenceDetail(id: string) {
  const { isAdmin, isStudent, isDosen } = useRole();
  const adminQuery = useAdminDefenceDetail(isAdmin() ? id : undefined);
  const studentQuery = useStudentDefenceDetail(isStudent() ? id : undefined);
  const lecturerQuery = useLecturerDefenceDetail(isDosen() ? id : undefined);
  const data = adminQuery.data ?? studentQuery.data ?? lecturerQuery.data;
  return {
    data,
    isLoading: adminQuery.isLoading || studentQuery.isLoading || lecturerQuery.isLoading,
    isFetching: adminQuery.isFetching || studentQuery.isFetching || lecturerQuery.isFetching,
    refetch: isAdmin()
      ? adminQuery.refetch
      : isStudent()
        ? studentQuery.refetch
        : lecturerQuery.refetch,
  };
}
