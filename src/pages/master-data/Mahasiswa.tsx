import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useAuth } from '../../hooks/useAuth';
import { getStudentsAPI, type Student } from '../../services/admin.service';
import CustomTable, { type Column } from '../../components/layout/CustomTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { toTitleCaseName } from '../../lib/text';
import { useQuery } from '@tanstack/react-query';

export default function Mahasiswa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  
  // Local UI state only
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  // Memoized breadcrumbs to avoid unnecessary re-renders
  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Data Mahasiswa' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Data Mahasiswa');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  useEffect(() => {
    if (!user?.roles.some((r) => r.name === 'admin')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Use TanStack Query for server state management
  const { data, isLoading, error } = useQuery({
    queryKey: ['students', { page, pageSize, search: searchValue }],
    queryFn: () => getStudentsAPI({ page, pageSize, search: searchValue }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
  });

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data mahasiswa');
    }
  }, [error]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  const columns: Column<Student>[] = [
    {
      key: 'identityNumber',
      header: 'NIM',
      render: (row: Student) => row.identityNumber || '-',
    },
    {
      key: 'fullName',
      header: 'Nama',
      render: (row: Student) => toTitleCaseName(row.fullName),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Student) => row.email,
    },
    {
      key: 'enrollmentYear',
      header: 'Tahun Masuk',
      render: (row: Student) => row.student?.enrollmentYear || '-',
    },
    {
      key: 'sksCompleted',
      header: 'SKS Selesai',
      render: (row: Student) => row.student?.sksCompleted || 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Student) => (
        <Badge variant={row.student?.status === 'Aktif' ? 'default' : 'secondary'}>
          {row.student?.status || '-'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Student) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/master-data/mahasiswa/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Extract data from query result
  const students = data?.students || [];
  const total = data?.meta?.total || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Mahasiswa</h1>
          <p className="text-gray-500">Kelola data mahasiswa sistem</p>
        </div>
      </div>

      <CustomTable
        columns={columns as any}
        data={students}
        loading={isLoading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters
      />
    </div>
  );
}
