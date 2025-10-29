import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [notes, setNotes] = useState("\n");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const canAct = guidance && guidance.status !== "cancelled";

  const load = async () => {
    if (!guidanceId || !open) return;
    setLoading(true);
    try {
  const data = await getStudentGuidanceDetail(guidanceId);
  setGuidance(data.guidance);
  setNotes(data.guidance.notes ?? "");
  const iso = data.guidance.schedule?.guidanceDate || data.guidance.scheduledAt || "";
  setRescheduleDate(iso ? iso.slice(0, 16) : "");
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

  const doUpdateNotes = async () => {
    if (!guidanceId) return;
    try {
      await updateStudentGuidanceNotes(guidanceId, { studentNotes: notes });
      toast.success("Catatan diperbarui", { id: "guidance-notes-updated" });
      onUpdated?.();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui catatan");
    }
  };

  const doReschedule = async () => {
    if (!guidanceId || !rescheduleDate) {
      toast.error("Isi jadwal baru");
      return;
    }
    try {
      await rescheduleStudentGuidance(guidanceId, { guidanceDate: rescheduleDate, studentNotes: rescheduleNotes || undefined });
      toast.success("Jadwal diperbarui", { id: "guidance-rescheduled" });
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menjadwalkan ulang");
    }
  };

  const doCancel = async () => {
    if (!guidanceId) return;
    try {
      await cancelStudentGuidance(guidanceId, { reason: cancelReason || undefined });
      toast.success("Bimbingan dibatalkan", { id: "guidance-cancelled" });
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal membatalkan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Bimbingan</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat...</div>
        ) : guidance ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Pembimbing</div>
                <div className="font-medium">{guidance.supervisorName || guidance.supervisorId}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{guidance.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Terjadwal</div>
                <div className="font-medium">{guidance.schedule?.guidanceDateFormatted || guidance.scheduledAtFormatted || (guidance.scheduledAt ? new Date(guidance.scheduledAt).toLocaleString() : '-')}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lokasi</div>
                <div className="font-medium">{guidance.location || '-'}</div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tambahkan catatan..." />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={doUpdateNotes} disabled={!canAct}>Simpan Catatan</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Reschedule</Label>
                <Input type="datetime-local" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
                <Input placeholder="Catatan (opsional)" value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)} />
                <div className="flex justify-end">
                  <Button size="sm" onClick={doReschedule} disabled={!canAct}>Simpan Jadwal</Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Batalkan Bimbingan</Label>
                <Input placeholder="Alasan (opsional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <div className="flex justify-end">
                  <Button size="sm" variant="destructive" onClick={doCancel} disabled={!canAct}>Batalkan</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Data tidak ditemukan</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
