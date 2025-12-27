import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import type {
  Milestone,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "@/types/milestone.types";

interface MilestoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone | null;
  onSubmit: (data: CreateMilestoneDto | UpdateMilestoneDto) => void;
  isSubmitting?: boolean;
}

export function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
  onSubmit,
  isSubmitting,
}: MilestoneFormDialogProps) {
  const isEdit = !!milestone;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  // Reset form when dialog opens/closes or milestone changes
  useEffect(() => {
    if (open && milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setTargetDate(milestone.targetDate ? new Date(milestone.targetDate) : undefined);
    } else if (open && !milestone) {
      setTitle("");
      setDescription("");
      setTargetDate(undefined);
    }
  }, [open, milestone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (isEdit) {
      const updateData: UpdateMilestoneDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate?.toISOString(),
      };
      onSubmit(updateData);
    } else {
      const createData: CreateMilestoneDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate?.toISOString(),
        orderIndex: 0,
      };
      onSubmit(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Milestone" : "Tambah Milestone Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Judul <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengumpulan Data"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan apa yang akan dicapai pada milestone ini..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate
                    ? format(targetDate, "PPP", { locale: localeId })
                    : "Pilih tanggal target"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  initialFocus
                  locale={localeId}
                />
              </PopoverContent>
            </Popover>
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
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
