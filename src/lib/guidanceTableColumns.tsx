import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, FileTextIcon } from 'lucide-react';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';

interface GetGuidanceTableColumnsOptions {
  items: GuidanceItem[];
  supervisorFilter: string;
  setSupervisorFilter: (value: string) => void;
  status: GuidanceStatus | '';
  setStatus: (value: GuidanceStatus | '') => void;
  setPage: (value: number) => void;
  onViewDocument: (fileName?: string | null, filePath?: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}

export const getGuidanceTableColumns = (options: GetGuidanceTableColumnsOptions): Column<GuidanceItem>[] => {
  const {
    items,
    supervisorFilter,
    setSupervisorFilter,
    status,
    setStatus,
    setPage,
    onViewDocument,
    navigate,
  } = options;

  return [
    {
      key: 'supervisor',
      header: 'Pembimbing',
      accessor: (r) => r.supervisorName || r.supervisorId || '-',
      filter: {
        type: 'select',
        value: supervisorFilter,
        onChange: (v: string) => {
          setSupervisorFilter(v);
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          ...Array.from(new Set(items.map((it) => it.supervisorName || it.supervisorId || '-'))).map((name) => ({
            label: String(name),
            value: String(name),
          })),
        ],
      },
    },
    {
      key: 'time',
      header: 'Waktu',
      accessor: (r) =>
        r.approvedDateFormatted ||
        r.requestedDateFormatted ||
        (r.approvedDate
          ? new Date(r.approvedDate).toLocaleString()
          : r.requestedDate
          ? new Date(r.requestedDate).toLocaleString()
          : '-'),
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => {
        const f = r.document?.filePath || '';
        const isPdf = f.toLowerCase().endsWith('.pdf');
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!isPdf}
            onClick={() => {
              onViewDocument(r.document?.fileName, r.document?.filePath);
            }}
            title={isPdf ? `Lihat ${r.document?.fileName || 'dokumen'}` : 'Tidak ada dokumen PDF'}
          >
            <FileTextIcon className="size-4" />
          </Button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status} />,
      filter: {
        type: 'select',
        value: status,
        onChange: (v: string) => {
          setStatus(v as GuidanceStatus | '');
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          { label: 'Menunggu', value: 'requested' },
          { label: 'Diterima', value: 'accepted' },
          { label: 'Ditolak', value: 'rejected' },
        ],
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (r) => {
        const isRejected = r.status === 'rejected';
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => navigate(`/tugas-akhir/bimbingan/student/session/${r.id}`)} 
            title={isRejected ? 'Bimbingan ditolak' : 'Detail'}
            disabled={isRejected}
          >
            <EyeIcon className="size-4" />
          </Button>
        );
      },
    },
  ];
};
