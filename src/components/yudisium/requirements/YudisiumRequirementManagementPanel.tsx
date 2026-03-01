import { useState } from 'react';
import { useYudisiumRequirements } from '@/hooks/master-data/useYudisiumRequirements';
import { YudisiumRequirementTable } from './YudisiumRequirementTable';
import { YudisiumRequirementFormDialog } from './YudisiumRequirementFormDialog';

export function YudisiumRequirementManagementPanel() {
    const {
        requirements,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        moveTop,
        moveBottom,
        toggle,
        remove,
        isMoving,
        isToggling,
        isDeleting,
    } = useYudisiumRequirements();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="space-y-4">

            <YudisiumRequirementTable
                data={requirements}
                isLoading={isLoading}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                onCreate={() => setCreateDialogOpen(true)}
                onUpdate={update}
                onMoveTop={moveTop}
                onMoveBottom={moveBottom}
                onToggle={toggle}
                onDelete={remove}
                isMoving={isMoving}
                isToggling={isToggling}
                isDeleting={isDeleting}
            />

            <YudisiumRequirementFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={create}
            />
        </div>
    );
}
