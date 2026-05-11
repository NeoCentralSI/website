import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type { QuickAddRubricPayload } from '@/services/master-data/seminar-rubric.service';

interface QuickAddRubricDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cpmkId: string;
    cpmkCode: string;
    onSubmit: (cpmkId: string, data: QuickAddRubricPayload) => Promise<unknown>;
}

export function QuickAddRubricDialog({
    open,
    onOpenChange,
    cpmkId,
    cpmkCode,
    onSubmit,
}: QuickAddRubricDialogProps) {
    const [criteriaName, setCriteriaName] = useState('');
    const [criteriaMaxScore, setCriteriaMaxScore] = useState('');
    const [description, setDescription] = useState('');
    const [minScore, setMinScore] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setCriteriaName('');
            setCriteriaMaxScore('');
            setDescription('');
            setMinScore('');
            setMaxScore('');
        }
    }, [open]);

    const parsedCriteriaMax = parseInt(criteriaMaxScore, 10);
    const parsedMin = parseInt(minScore, 10);
    const parsedMax = parseInt(maxScore, 10);

    const criteriaMaxValid = !isNaN(parsedCriteriaMax) && parsedCriteriaMax >= 1 && parsedCriteriaMax <= 1000;
    const minValid = !isNaN(parsedMin) && parsedMin >= 0;
    const maxValid = !isNaN(parsedMax) && parsedMax >= 1;
    const rangeValid = minValid && maxValid && parsedMin < parsedMax;
    const withinCriteria = !maxValid || !criteriaMaxValid || parsedMax <= parsedCriteriaMax;

    const isValid =
        criteriaMaxScore.trim() &&
        criteriaMaxValid &&
        description.trim() &&
        minScore.trim() &&
        maxScore.trim() &&
        rangeValid &&
        withinCriteria;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: QuickAddRubricPayload = {
                criteriaMaxScore: parsedCriteriaMax,
                description: description.trim(),
                minScore: parsedMin,
                maxScore: parsedMax,
            };
            if (criteriaName.trim()) {
                payload.criteriaName = criteriaName.trim();
            }
            await onSubmit(cpmkId, payload);
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Rubrik Langsung — {cpmkCode}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Kriteria akan dibuat otomatis di belakang layar. Rubrik baru akan
                        langsung terhubung ke kriteria tersebut.
                    </p>

                    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Informasi Kriteria
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="qaCriteriaName">Nama Kriteria</Label>
                            <Input
                                id="qaCriteriaName"
                                placeholder="Contoh: Kemampuan Analisis (opsional)"
                                value={criteriaName}
                                onChange={(e) => setCriteriaName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qaCriteriaMaxScore">
                                Skor Maksimal Kriteria <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="qaCriteriaMaxScore"
                                type="number"
                                placeholder="Contoh: 25"
                                min={1}
                                max={1000}
                                value={criteriaMaxScore}
                                onChange={(e) => setCriteriaMaxScore(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Detail Rubrik
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="qaDescription">
                                Deskripsi <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="qaDescription"
                                placeholder="Deskripsi level rubrik penilaian..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="qaMinScore">
                                    Skor Minimum <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="qaMinScore"
                                    type="number"
                                    placeholder="0"
                                    min={0}
                                    value={minScore}
                                    onChange={(e) => setMinScore(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qaMaxScore">
                                    Skor Maksimum <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="qaMaxScore"
                                    type="number"
                                    placeholder={criteriaMaxValid ? `Maks: ${parsedCriteriaMax}` : 'Contoh: 25'}
                                    min={1}
                                    max={criteriaMaxValid ? parsedCriteriaMax : undefined}
                                    value={maxScore}
                                    onChange={(e) => setMaxScore(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {maxScore.trim() && maxValid && !withinCriteria && (
                        <p className="text-xs text-destructive">
                            Skor maksimum rubrik ({parsedMax}) melebihi skor maksimal kriteria ({parsedCriteriaMax}).
                        </p>
                    )}
                    {minScore.trim() && maxScore.trim() && minValid && maxValid && !rangeValid && (
                        <p className="text-xs text-destructive">
                            Skor minimum harus lebih kecil dari skor maksimum.
                        </p>
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
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menambahkan...
                                </>
                            ) : (
                                'Tambah Rubrik'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
