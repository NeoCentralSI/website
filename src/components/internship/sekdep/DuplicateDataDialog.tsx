import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DuplicateDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDuplicate: (fromYearId: string) => Promise<void>;
    academicYears: any[];
    currentYearId: string;
    title: string;
    description: string;
    targetName: string;
}

export function DuplicateDataDialog({
    open,
    onOpenChange,
    onDuplicate,
    academicYears,
    currentYearId,
    title,
    description,
    targetName
}: DuplicateDataDialogProps) {
    const [sourceYearId, setSourceYearId] = useState<string>('');
    const [isPending, setIsPending] = useState(false);

    const availableYears = academicYears.filter(ay => ay.id !== currentYearId);

    const handleDuplicate = async () => {
        if (!sourceYearId) {
            toast.error("Silakan pilih tahun ajaran asal");
            return;
        }

        setIsPending(true);
        try {
            await onDuplicate(sourceYearId);
            toast.success(`Data ${targetName} berhasil diduplikasi`);
            onOpenChange(false);
            setSourceYearId('');
        } catch (error: any) {
            toast.error(error.message || `Gagal menduplikasi data ${targetName}`);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-width-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="size-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="sourceYear">Duplikat dari Tahun Ajaran</Label>
                        <Select value={sourceYearId} onValueChange={setSourceYearId}>
                            <SelectTrigger id="sourceYear">
                                <SelectValue placeholder="Pilih tahun ajaran asal..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.length === 0 ? (
                                    <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                                        Tidak ada tahun ajaran lain tersedia
                                    </div>
                                ) : (
                                    availableYears.map((ay) => (
                                        <SelectItem key={ay.id} value={ay.id}>
                                            {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'} {ay.isActive ? '(Aktif)' : ''}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground italic">
                            Data akan disalin ke tahun ajaran yang sedang aktif di filter saat ini.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Batal
                    </Button>
                    <Button onClick={handleDuplicate} disabled={isPending || !sourceYearId}>
                        {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Copy className="size-4 mr-1" />}
                        Duplikat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
