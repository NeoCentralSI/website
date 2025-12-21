import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { ComboBox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import type { SupervisorsResponse } from "@/services/studentGuidance.service";
import { requestStudentGuidance } from "@/services/studentGuidance.service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export type RequestGuidanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisors?: SupervisorsResponse["supervisors"];
  onSubmitted?: () => void;
};

export default function RequestGuidanceDialog({ open, onOpenChange, supervisors = [], onSubmitted }: RequestGuidanceDialogProps) {
  const [when, setWhen] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  // Prevent borderline server-side validation by enforcing a small future window on the picker
  const minDate = new Date(Date.now() + 60 * 1000); // >= 1 minute from now

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!when) throw new Error("Pilih tanggal dan waktu");
      if (!file) throw new Error("Unggah file thesis (PDF)");
      // ensure the date is not behind server tolerance; bump to minDate if needed
      const selected = when.getTime() < minDate.getTime() ? minDate : when;
      return requestStudentGuidance({
        guidanceDate: selected.toISOString(),
        studentNotes: note || undefined,
        file: file,
        meetingUrl: meetingUrl || undefined,
        supervisorId: supervisorId || undefined,
      });
    },
    onSuccess: (res) => {
      const whenFmt = res?.guidance?.requestedDateFormatted || res?.guidance?.approvedDateFormatted;
      const msg = whenFmt ? `Pengajuan bimbingan terkirim • ${whenFmt}` : "Pengajuan bimbingan terkirim";
      toast.success(msg, { id: "guidance-requested" });
      onOpenChange(false);
      setWhen(null); setNote(""); setMeetingUrl(""); setSupervisorId(""); setFile(null);
      onSubmitted?.();
    },
    onError: (e: any) => toast.error(e?.message || "Gagal mengajukan bimbingan"),
  });

  const supervisorOptions = [{ label: "Pilih otomatis", value: "" }, ...supervisors.map((s) => ({ label: s.name || s.id, value: s.id }))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajukan Bimbingan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Waktu Bimbingan</Label>
              <DateTimePicker value={when} onChange={setWhen} min={minDate} />
            <span className="text-xs text-muted-foreground">Pembimbing akan dipilih otomatis oleh sistem bila tidak dipilih.</span>
          </div>
          <div className="grid gap-2">
            <Label>Pilih Pembimbing (opsional)</Label>
            <ComboBox items={supervisorOptions} defaultValue={supervisorId} onChange={setSupervisorId} width="w-full" />
          </div>
          <div className="grid gap-2">
            <Label>Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Meeting URL (opsional)</Label>
            <Input
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>File Thesis</Label>
            <Input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="text-xs text-muted-foreground">Format yang didukung: PDF saja. Maks 50MB.</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>Batal</Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Mengirim...
                </>
              ) : (
                'Kirim'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
