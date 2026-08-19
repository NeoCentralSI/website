import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useCurriculum } from '@/hooks/master-data/useCurriculum';
import { CurriculumTable } from '@/components/master-data/curriculum/CurriculumTable';
import { CurriculumFormDialog } from '@/components/master-data/curriculum/CurriculumFormDialog';
import { useRole } from '@/hooks/shared/useRole';
import type {
    CreateCurriculumPayload,
    UpdateCurriculumPayload,
} from '@/services/master-data/curriculum.service';

export default function MasterDataCurriculum() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(() => [
        { label: 'Kelola' },
        { label: 'CPL' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Kelola Kurikulum CPL');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        curriculums,
        total: totalCurriculums,
        isLoading: isLoadingCurriculums,
        isFetching: isFetchingCurriculums,
        refetch: refetchCurriculums,
        params: curriculumParams,
        setParams: setCurriculumParams,
        create: createCurriculum,
        update: updateCurriculum,
        remove: removeCurriculum,
        isDeleting: isDeletingCurriculum,
    } = useCurriculum();

    const navigate = useNavigate();
    const { isGkm } = useRole();
    const isManagement = isGkm();

    const [createCurriculumOpen, setCreateCurriculumOpen] = useState(false);
    const [updateCurriculumOpen, setUpdateCurriculumOpen] = useState(false);
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

    const selectedCurriculumData = useMemo(() => {
        if (!selectedCurriculumId) return null;
        return curriculums.find((c) => c.id === selectedCurriculumId) || null;
    }, [selectedCurriculumId, curriculums]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Kelola Kurikulum CPL</h1>
                <p className="text-muted-foreground">
                    Kelola data kurikulum dan pilih kurikulum untuk mengatur CPL
                </p>
            </div>

            <CurriculumTable
                data={curriculums}
                total={totalCurriculums}
                isLoading={isLoadingCurriculums}
                isFetching={isFetchingCurriculums}
                onDelete={removeCurriculum}
                onUpdate={(id) => {
                    setSelectedCurriculumId(id);
                    setUpdateCurriculumOpen(true);
                }}
                onCreate={() => setCreateCurriculumOpen(true)}
                onRefresh={() => refetchCurriculums()}
                onDetail={(id) => navigate(`/kelola/cpl/${id}`)}
                isDeleting={isDeletingCurriculum}
                isManagement={isManagement}
                params={curriculumParams}
                onParamsChange={setCurriculumParams}
            />

            <CurriculumFormDialog
                open={createCurriculumOpen}
                onOpenChange={setCreateCurriculumOpen}
                onSubmit={async (data) => {
                    await createCurriculum(data as CreateCurriculumPayload);
                }}
            />

            <CurriculumFormDialog
                open={updateCurriculumOpen}
                onOpenChange={(open) => {
                    setUpdateCurriculumOpen(open);
                    if (!open) setSelectedCurriculumId(null);
                }}
                initialData={selectedCurriculumData}
                onSubmit={async (data) => {
                    if (!selectedCurriculumId) return;
                    await updateCurriculum(selectedCurriculumId, data as UpdateCurriculumPayload);
                }}
            />
        </div>
    );
}
