import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  toTitleCaseName,
  formatDateOnlyId,
  formatDateShortId,
  formatRoleName,
} from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import type { DocumentSubmitStatus } from '@/types/seminar.types';
import { BookOpen, Calendar, Eye, FileText } from 'lucide-react';

function extractSeminarTime(timeIso?: string | null): string {
  if (!timeIso) return '--:--';
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
  const supervisors: any[] = [...(detail.supervisors || (detail.thesis?.supervisors || []).map((s: any) => ({
    name: s.lecturerName || s.name,
    role: s.role,
  })))].sort((a, b) => (a.role || '').localeCompare(b.role || ''));

  const examiners: any[] = detail.examiners ?? [];
  const documentTypes: any[] = detail.documentTypes ?? [];
  const documents: any[] = detail.documents ?? [];

  const handleDownload = async (filePath: string, fileName?: string | null) => {
    try {
      await openProtectedFile(filePath, fileName || undefined);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal membuka dokumen');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Informasi Seminar */}
        <Card className="lg:col-span-1 h-full flex flex-col">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Informasi Seminar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 flex-1">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Mahasiswa</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{toTitleCaseName(detail.student?.name)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIM</p>
                <p className="text-sm font-medium mt-0.5">{detail.student?.nim}</p>
              </div>

              {examiners.map((e: any, index: number) => (
                <div key={e.id || index}>
                  <p className="text-xs text-muted-foreground">Penguji {e.order || index + 1}</p>
                  <p className="text-sm font-medium mt-0.5">{toTitleCaseName(e.lecturerName)}</p>
                </div>
              ))}

              <div>
                <p className="text-xs text-muted-foreground">Tanggal</p>
                <p className="text-sm font-medium mt-0.5">
                  {detail.date ? formatDateOnlyId(detail.date) : 'Belum dijadwalkan'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu</p>
                <p className="text-sm font-medium mt-0.5">
                  {!detail.startTime || !detail.endTime
                    ? detail.date ? formatDateOnlyId(detail.date) : '--:--'
                    : `${extractSeminarTime(detail.startTime)} – ${extractSeminarTime(detail.endTime)} WIB`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ruangan</p>
                <div className="text-sm font-medium mt-0.5 leading-snug">
                  {detail.room?.name || '-'}
                  {detail.meetingLink && (
                    <a
                      href={detail.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs font-normal block mt-1 truncate max-w-xs"
                    >
                      {detail.meetingLink}
                    </a>
                  )}
                </div>
              </div>
              {detail.scheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Jadwal Ditetapkan Pada</p>
                  <p className="text-sm font-medium mt-0.5">{formatDateOnlyId(detail.scheduledAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Informasi Tugas Akhir & Dokumen Seminar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Tugas Akhir */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Informasi Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Judul</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{detail.thesis?.title}</p>
              </div>
              {supervisors.map((s: any, index: number) => (
                <div key={index}>
                  <p className="text-xs text-muted-foreground">
                    {s.role ? formatRoleName(s.role) : `Dosen Pembimbing ${index + 1}`}
                  </p>
                  <p className="text-sm font-medium mt-0.5">{toTitleCaseName(s.name)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dokumen Seminar */}
          {(documentTypes.length > 0 || documents.length > 0) && (
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Dokumen Seminar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {documentTypes.length > 0 ? (
                  documentTypes.map((dt: any) => {
                    const doc = documents.find((d: any) => d.documentTypeId === dt.id);
                    const statusDisplay = doc ? getDocStatusDisplay(doc.status) : null;
                    const docName = dt.name;
                    const fileName = doc ? (doc.fileName || 'File') : 'Belum diunggah';
                    const fileDate = doc ? formatDateShortId(doc.submittedAt) : '';

                    return (
                      <div
                        key={dt.id}
                        className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-sm hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`p-2.5 rounded-lg shrink-0 ${doc ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}
                          >
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm text-foreground block">
                              {docName}
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                              {fileName} {fileDate && `• ${fileDate}`}
                            </span>
                            {doc?.notes && (
                              <span className="text-xs text-muted-foreground block mt-1 italic">
                                Catatan: {doc.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {statusDisplay && (
                            <Badge variant={statusDisplay.badge} className="rounded-md font-medium px-2.5 py-0.5">
                              {statusDisplay.label}
                            </Badge>
                          )}
                          {doc?.filePath && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 border rounded-lg hover:bg-accent shrink-0"
                              onClick={() => handleDownload(doc.filePath, doc.fileName)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  documents.map((doc: any) => {
                    const docName = doc.documentTypeName || 'Dokumen';
                    const fileName = doc.fileName || 'File';
                    const fileDate = formatDateShortId(doc.submittedAt);

                    return (
                      <div
                        key={doc.documentTypeId || doc.id}
                        className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-sm hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-2.5 rounded-lg shrink-0 bg-emerald-50 text-emerald-600">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm text-foreground block">
                              {docName}
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                              {fileName} • {fileDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant={
                              doc.status === 'approved'
                                ? 'success'
                                : doc.status === 'declined'
                                  ? 'destructive'
                                  : 'warning'
                            }
                            className="rounded-md font-medium px-2.5 py-0.5"
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
                              className="h-9 w-9 border rounded-lg hover:bg-accent shrink-0"
                              onClick={() => handleDownload(doc.filePath, doc.fileName)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
