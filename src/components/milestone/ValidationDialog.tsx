import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { Milestone } from "@/types/milestone.types";

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone | null;
  isSubmitting?: boolean;
  onValidate: (data: { isValid: boolean; notes?: string }) => void;
}

export function ValidationDialog({
  open,
  onOpenChange,
  milestone,
  isSubmitting,
  onValidate,
}: ValidationDialogProps) {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onValidate({
      isValid,
      notes: notes.trim() || undefined,
    });
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Validasi Milestone
          </DialogTitle>
          <DialogDescription>
            Validasi milestone "{milestone.title}" yang diajukan oleh mahasiswa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Hasil Validasi</Label>
            <RadioGroup
              value={isValid ? "valid" : "invalid"}
              onValueChange={(val) => setIsValid(val === "valid")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="valid"
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  isValid
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="valid" id="valid" />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Valid</div>
                    <div className="text-xs text-muted-foreground">
                      Milestone selesai
                    </div>
                  </div>
                </div>
              </Label>
              <Label
                htmlFor="invalid"
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  !isValid
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="invalid" id="invalid" />
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Perlu Revisi</div>
                    <div className="text-xs text-muted-foreground">
                      Ada perbaikan
                    </div>
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan {!isValid && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isValid
                  ? "Tambahkan catatan atau feedback (opsional)..."
                  : "Jelaskan apa yang perlu diperbaiki..."
              }
              rows={4}
              required={!isValid}
            />
          </div>

          {/* Progress info */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Progress saat ini:</div>
              <div className="font-medium text-foreground">
                {milestone.progressPercentage}%
              </div>
              <div>Status:</div>
              <div className="font-medium text-foreground">
                Menunggu Review
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isValid && !notes.trim())}
              variant={isValid ? "default" : "secondary"}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isValid ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validasi Selesai
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Minta Revisi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
