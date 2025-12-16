import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, UserPlus, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import CustomTable from '@/components/layout/CustomTable';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';
import { createUserAPI, updateUserAPI, importStudentsCsvAPI, getUsersAPI } from '@/services/admin.service';
import { toTitleCaseName } from '@/lib/text';
import { formatRoleName, ROLES } from '@/lib/roles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserFormDialog, ImportStudentDialog } from '@/components/master-data';

export default function UserManagementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  
  // Local UI state only
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  
  // Server-side filters
  const [identityTypeFilter, setIdentityTypeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Form state (local UI state)
  const [formData, setFormData] = useState<CreateUserRequest | UpdateUserRequest>({
    fullName: '',
    email: '',
    roles: [],
    identityNumber: '',
    identityType: 'NIM',
  });

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Kelola User' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Kelola User');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // Convert statusFilter to boolean for API
  const isVerifiedFilter = useMemo(() => {
    if (statusFilter === 'verified') return true;
    if (statusFilter === 'unverified') return false;
    return undefined;
  }, [statusFilter]);

  // Use TanStack Query for server state with all filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', { 
      page, 
      pageSize, 
      search: searchValue,
      identityType: identityTypeFilter,
      role: roleFilter,
      isVerified: isVerifiedFilter
    }],
    queryFn: () => getUsersAPI({ 
      page, 
      pageSize, 
      search: searchValue,
      identityType: identityTypeFilter || undefined,
      role: roleFilter || undefined,
      isVerified: isVerifiedFilter
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data user');
    }
  }, [error]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchValue, identityTypeFilter, roleFilter, statusFilter]);

  // Extract users from query data (no client-side filtering needed)
  const users = data?.users || [];
  const total = data?.meta?.total || 0;

  // Invalidate cache after mutations
  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        roles: user.roles.map(r => r.name),
        identityNumber: user.identityNumber,
        identityType: user.identityType,
        isVerified: user.isVerified,
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        roles: [],
        identityNumber: '',
        identityType: 'NIM',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await updateUserAPI(editingUser.id, formData as UpdateUserRequest);
        toast.success('User berhasil diupdate');
      } else {
        await createUserAPI(formData as CreateUserRequest);
        toast.success('User berhasil dibuat');
      }
      
      setDialogOpen(false);
      invalidateUsers(); // Invalidate cache to refetch data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan user');
    }
  };

  const handleImportCsv = async () => {
    if (!selectedFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    try {
      const result = await importStudentsCsvAPI(selectedFile);
      toast.success(`Berhasil import ${result.summary?.created || 0} mahasiswa`);
      setImportDialogOpen(false);
      setSelectedFile(null);
      invalidateUsers(); // Invalidate cache to refetch data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal import CSV');
    }
  };

  // Role options for form - using ROLES constants from lib/roles.ts
  const roleOptions = [
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.GKM, label: 'GKM' },
    { value: ROLES.KETUA_DEPARTEMEN, label: 'Ketua Departemen' },
    { value: ROLES.SEKRETARIS_DEPARTEMEN, label: 'Sekretaris Departemen' },
    { value: ROLES.PEMBIMBING_1, label: 'Pembimbing 1' },
    { value: ROLES.PEMBIMBING_2, label: 'Pembimbing 2' },
    { value: ROLES.MAHASISWA, label: 'Mahasiswa' },
    { value: ROLES.PENGUJI, label: 'Penguji' },
  ];

  const columns = [
    {
      key: 'fullName',
      header: 'Nama Lengkap',
      sortable: true,
      render: (row: any) => (
        <span className="font-medium">{toTitleCaseName(row.fullName)}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      key: 'identityNumber',
      header: 'NIM/NIP',
      render: (row: any) => (
        <div>
          <div className="font-medium">{row.identityNumber || '-'}</div>
          {row.identityType && (
            <div className="text-xs text-muted-foreground">{row.identityType}</div>
          )}
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
            <Badge
              key={role.id}
              variant={role.status === 'active' ? 'default' : 'secondary'}
            >
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
          { label: 'Ketua Departemen', value: ROLES.KETUA_DEPARTEMEN },
          { label: 'Sekretaris Departemen', value: ROLES.SEKRETARIS_DEPARTEMEN },
          { label: 'Pembimbing 1', value: ROLES.PEMBIMBING_1 },
          { label: 'Pembimbing 2', value: ROLES.PEMBIMBING_2 },
          { label: 'Mahasiswa', value: ROLES.MAHASISWA },
          { label: 'Penguji', value: ROLES.PENGUJI },
        ],
      },
    },
    {
      key: 'isVerified',
      header: 'Status',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.isVerified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Terverifikasi</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Belum Verifikasi</span>
            </>
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
          size="sm"
          onClick={() => handleOpenDialog(row as User)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kelola User</h2>
          <p className="text-muted-foreground">Manajemen pengguna sistem</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>
      </div>

      <CustomTable
        data={users}
        columns={columns as any}
        loading={isLoading}
        emptyText="Belum ada data user"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters={true}
      />

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        roleOptions={roleOptions}
      />

      <ImportStudentDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        onImport={handleImportCsv}
      />
    </div>
  );
}
