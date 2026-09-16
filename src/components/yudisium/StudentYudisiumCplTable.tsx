import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
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
}

export function StudentYudisiumCplTable({ cplScores }: StudentYudisiumCplTableProps) {
  const [cplSearch, setCplSearch] = useState('');
  const [cplPage, setCplPage] = useState(1);
  const [cplPageSize, setCplPageSize] = useState(10);

  const filteredCplScores = useMemo(() => {
    const term = cplSearch.trim().toLowerCase();
    if (!term) return cplScores;

    return cplScores.filter((score) =>
      (score.code ?? '').toLowerCase().includes(term) ||
      score.description.toLowerCase().includes(term) ||
      (score.validatedBy ?? score.verifiedBy ?? '').toLowerCase().includes(term)
    );
  }, [cplScores, cplSearch]);

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
      className: 'min-w-[320px] whitespace-normal',
      render: (row) => (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
      key: 'verified',
      header: 'Diverifikasi',
      width: 220,
      render: (row) => {
        const validatorName = row.validatedBy ?? row.verifiedBy ?? null;
        const validatorNip = row.validatedByNip ?? row.verifiedByNip ?? null;
        const validatedAt = row.validatedAt ?? row.verifiedAt ?? null;

        const isValidated = row.status === 'validated' || !!row.validatedBy || !!row.verifiedBy || !!row.validatedAt || !!row.verifiedAt;

        if (!isValidated) {
          return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              <span>Belum diverifikasi</span>
            </div>
          );
        }

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              <span>{validatorName || 'Terverifikasi'}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {validatedAt ? formatDateTime(validatedAt) : '-'}
              {validatorNip ? ` • NIP ${validatorNip}` : ''}
            </div>
          </div>
        );
      },
    },
  ], [cplPage, cplPageSize]);

  if (cplScores.length === 0) return null;

  return (
    <section className="space-y-[14px]">
      <CustomTable
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
        emptyText="Tidak ada data CPL"
        rowKey={(row, index) => `${row.code ?? 'cpl'}-${index}`}
        className="rounded-[10px] border-gray-200 shadow-none"
      />
    </section>
  );
}
