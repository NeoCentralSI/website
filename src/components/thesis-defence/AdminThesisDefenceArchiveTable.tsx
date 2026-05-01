import { useMemo, useState } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { CustomTable } from '@/components/layout/CustomTable';
import type { AdminDefenceListItem } from '@/types/defence.types';
import {
  ThesisStudentInfoCell,
  ThesisTitleCell,
  ThesisPersonnelListCell
} from '@/components/shared/ThesisTableCells';
import { useAdminDefenceFormOptions, useUpdateAdminDefenceArchive, useDeleteAdminDefenceArchive } from '@/hooks/thesis-defence/useAdminThesisDefence';
import { AdminThesisDefenceArchiveFormDialog } from '@/components/thesis-defence/AdminThesisDefenceArchiveFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminThesisDefenceArchiveTableProps {
  data: AdminDefenceListItem[];
  loading: boolean;
  isRefreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  actions?: React.ReactNode;
}

export function AdminThesisDefenceArchiveTable({
  data,
  loading,
  isRefreshing,
  page,
  pageSize,
  total,
  searchValue,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  actions,
}: AdminThesisDefenceArchiveTableProps) {
  const navigate = useNavigate();
  const [editingDefence, setEditingDefence] = useState<AdminDefenceListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { thesisOptions, lecturerOptions, roomOptions } = useAdminDefenceFormOptions();
  const updateMutation = useUpdateAdminDefenceArchive();
  const deleteMutation = useDeleteAdminDefenceArchive();

  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Mahasiswa',
        width: 200,
        render: (row: AdminDefenceListItem) => (
          <ThesisStudentInfoCell name={row.studentName} nim={row.studentNim} />
        ),
      },
      {
        key: 'thesis',
        header: 'Judul TA',
        width: 300,
        render: (row: AdminDefenceListItem) => (
          <ThesisTitleCell title={row.thesisTitle} />
        ),
      },
      {
        key: 'supervisors',
        header: 'Pembimbing',
        width: 200,
        render: (row: AdminDefenceListItem) => (
          <ThesisPersonnelListCell people={row.supervisors} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 180,
        render: (row: AdminDefenceListItem) => (
          <ThesisEventStatusBadge
            status={row.status}
            scheduledDate={row.date}
            startTime={row.startTime}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 150,
        className: 'text-center',
        render: (row: AdminDefenceListItem) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(`/tugas-akhir/sidang/${row.id}`)}
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setEditingDefence(row)}
              title="Edit Arsip"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeletingId(row.id)}
              title="Hapus Arsip"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <>
      <CustomTable<AdminDefenceListItem>
        data={data}
        columns={columns}
        loading={loading}
        isRefreshing={isRefreshing}
        emptyText="Tidak ada data arsip sidang"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        actions={actions}
      />

      <AdminThesisDefenceArchiveFormDialog
        open={!!editingDefence}
        onOpenChange={(open) => !open && setEditingDefence(null)}
        editingSeminar={editingDefence as any} // Cast because of minor type differences
        thesisOptions={thesisOptions}
        lecturerOptions={lecturerOptions}
        roomOptions={roomOptions}
        isPending={updateMutation.isPending}
        onSubmit={(payload) => {
          if (editingDefence) {
            updateMutation.mutate(
              { defenceId: editingDefence.id, payload },
              { onSuccess: () => setEditingDefence(null) }
            );
          }
        }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip Sidang?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data sidang akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate(deletingId, {
                    onSuccess: () => setDeletingId(null),
                  });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
