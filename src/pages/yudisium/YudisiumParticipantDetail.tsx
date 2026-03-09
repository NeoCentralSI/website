import { useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAdminYudisiumParticipantDetail } from '@/hooks/yudisium/useAdminYudisium';
import { openProtectedFile } from '@/lib/protected-file';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import { toast } from 'sonner';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Menunggu Validasi Dokumen', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Menunggu Validasi CPL', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Lulus', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
  finalized: { label: 'Selesai', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export default function YudisiumParticipantDetail() {
  const { id: yudisiumId, participantId } = useParams<{ id: string; participantId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminYudisiumParticipantDetail(participantId!);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium Admin', href: '/yudisium/admin' },
      { label: data?.yudisium?.name ?? 'Detail', href: `/yudisium/admin/${yudisiumId}` },
      { label: data?.studentName ?? 'Detail Peserta' },
    ]);
    setTitle(data?.studentName ?? 'Detail Peserta');
  }, [setBreadcrumbs, setTitle, data, yudisiumId]);

  if (isLoading) {
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/yudisium/admin/${yudisiumId}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{toTitleCaseName(data.studentName)}</h1>
            <p className="text-muted-foreground">{data.studentNim}</p>
          </div>
          <Badge variant="outline" className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-y-2">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{toTitleCaseName(data.studentName)}</span>
              <span className="text-muted-foreground">NIM</span>
              <span className="font-medium">{data.studentNim}</span>
              <span className="text-muted-foreground">Judul TA</span>
              <span className="font-medium">{data.thesisTitle}</span>
              {data.supervisors.map((s, i) => (
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
          <CardHeader>
            <CardTitle className="text-base">Dokumen Persyaratan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.documents.map((doc) => (
                <div key={doc.requirementId} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-600' :
                      doc.status === 'declined' ? 'bg-red-100 text-red-600' :
                      doc.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {doc.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                      {doc.status === 'declined' && <XCircle className="h-4 w-4" />}
                      {doc.status === 'submitted' && <Clock className="h-4 w-4" />}
                      {!doc.status && <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{doc.requirementName}</p>
                      {doc.document?.fileName && (
                        <p className="text-xs text-muted-foreground truncate">{doc.document.fileName}</p>
                      )}
                      {doc.notes && (
                        <p className="text-xs text-red-600 mt-0.5">Catatan: {doc.notes}</p>
                      )}
                      {doc.verifiedAt && doc.verifiedBy && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Diverifikasi oleh {toTitleCaseName(doc.verifiedBy)} pada {formatDateId(doc.verifiedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.document?.filePath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await openProtectedFile(
                            doc.document!.filePath!,
                            doc.document!.fileName || undefined
                          );
                        } catch (error) {
                          toast.error((error as Error).message || 'Gagal membuka dokumen');
                        }
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {data.documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada dokumen yang diunggah.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
