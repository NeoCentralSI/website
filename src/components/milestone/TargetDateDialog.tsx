import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";

interface TargetDateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    milestoneTitle: string;
    onSubmit: (date: Date) => void;
    isSubmitting?: boolean;
}

export function TargetDateDialog({
    open,
    onOpenChange,
    milestoneTitle,
    onSubmit,
    isSubmitting = false,
}: TargetDateDialogProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);

    // Reset form when opened
    useEffect(() => {
        if (open) {
            setDate(undefined);
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date) {
            onSubmit(date);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tentukan Target Tanggal</DialogTitle>
                    <DialogDescription>
                        Silakan tentukan target tanggal selesai untuk milestone <strong>{milestoneTitle}</strong> sebelum mulai mengerjakan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetDate" className="text-sm font-medium">Target Tanggal Selesai <span className="text-destructive">*</span></Label>
                        <DatePicker
                            value={date}
                            onChange={setDate}
                            placeholder="Pilih target tanggal"
                            disabled={isSubmitting}
                        />
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
                        <Button type="submit" disabled={!date || isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Memproses...
                                </>
                            ) : (
                                "Simpan & Mulai"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
