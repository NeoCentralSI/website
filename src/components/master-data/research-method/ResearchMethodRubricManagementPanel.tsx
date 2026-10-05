import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useResearchMethodAssessment } from "@/hooks/master-data/useResearchMethodAssessment";
import type {
  ResearchMethodAssessmentCriteria,
  ResearchMethodAssessor,
  ResearchMethodCpmkWithRubrics,
  UpdateResearchMethodCriteriaPayload,
} from "@/services/researchMethodAssessment.service";
import { cn } from "@/lib/utils";

import { ResearchMethodCriteriaFormDialog } from "./ResearchMethodCriteriaFormDialog";
import { ResearchMethodCriteriaTable } from "./ResearchMethodCriteriaTable";

const ASSESSOR_OPTIONS: { value: ResearchMethodAssessor; label: string }[] = [
  { value: "supervisor", label: "Dosen Pembimbing" },
  { value: "coordinator", label: "Koordinator Metode Penelitian" },
];

export function ResearchMethodRubricManagementPanel({
  academicYearId,
}: {
  academicYearId?: string;
}) {
  const [assessor, setAssessor] = useState<ResearchMethodAssessor>("supervisor");
  const hook = useResearchMethodAssessment(assessor, academicYearId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetCpmk, setTargetCpmk] =
    useState<ResearchMethodCpmkWithRubrics | null>(null);
  const [editCriteria, setEditCriteria] =
    useState<ResearchMethodAssessmentCriteria | null>(null);

  const merged = useMemo(() => {
    const configured = new Map(hook.cpmks.map((item) => [item.id, item]));
    return hook.allCpmks
      .map(
        (cpmk) =>
          configured.get(cpmk.id) ||
          ({
            ...cpmk,
            assessmentCriterias: [],
          } as ResearchMethodCpmkWithRubrics),
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [hook.allCpmks, hook.cpmks]);

  const summary = hook.weightSummary;
  const supervisorTotal = summary?.supervisorTotal ?? 0;
  const coordinatorTotal = summary?.coordinatorTotal ?? 0;
  const combinedTotal = summary?.totalScore ?? 0;
  const assessorTotal =
    assessor === "supervisor" ? supervisorTotal : coordinatorTotal;
  const remainingScore = Math.max(0, 100 - combinedTotal);
  const assessorLabel =
    ASSESSOR_OPTIONS.find((item) => item.value === assessor)?.label ?? assessor;

  if (!academicYearId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Pilih tahun ajaran untuk mengelola rubrik.
      </div>
    );
  }

  const openCreate = (cpmkId: string) => {
    setTargetCpmk(merged.find((item) => item.id === cpmkId) ?? null);
    setEditCriteria(null);
    setDialogOpen(true);
  };

  const openEdit = (
    criteria: ResearchMethodAssessmentCriteria,
    cpmk: ResearchMethodCpmkWithRubrics,
  ) => {
    setTargetCpmk(cpmk);
    setEditCriteria(criteria);
    setDialogOpen(true);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Rubrik Penilaian Metode Penelitian</CardTitle>
            <CardDescription>
              Kelola kriteria dan rentang rubrik penilaian proposal berdasarkan
              CPMK serta peran penilai.
            </CardDescription>
          </div>

          {summary ? (
            <div
              className={cn(
                "flex h-fit items-center gap-3 rounded-lg border px-4 py-2 text-sm",
                combinedTotal === 100
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                  : combinedTotal > 100
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                    : "bg-muted/30",
              )}
            >
              <span className="font-medium text-muted-foreground">
                Total Skor Gabungan:
              </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  combinedTotal === 100 &&
                    "text-green-600 dark:text-green-400",
                  combinedTotal > 100 && "text-red-600 dark:text-red-400",
                )}
              >
                {combinedTotal} / 100
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-fit gap-1 rounded-lg border bg-background p-1 shadow-sm">
            {ASSESSOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAssessor(option.value)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  assessor === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {summary ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                Skor {assessorLabel}:
              </span>
              <span className="font-bold text-primary">{assessorTotal}</span>
              <span className="border-l pl-3 text-xs text-muted-foreground">
                Pembimbing: {supervisorTotal} | Koordinator: {coordinatorTotal}
              </span>
            </div>
          ) : null}
        </div>

        <ResearchMethodCriteriaTable
          data={merged}
          isLoading={hook.isLoading || hook.isCpmkLoading}
          isFetching={hook.isFetching || hook.isCpmkFetching}
          onRefresh={() => {
            void hook.refetch();
            void hook.refetchCpmks();
          }}
          onAddCriteria={openCreate}
          onEditCriteria={openEdit}
          onDeleteCriteria={hook.deleteCriteria}
          onDeleteCpmk={hook.removeConfiguration}
          onCreateRubric={hook.createRubric}
          onUpdateRubric={hook.updateRubric}
          onDeleteRubric={hook.deleteRubric}
          onReorderCriteria={hook.reorderCriteria}
          onReorderRubrics={hook.reorderRubrics}
          isDeletingCriteria={hook.isDeletingCriteria}
          isRemovingCpmk={hook.isRemovingConfiguration}
          isDeletingRubric={hook.isDeletingRubric}
          catalogCount={hook.allCpmks.length}
        />
      </CardContent>

      <ResearchMethodCriteriaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cpmkId={targetCpmk?.id ?? ""}
        cpmkCode={targetCpmk?.code ?? "-"}
        role={assessor}
        roleCap={100}
        editData={editCriteria}
        remainingScore={
          editCriteria
            ? remainingScore + (editCriteria.maxScore ?? 0)
            : remainingScore
        }
        onSubmit={
          editCriteria
            ? (data: UpdateResearchMethodCriteriaPayload) =>
                hook.updateCriteria(editCriteria.id, data)
            : hook.createCriteria
        }
      />
    </Card>
  );
}
