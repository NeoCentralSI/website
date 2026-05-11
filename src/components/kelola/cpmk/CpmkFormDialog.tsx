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
import type { Cpmk, CreateCpmkPayload, UpdateCpmkPayload } from '@/services/cpmk.service';

interface CpmkFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Tipe CPMK untuk mode tambah (penilaian seminar/sidang TA vs Metopel TA-03A/B). */
    defaultType?: 'research_method' | 'thesis';
    editData?: Cpmk | null;
    onSubmit: ((data: CreateCpmkPayload) => Promise<unknown>) | ((id: string, data: UpdateCpmkPayload) => Promise<unknown>);
}

export function CpmkFormDialog({
    open,
    onOpenChange,
    defaultType = 'thesis',
    editData,
    onSubmit,
}: CpmkFormDialogProps) {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;

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
            const type = isEdit && editData ? editData.type : defaultType;
            const payload = {
                code,
                description,
                type,
            };
            if (isEdit && editData) {
                await (onSubmit as (id: string, data: UpdateCpmkPayload) => Promise<unknown>)(editData.id, payload);
            } else {
                await (onSubmit as (data: CreateCpmkPayload) => Promise<unknown>)(payload);
            }
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = code.trim() && description.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Data CPMK' : 'Tambah Data CPMK'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        {isEdit
                            ? editData?.type === 'research_method'
                                ? 'Metodologi Penelitian (Metopel) — TA-03A/TA-03B'
                                : 'Tugas Akhir — seminar, sidang, dan konteks penilaian TA'
                            : defaultType === 'research_method'
                                ? 'Baris baru untuk CPMK Metodologi Penelitian (penilaian Metopel).'
                                : 'Baris baru untuk CPMK mata kuliah Tugas Akhir (bukan Metopel).'}
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode CPMK</Label>
                        <Input
                            id="code"
                            placeholder="Contoh: CPMK-01"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>

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
