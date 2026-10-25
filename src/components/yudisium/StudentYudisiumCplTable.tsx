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
      width: 48,
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
      width: 88,
      render: (row) => <span className="font-medium">{row.code ?? '-'}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      // Takes the rest of the width and wraps on as many lines as it needs.
      className: 'whitespace-normal break-words',
      render: (row) => (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {row.description}
        </p>
      ),
    },
    {
      key: 'score',
      header: 'Nilai',
      width: 64,
      className: 'text-center',
      render: (row) => <span className="font-semibold">{row.score ?? '-'}</span>,
    },
    {
      key: 'minimalScore',
      header: 'Minimal',
      width: 76,
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
      width: 132,
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
      width: 190,
      className: 'whitespace-normal',
      render: (row) => {
        const validatorName = row.validatedBy ?? row.verifiedBy ?? null;
        const validatorNip = row.validatedByNip ?? row.verifiedByNip ?? null;
        const validatedAt = row.validatedAt ?? row.verifiedAt ?? null;
        const isValidated = row.status === 'validated' || !!row.validatedBy || !!row.verifiedBy || !!row.validatedAt || !!row.verifiedAt;

        if (!isValidated) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5 shrink-0" />
              <span>Belum divalidasi</span>
            </div>
          );
        }

        const tooltip = [validatorName, validatorNip ? `NIP ${validatorNip}` : null].filter(Boolean).join(' · ') || 'Divalidasi';
        return (
          <div className="min-w-0 space-y-0.5" title={tooltip}>
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
              <span className="shrink-0">Divalidasi</span>
              {validatorName && <span className="min-w-0 truncate font-normal text-foreground">{validatorName}</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">{validatedAt ? formatDateTime(validatedAt) : '-'}</div>
          </div>
        );
      },
    },
  ], [cplPage, cplPageSize, statusFilter]);

  return (
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
  );
}
