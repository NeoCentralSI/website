import { useMemo, useState } from 'react';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName } from '@/lib/text';
import { RotateCcw, UserPlus } from 'lucide-react';

export interface SeminarAudienceTableRow {
  studentId?: string;
  studentName: string;
  nim: string;
  registeredAt: string | null;
  approvedAt: string | null;
  approvedByName?: string | null;
}

interface SeminarAudienceTableProps {
  rows: SeminarAudienceTableRow[];
  emptyLabel?: string;
  showAction?: boolean;
  approvingStudentId?: string | null;
  unapprovingStudentId?: string | null;
  onApprove?: (row: SeminarAudienceTableRow) => void;
  onUnapprove?: (row: SeminarAudienceTableRow) => void;
  loading?: boolean;
  // Selection
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (row: SeminarAudienceTableRow, index: number) => boolean;
  actions?: React.ReactNode;
}

export function SeminarAudienceTable({
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
}: SeminarAudienceTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      return (
        row.studentName.toLowerCase().includes(query) ||
        row.nim.toLowerCase().includes(query) ||
        (row.approvedByName || '').toLowerCase().includes(query)
      );
    });
  }, [search, rows]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const columns = useMemo<Column<SeminarAudienceTableRow>[]>(() => {
    const baseColumns: Column<SeminarAudienceTableRow>[] = [
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
        width: '40%',
        render: (row) => <span className="font-medium">{toTitleCaseName(row.studentName)}</span>,
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
        width: '20%',
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
    ];

    if (showAction) {
      baseColumns.push({
        key: 'actions',
        header: 'Aksi',
        className: 'text-right',
        width: 220,
        render: (row) => {
          const isApproved = !!row.approvedAt;
          const isApprovingThisRow = !!approvingStudentId && approvingStudentId === row.studentId;
          const isUnapprovingThisRow = !!unapprovingStudentId && unapprovingStudentId === row.studentId;

          return (
            <div className="flex items-center justify-end gap-2">
              {isApproved ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnapprove?.(row)}
                  disabled={!row.studentId || isUnapprovingThisRow}
                >
                  {isUnapprovingThisRow ? (
                    <Spinner className="mr-1 h-3 w-3" />
                  ) : (
                    <RotateCcw className="mr-1 h-3 w-3" />
                  )}
                  Batalkan Setujui
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove?.(row)}
                  disabled={!row.studentId || isApprovingThisRow}
                >
                  {isApprovingThisRow ? (
                    <Spinner className="mr-1 h-3 w-3" />
                  ) : (
                    <UserPlus className="mr-1 h-3 w-3" />
                  )}
                  Setujui
                </Button>
              )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [showAction, page, pageSize, approvingStudentId, unapprovingStudentId, onApprove, onUnapprove]);

  return (
    <InternshipTable
      columns={columns}
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
      rowKey={(row, index) => row.studentId || `${row.nim}-${index}`}
      className="p-0 border-0 shadow-none"
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      isRowSelectable={isRowSelectable}
      actions={actions}
    />
  );
}
