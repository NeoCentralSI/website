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
import { Loader2, MessageSquare } from "lucide-react";
import type { Milestone } from "@/types/milestone.types";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone | null;
  isSubmitting?: boolean;
  onSubmit: (notes: string) => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  milestone,
  isSubmitting,
  onSubmit,
}: FeedbackDialogProps) {
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim()) {
      onSubmit(notes.trim());
    }
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Tambah Feedback
          </DialogTitle>
          <DialogDescription>
            Berikan feedback atau catatan untuk milestone "{milestone.title}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis feedback atau saran untuk mahasiswa..."
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Feedback akan terlihat oleh mahasiswa sebagai catatan pembimbing.
            </p>
          </div>

          {/* Previous notes if any */}
          {milestone.supervisorNotes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Catatan Sebelumnya</Label>
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {milestone.supervisorNotes}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !notes.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <MessageSquare className="mr-2 h-4 w-4" />
              Kirim Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
