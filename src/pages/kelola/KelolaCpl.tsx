import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useCpl } from '@/hooks/master-data/useCpl';
import { CplTable } from '@/components/kelola/cpl/CplTable';
import { CplFormDialog } from '@/components/kelola/cpl/CplFormDialog';

export default function KelolaCpl() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(() => [
        { label: 'Kelola', href: '/kelola' },
        { label: 'Kelola Data CPL' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Kelola Data CPL');
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

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Kelola Data CPL</h1>
                <p className="text-gray-500">Tetapkan hasil pembelajaran program dan standar kelulusan minimum</p>
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
            />

            <CplFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
