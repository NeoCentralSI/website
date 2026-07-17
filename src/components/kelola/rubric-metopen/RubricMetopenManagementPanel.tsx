import { useMemo, useState } from "react";
import { Link2, Plus } from "lucide-react";

import { useRubricMetopen } from "@/hooks/master-data/useRubricMetopen";
import { MetopenCriteriaTable } from "@/components/kelola/rubric-metopen/MetopenCriteriaTable";
import { MetopenCriteriaFormDialog } from "@/components/kelola/rubric-metopen/MetopenCriteriaFormDialog";
import { MetopenCpmkCatalog } from "@/components/kelola/rubric-metopen/MetopenCpmkCatalog";
import { LocalTabsNav, type LocalTabItem } from "@/components/ui/tabs-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  MetopenAssessmentCriteria,
  MetopenCpmkWithRubrics,
  UpdateCriteriaPayload,
  MetopenRole,
} from "@/services/rubricMetopen.service";
import { cn } from "@/lib/utils";

type PanelTab = "katalog" | "konfigurasi";

const PANEL_TABS: LocalTabItem[] = [
  { label: "1. Katalog CPMK", value: "katalog" },
  { label: "2. Konfigurasi Rubrik", value: "konfigurasi" },
];

const ROLE_OPTIONS: { value: MetopenRole; label: string; short: string; cap: number }[] = [
  { value: "supervisor", label: "Pembimbing (TA-03A)", short: "TA-03A", cap: 75 },
  { value: "default", label: "Koordinator Metopen (TA-03B)", short: "TA-03B", cap: 25 },
];

function WeightStatus({
  globalTotal,
  roleTotal,
  roleLabel,
  roleCap,
  cpmkCount,
  criteriaCount,
}: {
  globalTotal: number;
  roleTotal: number;
  roleLabel: string;
  roleCap: number;
  cpmkCount: number;
  criteriaCount: number;
}) {
  const globalOk = globalTotal === 100;
  const globalOver = globalTotal > 100;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div
        className={cn(
          "rounded-lg border px-3 py-2.5",
          globalOk && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30",
          globalOver && "border-destructive/40 bg-destructive/5",
          !globalOk && !globalOver && "bg-muted/20",
        )}
      >
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Total gabungan
        </p>
        <p
          className={cn(
            "mt-0.5 text-lg font-semibold tabular-nums",
            globalOk && "text-emerald-700 dark:text-emerald-400",
            globalOver && "text-destructive",
          )}
        >
          {globalTotal}
          <span className="text-sm font-normal text-muted-foreground"> / 100</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {globalOk
            ? "Bobot TA-03A + TA-03B sudah lengkap"
            : globalOver
              ? "Melebihi 100 — kurangi skor kriteria"
              : `Sisa ${100 - globalTotal} poin`}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {roleLabel}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">
          {roleTotal}
          <span className="text-sm font-normal text-muted-foreground"> / {roleCap}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {cpmkCount} CPMK · {criteriaCount} kriteria
          {roleTotal < roleCap ? ` · sisa ${roleCap - roleTotal}` : ""}
        </p>
      </div>
    </div>
  );
}

