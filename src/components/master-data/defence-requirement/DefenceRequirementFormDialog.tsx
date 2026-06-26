import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import type { DefenceRequirement, CreateDefenceRequirementPayload, UpdateDefenceRequirementPayload } from '@/services/master-data/defence-requirement.service';

const formSchema = z.object({
    name: z.string().min(1, 'Nama persyaratan harus diisi'),
    description: z.string().optional(),
});

interface DefenceRequirementFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateDefenceRequirementPayload | UpdateDefenceRequirementPayload) => Promise<unknown>;
    initialData?: DefenceRequirement | null;
}

export function DefenceRequirementFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: DefenceRequirementFormDialogProps) {
    const isEditing = !!initialData;

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    description: initialData.description || '',
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async (values: any) => {
        try {
            await onSubmit(values);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Persyaratan' : 'Tambah Persyaratan'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Persyaratan</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Laporan Tugas Akhir Final" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Penjelasan detail mengenai persyaratan ini"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
