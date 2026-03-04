import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { getScheduledGuidances, cancelGuidanceByLecturer } from '@/services/lecturerGuidance.service';
import { getLecturerScheduledColumns } from '@/lib/lecturerScheduledColumns';
import { toTitleCaseName } from '@/lib/text';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
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

export default function ScheduledGuidancesPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Cancel dialog state
  const [cancelGuidanceId, setCancelGuidanceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Document preview state
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string; filePath?: string } | null>(null);

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan/lecturer/requests' }, { label: 'Terjadwal' }],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lecturer-scheduled'],
    queryFn: () => getScheduledGuidances({ pageSize: 100 }),
  });

  const allGuidances = data?.guidances || [];

  // Filter guidances based on search and filters
  const filteredGuidances = useMemo(() => {
    let items = allGuidances;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (g) =>
          g.studentName?.toLowerCase().includes(q) ||
          g.milestoneName?.toLowerCase().includes(q) ||
          ((g as any)?.notes as string)?.toLowerCase().includes(q)
      );
    }

    // Student filter
    if (studentFilter) {
      items = items.filter((g) => toTitleCaseName(g.studentName || '') === studentFilter);
    }

    // Status filter
    if (statusFilter) {
      items = items.filter((g) => g.status === statusFilter);
    }

    return items;
  }, [allGuidances, searchQuery, studentFilter, statusFilter]);

  // Paginate
  const total = filteredGuidances.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedGuidances = filteredGuidances.slice(startIdx, endIdx);

  const columns = getLecturerScheduledColumns({
    allGuidances,
    studentFilter,
    setStudentFilter,
    statusFilter,
    setStatusFilter,
    setPage,
    navigate,
    onViewDocument: (fileName, filePath) => {
      setDocInfo({ fileName: fileName || undefined, filePath: filePath || undefined });
      setDocOpen(true);
    },
    onCancel: (guidanceId: string) => {
      setCancelGuidanceId(guidanceId);
    },
  });

  // Define tabs for reuse
  const tabs = [
    { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
    { label: 'Terjadwal', to: '/tugas-akhir/bimbingan/lecturer/scheduled' },
    { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Bimbingan</h1>
          <p className="text-gray-500">Lihat jadwal bimbingan yang akan datang</p>
        </div>
      </div>

      <TabsNav tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat jadwal bimbingan..." />
        </div>
      ) : (
        <CustomTable
          columns={columns as any}
          data={paginatedGuidances}
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
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          actions={
            <RefreshButton
              onClick={() => refetch()}
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

      {/* Cancel guidance dialog */}
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
              Bimbingan yang sudah disetujui akan dibatalkan. Mahasiswa akan diberitahu mengenai pembatalan ini.
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
                  qc.invalidateQueries({ queryKey: ['lecturer-scheduled'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
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
