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
import type { ThesisCpmk, CreateThesisCpmkPayload, UpdateThesisCpmkPayload } from '@/services/master-data/thesis-cpmk.service';

interface ThesisCpmkFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: ThesisCpmk | null;
    onSubmit: ((data: CreateThesisCpmkPayload) => Promise<unknown>) | ((id: string, data: UpdateThesisCpmkPayload) => Promise<unknown>);
}

export function ThesisCpmkFormDialog({
    open,
    onOpenChange,
    editData,
    onSubmit,
}: ThesisCpmkFormDialogProps) {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;
    const isCodeLocked = Boolean(isEdit && editData?._count && (editData._count.thesisSeminarAssessmentCriterias > 0 || editData._count.thesisDefenceExaminerAssessmentCriterias > 0));

    useEffect(() => {
        if (editData) {
            setCode(editData.code || '');
            setDescription(editData.description || '');
        } else {
            setCode('');
            setDescription('');
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            if (isEdit && editData) {
                const payload: UpdateThesisCpmkPayload = isCodeLocked
                    ? { description }
                    : {
                        code,
                        description,
                    };
                await (onSubmit as (id: string, data: UpdateThesisCpmkPayload) => Promise<unknown>)(editData.id, payload);
            } else {
                const payload: CreateThesisCpmkPayload = {
                    code,
                    description,
                };
                await (onSubmit as (data: CreateThesisCpmkPayload) => Promise<unknown>)(payload);
            }
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = isCodeLocked ? Boolean(description.trim()) : Boolean(code.trim() && description.trim());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Data CPMK' : 'Tambah Data CPMK'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode CPMK</Label>
                        <Input
                            id="code"
                            placeholder="Contoh: CPMK-01"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            disabled={isCodeLocked}
                        />
                    </div>
                    {isCodeLocked && (
                        <p className="text-xs text-muted-foreground">
                            Kode CPMK dikunci karena sudah memiliki detail penilaian.
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            placeholder="Deskripsi capaian pembelajaran mata kuliah..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
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
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {isEdit ? 'Menyimpan...' : 'Menambahkan...'}
                                </>
                            ) : (
                                isEdit ? 'Simpan Perubahan' : 'Tambah CPMK'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
