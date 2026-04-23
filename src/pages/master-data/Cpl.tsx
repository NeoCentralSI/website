import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useCpl } from '@/hooks/master-data/useCpl';
import { CplTable } from '@/components/master-data/CplTable';
import { CplFormDialog } from '@/components/master-data/CplFormDialog';
import { useAuth } from '@/hooks/shared';
import { ROLES } from '@/lib/roles';

export default function Cpl() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(() => [
        { label: 'Master Data' },
        { label: 'CPL' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('CPL');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        cpls,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        toggle,
        remove,
        isToggling,
        isDeleting,
    } = useCpl();

    const { user } = useAuth();
    const isManagement = user?.role === ROLES.SEKRETARIS_DEPARTEMEN || user?.role === ROLES.KETUA_DEPARTEMEN;

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Kelola CPL</h1>
                <p className="text-muted-foreground">Atur capaian pembelajaran lulusan (CPL) dan skor minimal untuk mendukung proses evaluasi dan validasi akademik</p>
            </div>

            <CplTable
                data={cpls}
                isLoading={isLoading}
                isFetching={isFetching}
                onToggle={toggle}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isToggling={isToggling}
                isDeleting={isDeleting}
                isManagement={isManagement}
            />

            <CplFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
