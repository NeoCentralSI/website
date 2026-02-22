import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { DataMasterTaPanel } from "@/components/kelola/DataMasterTaPanel";

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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Data Master Tugas Akhir</h1>
                    <p className="text-gray-500">
                        Kelola data master tugas akhir, mahasiswa, topik, dan pembimbing.
                    </p>
                </div>
            </div>

            <DataMasterTaPanel />
        </div>
    );
}