export function RubricMetopenManagementPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>("katalog");
  const [selectedRole, setSelectedRole] = useState<MetopenRole>("supervisor");

  const {
    cpmks = [],
    allMetopenCpmks = [],
    weightSummary,
    isLoading,
    isFetching,
    refetch,
    createCpmk,
    isCreatingCpmk,
    updateCpmk,
    isUpdatingCpmk,
    deleteCpmkMaster,
    isDeletingCpmkMaster,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    removeCpmkConfig,
    createRubric,
    updateRubric,
    deleteRubric,
    isDeletingCriteria,
    isRemovingCpmkConfig,
    isDeletingRubric,
    reorderCriteria,
    reorderRubrics,
  } = useRubricMetopen(selectedRole);

  const [addCpmkOpen, setAddCpmkOpen] = useState(false);
  const [selectedAddCpmkId, setSelectedAddCpmkId] = useState("");
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<MetopenCpmkWithRubrics | null>(
    null,
  );
  const [editCriteria, setEditCriteria] = useState<MetopenAssessmentCriteria | null>(null);
  const [localCpmkIds, setLocalCpmkIds] = useState<Record<MetopenRole, string[]>>({
    supervisor: [],
    default: [],
  });

  const roleOption = ROLE_OPTIONS.find((r) => r.value === selectedRole)!;
  const globalTotalScore = weightSummary?.globalTotalScore ?? 0;
  const roleTotalScore = weightSummary?.totalScore ?? 0;
  const remainingScore = roleOption.cap - roleTotalScore;
  const currentLocalIds = localCpmkIds[selectedRole];

  const mergedCpmks = useMemo(() => {
    const backendIds = new Set(cpmks.map((cpmk) => cpmk.id));
    const localContainers = allMetopenCpmks
      .filter((cpmk) => currentLocalIds.includes(cpmk.id) && !backendIds.has(cpmk.id))
      .map((cpmk) => ({
        id: cpmk.id,
        code: cpmk.code,
        description: cpmk.description,
        displayOrder: 0,
        metopenAssessmentCriterias: [] as MetopenAssessmentCriteria[],
      }));
    return [...cpmks, ...localContainers].sort((a, b) => a.code.localeCompare(b.code));
  }, [allMetopenCpmks, cpmks, currentLocalIds]);

  const usedCpmkIds = useMemo(() => new Set(mergedCpmks.map((c) => c.id)), [mergedCpmks]);
  const availableForAdd = useMemo(
    () => allMetopenCpmks.filter((c) => !usedCpmkIds.has(c.id)),
    [allMetopenCpmks, usedCpmkIds],
  );

  const criteriaCount = weightSummary?.details.reduce((s, d) => s + d.criteriaCount, 0) ?? 0;

  const handleOpenAddCriteria = (cpmkId: string) => {
    setCriteriaTargetCpmk(mergedCpmks.find((c) => c.id === cpmkId) ?? null);
    setEditCriteria(null);
    setCriteriaDialogOpen(true);
  };

  const handleEditCriteria = (criteria: MetopenAssessmentCriteria, cpmk: MetopenCpmkWithRubrics) => {
    setCriteriaTargetCpmk(cpmk);
    setEditCriteria(criteria);
    setCriteriaDialogOpen(true);
  };

  const handleAddCpmk = () => {
    if (!selectedAddCpmkId) return;
    setLocalCpmkIds((prev) => ({
      ...prev,
      [selectedRole]: [...prev[selectedRole], selectedAddCpmkId],
    }));
    setSelectedAddCpmkId("");
    setAddCpmkOpen(false);
  };

  const handleDeleteCpmk = async (cpmkId: string) => {
    const isLocalOnly = currentLocalIds.includes(cpmkId) && !cpmks.some((c) => c.id === cpmkId);
    if (isLocalOnly) {
      setLocalCpmkIds((prev) => ({
        ...prev,
        [selectedRole]: prev[selectedRole].filter((id) => id !== cpmkId),
      }));
      return;
    }
    await removeCpmkConfig(cpmkId);
    setLocalCpmkIds((prev) => ({
      ...prev,
      [selectedRole]: prev[selectedRole].filter((id) => id !== cpmkId),
    }));
  };

  const purgeLocalRefs = (id: string) => {
    setLocalCpmkIds((prev) => ({
      supervisor: prev.supervisor.filter((itemId) => itemId !== id),
      default: prev.default.filter((itemId) => itemId !== id),
    }));
  };

  return (
    <div className="space-y-4">
      <LocalTabsNav
        tabs={PANEL_TABS}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as PanelTab)}
      />

      {activeTab === "katalog" ? (
        <div className="space-y-4">
          <MetopenCpmkCatalog
            items={allMetopenCpmks}
            onCreate={createCpmk}
            onUpdate={updateCpmk}
            onDelete={async (id) => {
              await deleteCpmkMaster(id);
              purgeLocalRefs(id);
            }}
            isCreating={isCreatingCpmk}
            isUpdating={isUpdatingCpmk}
            isDeleting={isDeletingCpmkMaster}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Susun rubrik penilaian</p>
              <p className="text-xs text-muted-foreground max-w-xl">
                Pilih role, masukkan CPMK dari katalog, lalu isi kriteria dan level skor.
                CPMK yang sama boleh dipakai di TA-03A dan TA-03B.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setAddCpmkOpen(true)}
              disabled={allMetopenCpmks.length === 0}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Masukkan CPMK
            </Button>
          </div>

          {allMetopenCpmks.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-8 text-center">
              <p className="text-sm font-medium">Katalog masih kosong</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Buat CPMK di tab Katalog terlebih dahulu, lalu kembali ke sini untuk menyusun
                rubrik.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab("katalog")}
              >
                Buka Katalog CPMK
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Role penilaian:</span>
                <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRole(opt.value)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        selectedRole === opt.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Maks {roleOption.cap}
                </Badge>
              </div>

              {weightSummary ? (
                <WeightStatus
                  globalTotal={globalTotalScore}
                  roleTotal={roleTotalScore}
                  roleLabel={roleOption.short}
                  roleCap={roleOption.cap}
                  cpmkCount={weightSummary.details.length}
                  criteriaCount={criteriaCount}
                />
              ) : null}

              <MetopenCriteriaTable
                data={mergedCpmks}
                isLoading={isLoading}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                onAddCriteria={handleOpenAddCriteria}
                onEditCriteria={handleEditCriteria}
                onDeleteCriteria={deleteCriteria}
                onDeleteCpmk={handleDeleteCpmk}
                onCreateRubric={createRubric}
                onUpdateRubric={updateRubric}
                onDeleteRubric={deleteRubric}
                onReorderCriteria={reorderCriteria}
                onReorderRubrics={reorderRubrics}
                isDeletingCriteria={isDeletingCriteria}
                isRemovingCpmk={isRemovingCpmkConfig}
                isDeletingRubric={isDeletingRubric}
                onGoToCatalog={() => setActiveTab("katalog")}
                catalogCount={allMetopenCpmks.length}
              />
            </>
          )}
        </div>
      )}

      <MetopenCriteriaFormDialog
        open={criteriaDialogOpen}
        onOpenChange={setCriteriaDialogOpen}
        cpmkId={criteriaTargetCpmk?.id ?? ""}
        cpmkCode={criteriaTargetCpmk?.code ?? "-"}
        role={selectedRole}
        editData={editCriteria}
        remainingScore={
          editCriteria ? remainingScore + (editCriteria.maxScore || 0) : remainingScore
        }
        onSubmit={
          editCriteria
            ? (data: UpdateCriteriaPayload) => updateCriteria(editCriteria.id, data)
            : createCriteria
        }
      />

      <Dialog
        open={addCpmkOpen}
        onOpenChange={(open) => {
          setAddCpmkOpen(open);
          if (!open) setSelectedAddCpmkId("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Masukkan CPMK ke {roleOption.short}</DialogTitle>
            <DialogDescription>
              Pilih dari katalog master. Setelah masuk, tambahkan kriteria penilaian untuk role
              ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={selectedAddCpmkId} onValueChange={setSelectedAddCpmkId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih CPMK...">
                  {selectedAddCpmkId
                    ? availableForAdd.find((cpmk) => cpmk.id === selectedAddCpmkId)?.code
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-(--radix-select-trigger-width)">
                {availableForAdd.map((cpmk) => (
                  <SelectItem
                    key={cpmk.id}
                    value={cpmk.id}
                    className="h-auto items-start py-2.5 whitespace-normal"
                  >
                    <span className="flex flex-col gap-0.5 pr-1 text-left">
                      <span className="font-medium leading-none">{cpmk.code}</span>
                      <span className="text-xs leading-snug text-muted-foreground line-clamp-2">
                        {cpmk.description}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableForAdd.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Semua CPMK katalog sudah masuk konfigurasi role ini.
              </p>
            ) : null}

            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-xs"
              onClick={() => {
                setAddCpmkOpen(false);
                setActiveTab("katalog");
              }}
            >
              <Link2 className="mr-1.5 h-3 w-3" />
              Kelola katalog CPMK
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCpmkOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleAddCpmk} disabled={!selectedAddCpmkId}>
              <Plus className="mr-2 h-4 w-4" />
              Masukkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
