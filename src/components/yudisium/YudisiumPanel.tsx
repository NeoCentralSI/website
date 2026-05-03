import { useYudisiumEvents, useDeleteYudisiumEvent, useUpdateYudisiumEvent, useCreateYudisiumEvent } from '@/hooks/yudisium/useYudisium';
import { YudisiumTable } from './YudisiumTable';
import { useRole } from '@/hooks/shared';

export function YudisiumPanel() {
  const { isKoordinatorYudisium } = useRole();
  const { data: events = [], isLoading, isFetching, refetch } = useYudisiumEvents();
  const deleteMutation = useDeleteYudisiumEvent();
  const updateMutation = useUpdateYudisiumEvent();
  const createMutation = useCreateYudisiumEvent();

  return (
    <div className="space-y-4">
      <YudisiumTable
        data={events}
        isLoading={isLoading}
        isFetching={isFetching}
        onDelete={(id) => deleteMutation.mutate(id)}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        onCreate={(data) => createMutation.mutateAsync(data)}
        onRefresh={() => refetch()}
        isDeleting={deleteMutation.isPending}
        canManage={isKoordinatorYudisium()}
        canViewDetail={true}
      />
    </div>
  );
}
