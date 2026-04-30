import { useMemo, useState } from 'react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName } from '@/lib/text';
import { RotateCcw, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export interface ThesisSeminarAudienceTableRow {
  studentId?: string;
  studentName: string;
  nim: string;
  registeredAt: string | null;
  approvedAt: string | null;
  approvedByName?: string | null;
}

interface ThesisSeminarAudienceTableProps {
  rows: ThesisSeminarAudienceTableRow[];
  emptyLabel?: string;
  showAction?: boolean;
  approvingStudentId?: string | null;
  unapprovingStudentId?: string | null;
  onApprove?: (row: ThesisSeminarAudienceTableRow) => void;
  onUnapprove?: (row: ThesisSeminarAudienceTableRow) => void;
  loading?: boolean;
  // Selection
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (row: ThesisSeminarAudienceTableRow, index: number) => boolean;
  actions?: React.ReactNode;
  // Admin props
  isEditable?: boolean;
  onDelete?: (studentId: string) => void;
}

export function ThesisSeminarAudienceTable({
  rows,
  emptyLabel = 'Belum ada peserta yang mendaftar.',
  showAction = false,
  approvingStudentId,
  unapprovingStudentId,
  onApprove,
  onUnapprove,
  loading = false,
  selectedIds = [],
  onSelectionChange,
  isRowSelectable,
  actions,
  isEditable = false,
  onDelete,
}: ThesisSeminarAudienceTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const name = row.studentName || '';
      const nim = row.nim || '';
      const approvedBy = row.approvedByName || '';

      return (
        name.toLowerCase().includes(query) ||
        nim.toLowerCase().includes(query) ||
        approvedBy.toLowerCase().includes(query)
      );
    });
  }, [search, rows]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const columns = useMemo<Column<ThesisSeminarAudienceTableRow>[]>(() => {
    const baseColumns: Column<ThesisSeminarAudienceTableRow>[] = [
      {
        key: 'no',
        header: 'No',
        width: '5%',
        className: 'text-center',
        render: (_row, index) => (
          <span className="text-sm text-muted-foreground">{(page - 1) * pageSize + index + 1}</span>
        ),
      },
      {
        key: 'name',
        header: 'Nama',
        width: '30%',
        render: (row) => <span className="font-medium">{toTitleCaseName(row.studentName || '-')}</span>,
      },
      {
        key: 'nim',
        header: 'NIM',
        width: '20%',
        render: (row) => row.nim,
      },
      {
        key: 'status',
        header: 'Status',
        width: '15%',
        className: 'text-center',
        render: (row) => {
          const isApproved = !!row.approvedAt;
          return (
            <Badge variant={isApproved ? 'success' : 'secondary'} className="text-xs">
              {isApproved ? 'Hadir' : 'Tidak Hadir'}
            </Badge>
          );
        },
      },
      {
        key: 'approvedAt',
        header: 'Disetujui Pada',
        width: '15%',
        render: (row) =>
          row.approvedAt
            ? format(new Date(row.approvedAt), 'd MMM yyyy', { locale: idLocale })
            : '-',
      },
      {
        key: 'approvedBy',
        header: 'Disetujui Oleh',
        width: '15%',
        render: (row) => row.approvedByName || '-',
      },
    ];

    const hasAnyAction = showAction || isEditable;

    if (hasAnyAction) {
      baseColumns.push({
        key: 'actions',
        header: 'Aksi',
        className: 'text-right',
        width: 150,
        render: (row) => {
          const isApproved = !!row.approvedAt;
          const isApprovingThisRow = !!approvingStudentId && approvingStudentId === row.studentId;
          const isUnapprovingThisRow = !!unapprovingStudentId && unapprovingStudentId === row.studentId;

          return (
            <div className="flex items-center justify-end gap-1">
              {showAction && (
                isApproved ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onUnapprove?.(row)}
                    disabled={!row.studentId || isUnapprovingThisRow}
                    title="Batalkan Setujui"
                  >
                    {isUnapprovingThisRow ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onApprove?.(row)}
                    disabled={!row.studentId || isApprovingThisRow}
                    title="Setujui"
                  >
                    {isApprovingThisRow ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                )
              )}
              {isEditable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => row.studentId && onDelete?.(row.studentId)}
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [showAction, isEditable, onDelete, page, pageSize, approvingStudentId, unapprovingStudentId, onApprove, onUnapprove]);

  return (
    <CustomTable
      columns={columns as any}
      data={paginatedRows}
      loading={loading}
      total={filteredRows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      emptyText={emptyLabel}
      actions={actions}
      rowKey={(row, index) => row.studentId || `${row.nim}-${index}`}
    />
  );
}
