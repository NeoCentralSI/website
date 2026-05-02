import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, Clock, 
  ShieldCheck, FilePlus, Undo2 
} from 'lucide-react';
import { 
  useYudisiumParticipantDetail,
  useParticipantCplScores,
  useVerifyCplScore,
  useCreateCplRecommendation,
  useUpdateCplRecommendationStatus,
} from '@/hooks/yudisium/useYudisiumParticipants';
import { openProtectedFile } from '@/lib/protected-file';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import { toast } from 'sonner';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import type { CplScoreItem, CplRecommendationItem } from '@/types/admin-yudisium.types';
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

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Menunggu Validasi Dokumen', className: 'bg-amber-50 text-amber-700 border-amber-200' },
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

export default function YudisiumParticipantDetail() {
  const { id: yudisiumId, yudisiumParticipantId } = useParams<{ id: string; yudisiumParticipantId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const { data, isLoading } = useYudisiumParticipantDetail(yudisiumId!, yudisiumParticipantId!);
  const { data: cplData, isLoading: loadingCpl, isFetching, refetch } = useParticipantCplScores(yudisiumId!, yudisiumParticipantId!);
  
  const verifyMutation = useVerifyCplScore(yudisiumId!, yudisiumParticipantId!);
  const createRecMutation = useCreateCplRecommendation(yudisiumId!, yudisiumParticipantId!);
  const updateRecStatusMutation = useUpdateCplRecommendationStatus(yudisiumId!, yudisiumParticipantId!);

  const [recModalOpen, setRecModalOpen] = useState(false);
  const [selectedCpl, setSelectedCpl] = useState<{ id: string; code: string } | null>(null);
  const [recRecommendation, setRecRecommendation] = useState('');
  const [recDescription, setRecDescription] = useState('');

  const baseDetailPath = `/yudisium/${yudisiumId}`;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: data?.yudisium?.name ?? 'Detail', href: baseDetailPath },
      { label: data?.studentName ?? 'Detail Peserta' },
    ]);
    setTitle(data?.studentName ?? 'Detail Peserta');
  }, [setBreadcrumbs, setTitle, data, yudisiumId, baseDetailPath]);

  if (isLoading || loadingCpl) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail peserta..." />
      </div>
    );
  }

  if (!data) {
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

  const statusInfo = PARTICIPANT_STATUS_MAP[data.status] || PARTICIPANT_STATUS_MAP.registered;

  const cplColumns: Column<CplScoreItem>[] = [
    { key: 'code', header: 'Kode CPL', render: (row) => row.code ?? '-' },
    {
      key: 'description',
      header: 'Deskripsi',
      width: 400,
      render: (row) => <span className="line-clamp-2">{row.description}</span>,
    },
    { key: 'score', header: 'Nilai', render: (row) => row.score ?? '-' },
    { key: 'minimalScore', header: 'Minimal', accessor: 'minimalScore' },
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
                setSelectedCpl({ id: row.cplId, code: row.code ?? '-' });
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
      key: 'cplCode',
      header: 'CPL',
      render: (row) => cplData?.cplScores.find(c => c.cplId === row.cplId)?.code ?? '-'
    },
    { key: 'recommendation', header: 'Rekomendasi' },
    { key: 'status', header: 'Status', render: (row) => {
      const s = REC_STATUS_MAP[row.status] || REC_STATUS_MAP.open;
      return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
    }},
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          {row.status !== 'resolved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateRecStatusMutation.mutate({ recommendationId: row.id, action: 'resolve' })}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Selesai
            </Button>
          )}
          {row.status === 'resolved' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateRecStatusMutation.mutate({ recommendationId: row.id, action: 'unresolve' })}
            >
              <Undo2 className="mr-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(baseDetailPath)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{toTitleCaseName(data.studentName)}</h1>
            <p className="text-muted-foreground">{data.studentNim}</p>
          </div>
          <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Mahasiswa</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-y-2">
              <span className="text-muted-foreground">Judul TA</span>
              <span className="font-medium">{data.thesisTitle}</span>
              {data.supervisors.map((s: any, i: number) => (
                <div key={i} className="contents">
                  <span className="text-muted-foreground">{s.role}</span>
                  <span className="font-medium">{toTitleCaseName(s.name)}</span>
                </div>
              ))}
              <span className="text-muted-foreground">Tanggal Daftar</span>
              <span className="font-medium">{data.registeredAt ? formatDateId(data.registeredAt) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dokumen Persyaratan</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.documents.map((doc: any) => (
                <div key={doc.requirementId} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {doc.status === 'approved' ? <CheckCircle className="text-green-600 h-4 w-4" /> : <Clock className="text-amber-600 h-4 w-4" />}
                    <span className="text-sm font-medium">{doc.requirementName}</span>
                  </div>
                  {doc.document?.filePath && (
                    <Button variant="ghost" size="sm" onClick={() => openProtectedFile(doc.document.filePath, doc.document.fileName)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Capaian Pembelajaran Lulusan (CPL)</CardTitle>
            <RefreshButton onClick={() => refetch()} isRefreshing={isFetching} />
          </div>
        </CardHeader>
        <CardContent>
          <CustomTable
            columns={cplColumns}
            data={cplData?.cplScores ?? []}
            loading={loadingCpl}
            emptyText="Tidak ada data CPL"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Rekomendasi CPL</CardTitle></CardHeader>
        <CardContent>
          <CustomTable
            columns={recColumns}
            data={cplData?.recommendations ?? []}
            loading={loadingCpl}
            emptyText="Tidak ada rekomendasi"
          />
        </CardContent>
      </Card>

      <Dialog open={recModalOpen} onOpenChange={setRecModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Rekomendasi CPL</DialogTitle>
            <DialogDescription>Rekomendasi untuk CPL {selectedCpl?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rekomendasi</Label>
              <Input value={recRecommendation} onChange={(e) => setRecRecommendation(e.target.value)} placeholder="Contoh: Remedial" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={recDescription} onChange={(e) => setRecDescription(e.target.value)} placeholder="Detail rekomendasi..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecModalOpen(false)}>Batal</Button>
            <Button 
              onClick={() => {
                if (selectedCpl) {
                  createRecMutation.mutate({ 
                    cplId: selectedCpl.id, 
                    recommendation: recRecommendation, 
                    description: recDescription 
                  }, { onSuccess: () => setRecModalOpen(false) });
                }
              }}
              disabled={createRecMutation.isPending}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { Input } from '@/components/ui/input';
