import { useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Paperclip, Upload, X, FileText } from 'lucide-react';
import {
    useCreateMetopenTemplate, useUpdateMetopenTemplate,
    useUploadTemplateAttachment, useUploadTemplateAttachmentsBatch, useDeleteTemplateAttachment,
} from '@/hooks/metopen/useMetopen';
import type { MetopenTemplate, CreateTemplateDto } from '@/types/metopen.types';

interface TemplateFormDialogProps {
    template?: MetopenTemplate;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TemplateFormDialog({ template, trigger, open: controlledOpen, onOpenChange }: TemplateFormDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = (value: boolean) => {
        setInternalOpen(value);
        onOpenChange?.(value);
    };
    const isEdit = !!template;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createMutation = useCreateMetopenTemplate();
    const updateMutation = useUpdateMetopenTemplate();
    const uploadAttachment = useUploadTemplateAttachment();
    const uploadBatch = useUploadTemplateAttachmentsBatch();
    const deleteAttachment = useDeleteTemplateAttachment();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data: CreateTemplateDto = {
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || undefined,
            defaultDueDays: formData.get('defaultDueDays') ? Number(formData.get('defaultDueDays')) : undefined,
            weightPercentage: formData.get('weightPercentage') ? Number(formData.get('weightPercentage')) : undefined,
            isGateToAdvisorSearch: formData.get('isGate') === 'on',
        };

        if (isEdit && template) {
            updateMutation.mutate(
                { id: template.id, data },
                { onSuccess: () => setOpen(false) }
            );
        } else {
            createMutation.mutate(data, { onSuccess: () => setOpen(false) });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files;
        if (!selected?.length || !template) return;

        const existingCount = existingAttachments.length;
        const maxAdd = Math.max(0, 10 - existingCount);
        const files = Array.from(selected).slice(0, maxAdd);

        if (files.length === 0) return;
        if (files.length === 1) {
            uploadAttachment.mutate({ templateId: template.id, file: files[0] });
        } else {
            uploadBatch.mutate({ templateId: template.id, files });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        if (!template) return;
        deleteAttachment.mutate({ templateId: template.id, attachmentId });
    };

    const existingAttachments = template?.attachments || [];
    const canAddMore = existingAttachments.length < 10;
    const isUploading = uploadAttachment.isPending || uploadBatch.isPending;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>{isEdit ? 'Edit' : 'Tambah Template'}</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Template Tugas' : 'Tambah Template Tugas Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Judul Tugas</Label>
                        <Input
                            id="name"
                            name="name"
                            required
                            defaultValue={template?.name || ''}
                            placeholder="Contoh: Topic Brief"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={template?.description || ''}
                            placeholder="Jelaskan apa yang harus dikerjakan mahasiswa..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="defaultDueDays">Durasi (hari)</Label>
                            <Input
                                id="defaultDueDays"
                                name="defaultDueDays"
                                type="number"
                                min={1}
                                defaultValue={template?.defaultDueDays ?? ''}
                                placeholder="Contoh: 14"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Hari dari tanggal mulai</p>
                        </div>

                        <div>
                            <Label htmlFor="weightPercentage">Bobot (%)</Label>
                            <Input
                                id="weightPercentage"
                                name="weightPercentage"
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={template?.weightPercentage ?? ''}
                                placeholder="Contoh: 25"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                        <Switch
                            id="isGate"
                            name="isGate"
                            defaultChecked={template?.isGateToAdvisorSearch || false}
                        />
                        <div>
                            <Label htmlFor="isGate" className="cursor-pointer">Gate Milestone</Label>
                            <p className="text-xs text-muted-foreground">
                                Jika dicentang, milestone ini harus selesai sebelum mahasiswa bisa request pembimbing
                            </p>
                        </div>
                    </div>

                    {/* Attachment Section — only shown in edit mode */}
                    {isEdit && template && (
                        <div className="space-y-3 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-medium">Lampiran Dokumen</Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!canAddMore || isUploading}
                                >
                                    {isUploading ? (
                                        <Spinner className="mr-1 h-3 w-3" />
                                    ) : (
                                        <Upload className="mr-1 h-3 w-3" />
                                    )}
                                    {canAddMore ? `Upload (${existingAttachments.length}/10)` : 'Maks 10 lampiran'}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {existingAttachments.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    Belum ada lampiran. Upload file untuk menambahkan (maks. 10).
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {existingAttachments.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="text-sm truncate">
                                                    {att.document?.fileName || 'Dokumen'}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteAttachment(att.id)}
                                                disabled={deleteAttachment.isPending}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
