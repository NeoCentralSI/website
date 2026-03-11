import { useMemo, useState } from 'react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
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
}

function getRegisteredAtValue(registeredAt: string | null): number {
  if (!registeredAt) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(registeredAt).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
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
}: SeminarAudienceTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      const leftValue = getRegisteredAtValue(left.registeredAt);
      const rightValue = getRegisteredAtValue(right.registeredAt);
      if (leftValue !== rightValue) return leftValue - rightValue;

      const nameCompare = left.studentName.localeCompare(right.studentName);
      if (nameCompare !== 0) return nameCompare;

      return left.nim.localeCompare(right.nim);
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedRows;

    return sortedRows.filter((row) => {
      return (
        row.studentName.toLowerCase().includes(query) ||
        row.nim.toLowerCase().includes(query) ||
        (row.approvedByName || '').toLowerCase().includes(query)
      );
    });
  }, [search, sortedRows]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const columns = useMemo<Column<SeminarAudienceTableRow>[]>(() => {
    const baseColumns: Column<SeminarAudienceTableRow>[] = [
      {
        key: 'no',
        header: 'No',
        width: 60,
        className: 'text-center',
        render: (_row, index) => (
          <span className="text-sm text-muted-foreground">{(page - 1) * pageSize + index + 1}</span>
        ),
      },
      {
        key: 'name',
        header: 'Nama',
        render: (row) => <span className="font-medium">{toTitleCaseName(row.studentName)}</span>,
      },
      {
        key: 'nim',
        header: 'NIM',
        width: 160,
        render: (row) => row.nim,
      },
      {
        key: 'status',
        header: 'Status',
        width: 140,
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
        key: 'approvedBy',
        header: 'Disetujui Oleh',
        render: (row) =>
          row.approvedByName ? (
            <span className="text-sm">{toTitleCaseName(row.approvedByName)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          ),
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
    <CustomTable
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
    />
  );
}
