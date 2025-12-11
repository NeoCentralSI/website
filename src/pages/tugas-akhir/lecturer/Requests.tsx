import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import GuidanceRequestDetailDialog from '@/components/thesis/GuidanceRequestDetailDialog';
import { useLecturerRequests, useLecturerGuidanceDialogs } from '@/hooks/guidance';
import { getLecturerRequestColumns } from '@/lib/lecturerRequestColumns';

export default function LecturerRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const {
    items,
    allRequests,
    total,
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
  } = useLecturerRequests();

  const {
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
    detailOpen,
    setDetailOpen,
    selectedGuidance,
    openDetail,
  } = useLecturerGuidanceDialogs();

  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan' }, { label: 'Permintaan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const columns = getLecturerRequestColumns({
    allRequests,
    studentFilter,
    setStudentFilter,
    statusFilter,
    setStatusFilter,
    setPage,
    onOpenDetail: openDetail,
  });

  return (
    <div className="p-4">
      <TabsNav
        tabs={[
          { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
          { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
        ]}
      />
      
      <CustomTable
        columns={columns as any}
        data={items}
        loading={isLoading}
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
        emptyText={q ? 'Tidak ditemukan' : 'Tidak ada permintaan'}
        enableColumnFilters
      />

      <DocumentPreviewDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        fileName={docInfo?.fileName || undefined}
        filePath={docInfo?.filePath || undefined}
      />

      <GuidanceRequestDetailDialog
        guidance={selectedGuidance}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={invalidate}
        onViewDocument={openDocumentPreview}
      />
    </div>
  );
}
