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
import type {
    AssessmentRubric,
    CreateRubricPayload,
    UpdateRubricPayload,
} from '@/services/master-data/defence-rubric.service';

interface DefenceRubricItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    criteriaMaxScore: number | null;
    editData?: AssessmentRubric | null;
    onSubmit:
        | ((data: CreateRubricPayload) => Promise<unknown>)
        | ((data: UpdateRubricPayload) => Promise<unknown>);
}

export function DefenceRubricItemFormDialog({
    open,
    onOpenChange,
    criteriaMaxScore,
    editData,
    onSubmit,
}: DefenceRubricItemFormDialogProps) {
    const [description, setDescription] = useState('');
    const [minScore, setMinScore] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;

    useEffect(() => {
        if (editData) {
            setDescription(editData.description || '');
            setMinScore(editData.minScore?.toString() || '0');
            setMaxScore(editData.maxScore?.toString() || '0');
        } else {
            setDescription('');
            setMinScore('');
            setMaxScore('');
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: CreateRubricPayload = {
                description,
                minScore: parseInt(minScore, 10),
                maxScore: parseInt(maxScore, 10),
            };
            await (onSubmit as (data: CreateRubricPayload) => Promise<unknown>)(
                payload
            );
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const parsedMin = parseInt(minScore, 10);
    const parsedMax = parseInt(maxScore, 10);

    const minValid = !isNaN(parsedMin) && parsedMin >= 0;
    const maxValid = !isNaN(parsedMax) && parsedMax > 0;
    const rangeValid = minValid && maxValid && parsedMin < parsedMax;
    const withinCriteria =
        criteriaMaxScore == null || !maxValid || parsedMax <= criteriaMaxScore;
    const descriptionValid = description.trim().length > 0 && description.trim().length <= 1000;
    const isValid =
        descriptionValid &&
        minScore.trim() &&
        maxScore.trim() &&
        rangeValid &&
        withinCriteria;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Level Rubrik Sidang' : 'Tambah Level Rubrik Sidang'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {criteriaMaxScore != null && (
                        <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
                            Skor maksimal kriteria: <strong>{criteriaMaxScore}</strong>.
                            Rentang skor rubrik tidak boleh melebihi nilai ini.
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="rubricDescription">
                            Deskripsi <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="rubricDescription"
                            placeholder="Deskripsi level rubrik penilaian..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {description.length}/1000 karakter
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="rubricMinScore">
                                Skor Minimum <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="rubricMinScore"
                                type="number"
                                placeholder="Contoh: 0"
                                min={0}
                                max={criteriaMaxScore ?? undefined}
                                value={minScore}
                                onChange={(e) => setMinScore(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rubricMaxScore">
                                Skor Maksimum <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="rubricMaxScore"
                                type="number"
                                placeholder={criteriaMaxScore ? `Maks: ${criteriaMaxScore}` : 'Contoh: 25'}
                                min={1}
                                max={criteriaMaxScore ?? undefined}
                                value={maxScore}
                                onChange={(e) => setMaxScore(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {maxScore.trim() && maxValid && !withinCriteria && (
                        <p className="text-xs text-destructive">
                            Skor maksimum ({parsedMax}) melebihi skor kriteria ({criteriaMaxScore}).
                        </p>
                    )}
                    {minScore.trim() && maxScore.trim() && minValid && maxValid && !rangeValid && (
                        <p className="text-xs text-destructive">
                            Skor minimum harus lebih kecil dari skor maksimum.
                        </p>
                    )}
                    {description.trim().length > 1000 && (
                        <p className="text-xs text-destructive">
                            Deskripsi maksimal 1000 karakter.
                        </p>
                    )}
                    {!maxScore.trim() && !minScore.trim() && (
                        <p className="text-xs text-muted-foreground">
                            Rentang skor untuk level rubrik ini.
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
                                    {isEdit ? 'Menyimpan...' : 'Menambahkan...'}
                                </>
                            ) : isEdit ? (
                                'Simpan Perubahan'
                            ) : (
                                'Tambah Level'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
