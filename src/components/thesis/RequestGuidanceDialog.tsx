import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { ComboBox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import type { SupervisorsResponse } from "@/services/studentGuidance.service";
import { requestStudentGuidance } from "@/services/studentGuidance.service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Milestone } from "@/types/milestone.types";

export type RequestGuidanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisors?: SupervisorsResponse["supervisors"];
  milestones?: Milestone[];
  onSubmitted?: () => void;
};

export default function RequestGuidanceDialog({ open, onOpenChange, supervisors = [], milestones = [], onSubmitted }: RequestGuidanceDialogProps) {
  const [when, setWhen] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
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
        documentUrl: documentUrl || undefined,
        supervisorId: supervisorId || undefined,
        milestoneId: milestoneId || undefined,
      });
    },
    onSuccess: (res) => {
      const whenFmt = res?.guidance?.requestedDateFormatted || res?.guidance?.approvedDateFormatted;
      const msg = whenFmt ? `Pengajuan bimbingan terkirim • ${whenFmt}` : "Pengajuan bimbingan terkirim";
      toast.success(msg, { id: "guidance-requested" });
      onOpenChange(false);
      setWhen(null); setNote(""); setMeetingUrl(""); setDocumentUrl(""); setSupervisorId(""); setMilestoneId(""); setFile(null);
      onSubmitted?.();
    },
    onError: (e: unknown) => toast.error((e as Error)?.message || "Gagal mengajukan bimbingan"),
  });

  const supervisorOptions = [{ label: "Pilih otomatis", value: "" }, ...supervisors.map((s) => ({ label: s.name || s.id, value: s.id }))];
  
  // Filter milestones - only show not completed milestones
  const activeMilestones = milestones.filter((m) => m.status !== "completed");
  
  // Check if there are milestones with active work (in_progress, revision_needed, pending_review)
  const milestonesWithProgress = milestones.filter(
    (m) => m.status === "in_progress" || m.status === "revision_needed" || m.status === "pending_review"
  );
  
  // Must have milestones and either active progress or select a milestone
  const hasNoMilestones = milestones.length === 0;
  const needsMilestoneSelection = milestonesWithProgress.length === 0 && activeMilestones.length > 0;
  
  const milestoneOptions = activeMilestones.map((m) => ({ 
    label: `${m.title}${m.status === "in_progress" ? " (Sedang dikerjakan)" : m.status === "revision_needed" ? " (Perlu revisi)" : ""}`, 
    value: m.id 
  }));

  // Disable submit if no milestones or no active progress and no milestone selected
  const canSubmit = !hasNoMilestones && (!needsMilestoneSelection || milestoneId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajukan Bimbingan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {/* Alert if no milestones */}
          {hasNoMilestones && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Anda belum memiliki milestone. Buat milestone terlebih dahulu di tab <strong>Milestone</strong> sebelum mengajukan bimbingan.
              </AlertDescription>
            </Alert>
          )}

          {/* Info if needs milestone selection */}
          {!hasNoMilestones && needsMilestoneSelection && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Tidak ada milestone yang sedang dikerjakan. Pilih milestone yang akan dibahas untuk melanjutkan.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label>Waktu Bimbingan</Label>
              <DateTimePicker value={when} onChange={setWhen} min={minDate} disabled={hasNoMilestones} />
            <span className="text-xs text-muted-foreground">Pembimbing akan dipilih otomatis oleh sistem bila tidak dipilih.</span>
          </div>
          <div className="grid gap-2">
            <Label>Pilih Pembimbing (opsional)</Label>
            <ComboBox items={supervisorOptions} defaultValue={supervisorId} onChange={setSupervisorId} width="w-full" disabled={hasNoMilestones} />
          </div>
          {activeMilestones.length > 0 && (
            <div className="grid gap-2">
              <Label>
                Milestone yang Dibahas
                {needsMilestoneSelection && <span className="text-destructive ml-1">*</span>}
              </Label>
              <ComboBox 
                items={milestoneOptions} 
                defaultValue={milestoneId} 
                onChange={setMilestoneId} 
                width="w-full"
                placeholder="Pilih milestone..."
              />
              <span className="text-xs text-muted-foreground">
                {needsMilestoneSelection 
                  ? "Wajib pilih milestone karena tidak ada yang sedang aktif dikerjakan."
                  : "Pilih milestone yang akan dibahas dalam bimbingan ini."
                }
              </span>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Catatan / Agenda</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Tuliskan agenda atau hal yang ingin dibahas..."
              rows={2}
              disabled={hasNoMilestones}
            />
          </div>
          <div className="grid gap-2">
            <Label>Link Dokumen (opsional)</Label>
            <Input
              placeholder="https://docs.google.com/... atau https://overleaf.com/..."
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              disabled={hasNoMilestones}
            />
            <span className="text-xs text-muted-foreground">Link ke dokumen yang akan dibahas (Google Docs, Overleaf, Notion, dll)</span>
          </div>
          <div className="grid gap-2">
            <Label>Meeting URL (opsional)</Label>
            <Input
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              disabled={hasNoMilestones}
            />
          </div>
          <div className="grid gap-2">
            <Label>File Thesis</Label>
            <Input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={hasNoMilestones}
            />
            <span className="text-xs text-muted-foreground">Format yang didukung: PDF saja. Maks 50MB.</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>Batal</Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !canSubmit}>
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
