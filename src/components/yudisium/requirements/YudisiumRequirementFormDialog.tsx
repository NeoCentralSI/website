import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type {
    CreateYudisiumRequirementPayload,
    UpdateYudisiumRequirementPayload,
    YudisiumRequirement,
} from '@/services/yudisiumRequirement.service';

interface YudisiumRequirementFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: YudisiumRequirement | null;
    onSubmit:
        | ((payload: CreateYudisiumRequirementPayload) => Promise<unknown>)
        | ((id: string, payload: UpdateYudisiumRequirementPayload) => Promise<unknown>);
}

export function YudisiumRequirementFormDialog({
    open,
    onOpenChange,
    editData,
    onSubmit,
}: YudisiumRequirementFormDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;

    useEffect(() => {
        if (editData) {
            setName(editData.name ?? '');
            setDescription(editData.description ?? '');
            setNotes(editData.notes ?? '');
        } else {
            setName('');
            setDescription('');
            setNotes('');
        }
    }, [editData, open]);

    const isValid = name.trim().length > 0 && name.trim().length <= 255;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            const payload: CreateYudisiumRequirementPayload = {
                name: name.trim(),
                description: description.trim() || null,
                notes: notes.trim() || null,
            };

            if (isEdit && editData) {
                await (onSubmit as (id: string, payload: UpdateYudisiumRequirementPayload) => Promise<unknown>)(
                    editData.id,
                    payload,
                );
            } else {
                await (onSubmit as (payload: CreateYudisiumRequirementPayload) => Promise<unknown>)(payload);
            }

            onOpenChange(false);
        } catch {
            // error handled in hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Persyaratan Yudisium' : 'Tambah Persyaratan Yudisium'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reqName">
                            Nama Persyaratan <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="reqName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Bukti Bebas Pustaka"
                            maxLength={255}
                            required
                        />
                        <p className="text-xs text-muted-foreground text-right">{name.length}/255 karakter</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reqDescription">Deskripsi</Label>
                        <Textarea
                            id="reqDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Deskripsi singkat persyaratan"
                            rows={3}
                            maxLength={2000}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reqNotes">Catatan</Label>
                        <Textarea
                            id="reqNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan (opsional)"
                            rows={3}
                            maxLength={2000}
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
                            ) : isEdit ? (
                                'Simpan Perubahan'
                            ) : (
                                'Tambah Persyaratan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
