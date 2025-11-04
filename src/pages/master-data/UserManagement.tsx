import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, UserPlus, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import CustomTable from '@/components/layout/CustomTable';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';
import { createUserAPI, updateUserAPI, importStudentsCsvAPI, getUsersAPI } from '@/services/admin.service';
import { toTitleCaseName } from '@/lib/text';

export default function UserManagementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [allUsers, setAllUsers] = useState<User[]>([]); // All data from API
  const [users, setUsers] = useState<User[]>([]); // Filtered data for display
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  
  // Column filters
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

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Master Data' },
      { label: 'Kelola User' },
    ]);
    setTitle('Kelola User');
  }, [setBreadcrumbs, setTitle]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsersAPI({ page: 1, pageSize: 1000 }); // Load all data
      setAllUsers(response.users);
    } catch (error) {
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchValue, identityTypeFilter, roleFilter, statusFilter]);

  // Filter and paginate data on frontend
  useEffect(() => {
    let filtered = allUsers;

    // Apply search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.identityNumber?.toLowerCase().includes(search)
      );
    }

    // Apply identity type filter
    if (identityTypeFilter) {
      filtered = filtered.filter(user => user.identityType === identityTypeFilter);
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === roleFilter)
      );
    }

    // Apply status filter
    if (statusFilter) {
      const isVerified = statusFilter === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setUsers(filtered.slice(start, end));
  }, [allUsers, searchValue, identityTypeFilter, roleFilter, statusFilter, page, pageSize]);

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
      loadUsers();
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
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal import CSV');
    }
  };

  // Format role name for display
  const formatRoleName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'gkm': 'GKM',
      'kadep': 'Kadep',
      'pembimbing1': 'Pembimbing 1',
      'pembimbing2': 'Pembimbing 2',
      'student': 'Mahasiswa',
      'sekdep': 'Sekdep',
      'penguji': 'Penguji',
    };
    return roleMap[roleName] || roleName;
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'gkm', label: 'GKM' },
    { value: 'kadep', label: 'Kadep' },
    { value: 'pembimbing1', label: 'Pembimbing 1' },
    { value: 'pembimbing2', label: 'Pembimbing 2' },
    { value: 'student', label: 'Mahasiswa' },
    { value: 'sekdep', label: 'Sekdep' },
    { value: 'penguji', label: 'Penguji' },
  ];

  // Calculate filtered total
  const getFilteredTotal = () => {
    let filtered = allUsers;

    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.identityNumber?.toLowerCase().includes(search)
      );
    }

    if (identityTypeFilter) {
      filtered = filtered.filter(user => user.identityType === identityTypeFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === roleFilter)
      );
    }

    if (statusFilter) {
      const isVerified = statusFilter === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    return filtered.length;
  };

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
          { label: 'Admin', value: 'admin' },
          { label: 'GKM', value: 'gkm' },
          { label: 'Kadep', value: 'kadep' },
          { label: 'Pembimbing 1', value: 'pembimbing1' },
          { label: 'Pembimbing 2', value: 'pembimbing2' },
          { label: 'Mahasiswa', value: 'student' },
          { label: 'Sekdep', value: 'sekdep' },
          { label: 'Penguji', value: 'penguji' },
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
        loading={loading}
        emptyText="Belum ada data user"
        page={page}
        pageSize={pageSize}
        total={getFilteredTotal()}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters={true}
      />

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Ubah informasi user yang sudah ada'
                  : 'Buat user baru dengan mengisi form di bawah'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="identityType">Tipe Identitas</Label>
                  <Select
                    value={formData.identityType}
                    onValueChange={(value: any) => {
                      // Auto-set role to student if identity type is NIM
                      if (value === 'NIM') {
                        setFormData({ ...formData, identityType: value, roles: ['student'] });
                      } else {
                        setFormData({ ...formData, identityType: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIM">NIM</SelectItem>
                      <SelectItem value="NIP">NIP</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="identityNumber">Nomor Identitas</Label>
                  <Input
                    id="identityNumber"
                    value={formData.identityNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, identityNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="roles">Role</Label>
                <Select
                  value={typeof formData.roles?.[0] === 'string' ? formData.roles[0] : ''}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, roles: [value] })
                  }
                  disabled={formData.identityType === 'NIM'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions
                      .filter(role => {
                        // Filter admin jika edit mode
                        if (editingUser && role.value === 'admin') return false;
                        // Filter student jika identity type adalah NIP
                        if (formData.identityType === 'NIP' && role.value === 'student') return false;
                        // Only show student if identity type is NIM
                        if (formData.identityType === 'NIM' && role.value !== 'student') return false;
                        return true;
                      })
                      .map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.identityType === 'NIM' && (
                  <p className="text-xs text-muted-foreground">
                    Note: User dengan NIM hanya dapat memiliki role Mahasiswa
                  </p>
                )}
                {editingUser && formData.identityType !== 'NIM' && (
                  <p className="text-xs text-muted-foreground">
                    Note: Role admin tidak dapat diubah melalui form ini
                  </p>
                )}
                {formData.identityType === 'NIP' && (
                  <p className="text-xs text-muted-foreground">
                    Note: User dengan NIP tidak dapat menjadi mahasiswa
                  </p>
                )}
              </div>

              {editingUser && 'isVerified' in formData && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isVerified">Status Verifikasi</Label>
                  <Switch
                    id="isVerified"
                    checked={formData.isVerified}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isVerified: checked })
                    }
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingUser ? 'Simpan Perubahan' : 'Buat User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Mahasiswa dari CSV</DialogTitle>
            <DialogDescription>
              Upload file CSV untuk import data mahasiswa secara massal
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csv-file">File CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Format: NIM, Nama, Email, dll.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleImportCsv} disabled={!selectedFile}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
