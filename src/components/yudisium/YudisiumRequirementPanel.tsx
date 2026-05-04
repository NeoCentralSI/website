import { useState } from 'react';
import { useYudisiumRequirements } from '@/hooks/yudisium/useYudisiumRequirements';
import { YudisiumRequirementTable } from './YudisiumRequirementTable';
import { YudisiumRequirementFormDialog } from './YudisiumRequirementFormDialog';

export function YudisiumRequirementPanel() {
  const {
    requirements,
    isLoading,
    isFetching,
    refetch,
    create,
    update,
    remove,
    isUpdating,
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
        onDelete={remove}
        isUpdating={isUpdating}
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
