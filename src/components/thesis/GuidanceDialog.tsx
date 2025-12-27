import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Spinner } from "@/components/ui/spinner";
import type { GuidanceItem } from "@/services/studentGuidance.service";
import {
  getStudentGuidanceDetail,
  rescheduleStudentGuidance,
  cancelStudentGuidance,
  updateStudentGuidanceNotes,
} from "@/services/studentGuidance.service";
import { toast } from "sonner";

type Props = {
  guidanceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void; // refresh list after actions
};

export default function GuidanceDialog({ guidanceId, open, onOpenChange, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<GuidanceItem | null>(null);
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Can only edit/reschedule if status is "requested" (not accepted or rejected)
  const canEdit = guidance && guidance.status === "requested";
  // Can only cancel (delete) if status is "requested"
  const canCancel = guidance && guidance.status === "requested";

  const load = async () => {
    if (!guidanceId || !open) return;
    setLoading(true);
    try {
      const data = await getStudentGuidanceDetail(guidanceId);
      setGuidance(data.guidance);
      setNotes(data.guidance.notes ?? "");
      const iso = data.guidance.approvedDate || data.guidance.requestedDate || "";
      setRescheduleDate(iso ? new Date(iso) : null);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidanceId, open]);

  const handleUpdate = async () => {
    if (!guidanceId) return;
    setIsSubmitting(true);
    
    try {
      // Update notes
      await updateStudentGuidanceNotes(guidanceId, { studentNotes: notes });
      
      // If reschedule date changed, update it
      const originalDate = guidance?.approvedDate || guidance?.requestedDate;
      const hasDateChanged = rescheduleDate && originalDate && 
        new Date(rescheduleDate).getTime() !== new Date(originalDate).getTime();
      
      if (hasDateChanged && rescheduleDate) {
        await rescheduleStudentGuidance(guidanceId, { 
          guidanceDate: rescheduleDate.toISOString(),
        });
        toast.success("Bimbingan berhasil diperbarui", { id: "guidance-updated" });
      } else {
        toast.success("Catatan diperbarui", { id: "guidance-notes-updated" });
      }
      
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!guidanceId) return;
    setIsCancelling(true);
    
    try {
      await cancelStudentGuidance(guidanceId, { reason: "Dibatalkan oleh mahasiswa" });
      toast.success("Permintaan bimbingan dihapus", { id: "guidance-deleted" });
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus permintaan");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Bimbingan</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : guidance ? (
          <div className="space-y-6">
            {/* Info Section */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Pembimbing</div>
                <div className="font-medium">{guidance.supervisorName || guidance.supervisorId}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="font-medium capitalize">{guidance.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Terjadwal</div>
                <div className="font-medium text-sm">{guidance.approvedDateFormatted || guidance.requestedDateFormatted || (guidance.requestedDate ? new Date(guidance.requestedDate).toLocaleString() : '-')}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Lokasi</div>
                <div className="font-medium">{guidance.location || '-'}</div>
              </div>
              {guidance.milestoneTitles && guidance.milestoneTitles.length > 0 && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Milestone yang dibahas</div>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {guidance.milestoneTitles.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Edit Section */}
            <div className="space-y-4">
              {guidance.status === "accepted" && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                  ℹ️ Bimbingan sudah disetujui. Jadwal dan catatan tidak dapat diubah.
                </div>
              )}
              
              {guidance.status === "rejected" && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  ℹ️ Bimbingan ditolak. Tidak dapat melakukan perubahan.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reschedule-date">Reschedule</Label>
                <DateTimePicker 
                  value={rescheduleDate} 
                  onChange={setRescheduleDate}
                  disabled={!canEdit}
                  placeholder="Pilih jadwal baru"
                />
                {!canEdit && guidance.status === "requested" && (
                  <p className="text-xs text-muted-foreground">Jadwal dapat diubah saat status masih "Menunggu"</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea 
                  id="notes"
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Tambahkan catatan..."
                  disabled={!canEdit}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {canCancel && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancel}
                  disabled={isCancelling || isSubmitting}
                >
                  {isCancelling ? (
                    <>
                      <Spinner className="mr-2" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Permintaan'
                  )}
                </Button>
              )}
              <Button 
                onClick={handleUpdate} 
                disabled={!canEdit || isSubmitting || isCancelling}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Data tidak ditemukan</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
