import { useMemo } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import CustomTable from '@/components/layout/CustomTable';
import type { SeminarAudience } from '@/services/thesis-seminar/admin.service';

interface ThesisSeminarAudienceTableProps {
  data: SeminarAudience[];
  loading: boolean;
  isRefreshing?: boolean;
  isEditable: boolean;
  onDelete: (studentId: string) => void;
  actions?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function ThesisSeminarAudienceTable({
  data,
  loading,
  isRefreshing,
  isEditable,
  onDelete,
  actions,
  searchValue,
  onSearchChange,
}: ThesisSeminarAudienceTableProps) {
  const columns = useMemo(() => {
    const cols: {
      key: string;
      header: string;
      render: (row: SeminarAudience) => React.ReactNode;
    }[] = [
      {
        key: 'nama',
        header: 'Nama',
        render: (row) => (
          <div>
            <div className="font-medium">{row.fullName}</div>
          </div>
        ),
      },
      {
        key: 'nim',
        header: 'NIM',
        render: (row) => <span className="text-muted-foreground text-sm">{row.nim}</span>,
      },
      {
        key: 'approvedAt',
        header: 'Disetujui Pada',
        render: (row) =>
          row.approvedAt
            ? format(new Date(row.approvedAt), 'd MMM yyyy', { locale: idLocale })
            : '-',
      },
      {
        key: 'approvedBy',
        header: 'Disetujui Oleh',
        render: (row) => row.approvedByName || '-',
      },
    ];

    if (isEditable) {
      cols.push({
        key: 'actions',
        header: 'Aksi',
        render: (row) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(row.studentId)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ),
      });
    }

    return cols;
  }, [isEditable, onDelete]);

  return (
    <CustomTable
      data={data}
      columns={columns as any}
      loading={loading}
      isRefreshing={isRefreshing}
      emptyText="Belum ada data audience seminar"
      total={data.length}
      page={1}
      pageSize={data.length || 10}
      onPageChange={() => {}}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={actions}
    />
  );
}
