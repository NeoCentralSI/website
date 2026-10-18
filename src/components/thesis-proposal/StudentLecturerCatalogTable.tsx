import { Check } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { BADGE_COLUMN_WIDTH, CLIP_CELL } from '@/lib/tableColumnWidths';
import { formatLecturerName } from '@/lib/text';
import type { CatalogLecturer } from '@/types/thesis-proposal.types';

const SHOWN_TOPICS = 2;
export const CLOSED_INTAKE_REASON = 'Dosen sedang menutup penerimaan pengajuan.';

/** "Topik A, Topik B +3": the first topics, the rest in the tooltip. */
export function summarizeTopics(topics: string[]): { text: string; title: string | undefined } {
  if (topics.length === 0) return { text: '-', title: undefined };
  const rest = topics.length - SHOWN_TOPICS;
  return { text: `${topics.slice(0, SHOWN_TOPICS).join(', ')}${rest > 0 ? ` +${rest}` : ''}`, title: topics.join(', ') };
}

const topicsOf = (lecturer: CatalogLecturer) => (lecturer.offeredTopics?.length ? lecturer.offeredTopics : lecturer.supervisedTopics);

/**
 * Paket P9 (2): the lecturer catalog of the request page. Each lecturer shows the name, the
 * kelompok keilmuan, the topics offered and the load, so a search by kelompok keilmuan or topic
 * matches without choosing a lecturer first. A lecturer who closed intake cannot be chosen.
 */
export function StudentLecturerCatalogTable({ lecturers, value, onChange, isLoading }: {
  lecturers: CatalogLecturer[];
  value: string;
  onChange: (lecturerId: string) => void;
  isLoading?: boolean;
}) {
  const table = useLocalTable(lecturers, (lecturer, term) =>
    haystack(lecturer.fullName, lecturer.scienceGroup?.name, ...(lecturer.offeredTopics ?? []), ...lecturer.supervisedTopics).includes(term));

  const columns: Column<CatalogLecturer>[] = [
    {
      key: 'lecturer',
      header: 'Dosen',
      width: 260,
      className: CLIP_CELL,
      render: (lecturer) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={formatLecturerName(lecturer.fullName)}>{formatLecturerName(lecturer.fullName)}</p>
          <p className="truncate text-xs text-muted-foreground">{lecturer.scienceGroup?.name ?? 'Kelompok keilmuan belum diisi'}</p>
        </div>
      ),
    },
    {
      key: 'topics',
      header: 'Topik Ditawarkan',
      className: CLIP_CELL,
      render: (lecturer) => {
        const { text, title } = summarizeTopics(topicsOf(lecturer));
        return <p className="truncate text-sm" title={title}>{text}</p>;
      },
    },
    {
      key: 'load',
      header: 'Beban',
      width: BADGE_COLUMN_WIDTH.supervisionLoad,
      className: CLIP_CELL,
      render: (lecturer) => lecturer.acceptingRequests
        ? <SupervisionLoadBadge activeCount={lecturer.activeCount} hardLimit={lecturer.hardLimit} level={lecturer.level} className="whitespace-nowrap" />
        : <Badge variant="outline" className="whitespace-nowrap">Ditutup Dosen</Badge>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 112,
      className: 'text-center',
      render: (lecturer) => {
        const chosen = lecturer.lecturerId === value;
        return (
          <span title={lecturer.acceptingRequests ? undefined : CLOSED_INTAKE_REASON} className="inline-flex">
            <Button
              size="sm"
              variant={chosen ? 'default' : 'outline'}
              disabled={!lecturer.acceptingRequests}
              aria-pressed={chosen}
              aria-label={`Pilih ${formatLecturerName(lecturer.fullName)}`}
              onClick={() => onChange(lecturer.lecturerId)}
            >
              {chosen && <Check className="mr-1 h-4 w-4" />}{chosen ? 'Dipilih' : 'Pilih'}
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <CustomTable
      columns={columns}
      {...table.tableProps}
      loading={isLoading}
      className="border-0 p-0 shadow-none"
      tableClassName="table-fixed min-w-[760px]"
      searchPlaceholder="Cari nama, kelompok keilmuan, atau topik..."
      emptyText={table.search ? 'Tidak ditemukan' : 'Belum ada dosen pembimbing.'}
      rowKey={(lecturer) => lecturer.lecturerId}
    />
  );
}
