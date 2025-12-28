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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === 'approve' && 'Setujui Bimbingan'}
            {mode === 'reject' && 'Tolak Bimbingan'}
            {mode === 'view' && 'Detail Permintaan Bimbingan'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {mode === 'view' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Kolom Kiri - Info Utama */}
              <div className="space-y-4">
                {/* Info Section - Compact */}
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Mahasiswa</div>
                      <div className="font-medium text-sm">
                        {toTitleCaseName((guidance as any)?.studentName || (guidance as any)?.studentId || '-')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <div><StatusBadge status={guidance.status as any} /></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Catatan Mahasiswa */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catatan Mahasiswa</Label>
                  <div className="p-3 rounded-lg bg-muted/30 text-sm min-h-20 max-h-32 overflow-auto">
                    {(guidance as any)?.notes || (guidance as any)?.studentNotes || '-'}
                  </div>
                </div>

                {/* Meeting URL (if exists) */}
                {(guidance as any)?.meetingUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meeting URL</Label>
                    <div className="p-3 rounded-lg bg-muted/30 text-sm">
                      <a 
                        href={(guidance as any).meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {(guidance as any).meetingUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Kolom Kanan - Milestone & Dokumen */}
              <div className="space-y-4">
                {/* Milestone */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Milestone yang Dibahas</Label>
                  <div className="p-3 rounded-lg bg-muted/30 text-sm min-h-20 max-h-32 overflow-auto">
                    {((guidance as any)?.milestoneTitles && (guidance as any).milestoneTitles.length > 0) ? (
                      <ul className="list-disc list-inside text-primary space-y-1">
                        {(guidance as any).milestoneTitles.map((title: string) => (
                          <li key={title}>{title}</li>
                        ))}
                      </ul>
                    ) : (guidance as any)?.milestone?.title ? (
                      <div className="font-medium text-primary">
                        {(guidance as any).milestone.title}
                      </div>
                    ) : (guidance as any)?.milestoneIds && (guidance as any).milestoneIds.length > 0 ? (
                      <ul className="list-disc list-inside text-primary space-y-1">
                        {(guidance as any).milestoneIds.map((id: string) => (
                          <li key={id}>Milestone ID: {id}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-muted-foreground">Tidak ada milestone terlampir</div>
                    )}
                  </div>
                </div>

                {/* Dokumen */}
                {fileName && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">File Thesis</Label>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      <FileTextIcon className="size-5 text-muted-foreground shrink-0" />
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

                {/* Link Dokumen Pembahasan (if exists) */}
                {(guidance as any)?.documentUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Link Dokumen Pembahasan</Label>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                      <a 
                        href={(guidance as any).documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {(guidance as any).documentUrl}
                      </a>
                      <div className="text-xs text-muted-foreground mt-1">Google Docs, Overleaf, Notion, dll</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'approve' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                ℹ️ Anda akan menyetujui permintaan bimbingan dari{' '}
                <strong>{toTitleCaseName((guidance as any)?.studentName || '-')}</strong>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="resize-none"
                  />
                </div>
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
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Mahasiswa akan menerima notifikasi dengan alasan ini
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="shrink-0 border-t pt-4">
          {mode === 'view' && canApproveReject && (
            <div className="flex justify-end gap-2">
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

          {mode === 'approve' && (
            <div className="flex justify-end gap-2">
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
          )}

          {mode === 'reject' && (
            <div className="flex justify-end gap-2">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
