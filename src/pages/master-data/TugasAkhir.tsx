import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { DataMasterTaPanel } from "@/components/kelola/DataMasterTaPanel";

/**
 * Master Data > Data Tugas Akhir. SIA is read only (plan 10.6): NeoCentral no longer sends
 * thesis data to SIA; titles of theses that pass Metode Penelitian leave as an export file
 * (Metode Penelitian > Penilaian Proposal).
 */
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

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Data Master Tugas Akhir</h1>
                <p className="text-muted-foreground">
                    Kelola data master tugas akhir, mahasiswa, topik, dan pembimbing
                </p>
            </div>

            <DataMasterTaPanel />
        </div>
    );
}
