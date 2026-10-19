import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import { listStudentGuidance } from '@/services/studentGuidance.service';
import { formatDateTimeWib } from '@/lib/text';
import type { PhaseFilterValue } from '@/components/thesis/ThesisPhaseFilter';

const PHASE_PARAM: Record<string, PhaseFilterValue> = { semua: '', proposal: 'proposal', penelitian: 'research' };
const phaseParamOf = (value: PhaseFilterValue) => (value === 'research' ? 'penelitian' : value || 'semua');

export function useStudentGuidance() {
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
  // Filter in the "Jenis" column header, default Semua.
  const [phase, setPhase] = useState<PhaseFilterValue>(PHASE_PARAM[searchParams.get('fase') ?? ''] ?? '');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['student-guidance', { status }],
    queryFn: async () => {
      try {
        const res = await listStudentGuidance({ status: status || undefined });
        return (res?.items ?? []) as GuidanceItem[];
      } catch (error) {
        console.error('[useStudentGuidance] API error:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const items: GuidanceItem[] = useMemo(() => (Array.isArray(data) ? data : []), [data]);

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
    if (phase) sp.set('fase', phaseParamOf(phase));
    else sp.delete('fase');
    setSearchParams(sp, { replace: true });
  }, [status, q, supervisorFilter, page, pageSize, phase, searchParams, setSearchParams]);

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
    const scheduled = pending.approvedDate ?? pending.requestedDate;
    const dateStr = scheduled ? formatDateTimeWib(scheduled) : 'belum ditentukan';
    return {
      id: pending.id,
      dateStr,
      supervisorName: pending.supervisorName || 'Dosen',
    };
  }, [items]);

  // Client-side filtering and pagination
  const display = useMemo(() => {
    let arr = [...items];
    if (phase) {
      arr = arr.filter((it) => it.phase === phase);
    }
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
        const when = formatDateTimeWib(it.approvedDate ?? it.requestedDate).toLowerCase();
        return sup.includes(needle) || statusText.includes(needle) || when.includes(needle);
      });
    }
    // Sort by createdAt timestamp (newest first)
    arr.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, phase, supervisorFilter, q, page, pageSize]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['student-guidance'] });
  };

  return {
    items,
    displayItems: display.slice,
    total: display.totalCount,
    isLoading,
    isFetching,
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
    phase,
    setPhase,
    hasPendingRequest,
    pendingRequestInfo,
    invalidate,
    refetch,
  };
};
