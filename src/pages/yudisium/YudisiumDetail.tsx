import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileDown, Eye, CheckSquare } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { YudisiumValidationFormDialog } from '@/components/yudisium/YudisiumValidationFormDialog';

import { useRole, useAuth } from '@/hooks/shared';
import { useYudisiumEvent } from '@/hooks/yudisium/useYudisium';
import { useYudisiumParticipants } from '@/hooks/yudisium/useYudisiumParticipants';
import { useDownloadDraftSk, useUploadSkResmi } from '@/hooks/yudisium/useYudisiumParticipants';

import { ROLES } from '@/lib/roles';
import { formatDateOnlyId } from '@/lib/text';
import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'Dalam Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  scheduled: { label: 'Acara Terjadwalkan', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ongoing: { label: 'Sedang Berlangsung', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  finalized: { label: 'Finalized', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  completed: { label: 'Selesai', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: {
    label: 'Menunggu Validasi Dokumen',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  verified: {
    label: 'Menunggu Validasi CPL',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  cpl_validated: {
    label: 'Calon Peserta Yudisium',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  },
  appointed: {
    label: 'Peserta Yudisium',
    className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  finalized: {
    label: 'Lulus',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  rejected: {
    label: 'Belum Lulus',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
};

/** Calendar day in local timezone as YYYY-MM-DD (avoids UTC shift from toISOString()). */
function toDateOnlyLocalString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD for DatePicker display at local noon (stable across DST). */
function parseDateOnlyLocal(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const base = ymd.split('T')[0];
  const [y, m, d] = base.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function dateInputToISO(value: string): string {
  if (!value) return '';
  return new Date(value + 'T00:00:00.000Z').toISOString();
}

export default function YudisiumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isAdmin, isKadep, isSekdep, isKoordinatorYudisium, hasAnyRole } = useRole();

  // Queries & Mutations
  const { data: detail, isLoading: isLoadingDetail, refetch: refetchDetail } = useYudisiumEvent(id!);
  const { data: participantData, isLoading: isLoadingParticipants, isFetching: isFetchingParticipants, refetch: refetchParticipants } = useYudisiumParticipants(id!);
  const draftSkMutation = useDownloadDraftSk();
  const uploadSkMutation = useUploadSkResmi(id!);

  // SK Modal State
  const [skModalOpen, setSkModalOpen] = useState(false);
  const [skFile, setSkFile] = useState<File | null>(null);
  const [skEventDate, setSkEventDate] = useState('');
  const [skDecreeNumber, setSkDecreeNumber] = useState('');
  const [skDecreeIssuedAt, setSkDecreeIssuedAt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Participant Table State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedParticipant, setSelectedParticipant] = useState<AdminYudisiumParticipant | null>(null);

  const { user } = useAuth();
  const canManageSkActions = user?.roles?.some(r => r.name === ROLES.KOORDINATOR_YUDISIUM && r.status === 'active') ?? false;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Detail' },
    ]);
    setTitle('Detail Periode Yudisium');
  }, [setBreadcrumbs, setTitle]);

  const participants = participantData?.participants ?? [];
  const filteredParticipants = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return participants;
    return participants.filter(
      (p) =>
        p.studentName.toLowerCase().includes(term) ||
        p.studentNim.toLowerCase().includes(term) ||
        (PARTICIPANT_STATUS_MAP[p.status]?.label ?? p.status).toLowerCase().includes(term)
    );
  }, [participants, search]);

  const paginatedParticipants = filteredParticipants.slice((page - 1) * pageSize, page * pageSize);

  const handleUploadSk = async () => {
    if (!skFile) return;
    try {
      await uploadSkMutation.mutateAsync({
        file: skFile,
        eventDate: dateInputToISO(skEventDate),
        decreeNumber: skDecreeNumber,
        decreeIssuedAt: dateInputToISO(skDecreeIssuedAt),
      });
      setSkModalOpen(false);
      void refetchDetail();
    } catch {
      // Handled by toast
    }
  };

  const columns: Column<AdminYudisiumParticipant>[] = [
    { key: 'studentName', header: 'Nama', accessor: 'studentName' },
    { key: 'studentNim', header: 'NIM', accessor: 'studentNim' },
    {
      key: 'thesisTitle',
      header: 'Judul TA',
      render: (row) => (
        <span className="text-sm line-clamp-2" title={row.thesisTitle}>
          {row.thesisTitle || '-'}
        </span>
      ),
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
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          {isAdmin() && row.status === 'registered' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => setSelectedParticipant(row)}
              title="Validasi Pendaftaran"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/yudisium/${id}/peserta/${row.id}`)}
            title="Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoadingDetail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail yudisium..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p>Periode yudisium tidak ditemukan.</p>
          <Button variant="link" onClick={() => navigate('/yudisium')}>Kembali</Button>
        </div>
      </div>
    );
  }

  const s = STATUS_MAP[detail.status] || STATUS_MAP.draft;

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/yudisium')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{detail.name}</h1>
            <p className="text-muted-foreground">Detail Periode Yudisium</p>
          </div>
        </div>

        <Badge variant="outline" className={s.className}>
          {s.label}
        </Badge>
      </div>

      <div className="space-y-10">
        {/* Identitas Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">Identitas Yudisium</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nama Periode</p>
                    <p className="text-base">{detail.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rentang Pendaftaran</p>
                    <p className="text-base">
                      {formatDateOnlyId(detail.registrationOpenDate)} — {formatDateOnlyId(detail.registrationCloseDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tanggal Yudisium</p>
                    <p className="text-base">{formatDateOnlyId(detail.eventDate) || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ruangan</p>
                    <p className="text-base">{detail.room?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Form Exit Survey</p>
                    <p className="text-base">{detail.exitSurveyForm?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Catatan</p>
                    <p className="text-base">{detail.notes || '-'}</p>
                  </div>
                </div>
              </div>

              {canManageSkActions && (
                <div className="flex items-center gap-3 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
                    onClick={() => {
                      setSkFile(null);
                      setSkEventDate(detail.eventDate?.split('T')[0] ?? '');
                      setSkDecreeNumber('');
                      setSkDecreeIssuedAt('');
                      setSkModalOpen(true);
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload SK Resmi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => draftSkMutation.mutate(detail.id)}
                    disabled={draftSkMutation.isPending}
                  >
                    {draftSkMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Generate Draft SK
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Peserta Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">Daftar Peserta Yudisium</h2>
          <CustomTable
            columns={columns}
            data={paginatedParticipants}
            loading={isLoadingParticipants}
            isRefreshing={isFetchingParticipants && !isLoadingParticipants}
            total={filteredParticipants.length}
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
                onClick={() => void refetchParticipants()}
                isRefreshing={isFetchingParticipants && !isLoadingParticipants}
              />
            }
          />
        </div>
      </div>

      {/* Modals */}
      <Dialog open={skModalOpen} onOpenChange={setSkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload SK Resmi</DialogTitle>
            <DialogDescription>
              Unggah file SK resmi beserta informasi terkait pelaksanaan yudisium.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>File SK (PDF)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setSkFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Pelaksanaan Yudisium</Label>
              <DatePicker
                value={parseDateOnlyLocal(skEventDate)}
                onChange={(date) => setSkEventDate(date ? toDateOnlyLocalString(date) : '')}
                showPastDates={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor SK</Label>
              <Input
                type="text"
                placeholder="Contoh: SK/001/2026"
                value={skDecreeNumber}
                onChange={(e) => setSkDecreeNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal SK Ditetapkan</Label>
              <DatePicker
                value={parseDateOnlyLocal(skDecreeIssuedAt)}
                onChange={(date) => setSkDecreeIssuedAt(date ? toDateOnlyLocalString(date) : '')}
                showPastDates={true}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUploadSk}
              disabled={
                uploadSkMutation.isPending || 
                !skFile || 
                !skEventDate || 
                !skDecreeNumber || 
                !skDecreeIssuedAt
              }
            >
              {uploadSkMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Mengunggah...
                </>
              ) : (
                'Upload SK'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YudisiumValidationFormDialog
        participant={selectedParticipant}
        yudisiumId={id!}
        open={!!selectedParticipant}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipant(null);
        }}
      />
    </div>
  );
}
