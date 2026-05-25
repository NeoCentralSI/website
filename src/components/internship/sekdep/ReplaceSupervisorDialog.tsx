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
import { getSekdepLecturerWorkload, requestSupervisorReplacement } from '@/services/internship/sekdep.service';
import { getSekdepLecturerWorkloadColumns } from '@/lib/internship/sekdepColumns';
import { toast } from 'sonner';
import { Users, CheckCircle2, MessageSquareText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReplaceSupervisorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedInternshipIds: string[];
    onSuccess?: () => void;
}

export function ReplaceSupervisorDialog({
    open,
    onOpenChange,
    selectedInternshipIds,
    onSuccess,
}: ReplaceSupervisorDialogProps) {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
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
            toast.error("Silakan pilih dosen pembimbing baru terlebih dahulu");
            return;
        }

        if (!reason.trim()) {
            toast.error("Silakan masukkan alasan penggantian pembimbing");
            return;
        }

        setIsSubmitting(true);
        try {
            let successCount = 0;
            let errorMsg = "";
            for (const id of selectedInternshipIds) {
                try {
                    await requestSupervisorReplacement(id, selectedLecturerId, reason);
                    successCount++;
                } catch(e: any) {
                    errorMsg = e.response?.data?.message || e.message;
                }
            }
            if (successCount > 0) {
                toast.success(`Berhasil mengajukan ${successCount} permintaan penggantian pembimbing`);
                onOpenChange(false);
                setReason('');
                setSelectedLecturerId(null);
                onSuccess?.();
            } else {
                toast.error(errorMsg || "Gagal mengajukan penggantian");
            }
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
                        Ganti Dosen Pembimbing
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Ajukan penggantian pembimbing KP untuk <b>{selectedInternshipIds.length}</b> mahasiswa terpilih.
                        Penggantian memerlukan persetujuan Kepala Departemen.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-2 space-y-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold">
                            <MessageSquareText className="size-4" />
                            Alasan Penggantian <span className="text-destructive">*</span>
                        </Label>
                        <Textarea 
                            placeholder="Tuliskan alasan mengapa dosen pembimbing harus diganti..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">Pilih Dosen Pembimbing Baru <span className="text-destructive">*</span></Label>
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
                            className="border rounded-md shadow-none p-0"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-between items-center gap-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {selectedLecturerId ? (
                            <span className="flex items-center gap-2 text-primary font-medium animate-in fade-in slide-in-from-left-2">
                                <CheckCircle2 className="size-4" />
                                Dosen baru telah dipilih
                            </span>
                        ) : (
                            "Pilih salah satu dosen dari tabel"
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedLecturerId || !reason.trim() || isSubmitting}
                            className="bg-primary hover:bg-primary/90 min-w-[120px]"
                        >
                            {isSubmitting ? "Mengajukan..." : "Ajukan Penggantian"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
