import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useLecturerAvailability } from '@/hooks/master-data/useLecturerAvailability';
import { LecturerAvailabilityTable } from '@/components/master-data/lecturer-availability/LecturerAvailabilityTable';
import { LecturerAvailabilityFormDialog } from '@/components/master-data/lecturer-availability/LecturerAvailabilityFormDialog';

export default function LecturerAvailability() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(() => [
        { label: 'Dosen' },
        { label: 'Jadwal Ketersediaan' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Jadwal Ketersediaan');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        availabilities,
        total,
        isLoading,
        isFetching,
        refetch,
        params,
        setParams,
        create,
        update,
        remove,
        isDeleting,
    } = useLecturerAvailability();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Kelola Jadwal Ketersediaan</h1>
                <p className="text-muted-foreground">Kelola jadwal ketersediaan dosen untuk membantu proses penjadwalan seminar hasil dan sidang</p>
            </div>

            <LecturerAvailabilityTable
                data={availabilities}
                total={total}
                isLoading={isLoading}
                isFetching={isFetching}
                params={params}
                onParamsChange={setParams}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
            />

            <LecturerAvailabilityFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
