import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CustomTable from '@/components/layout/CustomTable';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';
import { GenericImportExcelDialog } from '@/components/shared/GenericImportExcelDialog';
import { importUsersExcelAPI, getUsersAPI, createUserAPI, updateUserAPI } from '@/services/admin.service';
import { toTitleCaseName } from '@/lib/text';
import { formatRoleName, ROLES } from '@/lib/roles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserFormDialog } from '@/components/master-data/UserFormDialog';
import { RefreshButton } from '@/components/ui/refresh-button';
import * as xlsx from 'xlsx';
import { format } from 'date-fns';

export default function UserManagementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  // Filters
  const [identityTypeFilter, setIdentityTypeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateUserRequest | UpdateUserRequest>({
    fullName: '',
    email: '',
    roles: [],
    identityNumber: '',
    identityType: 'NIM',
  });

  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Kelola User' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Kelola User');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const isVerifiedFilter = useMemo(() => {
    if (statusFilter === 'verified') return true;
    if (statusFilter === 'unverified') return false;
    return undefined;
  }, [statusFilter]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['users', { page, pageSize, search: searchValue, identityType: identityTypeFilter, role: roleFilter, isVerified: isVerifiedFilter }],
    queryFn: () => getUsersAPI({
      page,
      pageSize,
      search: searchValue,
      identityType: identityTypeFilter || undefined,
      role: roleFilter || undefined,
      isVerified: isVerifiedFilter
    }),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (error) toast.error((error as Error).message || 'Gagal memuat data user');
  }, [error]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, identityTypeFilter, roleFilter, statusFilter]);

  const users = data?.users || [];
  const total = data?.meta?.total || 0;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUserAPI(editingUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
      setEditingUser(null);
      toast.success('User berhasil diperbarui');
    },
    onError: (error: any) => toast.error(error.message || 'Gagal memperbarui user'),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => createUserAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
      toast.success('User berhasil dibuat');
    },
    onError: (error: any) => toast.error(error.message || 'Gagal membuat user'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate(formData as UpdateUserRequest);
    } else {
      createMutation.mutate(formData as CreateUserRequest);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await getUsersAPI({
        pageSize: 0, // all
        search: searchValue,
        identityType: identityTypeFilter || undefined,
        role: roleFilter || undefined,
        isVerified: isVerifiedFilter
      });

      const allUsers = response.users || [];

      if (allUsers.length === 0) {
        toast.error('Tidak ada data untuk di-export.');
        return;
      }

      const excelData = allUsers.map((user, index) => ({
        "No": index + 1,
        "Nama Lengkap": toTitleCaseName(user.fullName) || "-",
        "Email": user.email || "-",
        "NIM/NIP": user.identityNumber || "-",
        "Tipe Identitas": user.identityType || "-",
        "Role": user.roles.map((r: any) => formatRoleName(r.name)).join(", "),
        "Status Verifikasi": user.isVerified ? "Terverifikasi" : "Belum Verifikasi",
        "Dibuat": user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "-"
      }));

      const worksheet = xlsx.utils.json_to_sheet(excelData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Data User");

      const colWidths = [
          { wch: 5 },
          { wch: 30 },
          { wch: 30 },
          { wch: 20 },
          { wch: 15 },
          { wch: 40 },
          { wch: 20 },
          { wch: 15 },
      ];
      worksheet["!cols"] = colWidths;

      xlsx.writeFile(workbook, `Data_User_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
      toast.success(`Berhasil mengeksport ${allUsers.length} data user.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengeksport data user.');
    } finally {
      setIsExporting(false);
    }
  };

  const roleOptions = [
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.GKM, label: 'GKM' },
    { value: ROLES.KETUA_DEPARTEMEN, label: 'Ketua Departemen' },
    { value: ROLES.SEKRETARIS_DEPARTEMEN, label: 'Sekretaris Departemen' },
    { value: ROLES.PEMBIMBING_1, label: 'Pembimbing 1' },
    { value: ROLES.PEMBIMBING_2, label: 'Pembimbing 2' },
    { value: ROLES.MAHASISWA, label: 'Mahasiswa' },
    { value: ROLES.PENGUJI, label: 'Penguji' },
    { value: ROLES.KOORDINATOR_YUDISIUM, label: 'Koordinator Yudisium' },
    { value: ROLES.TIM_PENGELOLA_CPL, label: 'Tim Pengelola CPL' },
    { value: ROLES.DOSEN_METOPEN, label: 'Dosen Pengampu Metopel' },
  ];

  const columns = useMemo(() => [
    {
      key: 'fullName',
      header: 'Nama Lengkap',
      render: (row: any) => <span className="font-medium">{toTitleCaseName(row.fullName)}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
    },
    {
      key: 'identityNumber',
      header: 'NIM/NIP',
      render: (row: any) => (
        <div>
          <div className="font-medium">{row.identityNumber || '-'}</div>
          {row.identityType && <div className="text-xs text-muted-foreground">{row.identityType}</div>}
        </div>
      ),
      filter: {
        type: 'select',
        value: identityTypeFilter,
        onChange: setIdentityTypeFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'NIM', value: 'NIM' },
          { label: 'NIP', value: 'NIP' },
          { label: 'OTHER', value: 'OTHER' },
        ],
      },
    },
    {
      key: 'roles',
      header: 'Role',
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role: any) => (
            <Badge key={role.id} variant={role.status === 'active' ? 'default' : 'secondary'}>
              {formatRoleName(role.name)}
            </Badge>
          ))}
        </div>
      ),
      filter: {
        type: 'select',
        value: roleFilter,
        onChange: setRoleFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Admin', value: ROLES.ADMIN },
          { label: 'GKM', value: ROLES.GKM },
          { label: 'Kadep', value: ROLES.KETUA_DEPARTEMEN },
          { label: 'Sekdep', value: ROLES.SEKRETARIS_DEPARTEMEN },
          { label: 'Pembimbing 1', value: ROLES.PEMBIMBING_1 },
          { label: 'Pembimbing 2', value: ROLES.PEMBIMBING_2 },
          { label: 'Mahasiswa', value: ROLES.MAHASISWA },
          { label: 'Penguji', value: ROLES.PENGUJI },
          { label: 'Koordinator Yudisium', value: ROLES.KOORDINATOR_YUDISIUM },
          { label: 'Tim Pengelola CPL', value: ROLES.TIM_PENGELOLA_CPL },
          { label: 'Dosen Pengampu Metopel', value: ROLES.DOSEN_METOPEN },
        ],
      },
    },
    {
      key: 'isVerified',
      header: 'Status',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.isVerified ? (
            <><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600">Terverifikasi</span></>
          ) : (
            <><XCircle className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-500">Belum Verifikasi</span></>
          )}
        </div>
      ),
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: setStatusFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Terverifikasi', value: 'verified' },
          { label: 'Belum Verifikasi', value: 'unverified' },
        ],
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-black"
          onClick={() => {
            setEditingUser(row);
            setFormData({
              fullName: row.fullName,
              email: row.email,
              roles: row.roles.map((r: any) => r.name),
              identityNumber: row.identityNumber,
              identityType: row.identityType,
              isVerified: row.isVerified
            } as any);
            setIsFormOpen(true);
          }}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ], [identityTypeFilter, roleFilter, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kelola User</h2>
          <p className="text-muted-foreground">Manajemen pengguna sistem</p>
        </div>
      </div>

      <CustomTable
        data={users}
        columns={columns as any}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        emptyText="Belum ada data user"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters={true}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setEditingUser(null);
              setFormData({ fullName: '', email: '', roles: ['Mahasiswa'], identityNumber: '', identityType: 'NIM' });
              setIsFormOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> Tambah User
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Excel
            </Button>
            <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
          </div>
        }
      />

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        roleOptions={roleOptions}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <GenericImportExcelDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Data User"
        description="Unggah file Excel untuk mendaftarkan user secara massal."
        templateFilename="Template_Import_User"
        templateHeaders={["Nama Lengkap", "Email", "NIM/NIP", "Tipe Identitas", "Role"]}
        templateSampleData={[{
          "Nama Lengkap": "Budi Santoso",
          "Email": "budi@student.unand.ac.id",
          "NIM/NIP": "2111521001",
          "Tipe Identitas": "NIM",
          "Role": "Mahasiswa"
        }]}
        importFn={importUsersExcelAPI}
        queryKeys={[['users']]}
      />
    </div>
  );
}
