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
import { Spinner } from '@/components/ui/spinner';
import type {
    AssessmentCriteria,
    CreateCriteriaPayload,
    UpdateCriteriaPayload,
    DefenceRole,
} from '@/services/master-data/defence-rubric.service';

interface DefenceCriteriaFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cpmkId: string;
    cpmkCode: string;
    role: DefenceRole;
    editData?: AssessmentCriteria | null;
    remainingScore?: number;
    onSubmit:
        | ((data: CreateCriteriaPayload) => Promise<unknown>)
        | ((data: UpdateCriteriaPayload) => Promise<unknown>);
}

const ROLE_LABEL: Record<DefenceRole, string> = {
    examiner: 'Penguji',
    supervisor: 'Pembimbing',
};

export function DefenceCriteriaFormDialog({
    open,
    onOpenChange,
    cpmkId,
    cpmkCode,
    role,
    editData,
    remainingScore,
    onSubmit,
}: DefenceCriteriaFormDialogProps) {
    const [name, setName] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!editData;
    const isMaxScoreLocked = Boolean(isEdit && editData?.hasAssessmentDetails);

    useEffect(() => {
        if (editData) {
            setName(editData.name || '');
            setMaxScore(editData.maxScore?.toString() || '');
        } else {
            setName('');
            setMaxScore('');
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEdit) {
                const payload: UpdateCriteriaPayload = {
                    ...(name.trim() ? { name: name.trim() } : {}),
                    ...(isMaxScoreLocked ? {} : { maxScore: parseInt(maxScore, 10) }),
                };
                await (onSubmit as (data: UpdateCriteriaPayload) => Promise<unknown>)(payload);
            } else {
                const payload = {
                    ...(name.trim() ? { name: name.trim() } : {}),
                    maxScore: parseInt(maxScore, 10),
                };
                await (onSubmit as (data: CreateCriteriaPayload) => Promise<unknown>)({
                    ...payload,
                    cpmkId,
                    role,
                });
            }
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const parsed = parseInt(maxScore, 10);
    const effectiveMax = remainingScore != null ? remainingScore : 100;
    const isValid =
        isMaxScoreLocked
            ? true
            : (maxScore.trim() &&
                !isNaN(parsed) &&
                parsed >= 1);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Kriteria Sidang' : 'Tambah Kriteria Sidang'}
                        {' '}({ROLE_LABEL[role]})
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-md bg-muted/50 border px-3 py-2 text-sm">
                        <span className="font-semibold">{cpmkCode}</span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="criteriaName">Nama Kriteria</Label>
                        <Input
                            id="criteriaName"
                            placeholder="Contoh: Kemampuan Analisis"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Opsional. Biarkan kosong jika tidak diperlukan.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="criteriaMaxScore">
                            Skor Maksimal <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="criteriaMaxScore"
                            type="number"
                            placeholder="Contoh: 10"
                            min={1}
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            required
                            autoFocus
                            disabled={isMaxScoreLocked}
                        />
                        <p className="text-xs text-muted-foreground">
                            {remainingScore != null
                                ? `Sisa skor tersedia: ${remainingScore} dari 100 (gabungan penguji & pembimbing)`
                                : 'Skor maksimal untuk rentang rubrik di kriteria ini.'
                            }
                        </p>
                        {isMaxScoreLocked && (
                            <p className="text-xs text-amber-700">
                                Skor maksimal terkunci karena kriteria ini sudah memiliki detail penilaian.
                            </p>
                        )}
                        {maxScore.trim() && !isNaN(parsed) && parsed > effectiveMax && (
                            <p className="text-xs text-amber-700">
                                Skor ({parsed}) melebihi sisa indikator ({effectiveMax}). Ini hanya peringatan.
                            </p>
                        )}
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
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menyimpan...
                                </>
                            ) : (
                                isEdit ? 'Simpan Perubahan' : 'Tambah Kriteria'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
