export {
  useStudentSeminarOverview,
  useStudentAttendanceHistory,
  useSeminarDocumentTypes,
  useStudentSeminarDocuments,
  useUploadSeminarDocument,
  useSeminarAnnouncements,
  useRegisterToSeminar,
  useCancelSeminarRegistration,
  useStudentRevisions,
  useCreateRevision,
  useSubmitRevisionAction,
  useStudentSeminarHistory,
  useStudentSeminarDetail,
  useStudentSeminarAssessment,
  useSaveRevisionAction,
  useSubmitRevision,
  useCancelRevisionSubmission,
  useDeleteRevision,
} from './useStudentThesisSeminar';
export * from './useAdminThesisSeminar';
export * from './useLecturerThesisSeminar';

import { useRole } from '@/hooks/shared/useRole';
import { useAdminThesisSeminarDetail } from './useAdminThesisSeminar';
import { useStudentSeminarDetail } from './useStudentThesisSeminar';
import { useLecturerSeminarDetail } from './useLecturerThesisSeminar';

export function useThesisSeminarDetail(id: string) {
  const { isAdmin, isStudent, isDosen } = useRole();
  const adminQuery = useAdminThesisSeminarDetail(isAdmin() ? id : undefined);
  const studentQuery = useStudentSeminarDetail(isStudent() ? id : undefined);
  const lecturerQuery = useLecturerSeminarDetail(isDosen() ? id : undefined);
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
