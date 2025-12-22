import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentSupervisors } from '@/services/studentGuidance.service';
import CustomTable from '@/components/layout/CustomTable';
import GuidanceDialog from '@/components/thesis/GuidanceDialog';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import RequestGuidanceDialog from '@/components/thesis/RequestGuidanceDialog';
import { PendingRequestAlert } from '@/components/thesis/PendingRequestAlert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStudentGuidance, useGuidanceDialogs } from '@/hooks/guidance';
import { getGuidanceTableColumns } from '@/lib/guidanceTableColumns';
import { useMilestones } from '@/hooks/milestone';

export default function StudentGuidancePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const qc = useQueryClient();

  const {
    items,
    displayItems,
    total,
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
  } = useStudentGuidance();

  const {
    openRequest,
    setOpenRequest,
    openDetail,
    setOpenDetail,
    activeId,
    docOpen,
    setDocOpen,
    docInfo,
    openDetailDialog,
    openDocumentPreview,
  } = useGuidanceDialogs();

  const supervisorsQuery = useQuery({
    queryKey: ['student-supervisors'],
    queryFn: getStudentSupervisors,
  });

  const supervisors = supervisorsQuery.data?.supervisors ?? [];
  const thesisId = supervisorsQuery.data?.thesisId ?? '';

  // Fetch milestones for guidance dialog
  const milestonesQuery = useMilestones(thesisId);
  const milestones = milestonesQuery.data?.milestones ?? [];

  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const columns = getGuidanceTableColumns({
    items,
    supervisorFilter,
    setSupervisorFilter,
    status,
    setStatus,
    setPage,
    onViewDetail: openDetailDialog,
    onViewDocument: openDocumentPreview,
  });

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/milestone' },
        ]}
      />

      {hasPendingRequest && pendingRequestInfo && (
        <PendingRequestAlert
          supervisorName={pendingRequestInfo.supervisorName}
          dateStr={pendingRequestInfo.dateStr}
          onViewDetail={() => openDetailDialog(pendingRequestInfo.id)}
        />
      )}

      <CustomTable
        columns={columns as any}
        data={displayItems}
        loading={isLoading}
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
        }
      />

      <GuidanceDialog
        guidanceId={activeId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['student-guidance'] })}
      />

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
    </div>
  );
}
