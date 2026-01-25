import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CustomTable from '@/components/layout/CustomTable';
import { getScheduledGuidances } from '@/services/lecturerGuidance.service';
import { getLecturerScheduledColumns } from '@/lib/lecturerScheduledColumns';
import { toTitleCaseName } from '@/lib/text';

export default function ScheduledGuidancesPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan' }, { label: 'Terjadwal' }],
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

  return (
    <div className="p-4">
      <TabsNav
        tabs={[
          { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
          { label: 'Terjadwal', to: '/tugas-akhir/bimbingan/lecturer/scheduled' },
          { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
        ]}
      />

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
    </div>
  );
}
