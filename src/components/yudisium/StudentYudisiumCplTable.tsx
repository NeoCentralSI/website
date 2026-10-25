import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { RefreshButton } from '@/components/ui/refresh-button';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import type { StudentYudisiumOverviewResponse } from '@/types/student-yudisium.types';

type StudentCplScore = NonNullable<StudentYudisiumOverviewResponse['cplScores']>[number];

const formatDateTime = (date: any) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '-';
  }
};

interface StudentYudisiumCplTableProps {
  cplScores: StudentCplScore[];
  onRefetch?: () => void;
  isFetching?: boolean;
}

export function StudentYudisiumCplTable({ cplScores, onRefetch, isFetching = false }: StudentYudisiumCplTableProps) {
  const [cplSearch, setCplSearch] = useState('');
  const [cplPage, setCplPage] = useState(1);
  const [cplPageSize, setCplPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCplScores = useMemo(() => {
    const term = cplSearch.trim().toLowerCase();
    return cplScores.filter((score) =>
      (statusFilter === 'all' || (statusFilter === 'passed' ? score.passed : !score.passed)) && (
      (score.code ?? '').toLowerCase().includes(term) ||
      score.description.toLowerCase().includes(term) ||
      (score.validatedBy ?? score.verifiedBy ?? '').toLowerCase().includes(term)
    )).sort((a, b) => Number(a.passed) - Number(b.passed) || a.code.localeCompare(b.code, 'id', { numeric: true }));
  }, [cplScores, cplSearch, statusFilter]);

  const paginatedCplScores = useMemo(() => {
    const start = (cplPage - 1) * cplPageSize;
    return filteredCplScores.slice(start, start + cplPageSize);
  }, [cplPage, cplPageSize, filteredCplScores]);

  const cplColumns = useMemo<Column<StudentCplScore>[]>(() => [
    {
      key: 'no',
      header: 'No',
      width: 60,
      className: 'text-center',
      render: (_row, index) => (
        <span className="text-sm text-muted-foreground">
          {(cplPage - 1) * cplPageSize + index + 1}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Kode CPL',
      width: 110,
      render: (row) => <span className="font-medium">{row.code ?? '-'}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      className: 'whitespace-normal',
      render: (row) => (
        <p title={row.description} className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {row.description}
        </p>
      ),
    },
    {
      key: 'score',
      header: 'Nilai',
      width: 80,
      className: 'text-center',
      render: (row) => <span className="font-semibold">{row.score ?? '-'}</span>,
    },
    {
      key: 'minimalScore',
      header: 'Minimal',
      width: 90,
      className: 'text-center',
      render: (row) => <span>{row.minimalScore}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      filter: { type: 'select', value: statusFilter, defaultValue: 'all',
        onChange: (value) => { setStatusFilter(value); setCplPage(1); },
        options: [{ label: 'Semua', value: 'all' }, { label: 'Lulus', value: 'passed' }, { label: 'Belum Tercapai', value: 'pending' }],
      },
      width: 130,
      className: 'text-center',
      render: (row) => (
        <Badge
          variant="outline"
          className={row.passed
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'}
        >
          {row.passed ? 'Lulus' : 'Belum Tercapai'}
        </Badge>
      ),
    },
    {
      key: 'validated',
      header: 'Validasi',
      width: 200,
      render: (row) => {
        const validatorName = row.validatedBy ?? row.verifiedBy ?? null;
        const validatorNip = row.validatedByNip ?? row.verifiedByNip ?? null;
        const validatedAt = row.validatedAt ?? row.verifiedAt ?? null;

        const isValidated = row.status === 'validated' || !!row.validatedBy || !!row.verifiedBy || !!row.validatedAt || !!row.verifiedAt;

        if (!isValidated) {
          return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              <span>Belum divalidasi</span>
            </div>
          );
        }

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              <span>Divalidasi</span>
            </div>
            {validatorName && <div className="line-clamp-2 text-xs text-foreground" title={validatorName}>{validatorName}</div>}
            <div className="text-[10px] text-muted-foreground">
              {validatedAt ? formatDateTime(validatedAt) : '-'}
              {validatorNip ? ` • NIP ${validatorNip}` : ''}
            </div>
          </div>
        );
      },
    },
  ], [cplPage, cplPageSize, statusFilter]);

  return (
    <section className="space-y-[14px]">
      <h2 className="text-base font-semibold">Capaian Pembelajaran Lulusan</h2>
      <CustomTable
        enableColumnFilters
        tableClassName="table-fixed"
        isRefreshing={isFetching}
        actions={<>
          <Badge variant="secondary">{cplScores.length} CPL</Badge>
          {onRefetch && <RefreshButton onClick={onRefetch} isRefreshing={isFetching} />}
        </>}
        columns={cplColumns}
        data={paginatedCplScores}
        total={filteredCplScores.length}
        page={cplPage}
        pageSize={cplPageSize}
        onPageChange={setCplPage}
        onPageSizeChange={(size) => {
          setCplPageSize(size);
          setCplPage(1);
        }}
        searchValue={cplSearch}
        onSearchChange={(value) => {
          setCplSearch(value);
          setCplPage(1);
        }}
        emptyText="Nilai CPL Anda belum tersedia"
        rowKey={(row, index) => `${row.code ?? 'cpl'}-${index}`}
        className="rounded-[10px] border-gray-200 shadow-none"
      />
    </section>
  );
}
