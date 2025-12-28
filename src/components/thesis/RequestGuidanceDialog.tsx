import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Spinner } from "@/components/ui/spinner";
import { ComboBox } from "@/components/ui/combobox";
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
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([]);
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
        milestoneIds: selectedMilestoneIds.length ? selectedMilestoneIds : undefined,
      });
    },
    onSuccess: (res) => {
      const whenFmt = res?.guidance?.requestedDateFormatted || res?.guidance?.approvedDateFormatted;
      const msg = whenFmt ? `Pengajuan bimbingan terkirim • ${whenFmt}` : "Pengajuan bimbingan terkirim";
      toast.success(msg, { id: "guidance-requested" });
      onOpenChange(false);
      setWhen(null); setNote(""); setMeetingUrl(""); setDocumentUrl(""); setSupervisorId(""); setSelectedMilestoneIds([]); setFile(null);
      onSubmitted?.();
    },
    onError: (e: unknown) => toast.error((e as Error)?.message || "Gagal mengajukan bimbingan"),
  });

  const supervisorOptions = [{ label: "Pilih otomatis", value: "" }, ...supervisors.map((s) => ({ label: s.name || s.id, value: s.id }))];
  
  // Filter milestones - only show not completed milestones
  const activeMilestones = milestones.filter((m) => m.status !== "completed");
  
  // Check if there are milestones with active work (in_progress, revision_needed)
  const milestonesWithProgress = milestones.filter(
    (m) => m.status === "in_progress" || m.status === "revision_needed"
  );
  
  // Must have milestones and either active progress or select a milestone
  const hasNoMilestones = milestones.length === 0;
  const needsMilestoneSelection = milestonesWithProgress.length === 0 && activeMilestones.length > 0;
  
  // Disable submit if no milestones or no active progress and no milestone selected
  const canSubmit = !hasNoMilestones && (!needsMilestoneSelection || selectedMilestoneIds.length > 0);

  const toggleMilestone = (id: string) => {
    setSelectedMilestoneIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw]! max-w-none! flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Ajukan Bimbingan</DialogTitle>
        </DialogHeader>
        
        {/* Alert if no milestones - full width */}
        {hasNoMilestones && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda belum memiliki milestone. Buat milestone terlebih dahulu di tab <strong>Milestone</strong> sebelum mengajukan bimbingan.
            </AlertDescription>
          </Alert>
        )}

        {/* Info if needs milestone selection - full width */}
        {!hasNoMilestones && needsMilestoneSelection && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tidak ada milestone yang sedang dikerjakan. Pilih milestone yang akan dibahas untuk melanjutkan.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-x-10 gap-y-4 md:grid-cols-2 flex-1">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Waktu Bimbingan</Label>
              <DateTimePicker value={when} onChange={setWhen} min={minDate} disabled={hasNoMilestones} />
              <p className="text-xs text-muted-foreground">Pembimbing akan dipilih otomatis oleh sistem bila tidak dipilih.</p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Pilih Pembimbing (opsional)</Label>
              <ComboBox items={supervisorOptions} defaultValue={supervisorId} onChange={setSupervisorId} width="w-full" disabled={hasNoMilestones} />
            </div>
            
            {activeMilestones.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Milestone yang Dibahas
                  {needsMilestoneSelection && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="space-y-1 rounded-lg border p-3 max-h-36 overflow-auto">
                  {activeMilestones.map((m) => (
                    <label key={m.id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/50 py-1 px-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-primary"
                        checked={selectedMilestoneIds.includes(m.id)}
                        onChange={() => toggleMilestone(m.id)}
                      />
                      <span className="flex-1">
                        <span className="font-medium">{m.title}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {m.status === "in_progress"
                            ? "(Sedang dikerjakan)"
                            : m.status === "revision_needed"
                              ? "(Perlu revisi)"
                              : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {needsMilestoneSelection 
                    ? "Wajib pilih milestone karena tidak ada yang sedang aktif dikerjakan."
                    : "Pilih milestone yang akan dibahas dalam bimbingan ini."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Catatan / Agenda</Label>
              <Textarea 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="Tuliskan agenda atau hal yang ingin dibahas..."
                rows={3}
                disabled={hasNoMilestones}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Link Dokumen (opsional)</Label>
              <Input
                placeholder="https://docs.google.com/..."
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                disabled={hasNoMilestones}
              />
              <p className="text-xs text-muted-foreground">Link ke dokumen (Google Docs, Overleaf, Notion)</p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Meeting URL (opsional)</Label>
              <Input
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                disabled={hasNoMilestones}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">File Thesis</Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={hasNoMilestones}
              />
              <p className="text-xs text-muted-foreground">Format: PDF saja. Maks 50MB.</p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi - full width */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>
            Batal
          </Button>
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !canSubmit}>
            {submitMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Mengirim...
              </>
            ) : (
              'Kirim'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
