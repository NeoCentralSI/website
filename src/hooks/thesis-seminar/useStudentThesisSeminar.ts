import { useQuery } from '@tanstack/react-query';
import { studentSeminarService } from '@/services/thesis-seminar/student.service';

export const useStudentThesisSeminar = () => {
  const overviewQuery = useQuery({
    queryKey: ['thesis-seminar', 'student', 'overview'],
    queryFn: () => studentSeminarService.getOverview(),
  });

  const historyQuery = useQuery({
    queryKey: ['thesis-seminar', 'student', 'history'],
    queryFn: () => studentSeminarService.getHistory(),
  });

  const attendanceQuery = useQuery({
    queryKey: ['thesis-seminar', 'student', 'attendance'],
    queryFn: () => studentSeminarService.getAttendanceHistory(),
  });

  return {
    overview: overviewQuery.data,
    history: historyQuery.data || [],
    attendance: attendanceQuery.data,
    isLoading: overviewQuery.isLoading || historyQuery.isLoading,
    isError: overviewQuery.isError || historyQuery.isError,
    refetch: () => {
      overviewQuery.refetch();
      historyQuery.refetch();
    }
  };
};
