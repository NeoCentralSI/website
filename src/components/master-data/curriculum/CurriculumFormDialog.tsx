import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Curriculum, CreateCurriculumPayload, UpdateCurriculumPayload } from '@/services/master-data/curriculum.service';

const curriculumSchema = z.object({
    name: z.string().min(1, 'Nama kurikulum wajib diisi'),
    startYear: z.coerce.number().min(2000, 'Tahun mulai tidak valid'),
    endYear: z.coerce.number().optional().nullable(),
}).refine((data) => {
    if (data.endYear) {
        return data.endYear >= data.startYear;
    }
    return true;
}, {
    message: "Tahun akhir tidak boleh kurang dari tahun mulai",
    path: ["endYear"],
});

type CurriculumFormValues = z.infer<typeof curriculumSchema>;

interface CurriculumFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Curriculum | null;
    onSubmit: (data: CreateCurriculumPayload | UpdateCurriculumPayload) => Promise<void>;
}

export function CurriculumFormDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
}: CurriculumFormDialogProps) {
    const isEditing = !!initialData;
    const hasCpl = isEditing && (initialData.cplCount > 0);

    const form = useForm<CurriculumFormValues>({
        resolver: zodResolver(curriculumSchema),
        defaultValues: {
            name: '',
            startYear: new Date().getFullYear(),
            endYear: null,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    startYear: initialData.startYear,
                    endYear: initialData.endYear,
                });
            } else {
                form.reset({
                    name: '',
                    startYear: new Date().getFullYear(),
                    endYear: null,
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async (values: CurriculumFormValues) => {
        try {
            await onSubmit(values as CreateCurriculumPayload);
            onOpenChange(false);
        } catch (error) {
            // Error is handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Ubah Kurikulum' : 'Tambah Kurikulum'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah informasi kurikulum di bawah ini.'
                            : 'Tambahkan data kurikulum baru.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Kurikulum</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Kurikulum 2024" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tahun Mulai</FormLabel>
                                        <FormControl>
                                            <Input type="number" disabled={hasCpl} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endYear"
                                render={({ field: { value, onChange, ...field } }) => (
                                    <FormItem>
                                        <FormLabel>Tahun Akhir (Opsional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                value={value || ''}
                                                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                                                placeholder="Kosongkan jika masih berlaku"
                                                disabled={hasCpl}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
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
