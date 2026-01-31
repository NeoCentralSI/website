import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Spinner } from "@/components/ui/spinner";
import { ComboBox } from "@/components/ui/combobox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings2 } from "lucide-react";
import type { SupervisorBusySlot, SupervisorsResponse } from "@/services/studentGuidance.service";
import { getSupervisorAvailability, requestStudentGuidance } from "@/services/studentGuidance.service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Milestone } from "@/types/milestone.types";

const DURATION_OPTIONS = [
  { value: '30', label: '30 menit' },
  { value: '60', label: '1 jam' },
  { value: '90', label: '1 jam 30 menit' },
  { value: '120', label: '2 jam' },
];

export type RequestGuidanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisors?: SupervisorsResponse["supervisors"];
  milestones?: Milestone[];
  onSubmitted?: () => void;
};

export default function RequestGuidanceDialog({ open, onOpenChange, supervisors = [], milestones = [], onSubmitted }: RequestGuidanceDialogProps) {
  const [when, setWhen] = useState<Date | null>(null);
  const [duration, setDuration] = useState('60');
  const [note, setNote] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busySlots, setBusySlots] = useState<SupervisorBusySlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const minDate = new Date(Date.now() + 60 * 1000);
  const durationMinutes = parseInt(duration, 10);

  const resolvedSupervisorId = useMemo(() => supervisorId || supervisors[0]?.id || "", [supervisorId, supervisors]);

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  const addMinutes = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!when || !resolvedSupervisorId) {
        setBusySlots([]);
        setSlotConflict(null);
        return;
      }
      setCheckingAvailability(true);
      setAvailabilityError(null);
      try {
        const res = await getSupervisorAvailability(resolvedSupervisorId, {
          start: startOfDay(when).toISOString(),
          end: endOfDay(when).toISOString(),
        });
        setBusySlots(res.busySlots || []);

        const selectedStart = when;
        const selectedEnd = addMinutes(when, durationMinutes);
        const conflict = res.busySlots?.find((slot) => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return selectedStart < slotEnd && selectedEnd > slotStart;
        });
        if (conflict) {
          const label = conflict.studentName ? `dengan ${conflict.studentName}` : "dengan mahasiswa lain";
          const range = `${new Date(conflict.start).toLocaleString("id-ID")} - ${new Date(conflict.end).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
          setSlotConflict(`Jadwal bentrok ${label} pada ${range}. Pilih waktu lain.`);
        } else {
          setSlotConflict(null);
        }
      } catch (err) {
        setAvailabilityError((err as Error)?.message || "Gagal memuat jadwal dosen");
        setSlotConflict(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [when, resolvedSupervisorId, durationMinutes]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!when) throw new Error("Pilih tanggal dan waktu");
      if (slotConflict) throw new Error(slotConflict);
      const selected = when.getTime() < minDate.getTime() ? minDate : when;
      return requestStudentGuidance({
        guidanceDate: selected.toISOString(),
        studentNotes: note || undefined,
        file: file ?? undefined,
        documentUrl: documentUrl || undefined,
        supervisorId: resolvedSupervisorId || undefined,
        milestoneIds: selectedMilestoneIds.length ? selectedMilestoneIds : undefined,
      });
    },
    onSuccess: (res) => {
      const whenFmt = res?.guidance?.requestedDateFormatted || res?.guidance?.approvedDateFormatted;
      const msg = whenFmt ? `Pengajuan bimbingan terkirim • ${whenFmt}` : "Pengajuan bimbingan terkirim";
      toast.success(msg, { id: "guidance-requested" });
      onOpenChange(false);
      resetForm();
      onSubmitted?.();
    },
    onError: (e: unknown) => toast.error((e as Error)?.message || "Gagal mengajukan bimbingan"),
  });

  const resetForm = () => {
    setWhen(null);
    setDuration('60');
    setNote("");
    setDocumentUrl("");
    setSupervisorId("");
    setSelectedMilestoneIds([]);
    setFile(null);
    setShowAdvanced(false);
  };

  const supervisorOptions = [
    { label: "Pilih otomatis (Pembimbing 1)", value: "" },
    ...supervisors.map((s) => ({ label: s.name || s.id, value: s.id }))
  ];
  
  const activeMilestones = milestones.filter((m) => m.status !== "completed");
  
  const canSubmit = !!when && !slotConflict && !checkingAvailability;

  const toggleMilestone = (id: string) => {
    setSelectedMilestoneIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Ajukan Bimbingan</DialogTitle>
          <DialogDescription>
            Pilih waktu bimbingan dan tulis agenda yang ingin dibahas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Required: Date/Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Kapan? <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker 
              value={when} 
              onChange={setWhen} 
              min={minDate}
              busySlots={busySlots}
              duration={durationMinutes}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Durasi</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih durasi" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fixed height area for messages */}
          <div className="min-h-6">
            {checkingAvailability && (
              <p className="text-xs text-muted-foreground">Memeriksa jadwal...</p>
            )}
            {availabilityError && (
              <p className="text-xs text-destructive">{availabilityError}</p>
            )}
            {slotConflict && (
              <p className="text-xs text-destructive font-medium">{slotConflict}</p>
            )}
          </div>

          {/* Optional: Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Apa yang ingin dibahas?</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Contoh: Review Bab 3, diskusi metodologi, dll..."
              rows={3}
            />
          </div>

          {/* Optional: File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Unggah file thesis (opsional)</Label>
            <Input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              {file ? `File: ${file.name}` : "Kosongkan jika file sama dengan sebelumnya"}
            </p>
          </div>

          {/* Advanced Options - Collapsed by default */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Opsi Lanjutan
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Supervisor Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pilih Pembimbing</Label>
                <ComboBox 
                  items={supervisorOptions} 
                  defaultValue={supervisorId} 
                  onChange={setSupervisorId} 
                  width="w-full"
                />
              </div>
              
              {/* Milestone Selection */}
              {activeMilestones.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Milestone yang Dibahas</Label>
                  <div className="space-y-1 rounded-lg border p-3 max-h-32 overflow-auto">
                    {activeMilestones.map((m) => (
                      <label key={m.id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/50 py-1 px-1 rounded">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-primary"
                          checked={selectedMilestoneIds.includes(m.id)}
                          onChange={() => toggleMilestone(m.id)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{m.title}</span>
                          {m.status === "in_progress" && (
                            <span className="ml-1 text-xs text-muted-foreground">(Sedang dikerjakan)</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Document URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Link Dokumen Online</Label>
                <Input
                  placeholder="https://docs.google.com/..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
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
              'Ajukan Bimbingan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
