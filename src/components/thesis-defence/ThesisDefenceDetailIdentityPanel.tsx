import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toTitleCaseName, formatDateShortId, formatDateOnlyId, formatRoleName } from '@/lib/text';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  XCircle,
  Eye,
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

  const supervisors: any[] = detail.supervisors || [];
  const examiners: any[] = detail.examiners || [];
  const documentTypes: any[] = detail.documentTypes || [];
  const documents: any[] = detail.documents || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Informasi Sidang */}
        <Card className="lg:col-span-1 h-full flex flex-col">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Informasi Sidang
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
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Sidang</p>
                <p className="text-sm font-medium mt-0.5">
                  {detail.date ? formatDateOnlyId(detail.date) : 'Belum dijadwalkan'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu</p>
                <p className="text-sm font-medium mt-0.5">
                  {detail.date && detail.startTime
                    ? `${extractTime(detail.startTime)} – ${extractTime(detail.endTime)} WIB`
                    : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempat</p>
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

              {examiners.map((e: any) => (
                <div key={e.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Penguji {e.order}</p>
                    <ThesisExaminerAvailabilityStatusBadge status={e.availabilityStatus} className="text-[9px] px-1 py-0 h-4" />
                  </div>
                  <p className="text-sm font-medium mt-0.5">{toTitleCaseName(e.lecturerName)}</p>
                </div>
              ))}

              {detail.rejectedExaminers && detail.rejectedExaminers.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Riwayat Penolakan:</p>
                  <div className="space-y-2">
                    {detail.rejectedExaminers.map((e: any) => (
                      <div key={e.id} className="flex flex-col gap-0.5 opacity-60">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3 w-3 text-red-400" />
                          <span className="text-xs font-medium line-through">{toTitleCaseName(e.lecturerName)}</span>
                          <span className="text-[10px] text-muted-foreground">(Penguji {e.order})</span>
                        </div>
                        {e.respondedAt && (
                          <span className="text-[9px] text-muted-foreground pl-4">Ditolak: {formatDateShortId(e.respondedAt)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - TA Info & Documents */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supervisors.map((s: any, index: number) => (
                  <div key={index}>
                    <p className="text-xs text-muted-foreground">
                      {s.role ? formatRoleName(s.role) : `Dosen Pembimbing ${index + 1}`}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{toTitleCaseName(s.name)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dokumen Sidang */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Dokumen Sidang
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {documentTypes.map((dt: any) => {
                const doc = documents.find((d: any) => d.documentTypeId === dt.id);
                const statusDisplay = doc ? getDocStatusDisplay(doc.status) : null;
                const isSubmitted = doc?.status === 'submitted';
                const isDeclined = doc?.status === 'declined';

                return (
                  <div
                    key={dt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-sm hover:border-border transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${doc ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-foreground block">
                          {dt.name}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                          {doc ? `${doc.fileName || 'File'} • ${formatDateShortId(doc.submittedAt)}` : 'Belum diunggah'}
                        </span>
                        {doc?.notes && (
                          <span className="text-xs text-red-600 block mt-1 italic">
                            Catatan: {doc.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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
                          onClick={async () => {
                            try {
                              await openProtectedFile(doc.filePath!, doc.fileName || undefined);
                            } catch (error) {
                              toast.error((error as Error).message || 'Gagal membuka dokumen');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Admin Validation Actions */}
                      {isAdmin() && doc && (isSubmitted || isDeclined) && (
                        <div className="flex items-center gap-1.5 ml-1 pl-3 border-l">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleValidate(dt.id, 'approve')}
                            disabled={validateMutation.isPending}
                          >
                            {validateMutation.isPending && selectedDocTypeId === dt.id ? (
                              <Spinner className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setSelectedDocTypeId(dt.id);
                              setDeclineDialogOpen(true);
                            }}
                            disabled={validateMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

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
