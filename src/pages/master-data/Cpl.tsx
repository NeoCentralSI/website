import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useCpl } from '@/hooks/master-data/useCpl';
import { useCurriculum } from '@/hooks/master-data/useCurriculum';
import { CplTable } from '@/components/master-data/cpl/CplTable';
import { CplFormDialog } from '@/components/master-data/cpl/CplFormDialog';
import { useRole } from '@/hooks/shared';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MasterDataCpl() {
    const { curriculumId } = useParams();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    const { curriculums } = useCurriculum();
    const selectedCurriculum = useMemo(() => 
        curriculums.find(c => c.id === curriculumId), 
    [curriculums, curriculumId]);

    const breadcrumbs = useMemo(() => [
        { label: 'Kelola' },
        { label: 'CPL & Kurikulum', url: '/kelola/cpl' },
        { label: selectedCurriculum?.name || 'Daftar CPL' },
    ], [selectedCurriculum]);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(`Daftar CPL - ${selectedCurriculum?.name || ''}`);
    }, [breadcrumbs, setBreadcrumbs, setTitle, selectedCurriculum]);

    const {
        cpls,
        total,
        isLoading,
        isFetching,
        refetch,
        params,
        setParams,
        create,
        update,
        toggle,
        remove,
        exportAllScores,
        isToggling,
        isDeleting,
        isExportingAllScores,
    } = useCpl();

    // Pastikan list difilter berdasarkan curriculumId
    useEffect(() => {
        if (curriculumId && params.curriculumId !== curriculumId) {
            setParams(prev => ({ ...prev, curriculumId }));
        }
    }, [curriculumId, params.curriculumId, setParams]);

    const { isGkm } = useRole();
    const isManagement = isGkm();

    const [createCplOpen, setCreateCplOpen] = useState(false);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0">
                        <Link to="/kelola/cpl">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Data CPL - {selectedCurriculum?.name || 'Memuat...'}</h1>
                        <p className="text-muted-foreground">Kelola capaian pembelajaran untuk kurikulum ini</p>
                    </div>
                </div>
            </div>

            <CplTable
                data={cpls}
                total={total}
                isLoading={isLoading}
                isFetching={isFetching}
                onToggle={toggle}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateCplOpen(true)}
                onRefresh={() => refetch()}
                onDetail={(id) => navigate(`/kelola/cpl/detail/${id}`)}
                onExportAllScores={exportAllScores}
                isToggling={isToggling}
                isDeleting={isDeleting}
                isExportingAllScores={isExportingAllScores}
                isManagement={isManagement}
                params={params}
                onParamsChange={setParams}
            />

            <CplFormDialog
                open={createCplOpen}
                onOpenChange={setCreateCplOpen}
                onSubmit={create}
                // curriculums prop removed
                defaultCurriculumId={curriculumId}
            />
        </div>
    );
}
