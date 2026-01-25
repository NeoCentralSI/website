import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentSupervisors } from '@/services/studentGuidance.service';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import RequestGuidanceDialog from '@/components/thesis/RequestGuidanceDialog';
import { PendingRequestAlert } from '@/components/thesis/PendingRequestAlert';
import NeedsSummaryList from '@/components/thesis/NeedsSummaryList';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStudentGuidance, useGuidanceDialogs } from '@/hooks/guidance';
import { getGuidanceTableColumns } from '@/lib/guidanceTableColumns';
import { useMilestones } from '@/hooks/milestone';

export default function StudentGuidancePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const qc = useQueryClient();
  const navigate = useNavigate();

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
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  } = useGuidanceDialogs();

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

  const columns = getGuidanceTableColumns({
    items,
    supervisorFilter,
    setSupervisorFilter,
    status,
    setStatus,
    setPage,
    onViewDocument: openDocumentPreview,
    navigate,
  });

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/milestone' },
          { label: 'Riwayat', to: '/tugas-akhir/bimbingan/completed-history' },
        ]}
      />

      {hasPendingRequest && pendingRequestInfo && (
        <PendingRequestAlert
          supervisorName={pendingRequestInfo.supervisorName}
          dateStr={pendingRequestInfo.dateStr}
          onViewDetail={() => navigate(`/tugas-akhir/bimbingan/student/session/${pendingRequestInfo.id}`)}
        />
      )}

      {/* Bimbingan yang perlu diisi catatan */}
      <div className="mb-4">
        <NeedsSummaryList />
      </div>

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
