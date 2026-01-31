import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { CheckIcon, XIcon, FileTextIcon, ExternalLink } from "lucide-react";
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
      });
      toast.success("Bimbingan disetujui");
      setMode('view');
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
    setApproveFeedback("");
    setRejectFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === 'approve' && 'Setujui Bimbingan'}
            {mode === 'reject' && 'Tolak Bimbingan'}
            {mode === 'view' && 'Detail Permintaan Bimbingan'}
          </DialogTitle>
          {mode === 'view' && (
            <DialogDescription>
              Permintaan bimbingan dari {toTitleCaseName((guidance as any)?.studentName || '-')}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {mode === 'view' && (
            <>
              {/* Info Section - Compact Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mahasiswa</Label>
                  <div className="font-medium">
                    {toTitleCaseName((guidance as any)?.studentName || (guidance as any)?.studentId || '-')}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div><StatusBadge status={guidance.status as any} /></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Jadwal Diminta</Label>
                  <div className="font-medium">
                    {(guidance as any)?.requestedDateFormatted || 
                     (guidance as any)?.approvedDateFormatted || 
                     (guidance.requestedDate ? formatDateId(guidance.requestedDate) : '-')}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tanggal Pengajuan</Label>
                  <div className="text-sm">
                    {(guidance as any)?.createdAtFormatted || 
                     ((guidance as any)?.createdAt ? formatDateId((guidance as any).createdAt as string) : '-')}
                  </div>
                </div>
              </div>

              {/* Catatan Mahasiswa */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agenda/Catatan</Label>
                <div className="p-3 rounded-lg bg-muted/50 min-h-16 text-sm">
                  {(guidance as any)?.notes || (guidance as any)?.studentNotes || '-'}
                </div>
              </div>

              {/* Milestone (if any) */}
              {(((guidance as any)?.milestoneTitles && (guidance as any).milestoneTitles.length > 0) || 
                (guidance as any)?.milestone?.title) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Milestone</Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    {((guidance as any)?.milestoneTitles && (guidance as any).milestoneTitles.length > 0) ? (
                      (guidance as any).milestoneTitles.join(", ")
                    ) : (
                      (guidance as any)?.milestone?.title || '-'
                    )}
                  </div>
                </div>
              )}

              {/* Dokumen - Compact */}
              {fileName && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File Thesis</Label>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm truncate">{fileName}</span>
                    {isPdf && filePath && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => onViewDocument?.(fileName, filePath)}
                      >
                        Lihat
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Links - Compact */}
              {(guidance as any)?.documentUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Link</Label>
                  <div className="space-y-2">
                    <a 
                      href={(guidance as any).documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Dokumen Online
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'approve' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anda akan menyetujui permintaan bimbingan dari{' '}
                <strong>{toTitleCaseName((guidance as any)?.studentName || '-')}</strong>
              </p>

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
          )}

          {mode === 'reject' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anda akan menolak permintaan bimbingan dari{' '}
                <strong>{toTitleCaseName((guidance as any)?.studentName || '-')}</strong>
              </p>

              <div className="space-y-2">
                <Label htmlFor="rejectFeedback">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </Label>
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
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 flex justify-end gap-2 pt-4 border-t">
          {mode === 'view' && canApproveReject && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
              <Button variant="destructive" onClick={() => setMode('reject')}>
                Tolak
              </Button>
              <Button onClick={() => setMode('approve')}>
                Setujui
              </Button>
            </>
          )}

          {mode === 'view' && !canApproveReject && (
            <Button variant="outline" onClick={handleClose}>
              Tutup
            </Button>
          )}

          {mode === 'approve' && (
            <>
              <Button variant="outline" onClick={() => setMode('view')} disabled={submitting}>
                Batal
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Memproses...
                  </>
                ) : (
                  'Setujui Bimbingan'
                )}
              </Button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <Button variant="outline" onClick={() => setMode('view')} disabled={submitting}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={submitting || !rejectFeedback.trim()}
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Memproses...
                  </>
                ) : (
                  'Tolak Bimbingan'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
