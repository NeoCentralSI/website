import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import { listStudentGuidance } from '@/services/studentGuidance.service';

export const useStudentGuidance = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialStatus = (searchParams.get('status') as GuidanceStatus | '') || '';
  const initialQ = searchParams.get('q') || '';
  const initialSupervisor = searchParams.get('supervisor') || '';
  const initialPage = Number(searchParams.get('page') || 1);
  const initialLimit = Number(searchParams.get('limit') || 10);

  const [status, setStatus] = useState<GuidanceStatus | ''>(initialStatus);
  const [q, setQ] = useState<string>(initialQ);
  const [supervisorFilter, setSupervisorFilter] = useState<string>(initialSupervisor);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialLimit > 0 ? initialLimit : 10);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student-guidance', { status }],
    queryFn: async () => {
      const res = await listStudentGuidance({ status: status || undefined });
      return res.items as GuidanceItem[];
    },
  });

  const items: GuidanceItem[] = useMemo(() => (data ?? []) as GuidanceItem[], [data]);

  // Persist UI state in URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (status) sp.set('status', status);
    else sp.delete('status');
    if (q) sp.set('q', q);
    else sp.delete('q');
    if (supervisorFilter) sp.set('supervisor', supervisorFilter);
    else sp.delete('supervisor');
    if (page && page !== 1) sp.set('page', String(page));
    else sp.delete('page');
    if (pageSize && pageSize !== 10) sp.set('limit', String(pageSize));
    else sp.delete('limit');
    setSearchParams(sp, { replace: true });
  }, [status, q, supervisorFilter, page, pageSize, searchParams, setSearchParams]);

  // Refetch when status changes
  useEffect(() => {
    refetch();
  }, [status, refetch]);

  // Check for pending requests
  const hasPendingRequest = useMemo(() => {
    return items.some((item) => item.status === 'requested');
  }, [items]);

  const pendingRequestInfo = useMemo(() => {
    const pending = items.find((item) => item.status === 'requested');
    if (!pending) return null;
    const dateStr =
      pending.schedule?.guidanceDateFormatted ||
      pending.scheduledAtFormatted ||
      (pending.schedule?.guidanceDate
        ? new Date(pending.schedule.guidanceDate).toLocaleString()
        : pending.scheduledAt
        ? new Date(pending.scheduledAt).toLocaleString()
        : 'belum ditentukan');
    return {
      id: pending.id,
      dateStr,
      supervisorName: pending.supervisorName || 'Dosen',
    };
  }, [items]);

  // Client-side filtering and pagination
  const display = useMemo(() => {
    let arr = [...items];
    if (supervisorFilter) {
      arr = arr.filter(
        (it) => (it.supervisorName || it.supervisorId || '').toLowerCase() === supervisorFilter.toLowerCase()
      );
    }
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const sup = (it.supervisorName || it.supervisorId || '').toString().toLowerCase();
        const statusText = it.status.toString().toLowerCase();
        const when = (
          it.schedule?.guidanceDateFormatted ||
          it.scheduledAtFormatted ||
          (it.schedule?.guidanceDate
            ? new Date(it.schedule.guidanceDate).toLocaleString()
            : it.scheduledAt
            ? new Date(it.scheduledAt).toLocaleString()
            : '')
        ).toLowerCase();
        return sup.includes(needle) || statusText.includes(needle) || when.includes(needle);
      });
    }
    arr.sort((a, b) => {
      const at = a.schedule?.guidanceDate
        ? new Date(a.schedule.guidanceDate).getTime()
        : a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : 0;
      const bt = b.schedule?.guidanceDate
        ? new Date(b.schedule.guidanceDate).getTime()
        : b.scheduledAt
        ? new Date(b.scheduledAt).getTime()
        : 0;
      return bt - at;
    });
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, supervisorFilter, q, page, pageSize]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['student-guidance'] });
  };

  return {
    items,
    displayItems: display.slice,
    total: display.totalCount,
    isLoading,
    status,
    setStatus,
    q,
    setQ,
    supervisorFilter,
    setSupervisorFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    hasPendingRequest,
    pendingRequestInfo,
    invalidate,
  };
};
