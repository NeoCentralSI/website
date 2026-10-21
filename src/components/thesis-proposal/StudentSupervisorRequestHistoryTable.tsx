import { useState } from 'react';
import { Eye } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import {
  getSupervisorRequestRouteLabel,
  getSupervisorRequestStatusLabel,
  getSupervisorRequestStatusVariant,
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS,
} from '@/lib/thesisLabels';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

/**
 * Panel "Riwayat Pengajuan Pembimbing", one table like Riwayat Kehadiran Seminar
 * (every request the student sent, newest first), with the Ketua Departemen's note (revision,
 * rejection or redirect). The detail modal has only Tutup.
 */
export function StudentSupervisorRequestHistoryTable({ requests, isLoading, onRefresh, isFetching = false }: {
  requests: SupervisorRequest[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isFetching?: boolean;
}) {
  const [detail, setDetail] = useState<SupervisorRequest | null>(null);
  const table = useLocalTable(requests, (r, term) => haystack(r.proposedTitle, r.supervisor?.fullName, r.lecturer?.fullName).includes(term));
  const columns: Column<SupervisorRequest>[] = [
    { key: 'createdAt', header: 'Dikirim', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (r) => <DateTimeCell date={r.createdAt} /> },
    { key: 'title', header: 'Judul', className: CLIP_CELL, render: (r) => <TruncatedText text={r.proposedTitle} className="max-w-full" /> },
    {
      key: 'lecturer',
      header: 'Dosen dan Jalur',
      width: 220,
      className: CLIP_CELL,
      render: (r) => {
        const name = r.supervisor?.fullName ?? r.lecturer?.fullName;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm">{name ? formatLecturerName(name) : 'Ditetapkan departemen'}</p>
            <p className="truncate text-xs text-muted-foreground">{getSupervisorRequestRouteLabel(r.route)}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.supervisorRequestShortStatus,
      className: CLIP_CELL,
      render: (r) => (
        <Badge variant={getSupervisorRequestStatusVariant(r.status)} className="whitespace-nowrap" title={getSupervisorRequestStatusLabel(r.status)}>
          {SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'kadepNotes',
      header: 'Catatan Ketua Departemen',
      width: 220,
      className: CLIP_CELL,
      render: (r) => <TruncatedText text={r.kadepNotes} className="max-w-full" />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (r) => <div className="flex justify-center"><TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(r)} /></div>,
    },
  ];

  return (
    <>
      <CustomTable
        columns={columns}
        {...table.tableProps}
        loading={isLoading}
        tableClassName="table-fixed"
        emptyText={table.search ? 'Tidak ditemukan' : 'Belum ada pengajuan pembimbing.'}
        rowKey={(r) => r.id}
        searchPlaceholder="Cari judul atau dosen..."
        isRefreshing={isFetching}
        subtleRefresh
        actions={onRefresh ? <RefreshButton onClick={onRefresh} isRefreshing={isFetching} /> : undefined}
      />
      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Pengajuan Pembimbing"
        description={detail ? `Dikirim ${formatDateTimeWib(detail.createdAt)}` : undefined}
        footer={detail ? <DetailDialogActions onClose={() => setDetail(null)} /> : undefined}
      >
        {detail && <SupervisorRequestDetails request={detail} />}
      </RecordDetailDialog>
    </>
  );
}
