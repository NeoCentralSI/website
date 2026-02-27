import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { DataMasterTaPanel } from "@/components/kelola/DataMasterTaPanel";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncSiaData } from "@/services/masterDataTa.service";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw } from "lucide-react";

export default function MasterDataTugasAkhirPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    // Memoized breadcrumbs
    const breadcrumbs = useMemo(() => [
        { label: 'Master Data' },
        { label: 'Data Tugas Akhir' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Data Tugas Akhir');
    }, [setBreadcrumbs, setTitle, breadcrumbs]);

    const syncMutation = useMutation({
        mutationFn: () => syncSiaData(),
        onSuccess: (data) => {
            toast.success(`Berhasil sinkronisasi ${data?.totalRecords || 0} data ke SIA`);
        },
        onError: (err: any) => toast.error(err.message || "Gagal sinkronisasi data"),
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Data Master Tugas Akhir</h1>
                    <p className="text-gray-500">
                        Kelola data master tugas akhir, mahasiswa, topik, dan pembimbing.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Sinkronkan data tugas akhir dengan SIA</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => syncMutation.mutate()}
                                    disabled={syncMutation.isPending}
                                    aria-label="Sinkronisasi data SIA"
                                >
                                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{syncMutation.isPending ? 'Menyinkronkan...' : 'Sinkronkan data SIA'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <DataMasterTaPanel />
        </div>
    );
}
