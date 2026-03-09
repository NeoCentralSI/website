import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useRole } from '@/hooks/shared/useRole';
import { getStudentsAPI, triggerSiaSyncAPI, type Student } from '@/services/admin.service';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Eye, RefreshCw, Pencil } from 'lucide-react';
import { toTitleCaseName } from '@/lib/text';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUpdateStudentAPI } from '@/services/admin.service';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, X } from 'lucide-react';

export default function Mahasiswa() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  // Local UI state only
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editSks, setEditSks] = useState<number>(0);
  const [editSemester, setEditSemester] = useState<number>(1);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editMandatory, setEditMandatory] = useState<boolean>(false);
  const [editMkwu, setEditMkwu] = useState<boolean>(false);
  const [editInternship, setEditInternship] = useState<boolean>(false);
  const [editKkn, setEditKkn] = useState<boolean>(false);

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
    if (!isAdmin()) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Use TanStack Query for server state management
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['students', { page, pageSize, search: searchValue }],
    queryFn: () => getStudentsAPI({ page, pageSize, search: searchValue }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminUpdateStudentAPI(selectedStudent!.id, data),
    onSuccess: () => {
      toast.success('Data mahasiswa berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncMutation = useMutation({
    mutationFn: triggerSiaSyncAPI,
    onSuccess: () => {
      toast.success('Sync SIA berhasil dijalankan');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => {
      toast.error((err as Error).message || 'Sync SIA gagal');
    },
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
      key: 'currentSemester',
      header: 'Sem.',
      className: 'w-[60px] text-center',
      render: (row: Student) => row.student?.currentSemester || '-',
    },
    {
      key: 'progress',
      header: 'Prog. Wajib',
      render: (row: Student) => (
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">MKW:</span>
                  {row.student?.mandatoryCoursesCompleted ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>Mata Kuliah Wajib Selesai</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-xs text-muted-foreground mr-1">MKWU:</span>
                  {row.student?.mkwuCompleted ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>MKWU Selesai</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-xs text-muted-foreground mr-1">KP:</span>
                  {row.student?.internshipCompleted ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>Kerja Praktek Selesai</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-xs text-muted-foreground mr-1">KKN:</span>
                  {row.student?.kknCompleted ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>KKN Selesai</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Student) => {
        const rawStatus = row.student?.status || '-';
        const displayStatus = rawStatus === 'active' ? 'Aktif'
          : rawStatus === 'lulus' ? 'Lulus'
            : rawStatus === 'bss' ? 'Cuti (BSS)'
              : rawStatus === 'dropout' ? 'Drop Out'
                : rawStatus === 'mengundurkan_diri' ? 'Mengundurkan Diri'
                  : rawStatus;
        return (
          <Badge variant={rawStatus === 'active' ? 'default' : 'secondary'}>
            {displayStatus}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Student) => (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-black"
            onClick={() => navigate(`/master-data/mahasiswa/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin() && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-black"
              onClick={() => {
                setSelectedStudent(row);
                setEditSks(row.student?.sksCompleted || 0);
                setEditSemester(row.student?.currentSemester || 1);
                setEditStatus(row.student?.status || 'active');
                setEditMandatory(row.student?.mandatoryCoursesCompleted || false);
                setEditMkwu(row.student?.mkwuCompleted || false);
                setEditInternship(row.student?.internshipCompleted || false);
                setEditKkn(row.student?.kknCompleted || false);
                setIsEditOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Extract data from query result
  const students = data?.students || [];
  const total = data?.meta?.total || 0;


  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Mahasiswa</h1>
          <p className="text-gray-500">Kelola data mahasiswa sistem</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sinkronkan data mahasiswa dari SIA</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  aria-label="Sinkronisasi data SIA"
                >
                  <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{syncMutation.isPending ? 'Menyinkronkan...' : 'Sinkronkan data SIA'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <CustomTable
        columns={columns as any}
        data={students}
        loading={isLoading}
        isRefreshing={(isFetching && !isLoading) || syncMutation.isPending}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters
        actions={
          <RefreshButton
            onClick={() => refetch()}
            isRefreshing={isFetching && !isLoading}
          />
        }
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Mahasiswa</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKS Selesai</Label>
                <Input
                  type="number"
                  min="0"
                  value={editSks}
                  onChange={(e) => setEditSks(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Semester Saat Ini</Label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={editSemester}
                  onChange={(e) => setEditSemester(Number(e.target.value))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="lulus">Lulus</SelectItem>
                  <SelectItem value="bss">Cuti</SelectItem>
                  <SelectItem value="dropout">Drop Out</SelectItem>
                  <SelectItem value="mengundurkan_diri">Mengundurkan Diri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-base font-semibold">Persyaratan Akademik</Label>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mata Kuliah Wajib Selesai</Label>
                  <p className="text-xs text-muted-foreground">Status penyelesaian seluruh MK wajib prodi</p>
                </div>
                <Switch checked={editMandatory} onCheckedChange={setEditMandatory} />
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>MKWU Selesai</Label>
                  <p className="text-xs text-muted-foreground">Mata Kuliah Wajib Umum (Agama, Pancasila, dll)</p>
                </div>
                <Switch checked={editMkwu} onCheckedChange={setEditMkwu} />
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Praktek Lapangan / Magang</Label>
                  <p className="text-xs text-muted-foreground">Penyelesaian kegiatan magang industri</p>
                </div>
                <Switch checked={editInternship} onCheckedChange={setEditInternship} />
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Kuliah Kerja Nyata (KKN)</Label>
                  <p className="text-xs text-muted-foreground">Penyelesaian program pengabdian masyarakat</p>
                </div>
                <Switch checked={editKkn} onCheckedChange={setEditKkn} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 px-1">Mahasiswa: {toTitleCaseName(selectedStudent?.fullName || '')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={() => setIsConfirmOpen(true)} disabled={updateMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Edit Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyimpan perubahan data mahasiswa ini? Perubahan akan langsung berdampak pada sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  sksCompleted: editSks,
                  status: editStatus,
                  currentSemester: editSemester,
                  mandatoryCoursesCompleted: editMandatory,
                  mkwuCompleted: editMkwu,
                  internshipCompleted: editInternship,
                  kknCompleted: editKkn
                }, {
                  onSuccess: () => setIsConfirmOpen(false)
                });
              }}
              disabled={updateMutation.isPending}
            >
              Ya, Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
