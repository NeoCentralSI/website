import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeminarAudienceTable } from '@/components/seminar/SeminarAudienceTable';
import { toTitleCaseName, formatDateOnlyId, formatDateShortId } from '@/lib/text';
import { Calendar, FileText, Users, Download } from 'lucide-react';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import type { StudentSeminarDetailResponse } from '@/types/seminar.types';

function extractSeminarTime(timeIso?: string | null): string {
  if (!timeIso) return '--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

interface StudentIdentitasTabProps {
  detail: StudentSeminarDetailResponse;
}

export function StudentIdentitasTab({ detail }: StudentIdentitasTabProps) {
  const handleDownloadDocument = async (filePath: string, fileName?: string | null) => {
    try {
      await openProtectedFile(filePath, fileName || undefined);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal membuka dokumen');
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thesis Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informasi Tugas Akhir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Judul:</span>
              <span className="text-right max-w-[60%]">{detail.thesis.title}</span>
            </div>
            {detail.examiners.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <span className="text-muted-foreground text-xs">Dosen Penguji:</span>
                {detail.examiners.map((ex) => (
                  <div key={ex.id} className="flex justify-between">
                    <span className="text-muted-foreground">Penguji {ex.order}</span>
                    <span>{toTitleCaseName(ex.lecturerName)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seminar Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informasi Seminar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal:</span>
              <span>{detail.date ? formatDateOnlyId(detail.date) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waktu:</span>
              <span>{extractSeminarTime(detail.startTime)} – {extractSeminarTime(detail.endTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruangan:</span>
              <span>{detail.room?.name || '-'}</span>
            </div>
            {detail.meetingLink && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Link:</span>
                <a
                  href={detail.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {detail.meetingLink}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      {detail.documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumen Seminar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detail.documents.map((doc) => (
                <div
                  key={doc.documentTypeId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{doc.documentTypeName}</div>
                      {doc.submittedAt ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.fileName || 'File'} • {formatDateShortId(doc.submittedAt)}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Belum diunggah</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        doc.status === 'approved'
                          ? 'success'
                          : doc.status === 'declined'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {doc.status === 'approved'
                        ? 'Disetujui'
                        : doc.status === 'declined'
                          ? 'Ditolak'
                          : 'Menunggu'}
                    </Badge>
                    {doc.filePath && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadDocument(doc.filePath!, doc.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience / Attendance */}
      {detail.audiences.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Hadir Peserta ({detail.audiences.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeminarAudienceTable rows={detail.audiences} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
