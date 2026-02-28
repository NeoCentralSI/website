import { useState } from 'react';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { CpmkTable } from '@/components/kelola/cpmk/CpmkTable';
import { CpmkFormDialog } from '@/components/kelola/cpmk/CpmkFormDialog';

export function CpmkManagementPanel() {
    const {
        cpmks,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        toggle,
        remove,
        isToggling,
        isDeleting,
    } = useCpmk();

    // Filter to only show thesis-type CPMKs
    const thesisCpmks = cpmks.filter((cpmk) => cpmk.type === 'thesis');

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
            <CpmkTable
                data={thesisCpmks}
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

            <CpmkFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
