import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { AssessmentCriteria, CreateCriteriaPayload, UpdateCriteriaPayload, MetopenRole } from '@/services/rubricMetopen.service';

interface MetopenCriteriaFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cpmkId: string;
    cpmkCode: string;
    role: MetopenRole;
    editData?: AssessmentCriteria | null;
    remainingScore?: number;
    onSubmit:
        | ((data: CreateCriteriaPayload) => Promise<unknown>)
        | ((data: UpdateCriteriaPayload) => Promise<unknown>);
}

const ROLE_LABEL: Record<MetopenRole, string> = {
    supervisor: 'Pembimbing (TA-03A)',
    default: 'Koordinator Metopen (TA-03B)',
};

const ROLE_CAP: Record<MetopenRole, number> = { supervisor: 75, default: 25 };

export function MetopenCriteriaFormDialog({
    open, onOpenChange, cpmkId, cpmkCode, role, editData, remainingScore, onSubmit,
}: MetopenCriteriaFormDialogProps) {
    const [name, setName] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!editData;

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
            const payload = {
                ...(name.trim() ? { name: name.trim() } : {}),
                maxScore: parseInt(maxScore, 10),
            };
            if (isEdit) {
                await (onSubmit as (data: UpdateCriteriaPayload) => Promise<unknown>)(payload);
            } else {
                await (onSubmit as (data: CreateCriteriaPayload) => Promise<unknown>)({
                    ...payload, cpmkId, role,
                });
            }
            onOpenChange(false);
        } catch { /* handled by hook toast */ } finally {
            setIsSubmitting(false);
        }
    };

    const parsed = parseInt(maxScore, 10);
    const effectiveMax = remainingScore != null ? remainingScore : ROLE_CAP[role];
    const isValid = maxScore.trim() && !isNaN(parsed) && parsed >= 1 && parsed <= effectiveMax;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Kriteria Metopel' : 'Tambah Kriteria Metopel'} ({ROLE_LABEL[role]})
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-md bg-muted/50 border px-3 py-2 text-sm">
                        <span className="font-semibold">{cpmkCode}</span>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="criteriaName">Nama Kriteria</Label>
                        <Input id="criteriaName" placeholder="Contoh: Presentasi Lisan" value={name}
                            onChange={(e) => setName(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Opsional. Biarkan kosong jika tidak diperlukan.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="criteriaMaxScore">Skor Maksimal <span className="text-destructive">*</span></Label>
                        <Input id="criteriaMaxScore" type="number" placeholder="Contoh: 20" min={1} max={effectiveMax}
                            value={maxScore} onChange={(e) => setMaxScore(e.target.value)} required autoFocus />
                        <p className="text-xs text-muted-foreground">
                            {remainingScore != null
                                ? `Sisa skor tersedia: ${remainingScore} dari ${ROLE_CAP[role]} (${ROLE_LABEL[role]})`
                                : `Skor maksimal untuk ${ROLE_LABEL[role]} (total maks ${ROLE_CAP[role]}).`}
                        </p>
                        {maxScore.trim() && !isNaN(parsed) && parsed > effectiveMax && (
                            <p className="text-xs text-destructive">Skor ({parsed}) melebihi sisa yang tersedia ({effectiveMax}).</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? (<><Spinner className="mr-2 h-4 w-4" />Menyimpan...</>) : isEdit ? 'Simpan Perubahan' : 'Tambah Kriteria'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
