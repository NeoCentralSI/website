import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MinimumScoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentScore: number;
    onSubmit: (score: number) => void;
    isLoading?: boolean;
}

export function MinimumScoreDialog({
    open,
    onOpenChange,
    currentScore,
    onSubmit,
    isLoading,
}: MinimumScoreDialogProps) {
    const [score, setScore] = useState<number | ''>(currentScore);

    useEffect(() => {
        if (open) {
            setScore(currentScore);
        }
    }, [open, currentScore]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (score === '' || isNaN(Number(score))) return;
        onSubmit(Number(score));
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Pengaturan Skor Minimum Lulus</DialogTitle>
                        <DialogDescription>
                            Tentukan batas skor minimum yang harus dicapai mahasiswa agar dinyatakan lulus.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="minScore">Skor Minimum (0-100)</Label>
                            <Input
                                id="minScore"
                                type="number"
                                min={0}
                                max={100}
                                value={score}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setScore(val === '' ? '' : Number(val));
                                }}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
