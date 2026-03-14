import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateLogbookEntry, type InternshipLogbookItem } from '@/services/internship.service';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const logbookSchema = z.object({
    activityDescription: z.string().min(10, {
        message: 'Deskripsi aktivitas minimal 10 karakter.',
    }),
});

type LogbookFormValues = z.infer<typeof logbookSchema>;

interface EditLogbookDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    logbook: InternshipLogbookItem | null;
    onSuccess: () => void;
}

export default function EditLogbookDialog({ open, onOpenChange, logbook, onSuccess }: EditLogbookDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LogbookFormValues>({
        resolver: zodResolver(logbookSchema),
        defaultValues: {
            activityDescription: '',
        },
    });

    useEffect(() => {
        if (logbook) {
            form.reset({
                activityDescription: logbook.activityDescription || '',
            });
        }
    }, [logbook, form]);

    const onSubmit = async (values: LogbookFormValues) => {
        if (!logbook) return;

        setIsLoading(true);
        try {
            await updateLogbookEntry(logbook.id, values.activityDescription);
            toast.success('Logbook berhasil diperbarui');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui logbook');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Isi Aktivitas Harian</DialogTitle>
                    <DialogDescription>
                        {logbook && format(new Date(logbook.activityDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="activityDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi Aktivitas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Jelaskan aktivitas yang Anda lakukan hari ini..."
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
