import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import { getPendingRequests } from '@/services/lecturerGuidance.service';
import { toTitleCaseName, formatDateId } from '@/lib/text';

export const useLecturerRequests = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [q, setQ] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<string>('');

  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    requests: GuidanceItem[];
  }>({
    queryKey: ['lecturer-requests', page, pageSize],
    queryFn: async () => {
      return getPendingRequests({ page, pageSize });
    },
    placeholderData: (prev) => prev as any,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Client-side filter + sort newest-first
  const filteredItems = useMemo(() => {
    let arr = [...((data?.requests ?? []) as GuidanceItem[])];
    
    if (studentFilter) {
      arr = arr.filter((it) => toTitleCaseName(it.studentName || it.studentId || '-') === studentFilter);
    }
    
    if (statusFilter) {
      arr = arr.filter((it) => (it.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const name = toTitleCaseName(it.studentName || it.studentId || '').toLowerCase();
        const when = (
          (it as any)?.scheduledAtFormatted ||
          (it as any)?.schedule?.guidanceDateFormatted ||
          (it.scheduledAt ? formatDateId(it.scheduledAt) : '')
        ).toLowerCase();
        const notes = String((it as any)?.notes ?? '').toLowerCase();
        return name.includes(needle) || when.includes(needle) || notes.includes(needle);
      });
    }
    
    arr.sort((a, b) => {
      const at = a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : (a as any)?.schedule?.guidanceDate
        ? new Date((a as any).schedule.guidanceDate).getTime()
        : 0;
      const bt = b.scheduledAt
        ? new Date(b.scheduledAt).getTime()
        : (b as any)?.schedule?.guidanceDate
        ? new Date((b as any).schedule.guidanceDate).getTime()
        : 0;
      return bt - at;
    });
    
    return arr;
  }, [data?.requests, q, statusFilter, studentFilter]);

  const invalidate = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notification-unread'] });
  };

  return {
    items: filteredItems,
    allRequests: data?.requests ?? [],
    total: data?.total ?? 0,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    studentFilter,
    setStudentFilter,
    invalidate,
  };
};
