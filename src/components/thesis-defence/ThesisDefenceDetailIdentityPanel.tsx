import { RequirementDocumentRow } from '@/components/shared/RequirementDocumentRow';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toTitleCaseName, formatDateShortId, formatDateOnlyId, formatRoleName } from '@/lib/text';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  XCircle,
} from 'lucide-react';
import { ThesisExaminerAvailabilityStatusBadge } from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import { toast } from 'sonner';
import { useRole } from '@/hooks/shared';
import { useVerifyDefenceDocument } from '@/hooks/thesis-defence';
import { useDocumentViewer } from '@/components/thesis/useDocumentViewer';
import { API_CONFIG } from '@/config/api';
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


interface Props {
  detail: any;
}

export function ThesisDefenceDetailIdentityPanel({ detail }: Props) {
  const { isAdmin } = useRole();
  const validateMutation = useVerifyDefenceDocument();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');
  const { openDocument, viewer } = useDocumentViewer();

  const handleValidate = async (docTypeId: string, action: 'approve' | 'decline', notes?: string) => {
    try {
      await validateMutation.mutateAsync({
        defenceId: detail.id,
        requirementId: docTypeId,
        payload: { action, notes },
      });
      toast.success(action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      setDeclineDialogOpen(false);
      setDeclineNotes('');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal memvalidasi dokumen');
    }
  };

  const supervisors: any[] = [...(detail.supervisors || [])].sort((a, b) => (a.role || '').localeCompare(b.role || ''));
  const examiners: any[] = detail.examiners || [];
  const documentTypes: any[] = detail.documentTypes || [];
  const documents: any[] = detail.documents || [];

  return (
    <div className="space-y-6">
      {viewer}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Informasi Sidang */}
        <Card className="lg:col-span-1 h-full gap-4 py-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Informasi Sidang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Mahasiswa</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{toTitleCaseName(detail.student?.name)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIM</p>
                <p className="text-sm font-medium mt-0.5">{detail.student?.nim}</p>
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
          <Card className="gap-4 py-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Informasi Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card className="gap-4 py-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Dokumen Sidang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentTypes.map((dt: any) => {
                const doc = documents.find((d: any) => (d.requirementId || d.documentTypeId) === dt.id);
                const isSubmitted = doc?.status === 'submitted';
                const isDeclined = doc?.status === 'declined';

                return (
                  <RequirementDocumentRow
                    key={dt.id}
                    name={dt.name}
                    status={doc?.status}
                    fileName={doc?.fileName}
                    submittedAt={doc?.submittedAt}
                    notes={doc?.notes}
                    onView={doc ? () => openDocument(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENT_FILE(detail.id, dt.id), doc.fileName) : undefined}
                    actions={isAdmin() && doc && (isSubmitted || isDeclined) ? (
                        <div className="flex items-center gap-1.5 ml-1 pl-3 border-l">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8"
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
                    ) : null}
                  />
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
              Berikan alasan penolakan dokumen ini agar mahasiswa dapat memperbaikinya
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
