import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentSupervisors, rescheduleStudentGuidance, cancelStudentGuidance, getMyThesisDetail } from '@/services/studentGuidance.service';
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
import { Spinner } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import RequestGuidanceDialog from '@/components/thesis/RequestGuidanceDialog';
import { GuidanceRescheduleDialog } from '@/components/thesis/GuidanceRescheduleDialog';
import GuidanceExportDialog from '@/components/thesis/GuidanceExportDialog';
import BatchExportDialog from '@/components/thesis/BatchExportDialog';
import { PendingRequestAlert } from '@/components/thesis/PendingRequestAlert';
import { RequirementsNotMet } from '@/components/shared/RequirementsNotMet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStudentGuidance, useGuidanceDialogs } from '@/hooks/guidance';
import { getGuidanceTableColumns } from '@/lib/guidanceTableColumns';
import { useMilestones } from '@/hooks/milestone';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Download, FileDown } from 'lucide-react';

export default function StudentGuidancePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const {
    items,
    displayItems,
    total,
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
    hasPendingRequest,
    pendingRequestInfo,
    refetch,
  } = useStudentGuidance();

  const { data: thesisDetail } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
  });

  const isThesisInactive = thesisDetail?.status === "Gagal" || thesisDetail?.status === "Dibatalkan" || thesisDetail?.status === "Selesai";

  /* ADDED: Search params for Quick Actions */
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    openRequest,
    setOpenRequest,
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  } = useGuidanceDialogs();

  // Auto-open request dialog if action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (!hasPendingRequest) {
        setOpenRequest(true);
      }
      // Clear param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, hasPendingRequest, setOpenRequest, setSearchParams]);

  const [rescheduleGuidance, setRescheduleGuidance] = useState<{ id: string; supervisorId: string } | null>(null);
  const [cancelGuidanceId, setCancelGuidanceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [exportGuidanceId, setExportGuidanceId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchExport, setShowBatchExport] = useState(false);

  // Compute exportable IDs (completed/summary_pending with sessionSummary)
  const exportableIds = useMemo(() => {
    return (items || []).filter(
      (g) => (g.status === 'completed' || g.status === 'summary_pending') && !!g.sessionSummary
    ).map((g) => g.id);
  }, [items]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (ids: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  // Determine if the cancel target is an accepted guidance (needs reason + confirmation)
  const cancelTargetGuidance = useMemo(() => {
    if (!cancelGuidanceId) return null;
    return (items || []).find(g => g.id === cancelGuidanceId) || null;
  }, [cancelGuidanceId, items]);
  const isAcceptedCancel = cancelTargetGuidance?.status === 'accepted';

  const supervisorsQuery = useQuery({
    queryKey: ['student-supervisors'],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsQuery.data?.thesisId ?? '';

  // Fetch milestones for guidance dialog
  const milestonesQuery = useMilestones(thesisId);
  const milestones = milestonesQuery.data?.milestones ?? [];

  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const columns = useMemo(() => getGuidanceTableColumns({
    items: items || [],
    supervisorFilter,
    setSupervisorFilter,
    status,
    setStatus,
    setPage,
    onViewDocument: openDocumentPreview,
    navigate,
    studentNim: thesisDetail?.student?.nim,
    studentName: thesisDetail?.student?.name,
    selectedIds,
    onToggleSelect: handleToggleSelect,
    onToggleSelectAll: handleToggleSelectAll,
    exportableIds,
    onReschedule: (guidanceId: string) => {
      const guidance = (items || []).find(g => g.id === guidanceId);
      if (guidance && guidance.supervisorId) {
        setRescheduleGuidance({ id: guidanceId, supervisorId: guidance.supervisorId });
      }
    },
    onCancel: (guidanceId: string) => {
      setCancelGuidanceId(guidanceId);
    },
    onExport: (guidanceId: string) => {
      setExportGuidanceId(guidanceId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [items, supervisorFilter, setSupervisorFilter, status, setStatus, setPage, openDocumentPreview, navigate, thesisDetail?.student?.nim, thesisDetail?.student?.name, selectedIds, exportableIds]);

  const handleReschedule = async (data: { requestedDate: string; studentNotes: string }) => {
    if (!rescheduleGuidance) return false;

    try {
      await rescheduleStudentGuidance(rescheduleGuidance.id, {
        guidanceDate: new Date(data.requestedDate).toISOString(),
        studentNotes: data.studentNotes,
      });

      toast.success('Jadwal bimbingan berhasil diubah');
      qc.invalidateQueries({ queryKey: ['student-guidance'] });
      qc.invalidateQueries({ queryKey: ['notification-unread'] });
      setRescheduleGuidance(null);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah jadwal bimbingan');
      return false;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bimbingan Tugas Akhir</h1>
          <p className="text-gray-500">Jadwal bimbingan Tugas Akhir</p>
        </div>
      </div>

      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/milestone' },
        ]}
      />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data bimbingan..." />
        </div>
      ) : (
        <>
          {hasPendingRequest && pendingRequestInfo && (
            <PendingRequestAlert
              supervisorName={pendingRequestInfo.supervisorName}
              dateStr={pendingRequestInfo.dateStr}
              onViewDetail={() => navigate(`/tugas-akhir/bimbingan/student/session/${pendingRequestInfo.id}`)}
            />
          )}

          {!thesisId || thesisDetail?.isProposal ? (
            <RequirementsNotMet
              title="Syarat Mata Kuliah Belum Terpenuhi"
              description="Anda belum memenuhi persyaratan untuk mengambil mata kuliah Tugas Akhir."
              requirements={[
                {
                  label: "Mengambil mata kuliah Tugas Akhir",
                  met: false,
                  description: "Anda harus tercatat mengambil mata kuliah Tugas Akhir (proposal disetujui).",
                },
              ]}
              homeUrl="/dashboard"
            />
          ) : isThesisInactive ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold mb-2">Tugas Akhir Tidak Aktif</h3>
              <p className="text-muted-foreground">Status tugas akhir Anda saat ini adalah <strong>{thesisDetail?.status}</strong>. Anda tidak dapat mengakses fitur bimbingan.</p>
            </div>
          ) : (
            <CustomTable
              columns={columns as any}
              data={displayItems}
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
              enableColumnFilters
              searchValue={q}
              onSearchChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              emptyText={q || supervisorFilter ? 'Tidak ditemukan' : 'Tidak ada data'}
              actions={
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBatchExport(true)}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download ({selectedIds.size})
                    </Button>
                  )}
                  {exportableIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIds(new Set(exportableIds));
                        setShowBatchExport(true);
                      }}
                    >
                      <FileDown className="h-4 w-4 mr-1.5" />
                      Download Semua
                    </Button>
                  )}
                  <RefreshButton
                    onClick={() => refetch()}
                    isRefreshing={isFetching && !isLoading}
                  />
                  <Button
                    onClick={() => setOpenRequest(true)}
                    disabled={hasPendingRequest}
                    title={
                      hasPendingRequest
                        ? `Anda masih memiliki pengajuan yang belum direspon (${pendingRequestInfo?.dateStr}). Tunggu hingga dosen menyetujui atau menolak pengajuan tersebut.`
                        : 'Ajukan bimbingan baru'
                    }
                  >
                    Ajukan Bimbingan
                  </Button>
                </div>
              }
            />
          )}
        </>
      )}

      <DocumentPreviewDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        fileName={docInfo?.fileName ?? undefined}
        filePath={docInfo?.filePath ?? undefined}
      />

      <RequestGuidanceDialog
        open={openRequest}
        onOpenChange={setOpenRequest}
        supervisors={supervisorsQuery.data?.supervisors || []}
        milestones={milestones}
        onSubmitted={() => {
          qc.invalidateQueries({ queryKey: ['student-guidance'] });
          qc.invalidateQueries({ queryKey: ['notification-unread'] });
          qc.invalidateQueries({ queryKey: ['milestones'] });
        }}
      />

      <GuidanceRescheduleDialog
        open={!!rescheduleGuidance}
        onOpenChange={(open) => !open && setRescheduleGuidance(null)}
        onReschedule={handleReschedule}
        supervisorId={rescheduleGuidance?.supervisorId}
      />

      {/* Cancel Dialog - Different flow for requested vs accepted */}
      {/* Step 1: For requested = simple confirm, for accepted = reason input */}
      <AlertDialog open={!!cancelGuidanceId && !showCancelConfirm} onOpenChange={(open) => {
        if (!open) {
          setCancelGuidanceId(null);
          setCancelReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAcceptedCancel ? 'Batalkan Bimbingan Terjadwal?' : 'Batalkan Pengajuan Bimbingan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAcceptedCancel
                ? 'Bimbingan yang sudah disetujui akan dibatalkan. Silakan isi alasan pembatalan.'
                : 'Pengajuan bimbingan akan dibatalkan dan dosen pembimbing akan diberitahu. Anda dapat mengajukan bimbingan baru setelah membatalkan pengajuan ini.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isAcceptedCancel && (
            <div className="py-2">
              <label className="text-sm font-medium mb-1.5 block">Alasan Pembatalan <span className="text-destructive">*</span></label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-20 resize-none"
                placeholder="Contoh: Saya tidak dapat hadir karena..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">{cancelReason.length}/1000</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tidak</AlertDialogCancel>
            {isAcceptedCancel ? (
              <AlertDialogAction
                disabled={!cancelReason.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  setShowCancelConfirm(true);
                }}
              >
                Lanjutkan
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!cancelGuidanceId) return;
                  setIsCancelling(true);
                  try {
                    await cancelStudentGuidance(cancelGuidanceId);
                    toast.success('Pengajuan bimbingan berhasil dibatalkan');
                    qc.invalidateQueries({ queryKey: ['student-guidance'] });
                    qc.invalidateQueries({ queryKey: ['notification-unread'] });
                    setCancelGuidanceId(null);
                  } catch (error: any) {
                    toast.error(error.message || 'Gagal membatalkan pengajuan bimbingan');
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
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Confirmation dialog for accepted guidance cancellation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={(open) => {
        if (!open) setShowCancelConfirm(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan bimbingan ini? Tindakan ini tidak dapat dibatalkan dan dosen pembimbing akan diberitahu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Alasan:</p>
            <p className="text-muted-foreground">{cancelReason}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} onClick={() => setShowCancelConfirm(false)}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!cancelGuidanceId) return;
                setIsCancelling(true);
                try {
                  await cancelStudentGuidance(cancelGuidanceId, { reason: cancelReason });
                  toast.success('Bimbingan berhasil dibatalkan');
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  setCancelGuidanceId(null);
                  setCancelReason('');
                  setShowCancelConfirm(false);
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
                'Ya, Saya Yakin'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export/Download Dialog */}
      <GuidanceExportDialog
        guidanceId={exportGuidanceId || ''}
        open={!!exportGuidanceId}
        onOpenChange={(open) => !open && setExportGuidanceId(null)}
      />

      {/* Batch Export Dialog */}
      <BatchExportDialog
        open={showBatchExport}
        onOpenChange={(open) => {
          setShowBatchExport(open);
          if (!open) setSelectedIds(new Set());
        }}
        guidanceIds={Array.from(selectedIds)}
      />
    </div>
  );
}
