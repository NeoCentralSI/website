import { useState, useMemo } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { getQuestionTypeLabel } from '@/lib/exitSurvey';
import type { ExitSurveyQuestion } from '@/types/exit-survey.types';
import type { UpdateExitSurveyQuestionPayload } from '@/types/exit-survey.types';
import { ExitSurveyQuestionDialog } from './ExitSurveyQuestionDialog';

interface ExitSurveyQuestionTableProps {
  formId: string;
  formName: string;
  data: ExitSurveyQuestion[];
  isLoading: boolean;
  isFetching: boolean;
  onEdit: (question: ExitSurveyQuestion) => void;
  onDelete: (formId: string, questionId: string) => void;
  onAddQuestion: () => void;
  onRefresh: () => void;
  isDeleting: boolean;
  editQuestion: ExitSurveyQuestion | null;
  setEditQuestion: (q: ExitSurveyQuestion | null) => void;
  questionDialogOpen: boolean;
  setQuestionDialogOpen: (open: boolean) => void;
  onSubmitQuestion: (
    formId: string,
    data: import('@/types/exit-survey.types').CreateExitSurveyQuestionPayload | UpdateExitSurveyQuestionPayload,
    questionId?: string
  ) => Promise<unknown>;
}

export function ExitSurveyQuestionTable({
  formId,
  formName: _formName,
  data,
  isLoading,
  isFetching,
  onEdit,
  onDelete,
  onAddQuestion,
  onRefresh,
  isDeleting,
  editQuestion,
  setEditQuestion,
  questionDialogOpen,
  setQuestionDialogOpen,
  onSubmitQuestion,
}: ExitSurveyQuestionTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ formId: string; questionId: string } | null>(
    null
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.formId, deleteTarget.questionId);
      setDeleteTarget(null);
    }
  };

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return data;
    return data.filter((item) => item.question.toLowerCase().includes(term));
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const isOptionType = (item: ExitSurveyQuestion) =>
    item.questionType === 'single_choice' || item.questionType === 'multiple_choice';

  const columns = useMemo<Column<ExitSurveyQuestion>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 56,
        className: 'text-center',
        render: (_item, index) => (
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: 'question',
        header: 'Pertanyaan',
        width: 280,
        className: 'min-w-[200px] whitespace-normal',
        render: (item) => (
          <span className="text-sm text-foreground">{item.question}</span>
        ),
      },
      {
        key: 'questionType',
        header: 'Jenis Pertanyaan',
        width: 140,
        render: (item) => (
          <span className="text-sm">
            {getQuestionTypeLabel(item.questionType)}
          </span>
        ),
      },
      {
        key: 'options',
        header: 'Opsi Jawaban',
        width: 320,
        className: 'w-[320px] max-w-[320px]',
        render: (item) => {
          if (!isOptionType(item) || !item.options?.length) {
            return (
              <span className="text-sm text-muted-foreground">—</span>
            );
          }
          const sorted = [...item.options].sort(
            (a, b) => a.orderNumber - b.orderNumber
          );
          const text = sorted.map((o) => o.optionText).join(', ');
          const fullTitle = sorted.map((o) => o.optionText).join('\n');
          return (
            <span
              className="block max-w-[320px] text-sm text-muted-foreground break-all line-clamp-2"
              title={fullTitle}
            >
              {text || '—'}
            </span>
          );
        },
      },
      {
        key: 'isRequired',
        header: 'Wajib',
        width: 90,
        className: 'text-center',
        render: (item) => (
          <Badge
            variant={item.isRequired ? 'default' : 'secondary'}
            className="text-xs shrink-0"
          >
            {item.isRequired ? 'Iya' : 'Tidak'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 120,
        className: 'text-right shrink-0',
        render: (item) => (
          <div className="flex items-center justify-end gap-1 flex-nowrap">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(item)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteTarget({ formId, questionId: item.id })}
              disabled={isDeleting}
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize, formId, isDeleting, onEdit]
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
        emptyText="Belum ada pertanyaan"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={onRefresh}
              isRefreshing={isFetching && !isLoading}
            />
            <Button onClick={onAddQuestion} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pertanyaan
            </Button>
          </div>
        }
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pertanyaan ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/90"
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
      <ExitSurveyQuestionDialog
        open={questionDialogOpen}
        onOpenChange={(open) => {
          setQuestionDialogOpen(open);
          if (!open) setEditQuestion(null);
        }}
        formId={formId}
        editData={editQuestion}
        orderNumber={data.length + 1}
        onSubmit={async (fId, data, questionId) => {
          await onSubmitQuestion(fId, data, questionId);
        }}
      />
    </>
  );
}
