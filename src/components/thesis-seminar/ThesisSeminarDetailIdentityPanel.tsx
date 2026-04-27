import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThesisSeminarAudienceTable } from '@/components/thesis-seminar/ThesisSeminarDetailAudienceTable';
import { ThesisExaminerAvailabilityStatusBadge } from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import { useRole } from '@/hooks/shared/useRole';
import {
  toTitleCaseName,
  formatDateOnlyId,
  formatDateShortId,
  formatDateTimeId,
  formatRoleName,
} from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import type { DocumentSubmitStatus } from '@/types/seminar.types';
import { BookOpen, Calendar, Download, FileText, User, Users, XCircle } from 'lucide-react';

function extractSeminarTime(timeIso?: string | null): string {
  if (!timeIso) return '--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function getDocStatusDisplay(status: DocumentSubmitStatus) {
  switch (status) {
    case 'approved':
      return { label: 'Disetujui', badge: 'success' as const };
    case 'declined':
      return { label: 'Ditolak', badge: 'destructive' as const };
    default:
      return { label: 'Menunggu', badge: 'warning' as const };
  }
}

interface Props {
  detail: any;
}

export function ThesisSeminarDetailIdentityPanel({ detail }: Props) {
  const { isAdmin } = useRole();

  const supervisors: any[] = detail.supervisors || (detail.thesis?.supervisors || []).map((s: any) => ({
    name: s.lecturerName || s.name,
    role: s.role,
  }));

  const examiners: any[] = detail.examiners ?? [];
  const rejectedExaminers: any[] = detail.rejectedExaminers ?? [];
  const documentTypes: any[] = detail.documentTypes ?? [];
  const documents: any[] = detail.documents ?? [];
  const audiences: any[] = detail.audiences ?? [];

  const handleDownload = async (filePath: string, fileName?: string | null) => {
    try {
      await openProtectedFile(filePath, fileName || undefined);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal membuka dokumen');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thesis Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Informasi Tugas Akhir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Judul:</span>
              <p className="font-medium mt-0.5">{detail.thesis?.title}</p>
            </div>
            {supervisors.length > 0 && (
              <div>
                <span className="text-muted-foreground">Pembimbing:</span>
                <div className="mt-1 space-y-1">
                  {supervisors.map((s, i) => (
                    <div key={i} className="flex justify-between md:justify-start md:gap-2">
                      <span className="text-muted-foreground text-xs min-w-[100px]">{formatRoleName(s.role)}:</span>
                      <span className="text-right md:text-left">{toTitleCaseName(s.name)}</span>
                    </div>
                  ))}
                </div>
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
            {detail.registeredAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Daftar:</span>
                <span>{formatDateTimeId(detail.registeredAt)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Tanggal Seminar:</span>
              <span className="text-right">
                {detail.date
                  ? `${formatDateOnlyId(detail.date)}, ${extractSeminarTime(detail.startTime)} – ${extractSeminarTime(detail.endTime)}`
                  : 'Belum dijadwalkan'}
              </span>
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
                  className="text-blue-600 hover:underline truncate max-w-[200px]"
                >
                  {detail.meetingLink}
                </a>
              </div>
            )}
            {examiners.length > 0 && (
              <div className="pt-2 border-t mt-2">
                <span className="text-muted-foreground text-xs">Penguji:</span>
                <div className="mt-1 space-y-1">
                  {examiners.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between md:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{toTitleCaseName(e.lecturerName)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                        {e.availabilityStatus && (
                          <ThesisExaminerAvailabilityStatusBadge status={e.availabilityStatus} className="text-[10px] px-1 py-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rejectedExaminers.length > 0 && (
              <div className="pt-2 border-t opacity-60">
                <span className="text-muted-foreground text-xs">Riwayat Penolakan:</span>
                <div className="mt-1 space-y-1">
                  {rejectedExaminers.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between md:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span className="text-xs line-through">{toTitleCaseName(e.lecturerName)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      {(documentTypes.length > 0 || documents.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumen Seminar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* If we have documentTypes (Admin/Dosen view usually), map them */}
              {documentTypes.length > 0 ? (
                documentTypes.map((dt: any) => {
                  const doc = documents.find((d: any) => d.documentTypeId === dt.id);
                  const statusDisplay = doc ? getDocStatusDisplay(doc.status) : null;
                  return (
                    <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{dt.name}</div>
                          {doc ? (
                            <div className="text-xs text-muted-foreground truncate">
                              {doc.fileName || 'File'} • {formatDateShortId(doc.submittedAt)}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Belum diunggah</div>
                          )}
                          {doc?.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">Catatan: {doc.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusDisplay && <Badge variant={statusDisplay.badge}>{statusDisplay.label}</Badge>}
                        {doc?.filePath && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.filePath, doc.fileName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback to just mapping documents (Student view usually) */
                documents.map((doc: any) => (
                  <div key={doc.documentTypeId || doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{doc.documentTypeName || 'Dokumen'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.fileName || 'File'} • {formatDateShortId(doc.submittedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          doc.status === 'approved' ? 'success' : doc.status === 'declined' ? 'destructive' : 'warning'
                        }
                      >
                        {doc.status === 'approved' ? 'Disetujui' : doc.status === 'declined' ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                      {doc.filePath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownload(doc.filePath, doc.fileName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {documentTypes.length === 0 && documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada dokumen seminar.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience */}
      {audiences.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Hadir Peserta ({audiences.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThesisSeminarAudienceTable rows={audiences} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
