import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { GuidanceItem } from "@/services/studentGuidance.service";
import {
  getStudentGuidanceDetail,
  rescheduleStudentGuidance,
  cancelStudentGuidance,
  updateStudentGuidanceNotes,
} from "@/services/studentGuidance.service";
import { toast } from "sonner";

export default function GuidanceDetailPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { guidanceId } = useParams();
  const navigate = useNavigate();
  const [guidance, setGuidance] = useState<GuidanceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [openNotes, setOpenNotes] = useState(false);

  const [reschedule, setReschedule] = useState({ guidanceDate: "", studentNotes: "" });
  const [cancel, setCancel] = useState({ reason: "" });
  const [notes, setNotes] = useState({ studentNotes: "" });

  const breadcrumb = useMemo(() => [
    { label: "Tugas Akhir" },
    { label: "Bimbingan", href: "/tugas-akhir/bimbingan" },
    { label: "Detail" },
  ], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const load = async () => {
    if (!guidanceId) return;
    setIsLoading(true);
    try {
  const data = await getStudentGuidanceDetail(guidanceId);
      setGuidance(data.guidance);
  setNotes({ studentNotes: data.guidance.notes ?? "" });
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat detail");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidanceId]);

  const doReschedule = async () => {
    if (!guidanceId || !reschedule.guidanceDate) {
      toast.error("Pilih waktu baru");
      return;
    }
    try {
      await rescheduleStudentGuidance(guidanceId, reschedule);
      toast.success("Jadwal diperbarui", { id: "guidance-rescheduled" });
      setOpenReschedule(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menjadwalkan ulang");
    }
  };

  const doCancel = async () => {
    if (!guidanceId) return;
    try {
      await cancelStudentGuidance(guidanceId, cancel);
      toast.success("Bimbingan dibatalkan", { id: "guidance-cancelled" });
      setOpenCancel(false);
      navigate("/tugas-akhir/bimbingan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal membatalkan");
    }
  };

  const doUpdateNotes = async () => {
    if (!guidanceId) return;
    try {
  await updateStudentGuidanceNotes(guidanceId, notes);
      toast.success("Catatan diperbarui", { id: "guidance-notes-updated" });
      setOpenNotes(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui catatan");
    }
  };

  return (
      <div className="p-4">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">Kembali</Button>
        <Card className="p-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat...</div>
          ) : guidance ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pembimbing</div>
                  <div className="font-medium">{guidance.supervisorName || guidance.supervisorId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{guidance.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Terjadwal</div>
                  <div className="font-medium">{guidance.schedule?.guidanceDateFormatted || guidance.scheduledAtFormatted || (guidance.scheduledAt ? new Date(guidance.scheduledAt).toLocaleString() : '-')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Lokasi</div>
                  <div className="font-medium">{guidance.location || '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Catatan</div>
                <div className="text-sm whitespace-pre-wrap">{guidance.notes || '-'}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <Dialog open={openReschedule} onOpenChange={setOpenReschedule}>
                  <DialogTrigger asChild>
                    <Button>Reschedule</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reschedule Bimbingan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Waktu Baru</Label>
                        <Input type="datetime-local" value={reschedule.guidanceDate} onChange={(e) => setReschedule((s) => ({ ...s, guidanceDate: e.target.value }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Alasan (opsional)</Label>
                        <Input value={reschedule.studentNotes} onChange={(e) => setReschedule((s) => ({ ...s, studentNotes: e.target.value }))} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setOpenReschedule(false)}>Batal</Button>
                        <Button onClick={doReschedule}>Simpan</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={openCancel} onOpenChange={setOpenCancel}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Batalkan</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Batalkan Bimbingan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Alasan</Label>
                        <Input value={cancel.reason} onChange={(e) => setCancel({ reason: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setOpenCancel(false)}>Tutup</Button>
                        <Button variant="destructive" onClick={doCancel}>Konfirmasi</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={openNotes} onOpenChange={setOpenNotes}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">Perbarui Catatan</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Perbarui Catatan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Catatan</Label>
                        <Input value={notes.studentNotes} onChange={(e) => setNotes({ studentNotes: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setOpenNotes(false)}>Batal</Button>
                        <Button onClick={doUpdateNotes}>Simpan</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Data tidak ditemukan</div>
          )}
        </Card>
      </div>
  );
}
