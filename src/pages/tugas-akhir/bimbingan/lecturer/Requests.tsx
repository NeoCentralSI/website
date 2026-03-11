import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import GuidanceRequestDetailDialog from '@/components/thesis/GuidanceRequestDetailDialog';
import { useLecturerGuidanceDialogs } from '@/hooks/guidance';
import { getLecturerRequestColumns } from '@/lib/lecturerRequestColumns';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import { getPendingRequests, getScheduledGuidances, cancelGuidanceByLecturer } from '@/services/lecturerGuidance.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { toTitleCaseName } from '@/lib/text';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function LecturerBimbinganPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Fetch both requests and scheduled
  const requestsQuery = useQuery({
    queryKey: ['lecturer-requests'],
    queryFn: () => getPendingRequests({ pageSize: 100 }),
  });

  const scheduledQuery = useQuery({
    queryKey: ['lecturer-scheduled'],
    queryFn: () => getScheduledGuidances({ pageSize: 100 }),
  });

  const isLoading = requestsQuery.isLoading || scheduledQuery.isLoading;
  const isFetching = requestsQuery.isFetching || scheduledQuery.isFetching;

  // Merge both data sources into a single list, sorted by date (newest first)
  const allGuidances = useMemo(() => {
    const requests = requestsQuery.data?.requests || [];
    const scheduled = scheduledQuery.data?.guidances || [];

    // Combine and deduplicate by id
    const map = new Map<string, GuidanceItem>();
    for (const r of requests) map.set(r.id, r);
    for (const s of scheduled) if (!map.has(s.id)) map.set(s.id, s);

    const combined = Array.from(map.values());
    // Sort by newest first
    combined.sort((a, b) => {
      const dateA = a.approvedDate || a.requestedDate || a.createdAt || '';
      const dateB = b.approvedDate || b.requestedDate || b.createdAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    return combined;
  }, [requestsQuery.data, scheduledQuery.data]);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  const {
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  } = useLecturerGuidanceDialogs();

  // Detail dialog state
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Cancel dialog state
  const [cancelGuidanceId, setCancelGuidanceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const openDetailDialog = (guidance: GuidanceItem) => {
    setSelectedGuidance(guidance);
    setDetailOpen(true);
  };

  const handleDialogUpdated = () => {
    qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
    qc.invalidateQueries({ queryKey: ['lecturer-scheduled'] });
  };

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan' }],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    let items = [...allGuidances];
    if (statusFilter) {
      items = items.filter((it) => it.status === statusFilter);
    }
    if (studentFilter) {
      items = items.filter(
        (it) => toTitleCaseName(it.studentName || it.studentId || '-') === studentFilter
      );
    }
    if (q) {
      const needle = q.toLowerCase();
      items = items.filter((it) => {
        const name = (it.studentName || it.studentId || '').toLowerCase();
        const notes = ((it as any)?.notes || (it as any)?.studentNotes || '').toLowerCase();
        const milestone = (it.milestoneName || '').toLowerCase();
        return name.includes(needle) || notes.includes(needle) || milestone.includes(needle);
      });
    }
    return items;
  }, [allGuidances, statusFilter, studentFilter, q]);

  // Pagination
  const total = filteredItems.length;
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const columns = getLecturerRequestColumns({
    allRequests: allGuidances,
    studentFilter,
    setStudentFilter,
    statusFilter,
    setStatusFilter,
    setPage,
    navigate,
    onOpenDetail: openDetailDialog,
    onViewDocument: (fileName, filePath) => {
      openDocumentPreview(fileName, filePath);
    },
    onCancel: (guidanceId: string) => {
      setCancelGuidanceId(guidanceId);
    },
  });

  // Tabs
  const tabs = [
    { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
    { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
  ];

  const refetch = () => {
    requestsQuery.refetch();
    scheduledQuery.refetch();
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bimbingan Tugas Akhir</h1>
          <p className="text-gray-500">Kelola permintaan dan jadwal bimbingan mahasiswa</p>
        </div>
      </div>

      <TabsNav tabs={tabs} />

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data bimbingan..." />
        </div>
      ) : (
        <CustomTable
          columns={columns as any}
          data={paginatedItems}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          searchValue={q}
          onSearchChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          emptyText={q ? 'Tidak ditemukan' : 'Belum ada data bimbingan'}
          enableColumnFilters
          actions={
            <RefreshButton
              onClick={refetch}
              isRefreshing={isFetching && !isLoading}
            />
          }
        />
      )}

      <DocumentPreviewDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        fileName={docInfo?.fileName || undefined}
        filePath={docInfo?.filePath || undefined}
      />

      <GuidanceRequestDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        guidance={selectedGuidance}
        onUpdated={handleDialogUpdated}
        onViewDocument={(fileName, filePath) => {
          openDocumentPreview(fileName, filePath);
        }}
      />

      {/* Cancel guidance dialog for lecturer */}
      <AlertDialog open={!!cancelGuidanceId} onOpenChange={(open) => {
        if (!open) {
          setCancelGuidanceId(null);
          setCancelReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Bimbingan?</AlertDialogTitle>
            <AlertDialogDescription>
              Bimbingan yang sudah disetujui akan dibatalkan. Mahasiswa akan diberitahu mengenai pembatalan ini. Silakan isi alasan pembatalan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">
              Alasan Pembatalan <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
              placeholder="Contoh: Saya berhalangan hadir karena..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">{cancelReason.length}/1000</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tidak</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling || !cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!cancelGuidanceId || !cancelReason.trim()) return;
                setIsCancelling(true);
                try {
                  await cancelGuidanceByLecturer(cancelGuidanceId, { reason: cancelReason });
                  toast.success('Bimbingan berhasil dibatalkan');
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-scheduled'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  setCancelGuidanceId(null);
                  setCancelReason('');
                } catch (error: any) {
                  toast.error(error.message || 'Gagal membatalkan bimbingan');
                } finally {
                  setIsCancelling(false);
                }
              }}
            >
              {isCancelling ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Membatalkan...
                </>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
