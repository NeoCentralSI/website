import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import { getScheduledGuidances } from '@/services/lecturerGuidance.service';
import { getLecturerScheduledColumns } from '@/lib/lecturerScheduledColumns';
import { toTitleCaseName } from '@/lib/text';
import { Loading } from '@/components/ui/spinner';

export default function ScheduledGuidancesPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan/lecturer/requests' }, { label: 'Terjadwal' }],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const { data, isLoading } = useQuery({
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
          <Loading size="lg" text="Memuat jadwal bimbingan..." />
        </div>
      ) : (
        <CustomTable
          columns={columns as any}
          data={paginatedGuidances}
          loading={isLoading}
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
        />
      )}
    </div>
  );
}
