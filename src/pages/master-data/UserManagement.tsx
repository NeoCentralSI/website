import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { UserPlus, Upload } from 'lucide-react';
import CustomTable from '@/components/layout/CustomTable';
import { UserFormDialog, ImportStudentDialog } from '@/components/master-data';
import { useUserManagement, useUserForm, useImportStudents } from '@/hooks/admin';
import { getUserTableColumns } from '@/lib/userTableColumns';
import { roleOptions } from '@/lib/roles';

export default function UserManagementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const {
    users,
    total,
    isLoading,
    page,
    pageSize,
    setPage,
    setPageSize,
    searchValue,
    setSearchValue,
    identityTypeFilter,
    setIdentityTypeFilter,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    invalidateUsers,
  } = useUserManagement();

  const {
    dialogOpen,
    setDialogOpen,
    editingUser,
    formData,
    setFormData,
    handleOpenDialog,
    handleSubmit,
  } = useUserForm(invalidateUsers);

  const {
    importDialogOpen,
    setImportDialogOpen,
    selectedFile,
    setSelectedFile,
    handleImportCsv,
  } = useImportStudents(invalidateUsers);

  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Kelola User' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Kelola User');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const columns = getUserTableColumns({
    identityTypeFilter,
    setIdentityTypeFilter,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    onEdit: handleOpenDialog,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kelola User</h2>
          <p className="text-muted-foreground">Manajemen pengguna sistem</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
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
