import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toTitleCaseName, formatDateShortId, formatDateOnlyId, formatDateTimeId, formatRoleName } from '@/lib/text';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  User,
  XCircle,
} from 'lucide-react';
import { ThesisExaminerAvailabilityStatusBadge } from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import type { DocumentSubmitStatus } from '@/types/defence.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { useRole } from '@/hooks/shared';
import { useValidateDefenceDocument } from '@/hooks/thesis-defence';
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
import { Spinner } from '@/components/ui/spinner';

function extractTime(timeIso?: string | null): string {
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
    case 'submitted':
    default:
      return { label: 'Menunggu', badge: 'warning' as const };
  }
}

interface Props {
  detail: any;
}

export function ThesisDefenceDetailIdentityPanel({ detail }: Props) {
  const { isAdmin } = useRole();
  const validateMutation = useValidateDefenceDocument();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');

  const handleValidate = async (docTypeId: string, action: 'approve' | 'decline', notes?: string) => {
    try {
      await validateMutation.mutateAsync({
        defenceId: detail.id,
        documentTypeId: docTypeId,
        payload: { action, notes },
      });
      toast.success(action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      setDeclineDialogOpen(false);
      setDeclineNotes('');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal memvalidasi dokumen');
    }
  };

  return (
    <div className="space-y-4">
      {/* Student Identity Card (Mainly for Admin/Lecturer) */}
      {!detail.isStudentView && (
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
              {detail.student.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm text-emerald-600 font-medium">Mahasiswa Terdaftar</div>
              <div className="font-bold text-foreground text-lg">{toTitleCaseName(detail.student.name)}</div>
              <div className="text-sm text-muted-foreground">{detail.student.nim}</div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="font-medium mt-0.5">{detail.thesis.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pembimbing:</span>
              <div className="mt-1 space-y-1">
                {detail.supervisors.map((s: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground text-xs min-w-[100px]">{formatRoleName(s.role)}:</span>
                    <span>{toTitleCaseName(s.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defence Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informasi Sidang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal Daftar:</span>
              <span>{detail.registeredAt ? formatDateTimeId(detail.registeredAt) : '-'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Tanggal Sidang:</span>
              <span className="text-right">
                {detail.date
                  ? `${formatDateOnlyId(detail.date)}, ${extractTime(detail.startTime)} – ${extractTime(detail.endTime)}`
                  : 'Belum dijadwalkan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruangan:</span>
              <span>{detail.room?.name || '-'}</span>
            </div>
            {detail.meetingLink && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Link:</span>
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
            {detail.examiners.length > 0 && (
              <div>
                <span className="text-muted-foreground">Penguji:</span>
                <div className="mt-1 space-y-1">
                  {detail.examiners.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{toTitleCaseName(e.lecturerName)}</span>
                      <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                      <ThesisExaminerAvailabilityStatusBadge status={e.availabilityStatus} className="text-[10px] px-1 py-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.rejectedExaminers && detail.rejectedExaminers.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-xs">Riwayat Penolakan:</span>
                <div className="mt-1 space-y-1">
                  {detail.rejectedExaminers.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 opacity-60">
                      <XCircle className="h-3 w-3 text-red-400" />
                      <span className="text-xs line-through">{toTitleCaseName(e.lecturerName)}</span>
                      <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                      {e.respondedAt && (
                        <span className="text-[10px] text-muted-foreground">— {formatDateTimeId(e.respondedAt)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumen Sidang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detail.documentTypes.map((dt: any) => {
              const doc = detail.documents.find((d: any) => d.documentTypeId === dt.id);
              const statusDisplay = doc ? getDocStatusDisplay(doc.status) : null;
              const canDownload = !!doc?.filePath;
              const isSubmitted = doc?.status === 'submitted';
              const isDeclined = doc?.status === 'declined';

              return (
                <div key={dt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3">
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
                        <div className="text-xs text-red-600 mt-1 italic bg-red-50 px-2 py-0.5 rounded inline-block">
                          Catatan: {doc.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {statusDisplay && <Badge variant={statusDisplay.badge}>{statusDisplay.label}</Badge>}
                    
                    {/* View/Download Button */}
                    {canDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await openProtectedFile(doc!.filePath!, doc?.fileName || undefined);
                          } catch (error) {
                            toast.error((error as Error).message || 'Gagal membuka dokumen');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Admin Validation Actions */}
                    {isAdmin() && doc && (isSubmitted || isDeclined) && (
                      <div className="flex items-center gap-1 pl-2 border-l">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleValidate(dt.id, 'approve')}
                          disabled={validateMutation.isPending}
                        >
                          {validateMutation.isPending && selectedDocTypeId === dt.id ? (
                            <Spinner className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedDocTypeId(dt.id);
                            setDeclineDialogOpen(true);
                          }}
                          disabled={validateMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Dokumen</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan dokumen ini agar mahasiswa dapat memperbaikinya.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes">Alasan Penolakan</Label>
            <Textarea
              id="notes"
              placeholder="Contoh: Format file salah atau dokumen tidak lengkap..."
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDocTypeId && handleValidate(selectedDocTypeId, 'decline', declineNotes)}
              disabled={!declineNotes.trim() || validateMutation.isPending}
            >
              {validateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Tolak Dokumen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
