import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, Copy, Settings, Calendar, HelpCircle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import type { UpdateExitSurveyFormPayload } from '@/types/exit-survey.types';
import { ExitSurveyFormDialog } from './ExitSurveyFormDialog';

interface ExitSurveyFormTableProps {
  data: ExitSurveyForm[];
  isLoading: boolean;
  isFetching: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: UpdateExitSurveyFormPayload) => Promise<unknown>;
  onDuplicate: (id: string) => void;
  onManageQuestions: (form: ExitSurveyForm) => void;
  onCreate: () => void;
  onRefresh: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
}

export function ExitSurveyFormTable({
  isLoading,
  isFetching,
  onDelete,
  onUpdate,
  onDuplicate,
  onManageQuestions,
  onCreate,
  onRefresh,
  isUpdating,
  isDeleting,
  isDuplicating,
  data = [],
}: ExitSurveyFormTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ExitSurveyForm | null>(null);
  const [search, setSearch] = useState('');
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
      return !term || (
        item.name.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term)
      );
    });
  }, [data, search]);

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
        width: 220,
        className: 'whitespace-normal',
        render: (item) => <span className="font-medium">{item.name}</span>,
      },
      {
        key: 'description',
        header: 'Deskripsi',
        className: 'whitespace-normal min-w-[300px]',
        render: (item) => (
          <span className="text-sm">
            {item.description ?? '-'}
          </span>
        ),
      },
      {
        key: 'usedCount',
        header: 'Terpakai',
        width: 100,
        className: 'text-center',
        render: (item) => (
          <div className="flex justify-center">
            <Badge variant="outline" className="flex items-center gap-1 font-normal">
              <Calendar className="h-3 w-3" />
              <span className="font-bold">{item.usedCount}</span>
            </Badge>
          </div>
        ),
      },
      {
        key: 'totalQuestions',
        header: 'Pertanyaan',
        width: 110,
        className: 'text-center',
        render: (item) => (
          <div className="flex justify-center">
            <Badge variant="outline" className="flex items-center gap-1 font-normal">
              <HelpCircle className="h-3 w-3" />
              <span className="font-bold">{item.totalQuestions}</span>
            </Badge>
          </div>
        ),
      },
      {
        key: 'isActive',
        header: 'Aktif',
        width: 80,
        className: 'text-center',
        render: (item) => (
          <div className="flex justify-center">
            <Switch
              checked={item.isActive}
              onCheckedChange={() => onUpdate(item.id, { isActive: !item.isActive })}
              disabled={isUpdating}
            />
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 180,
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
              <Settings className="h-4 w-4" />
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
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setEditItem(item)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${item.usedCount > 0
                  ? 'text-red-300 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}
              onClick={() => setDeleteId(item.id)}
              disabled={isDeleting || item.usedCount > 0}
              title={item.usedCount > 0 ? 'Tidak dapat dihapus karena sudah digunakan oleh acara yudisium' : 'Hapus'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize, onManageQuestions, onDuplicate, onUpdate, isUpdating, isDeleting, isDuplicating]
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
              Apakah Anda yakin ingin menghapus form ini? Lanjutkan.
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
