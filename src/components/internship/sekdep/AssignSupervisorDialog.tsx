import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InternshipTable } from '@/components/internship/InternshipTable';
import { useQuery } from '@tanstack/react-query';
import { getSekdepLecturerWorkload, bulkAssignSupervisor } from '@/services/internship';
import { getSekdepLecturerWorkloadColumns } from '@/lib/internship/sekdepColumns';
import { toast } from 'sonner';
import { Users, CheckCircle2 } from 'lucide-react';

interface AssignSupervisorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedInternshipIds: string[];
    onSuccess?: () => void;
}

export function AssignSupervisorDialog({
    open,
    onOpenChange,
    selectedInternshipIds,
    onSuccess,
}: AssignSupervisorDialogProps) {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['sekdep-lecturer-workload-dialog', { q, page, pageSize }],
        queryFn: () => getSekdepLecturerWorkload(q, page, pageSize),
        enabled: open,
    });

    const columns = getSekdepLecturerWorkloadColumns({
        onViewDetail: (item) => {
            setSelectedLecturerId(item.id);
        },
    });

    // Modify columns to show selection instead of detail button maybe?
    // Or just use the detail button as "Select"
    const modifiedColumns = (columns as any[]).map(col => {
        if (col.key === 'actions') {
            return {
                ...col,
                header: 'Pilih',
                render: (item: any) => (
                    <Button
                        size="sm"
                        variant={selectedLecturerId === item.id ? "default" : "outline"}
                        className="h-8 w-full transition-all duration-300"
                        onClick={() => setSelectedLecturerId(item.id)}
                    >
                        {selectedLecturerId === item.id ? (
                            <CheckCircle2 className="size-4 mr-1 text-primary-foreground animate-in zoom-in" />
                        ) : null}
                        {selectedLecturerId === item.id ? "Terpilih" : "Pilih"}
                    </Button>
                )
            };
        }
        return col;
    });

    const handleConfirm = async () => {
        if (!selectedLecturerId) {
            toast.error("Silakan pilih dosen pembimbing terlebih dahulu");
            return;
        }

        setIsSubmitting(true);
        try {
            await bulkAssignSupervisor(selectedInternshipIds, selectedLecturerId);
            toast.success("Dosen pembimbing berhasil ditetapkan");
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Gagal menetapkan pembimbing");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Users className="size-6 text-primary" />
                        Pilih Dosen Pembimbing
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Pilih satu dosen untuk menjadi pembimbing dari {selectedInternshipIds.length} mahasiswa terpilih.
                        Beban kerja (Workload) ditampilkan untuk membantu distribusi yang merata.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-2">
                    <InternshipTable
                        columns={modifiedColumns}
                        data={data?.data || []}
                        total={data?.total || 0}
                        loading={isLoading}
                        isRefreshing={isFetching}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        searchValue={q}
                        onSearchChange={(val) => {
                            setQ(val);
                            setPage(1);
                        }}
                        className="border-none shadow-none p-0"
                    />
                </div>

                <DialogFooter className="mt-4 flex justify-between items-center gap-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {selectedLecturerId ? (
                            <span className="flex items-center gap-2 text-primary font-medium animate-in fade-in slide-in-from-left-2">
                                <CheckCircle2 className="size-4" />
                                Dosen telah dipilih
                            </span>
                        ) : (
                            "Pilih salah satu dosen dari tabel di atas"
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedLecturerId || isSubmitting}
                            className="bg-primary hover:bg-primary/90 min-w-[120px]"
                        >
                            {isSubmitting ? "Memproses..." : "Konfirmasi"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
