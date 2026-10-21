import { useMemo, useState, type ReactNode } from 'react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, LOAD_COUNT_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatLecturerName } from '@/lib/text';
import { SUPERVISION_LOAD_LEVEL_LABELS, type SupervisionLoadLevel } from '@/lib/thesisLabels';
import type { LecturerLoadRow, SupervisionLoadOverview } from '@/types/thesis-proposal.types';

/** Beban: the full lecturers first ("Semua" sorted by what needs attention). */
const LEVEL_ORDER: SupervisionLoadLevel[] = ['full', 'near_limit', 'available'];
const LEVEL_OPTIONS = [{ label: 'Semua', value: '' }, ...LEVEL_ORDER.map((value) => ({ label: SUPERVISION_LOAD_LEVEL_LABELS[value], value }))];

type Breakdown = LecturerLoadRow['breakdown'];
/**
 * One narrow, right-aligned number column per stage of `breakdown` (all five fit at
 * 1366 px, so nothing is merged into "Lainnya"). "Pembimbing 2" counts the lecturer's Pembimbing 2
 * roles, across the stages.
 */
const COUNT_COLUMNS: { key: keyof Breakdown; header: string; title: string; width: number }[] = [
  { key: 'waitingAssignment', header: 'Menunggu Penetapan', title: 'Diterima, belum masuk Penetapan Pembimbing', width: LOAD_COUNT_COLUMN_WIDTH.waitingAssignment },
  { key: 'proposal', header: 'Proposal', title: 'Fase proposal, sudah ditetapkan', width: LOAD_COUNT_COLUMN_WIDTH.proposal },
  { key: 'research', header: 'Penelitian', title: 'Fase penelitian', width: LOAD_COUNT_COLUMN_WIDTH.research },
  { key: 'onLeave', header: 'BSS', title: 'Berhenti Studi Sementara', width: LOAD_COUNT_COLUMN_WIDTH.onLeave },
  { key: 'asSupervisor2', header: 'Pembimbing 2', title: 'Jumlah sebagai Pembimbing 2', width: LOAD_COUNT_COLUMN_WIDTH.asSupervisor2 },
];

interface Props {
  overview: SupervisionLoadOverview;
  isFetching?: boolean;
  /** "Batas lunak", "Batas keras" and the edit button. */
  toolbar?: ReactNode;
  /** Muat Ulang, at the right end of the toolbar. */
  onRefresh?: () => void;
}

/**
 * Tabel Beban Dosen (Kelola → Batas Bimbingan and Penetapan → Beban Dosen): every lecturer's
 * current load against the limits in force for the overview's semester. A lecturer who closed
 * intake shows "Ditutup Dosen" under the name.
 */
export function SupervisionLoadTable({ overview, isFetching, toolbar, onRefresh }: Props) {
  const [level, setLevel] = useState<SupervisionLoadLevel | ''>('');
  const rows = useMemo(() => {
    const rank = (row: LecturerLoadRow) => LEVEL_ORDER.indexOf(row.level);
    const sorted = [...overview.lecturers].sort((a, b) => rank(a) - rank(b) || b.activeCount - a.activeCount || (a.fullName ?? '').localeCompare(b.fullName ?? ''));
    return level ? sorted.filter((row) => row.level === level) : sorted;
  }, [overview.lecturers, level]);
  const table = useLocalTable(rows, (row, term) => haystack(row.fullName, row.scienceGroup?.name).includes(term));
  const hardLimit = overview.applicable.hardLimit;

  const columns: Column<LecturerLoadRow>[] = [
    {
      key: 'lecturer',
      header: 'Dosen',
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={formatLecturerName(row.fullName)}>{formatLecturerName(row.fullName)}</p>
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-xs text-muted-foreground">{row.scienceGroup?.name ?? 'Kelompok keilmuan belum diisi'}</p>
            {!row.acceptingRequests && <Badge variant="outline" className="shrink-0 whitespace-nowrap">Ditutup Dosen</Badge>}
          </div>
        </div>
      ),
    },
    {
      key: 'load',
      header: 'Beban',
      width: BADGE_COLUMN_WIDTH.supervisionLoad,
      className: CLIP_CELL,
      render: (row) => <SupervisionLoadBadge activeCount={row.activeCount} hardLimit={hardLimit} level={row.level} className="whitespace-nowrap" />,
      filter: { type: 'select', value: level, onChange: (value) => { setLevel(value as SupervisionLoadLevel | ''); table.resetPage(); }, options: LEVEL_OPTIONS },
    },
    ...COUNT_COLUMNS.map<Column<LecturerLoadRow>>((column) => ({
      key: column.key,
      header: <span title={column.title}>{column.header}</span>,
      width: column.width,
      className: 'text-right tabular-nums',
      render: (row) => row.breakdown[column.key] ?? 0,
    })),
  ];

  return (
    <CustomTable
      columns={columns}
      {...table.tableProps}
      isRefreshing={isFetching}
      subtleRefresh
      enableColumnFilters
      tableClassName="table-fixed min-w-[960px]"
      searchPlaceholder="Cari nama dosen atau kelompok keilmuan..."
      emptyText={table.search || level ? 'Tidak ditemukan' : 'Belum ada data dosen.'}
      rowKey={(row) => row.lecturerId}
      actions={(toolbar || onRefresh) ? (
        <>
          {toolbar}
          {onRefresh && <RefreshButton onClick={onRefresh} isRefreshing={Boolean(isFetching)} />}
        </>
      ) : undefined}
    />
  );
}
