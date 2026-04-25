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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import type { Cpl, CreateCplPayload, UpdateCplPayload } from '@/services/master-data/cpl.service';

interface CplFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: Cpl | null;
    onSubmit: ((data: CreateCplPayload) => Promise<unknown>) | ((id: string, data: UpdateCplPayload) => Promise<unknown>);
}

export function CplFormDialog({
    open,
    onOpenChange,
    editData,
    onSubmit,
}: CplFormDialogProps) {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [minimalScore, setMinimalScore] = useState<number | ''>('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;

    useEffect(() => {
        if (editData) {
            setCode(editData.code || '');
            setDescription(editData.description || '');
            setMinimalScore(editData.minimalScore);
        } else {
            setCode('');
            setDescription('');
            setMinimalScore('');
            setIsActive(true);
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (minimalScore === '' || minimalScore < 0) return;

        setIsSubmitting(true);
        try {
            if (isEdit && editData) {
                const payload: UpdateCplPayload = {
                    code,
                    description,
                    minimalScore: Number(minimalScore),
                };
                await (onSubmit as (id: string, data: UpdateCplPayload) => Promise<unknown>)(editData.id, payload);
            } else {
                const payload: CreateCplPayload = {
                    code,
                    description,
                    minimalScore: Number(minimalScore),
                    isActive,
                };
                await (onSubmit as (data: CreateCplPayload) => Promise<unknown>)(payload);
            }
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = Boolean(code.trim() && description.trim() && minimalScore !== '' && Number(minimalScore) >= 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Data CPL' : 'Tambah Data CPL'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Kode CPL</Label>
                        <Input
                            id="code"
                            placeholder="Contoh: CPL-01"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            placeholder="Deskripsi capaian pembelajaran..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minimalScore">Skor Minimal</Label>
                        <Input
                            id="minimalScore"
                            type="number"
                            placeholder="0-100"
                            min={0}
                            max={100}
                            value={minimalScore}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMinimalScore(val === '' ? '' : Number(val));
                            }}
                            required
                        />
                    </div>

                    {!isEdit && (
                        <div className="flex items-center gap-3 rounded-md border p-3">
                            <Checkbox
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                            />
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive" className="cursor-pointer font-medium">
                                    Aktif
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Nonaktifkan jika ini adalah data CPL lama yang diarsipkan.
                                </p>
                            </div>
                        </div>
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
                            ) : (
                                isEdit ? 'Simpan Perubahan' : 'Tambah CPL'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
