import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react';
import { useAdminYudisiumParticipants } from '@/hooks/yudisium/useAdminYudisium';
import { YudisiumValidationModal } from '@/components/yudisium/YudisiumValidationModal';
import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';
import { formatDateOnlyId } from '@/lib/text';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: {
    label: 'Menunggu Validasi Dokumen',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  under_review: {
    label: 'Menunggu Validasi CPL',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  approved: {
    label: 'Lulus',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  rejected: {
    label: 'Ditolak',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  finalized: {
    label: 'Selesai',
    className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  },
};

export default function AdminYudisiumValidation() {
  const { id: yudisiumId } = useParams<{ id: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch } = useAdminYudisiumParticipants(yudisiumId!);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedParticipant, setSelectedParticipant] = useState<AdminYudisiumParticipant | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium Admin', href: '/yudisium/admin' },
      { label: data?.yudisium?.name ?? 'Detail' },
    ]);
    setTitle(data?.yudisium?.name ?? 'Detail Yudisium');
  }, [setBreadcrumbs, setTitle, data?.yudisium?.name]);

  const participants = data?.participants ?? [];

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return participants;
    return participants.filter(
      (p) =>
        p.studentName.toLowerCase().includes(term) ||
        p.studentNim.toLowerCase().includes(term) ||
        (PARTICIPANT_STATUS_MAP[p.status]?.label ?? p.status).toLowerCase().includes(term)
    );
  }, [participants, search]);

  const paginated = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<AdminYudisiumParticipant>[] = [
    {
      key: 'studentName',
      header: 'Nama',
      accessor: 'studentName',
    },
    {
      key: 'studentNim',
      header: 'NIM',
      accessor: 'studentNim',
    },
    {
      key: 'registeredAt',
      header: 'Tanggal Daftar',
      render: (row) => formatDateOnlyId(row.registeredAt),
    },
    {
      key: 'documents',
      header: 'Dokumen',
      render: (row) => {
        const { approved, total, declined } = row.documentSummary;
        return (
          <span className="text-sm">
            {approved}/{total}
            {declined > 0 && (
              <span className="text-red-500 ml-1">({declined} ditolak)</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = PARTICIPANT_STATUS_MAP[row.status] || PARTICIPANT_STATUS_MAP.registered;
        return (
          <Badge variant="outline" className={s.className}>
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'registered' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedParticipant(row)}
              title="Validasi dokumen"
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Validasi
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/yudisium/admin/${yudisiumId}/participant/${row.id}`)}
            title="Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat peserta yudisium..." />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/yudisium/admin')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{data?.yudisium?.name ?? 'Detail Yudisium'}</h1>
          <p className="text-muted-foreground">
            Daftar peserta yudisium — validasi dokumen persyaratan
          </p>
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        emptyText="Belum ada peserta yudisium"
        actions={
          <RefreshButton
            onClick={() => {
              void refetch();
            }}
            isRefreshing={isFetching && !isLoading}
          />
        }
      />

      <YudisiumValidationModal
        participant={selectedParticipant}
        yudisiumId={yudisiumId!}
        open={!!selectedParticipant}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipant(null);
        }}
      />
    </div>
  );
}
