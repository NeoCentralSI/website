import { useMemo } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Pencil, Calendar, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomTable from '@/components/layout/CustomTable';

import type { AcademicYear } from '@/services/admin.service';

interface AcademicYearTableProps {
  data: AcademicYear[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  semesterFilter: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onSemesterFilterChange: (filter: string) => void;
  onEdit: (year: AcademicYear) => void;
}

export function AcademicYearTable({
  data,
  loading,
  page,
  pageSize,
  total,
  searchValue,
  semesterFilter,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSemesterFilterChange,
  onEdit,
}: AcademicYearTableProps) {
  const formatSemester = (semester: string) => {
    return semester === 'ganjil' ? 'Ganjil' : 'Genap';
  };

  // Apply client-side semester filter
  const filteredData = useMemo(() => {
    if (!semesterFilter) return data;
    return data.filter(year => year.semester === semesterFilter);
  }, [data, semesterFilter]);

  const columns = useMemo(() => [
    {
      key: 'year',
      header: 'Tahun',
      accessor: 'year',
      sortable: true,
      render: (row: AcademicYear) => (
        <span className="font-semibold">{row.year}</span>
      ),
    },
    {
      key: 'semester',
      header: 'Semester',
      render: (row: AcademicYear) => (
        <Badge variant={row.semester === 'ganjil' ? 'default' : 'secondary'}>
          {formatSemester(row.semester)}
        </Badge>
      ),
      filter: {
        type: 'select',
        value: semesterFilter,
        onChange: onSemesterFilterChange,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Ganjil', value: 'ganjil' },
          { label: 'Genap', value: 'genap' },
        ],
      },
    },
    {
      key: 'period',
      header: 'Periode',
      render: (row: AcademicYear) => {
        if (!row.startDate || !row.endDate) return '-';
        const start = format(new Date(row.startDate), 'd MMM yyyy', { locale: idLocale });
        const end = format(new Date(row.endDate), 'd MMM yyyy', { locale: idLocale });
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span>{start} - {end}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Dibuat',
      render: (row: AcademicYear) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.createdAt), 'd MMM yyyy', { locale: idLocale })}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: AcademicYear) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Aktif
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary">
                Tidak Aktif
              </Badge>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: AcademicYear) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row)}
          disabled={!row.isActive}
          title={!row.isActive ? 'Tahun ajaran tidak aktif tidak dapat diedit' : 'Edit tahun ajaran'}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ], [semesterFilter, onSemesterFilterChange, onEdit]);

  const totalCount = filteredData.length > 0 ? filteredData.length : total;

  return (
    <CustomTable
      data={filteredData}
      columns={columns as any}
      loading={loading}
      emptyText="Belum ada data tahun ajaran"
      page={page}
      pageSize={pageSize}
      total={totalCount}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      enableColumnFilters={true}
    />
  );
}
