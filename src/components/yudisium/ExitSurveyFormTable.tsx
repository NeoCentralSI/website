import { useState, useMemo } from 'react';
import { Pencil, Power, Trash2, Plus, Copy, List } from 'lucide-react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import type { UpdateExitSurveyFormPayload } from '@/types/exit-survey.types';
import { ExitSurveyFormDialog } from './ExitSurveyFormDialog';

interface ExitSurveyFormTableProps {
  data: ExitSurveyForm[];
  isLoading: boolean;
  isFetching: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: UpdateExitSurveyFormPayload) => Promise<unknown>;
  onDuplicate: (id: string) => void;
  onManageQuestions: (form: ExitSurveyForm) => void;
  onCreate: () => void;
  onRefresh: () => void;
  isToggling: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
}

export function ExitSurveyFormTable({
  isLoading,
  isFetching,
  onToggle,
  onDelete,
  onUpdate,
  onDuplicate,
  onManageQuestions,
  onCreate,
  onRefresh,
  isToggling,
  isDeleting,
  isDuplicating,
  data = [],
}: ExitSurveyFormTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ExitSurveyForm | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    
    return data.filter((item) => {
      const matchedSearch = !term || (
        item.name.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term)
      );

      const matchedStatus = statusFilter === '' || (
        statusFilter === 'active' ? item.isActive : !item.isActive
      );

      return matchedSearch && matchedStatus;
    });
  }, [data, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns = useMemo<Column<ExitSurveyForm>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 50,
        className: 'text-center',
        render: (_item, index) => (
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Nama',
        render: (item) => <span className="font-medium">{item.name}</span>,
      },
      {
        key: 'description',
        header: 'Deskripsi',
        className: 'max-w-md whitespace-normal',
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {item.description ?? '-'}
          </span>
        ),
      },
      {
        key: 'totalQuestions',
        header: 'Total Pertanyaan',
        width: 120,
        className: 'text-center',
        render: (item) => (
          <span className="text-sm">
            {item.totalQuestions ?? item.questions?.length ?? 0}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 90,
        filter: {
          type: 'select',
          value: statusFilter,
          onChange: (value: string) => {
            setStatusFilter(value);
            setPage(1);
          },
          options: [
            { label: 'Aktif', value: 'active' },
            { label: 'Arsip', value: 'inactive' },
            { label: 'Semua', value: '' },
          ],
        },
        render: (item) => (
          <Badge
            variant={item.isActive ? 'default' : 'secondary'}
            className={
              item.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }
          >
            {item.isActive ? 'Aktif' : 'Arsip'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 240,
        className: 'text-right',
        render: (item) => (
          <div className="flex items-center justify-end gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onManageQuestions(item)}
              title="Kelola pertanyaan"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setEditItem(item)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onDuplicate(item.id)}
              disabled={isDuplicating}
              title="Duplikat form"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                item.isActive
                  ? 'text-muted-foreground hover:text-amber-600'
                  : 'text-muted-foreground hover:text-emerald-600'
              }`}
              onClick={() => onToggle(item.id)}
              disabled={isToggling}
              title={item.isActive ? 'Arsipkan' : 'Aktifkan'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteId(item.id)}
              disabled={isDeleting}
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize, onToggle, onManageQuestions, onDuplicate, isToggling, isDeleting, isDuplicating]
  );

  return (
    <>
      <CustomTable
        columns={columns}
        data={paginatedData}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        enableColumnFilters
        emptyText="Belum ada form exit survey"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
            <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />
          </div>
        }
      />
      <AlertDialog open={!!deleteId} onOpenChange={(o: boolean) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Form Exit Survey</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus form ini? Form yang sudah digunakan oleh acara yudisium tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {editItem && (
        <ExitSurveyFormDialog
          open={!!editItem}
          onOpenChange={(o: boolean) => !o && setEditItem(null)}
          editData={editItem}
          onSubmit={onUpdate}
        />
      )}
    </>
  );
}
