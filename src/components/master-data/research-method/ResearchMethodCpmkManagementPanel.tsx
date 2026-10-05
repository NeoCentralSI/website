import { useResearchMethodAssessment } from "@/hooks/master-data/useResearchMethodAssessment";
import { ResearchMethodCpmkCatalog } from "./ResearchMethodCpmkCatalog";

export function ResearchMethodCpmkManagementPanel({ academicYearId }: { academicYearId?: string }) {
  const hook = useResearchMethodAssessment("supervisor", academicYearId);

  if (!academicYearId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Pilih tahun ajaran untuk mengelola CPMK.
      </div>
    );
  }

  return (
    <ResearchMethodCpmkCatalog
      items={hook.allCpmks}
      isLoading={hook.isCpmkLoading}
      isFetching={hook.isCpmkFetching}
      onCreate={hook.createCpmk}
      onUpdate={hook.updateCpmk}
      onDelete={hook.deleteCpmk}
      onRefresh={() => void hook.refetchCpmks()}
      isCreating={hook.isCreatingCpmk}
      isUpdating={hook.isUpdatingCpmk}
      isDeleting={hook.isDeletingCpmk}
    />
  );
}
