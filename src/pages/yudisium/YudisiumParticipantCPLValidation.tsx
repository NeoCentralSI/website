import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { ArrowLeft, ShieldCheck, FilePlus, CheckCircle, Undo2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useLecturerYudisiumParticipantDetail,
  useParticipantCplScores,
  useVerifyCplScore,
  useCreateCplRecommendation,
  useUpdateCplRecommendationStatus,
} from '@/hooks/yudisium/useLecturerYudisium';
import { toTitleCaseName } from '@/lib/text';
import type { CplScoreItem, CplRecommendationItem } from '@/types/adminYudisium.types';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Menunggu Validasi Berkas', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Menunggu Validasi CPL', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Lulus', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
  finalized: { label: 'Selesai', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const REC_STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dismissed: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function YudisiumParticipantCPLValidation() {
  const navigate = useNavigate();
  const { id: yudisiumId, participantId } = useParams<{ id: string; participantId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data: participantData, isLoading: loadingParticipant } = useLecturerYudisiumParticipantDetail(participantId!);
  const { data: cplData, isLoading: loadingCpl, isFetching, refetch } = useParticipantCplScores(participantId!);
  const verifyMutation = useVerifyCplScore(participantId!);
  const createRecMutation = useCreateCplRecommendation(participantId!);
  const updateRecStatusMutation = useUpdateCplRecommendationStatus(participantId!);

  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recCplId, setRecCplId] = useState('');
  const [recCplCode, setRecCplCode] = useState('');
  const [recRecommendation, setRecRecommendation] = useState('');
  const [recDescription, setRecDescription] = useState('');

  const [cplSearch, setCplSearch] = useState('');
  const [cplPage, setCplPage] = useState(1);
  const [cplPageSize, setCplPageSize] = useState(10);

  const [recSearch, setRecSearch] = useState('');
  const [recPage, setRecPage] = useState(1);
  const [recPageSize, setRecPageSize] = useState(10);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium/lecturer/event' },
      { label: 'Detail', href: `/yudisium/lecturer/event/${yudisiumId}` },
      { label: 'Validasi CPL' },
    ]);
    setTitle('Validasi CPL');
  }, [setBreadcrumbs, setTitle, yudisiumId]);

  const isLoading = loadingParticipant || loadingCpl;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat data validasi CPL..." />
      </div>
    );
  }

  if (!participantData || !cplData) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Data peserta tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[participantData.status] ?? STATUS_MAP.registered;

  const filteredCpl = (() => {
    const term = cplSearch.toLowerCase();
    if (!term) return cplData.cplScores;
    return cplData.cplScores.filter(
      (c) =>
        (c.code ?? '').toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.status.toLowerCase().includes(term)
    );
  })();
  const paginatedCpl = filteredCpl.slice((cplPage - 1) * cplPageSize, cplPage * cplPageSize);

  const filteredRec = (() => {
    const term = recSearch.toLowerCase();
    if (!term) return cplData.recommendations;
    return cplData.recommendations.filter(
      (r) =>
        (r.recommendation ?? '').toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
  })();
  const paginatedRec = filteredRec.slice((recPage - 1) * recPageSize, recPage * recPageSize);

  const cplColumns: Column<CplScoreItem>[] = [
    { key: 'code', header: 'Kode CPL', render: (row) => row.code ?? '-' },
    {
      key: 'description',
      header: 'Deskripsi',
      width: 420,
      className: 'max-w-[420px] whitespace-normal break-words',
      render: (row) => <span className="block max-w-[420px] line-clamp-2">{row.description}</span>,
    },
    { key: 'score', header: 'Nilai Mahasiswa', render: (row) => row.score ?? '-' },
    { key: 'minimalScore', header: 'Skor Minimal', accessor: 'minimalScore' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.status === 'verified') {
          return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Tervalidasi</Badge>;
        }
        return (
          <Badge variant="outline" className={row.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
            {row.passed ? 'Lulus' : 'Tidak Lulus'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          {row.status !== 'verified' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => verifyMutation.mutate(row.cplId)}
              disabled={verifyMutation.isPending}
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Validasi
            </Button>
          )}
          {!row.passed && row.status !== 'verified' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRecCplId(row.cplId);
                setRecCplCode(row.code ?? '-');
                setRecRecommendation('');
                setRecDescription('');
                setRecModalOpen(true);
              }}
            >
              <FilePlus className="mr-1 h-3 w-3" />
              Rekomendasi
            </Button>
          )}
        </div>
      ),
    },
  ];

  const recColumns: Column<CplRecommendationItem>[] = [
    {
      key: 'cplId',
      header: 'Kode CPL',
      render: (row) => {
        const cpl = cplData.cplScores.find((c) => c.cplId === row.cplId);
        return cpl?.code ?? '-';
      },
    },
    { key: 'recommendation', header: 'Jenis Rekomendasi', render: (row) => row.recommendation ?? '-' },
    { key: 'description', header: 'Deskripsi', render: (row) => <span className="line-clamp-2">{row.description ?? '-'}</span> },
    {
      key: 'createdAt',
      header: 'Dibuat',
      render: (row) => new Date(row.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = REC_STATUS_MAP[row.status] ?? REC_STATUS_MAP.in_progress;
        return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'in_progress' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateRecStatusMutation.mutate({ recommendationId: row.id, action: 'resolve' })}
              disabled={updateRecStatusMutation.isPending}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Selesai
            </Button>
          )}
          {row.status === 'resolved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateRecStatusMutation.mutate({ recommendationId: row.id, action: 'unresolve' })}
              disabled={updateRecStatusMutation.isPending}
            >
              <Undo2 className="mr-1 h-3 w-3" />
              Batalkan
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleCreateRecommendation = () => {
    if (!recCplId) return;
    createRecMutation.mutate(
      { cplId: recCplId, recommendation: recRecommendation, description: recDescription },
      { onSuccess: () => setRecModalOpen(false) }
    );
  };

  return (
    <div className="p-4 space-y-6">
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => navigate(`/yudisium/lecturer/event/${yudisiumId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Detail Yudisium
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Validasi CPL</h1>
        <p className="text-muted-foreground">Validasi CPL mahasiswa dan pengelolaan rekomendasi CPL.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identitas Mahasiswa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nama:</span> {toTitleCaseName(participantData.studentName)}
          </p>
          <p>
            <span className="text-muted-foreground">NIM:</span> {participantData.studentNim}
          </p>
          <p>
            <span className="text-muted-foreground">Judul TA:</span> {participantData.thesisTitle}
          </p>
          <div className="pt-1">
            <Badge variant="outline" className={statusInfo.className}>
              Status: {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">CPL</h2>
        <CustomTable
          columns={cplColumns}
          data={paginatedCpl}
          loading={loadingCpl}
          isRefreshing={isFetching && !loadingCpl}
          total={filteredCpl.length}
          page={cplPage}
          pageSize={cplPageSize}
          onPageChange={setCplPage}
          onPageSizeChange={(s) => { setCplPageSize(s); setCplPage(1); }}
          searchValue={cplSearch}
          onSearchChange={(v) => { setCplSearch(v); setCplPage(1); }}
          emptyText="Belum ada data CPL"
          actions={
            <RefreshButton onClick={() => { void refetch(); }} isRefreshing={isFetching && !loadingCpl} />
          }
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Rekomendasi CPL</h2>
        <CustomTable
          columns={recColumns}
          data={paginatedRec}
          loading={loadingCpl}
          total={filteredRec.length}
          page={recPage}
          pageSize={recPageSize}
          onPageChange={setRecPage}
          onPageSizeChange={(s) => { setRecPageSize(s); setRecPage(1); }}
          searchValue={recSearch}
          onSearchChange={(v) => { setRecSearch(v); setRecPage(1); }}
          emptyText="Belum ada rekomendasi CPL"
        />
      </div>

      <Dialog open={recModalOpen} onOpenChange={setRecModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Rekomendasi CPL</DialogTitle>
            <DialogDescription>
              Buat rekomendasi untuk CPL {recCplCode} yang tidak memenuhi skor minimal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jenis Rekomendasi</Label>
              <Textarea
                placeholder="Contoh: Remedial, Ujian Ulang, dll."
                value={recRecommendation}
                onChange={(e) => setRecRecommendation(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi rekomendasi..."
                value={recDescription}
                onChange={(e) => setRecDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateRecommendation}
              disabled={createRecMutation.isPending || !recRecommendation.trim()}
            >
              {createRecMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
