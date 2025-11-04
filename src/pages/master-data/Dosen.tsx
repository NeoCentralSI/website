import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useAuth } from '../../hooks/useAuth';
import { getLecturersAPI, type Lecturer } from '../../services/admin.service';
import CustomTable, { type Column } from '../../components/layout/CustomTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { toTitleCaseName } from '../../lib/text';

export default function Dosen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [allLecturers, setAllLecturers] = useState<Lecturer[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Master Data' },
      { label: 'Data Dosen' },
    ]);
    setTitle('Data Dosen');
  }, [setBreadcrumbs, setTitle]);

  useEffect(() => {
    if (!user?.roles.some((r) => r.name === 'admin')) {
      navigate('/dashboard');
      return;
    }
    fetchLecturers();
  }, [user]);

  const fetchLecturers = async () => {
    setIsLoading(true);
    try {
      const response = await getLecturersAPI({
        page: 1,
        pageSize: 1000, // Fetch all for client-side filtering
        search: '',
      });
      setAllLecturers(response.lecturers);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data dosen');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and pagination on client side
  useEffect(() => {
    let filtered = [...allLecturers];

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(
        (lecturer) =>
          lecturer.fullName.toLowerCase().includes(searchValue.toLowerCase()) ||
          lecturer.email.toLowerCase().includes(searchValue.toLowerCase()) ||
          lecturer.identityNumber?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setLecturers(filtered.slice(startIndex, endIndex));
  }, [allLecturers, searchValue, page, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  const columns: Column<Lecturer>[] = [
    {
      key: 'identityNumber',
      header: 'NIP',
      render: (row: Lecturer) => row.identityNumber || '-',
    },
    {
      key: 'fullName',
      header: 'Nama',
      render: (row: Lecturer) => toTitleCaseName(row.fullName),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Lecturer) => row.email,
    },
    {
      key: 'phone',
      header: 'Telepon',
      render: (row: Lecturer) => row.phone || '-',
    },
    {
      key: 'activeGuidances',
      header: 'Bimbingan Aktif',
      render: (row: Lecturer) => (
        <Badge variant="default">
          {row.lecturer?.activeGuidances || 0}
        </Badge>
      ),
    },
    {
      key: 'seminarJuries',
      header: 'Penguji Seminar',
      render: (row: Lecturer) => (
        <Badge variant="secondary">
          {row.lecturer?.seminarJuries || 0}
        </Badge>
      ),
    },
    {
      key: 'defenceJuries',
      header: 'Penguji Sidang',
      render: (row: Lecturer) => (
        <Badge variant="secondary">
          {row.lecturer?.defenceJuries || 0}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Lecturer) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/master-data/dosen/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Dosen</h1>
          <p className="text-gray-500">Kelola data dosen sistem</p>
        </div>
      </div>

      <CustomTable
        columns={columns as any}
        data={lecturers}
        loading={isLoading}
        total={allLecturers.length}
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
