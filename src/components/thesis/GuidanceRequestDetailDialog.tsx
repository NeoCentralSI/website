import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { CheckIcon, XIcon, FileTextIcon } from "lucide-react";
import StatusBadge from "@/components/thesis/StatusBadge";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { approveGuidanceRequest, rejectGuidanceRequest } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";

type Props = {
  guidance: GuidanceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onViewDocument?: (fileName: string, filePath: string) => void;
};

export default function GuidanceRequestDetailDialog({ 
  guidance, 
  open, 
  onOpenChange, 
  onUpdated,
  onViewDocument 
}: Props) {
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [meetingUrl, setMeetingUrl] = useState("");
  const [approveFeedback, setApproveFeedback] = useState("");
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!guidance) return null;

  const canApproveReject = guidance.status === 'requested';
  const fileName = (guidance as any)?.document?.fileName as string | undefined;
  const filePath = (guidance as any)?.document?.filePath as string | undefined;
  const isPdf = Boolean(filePath && filePath.toLowerCase().endsWith(".pdf"));

  const handleApprove = async () => {
    if (!guidance.id) return;
    setSubmitting(true);
    try {
      await approveGuidanceRequest(guidance.id, {
        feedback: approveFeedback || "Approved",
        meetingUrl: meetingUrl || undefined,
      });
      toast.success("Bimbingan disetujui");
      setMode('view');
      setMeetingUrl("");
      setApproveFeedback("");
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyetujui");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!guidance.id) return;
    
    if (!rejectFeedback.trim()) {
      toast.error("Mohon isi alasan penolakan");
      return;
    }
    
    setSubmitting(true);
    try {
      await rejectGuidanceRequest(guidance.id, {
        message: rejectFeedback,
      });
      toast.success("Bimbingan ditolak");
      setMode('view');
      setRejectFeedback("");
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menolak");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMode('view');
    setMeetingUrl("");
    setApproveFeedback("");
    setRejectFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' && 'Setujui Bimbingan'}
            {mode === 'reject' && 'Tolak Bimbingan'}
            {mode === 'view' && 'Detail Permintaan Bimbingan'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' && (
          <div className="space-y-6">
            {/* Info Section */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Mahasiswa</div>
                <div className="font-medium">
                  {toTitleCaseName((guidance as any)?.studentName || (guidance as any)?.studentId || '-')}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div><StatusBadge status={guidance.status as any} /></div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Jadwal Diminta</div>
                <div className="font-medium text-sm">
                  {(guidance as any)?.requestedDateFormatted || 
                   (guidance as any)?.approvedDateFormatted || 
                   (guidance.requestedDate ? formatDateId(guidance.requestedDate) : '-')}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tanggal Pengajuan</div>
                <div className="font-medium text-sm">
                  {(guidance as any)?.createdAtFormatted || 
                   ((guidance as any)?.createdAt ? formatDateId((guidance as any).createdAt as string) : '-')}
                </div>
              </div>
            </div>

            {/* Catatan Mahasiswa */}
            <div className="space-y-2">
              <Label>Catatan Mahasiswa</Label>
              <div className="p-3 rounded-lg bg-muted/30 text-sm min-h-20">
                {(guidance as any)?.notes || '-'}
              </div>
            </div>

            {/* Dokumen */}
            {fileName && (
              <div className="space-y-2">
                <Label>Dokumen</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <FileTextIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{fileName}</div>
                    {isPdf && (
                      <div className="text-xs text-muted-foreground">Klik untuk melihat preview</div>
                    )}
                  </div>
                  {isPdf && filePath && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDocument?.(fileName, filePath)}
                    >
                      Lihat
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Meeting URL (if exists) */}
            {(guidance as any)?.meetingUrl && (
              <div className="space-y-2">
                <Label>Meeting URL</Label>
                <div className="p-3 rounded-lg bg-muted/30 text-sm break-all">
                  <a 
                    href={(guidance as any).meetingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {(guidance as any).meetingUrl}
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canApproveReject && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={() => setMode('reject')}
                  className="gap-2"
                >
                  <XIcon className="size-4" />
                  Tolak
                </Button>
                <Button 
                  onClick={() => setMode('approve')}
                  className="gap-2"
                >
                  <CheckIcon className="size-4" />
                  Setujui
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === 'approve' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              ℹ️ Anda akan menyetujui permintaan bimbingan dari{' '}
              <strong>{toTitleCaseName((guidance as any)?.studentName || '-')}</strong>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL (opsional)</Label>
                <Input
                  id="meetingUrl"
                  placeholder="https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Link meeting untuk bimbingan online
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approveFeedback">Catatan (opsional)</Label>
                <Textarea
                  id="approveFeedback"
                  placeholder="Catatan untuk mahasiswa..."
                  value={approveFeedback}
                  onChange={(e) => setApproveFeedback(e.target.value)}
                  disabled={submitting}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setMode('view')} 
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner className="size-4" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    Setujui Bimbingan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {mode === 'reject' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              ⚠️ Anda akan menolak permintaan bimbingan dari{' '}
              <strong>{toTitleCaseName((guidance as any)?.studentName || '-')}</strong>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectFeedback">Alasan Penolakan *</Label>
              <Textarea
                id="rejectFeedback"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                disabled={submitting}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Mahasiswa akan menerima notifikasi dengan alasan ini
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setMode('view')} 
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={submitting || !rejectFeedback.trim()}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner className="size-4" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <XIcon className="size-4" />
                    Tolak Bimbingan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
