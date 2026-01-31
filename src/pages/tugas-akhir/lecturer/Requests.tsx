import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import GuidanceRequestDetailDialog from '@/components/thesis/GuidanceRequestDetailDialog';
import { useLecturerRequests, useLecturerGuidanceDialogs } from '@/hooks/guidance';
import { getLecturerRequestColumns } from '@/lib/lecturerRequestColumns';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import { Loading } from '@/components/ui/spinner';

export default function LecturerRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

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
  } = useLecturerGuidanceDialogs();

  // State untuk detail dialog
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetailDialog = (guidance: GuidanceItem) => {
    setSelectedGuidance(guidance);
    setDetailOpen(true);
  };

  const handleDialogUpdated = () => {
    invalidate();
  };

  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan/lecturer/requests' }, { label: 'Permintaan' }], []);

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
    navigate,
    onOpenDetail: openDetailDialog,
  });

  // Define tabs for reuse
  const tabs = [
    { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
    { label: 'Terjadwal', to: '/tugas-akhir/bimbingan/lecturer/scheduled' },
    { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
  ];

  return (
    <div className="p-4">
      <TabsNav tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data permintaan..." />
        </div>
      ) : (
        <>
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
        </>
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
    </div>
  );
}
