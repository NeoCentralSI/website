import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useLecturerAvailability } from '@/hooks/useLecturerAvailability';
import { AvailabilityTable } from '@/components/lecturer-availability/AvailabilityTable';
import { AvailabilityFormDialog } from '@/components/lecturer-availability/AvailabilityFormDialog';

export default function JadwalKetersediaan() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(() => [{ label: 'Jadwal Ketersediaan' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Jadwal Ketersediaan');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        availabilities,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        toggle,
        remove,
        isToggling,
        isDeleting,
    } = useLecturerAvailability();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Jadwal Ketersediaan</h1>
                <p className="text-gray-500">Kelola jadwal ketersediaan Anda untuk bimbingan mahasiswa.</p>
            </div>

            <AvailabilityTable
                data={availabilities}
                isLoading={isLoading}
                isFetching={isFetching}
                onToggle={toggle}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isToggling={isToggling}
                isDeleting={isDeleting}
            />

            <AvailabilityFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
