import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentSupervisors, rescheduleStudentGuidance, cancelStudentGuidance } from '@/services/studentGuidance.service';
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
import { PendingRequestAlert } from '@/components/thesis/PendingRequestAlert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStudentGuidance, useGuidanceDialogs } from '@/hooks/guidance';
import { getGuidanceTableColumns } from '@/lib/guidanceTableColumns';
import { useMilestones } from '@/hooks/milestone';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { RefreshButton } from '@/components/ui/refresh-button';

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

  const {
    openRequest,
    setOpenRequest,
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  } = useGuidanceDialogs();

  const [rescheduleGuidance, setRescheduleGuidance] = useState<{ id: string; supervisorId: string } | null>(null);
  const [cancelGuidanceId, setCancelGuidanceId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
    onReschedule: (guidanceId: string) => {
      const guidance = (items || []).find(g => g.id === guidanceId);
      if (guidance && guidance.supervisorId) {
        setRescheduleGuidance({ id: guidanceId, supervisorId: guidance.supervisorId });
      }
    },
    onCancel: (guidanceId: string) => {
      setCancelGuidanceId(guidanceId);
    },
  }), [items, supervisorFilter, setSupervisorFilter, status, setStatus, setPage, openDocumentPreview, navigate]);

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
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
          { label: 'Tugas Akhir Saya', to: '/tugas-akhir/bimbingan/milestone' },
          { label: 'Riwayat', to: '/tugas-akhir/bimbingan/completed-history' },
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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelGuidanceId} onOpenChange={(open) => !open && setCancelGuidanceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Pengajuan Bimbingan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan bimbingan akan dibatalkan dan dosen pembimbing akan diberitahu.
              Anda dapat mengajukan bimbingan baru setelah membatalkan pengajuan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tidak</AlertDialogCancel>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
