import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import {
  getStudentSupervisors,
  getMyThesisDetail,
} from "@/services/studentGuidance.service";
import { Loading } from "@/components/ui/spinner";
import {
  MilestoneList,
  MilestoneFormDialog,
  TemplateSelectorDialog,
  DeleteMilestoneDialog,
  SeminarReadinessStatusCard,
  TargetDateDialog,
} from "@/components/milestone";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import {
  useMilestones,
  useTemplates,
  useCreateMilestone,
  useCreateFromTemplates,
  useUpdateMilestone,
  useDeleteMilestone,
  useUpdateProgress,
  useUpdateStatus,
  useReorderMilestones,
} from "@/hooks/milestone";

import type {
  Milestone,
  MilestoneStatus,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "@/types/milestone.types";

export default function StudentMilestonePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  // Get thesisId from supervisors endpoint

  const {
    data: supervisorsData,
    isLoading: isLoadingSupervisors,
    error: supervisorsError,
  } = useQuery({
    queryKey: ["student-supervisors"],

    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId || "";

  const hasThesis = !supervisorsError && !!thesisId;

  const { data: thesisDetail } = useQuery({
    queryKey: ["my-thesis-detail"],

    queryFn: getMyThesisDetail,

    enabled: hasThesis,
  });

  const isThesisInactive =
    thesisDetail?.status === "Gagal" ||
    thesisDetail?.status === "Dibatalkan" ||
    thesisDetail?.status === "Selesai";

  // Milestones data

  const { data: milestonesData, isLoading: isLoadingMilestones } =
    useMilestones(thesisId);

  const milestones = milestonesData?.milestones ?? [];

  const progress = milestonesData?.progress ?? null;

  const { data: templates = [], isLoading: isLoadingTemplates } =
    useTemplates();

  // Mutations

  const createMutation = useCreateMilestone(thesisId);

  const createFromTemplatesMutation = useCreateFromTemplates(thesisId);

  const updateMutation = useUpdateMilestone(thesisId);

  const deleteMutation = useDeleteMilestone(thesisId);

  const updateProgressMutation = useUpdateProgress(thesisId);

  const updateStatusMutation = useUpdateStatus(thesisId);

  const reorderMutation = useReorderMilestones(thesisId);

  // Dialog states

  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isBulkStarting, setIsBulkStarting] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [progressUpdatingId, setProgressUpdatingId] = useState<string | null>(
    null,
  );

  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const [milestoneToStart, setMilestoneToStart] = useState<Milestone | null>(
    null,
  );

  const [isStartingMilestone, setIsStartingMilestone] = useState(false);

  // Breadcrumbs

  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" },

      { label: "Bimbingan", href: "/tugas-akhir/bimbingan" },

      { label: "Milestone" },
    ],

    [],
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);

    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Handlers

  const handleCreateNew = () => {
    setSelectedMilestone(null);

    setFormDialogOpen(true);
  };

  const handleCreateFromTemplates = () => {
    setTemplateDialogOpen(true);
  };

  const handleEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone);

    setFormDialogOpen(true);
  };

  const handleDelete = (milestone: Milestone) => {
    setSelectedMilestone(milestone);

    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: CreateMilestoneDto | UpdateMilestoneDto) => {
    if (selectedMilestone) {
      updateMutation.mutate(
        { milestoneId: selectedMilestone.id, data: data as UpdateMilestoneDto },

        {
          onSuccess: () => {
            toast.success("Milestone berhasil diperbarui");

            setFormDialogOpen(false);

            setSelectedMilestone(null);
          },

          onError: (error) => {
            toast.error(error.message || "Gagal memperbarui milestone");
          },
        },
      );
    } else {
      createMutation.mutate(data as CreateMilestoneDto, {
        onSuccess: () => {
          toast.success("Milestone berhasil dibuat");

          setFormDialogOpen(false);
        },

        onError: (error) => {
          toast.error(error.message || "Gagal membuat milestone");
        },
      });
    }
  };

  const handleTemplateSubmit = (templateIds: string[], topicId: string) => {
    createFromTemplatesMutation.mutate(
      { templateIds, topicId },

      {
        onSuccess: (data) => {
          toast.success(
            `${data.length} milestone berhasil dibuat dari template`,
          );

          setTemplateDialogOpen(false);
        },

        onError: (error) => {
          toast.error(error.message || "Gagal membuat milestone dari template");
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedMilestone) return;

    deleteMutation.mutate(selectedMilestone.id, {
      onSuccess: () => {
        toast.success("Milestone berhasil dihapus");

        setDeleteDialogOpen(false);

        setSelectedMilestone(null);
      },

      onError: (error) => {
        toast.error(error.message || "Gagal menghapus milestone");
      },
    });
  };

  const handleProgressChange = (milestone: Milestone, newProgress: number) => {
    setProgressUpdatingId(milestone.id);

    updateProgressMutation.mutate(
      { milestoneId: milestone.id, data: { progressPercentage: newProgress } },

      {
        onSuccess: () => {
          toast.success("Progress berhasil diperbarui");
        },

        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui progress");
        },

        onSettled: () => {
          setProgressUpdatingId(null);
        },
      },
    );
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkStart = async () => {
    const eligible = milestones.filter(
      (m) => selectedIds.includes(m.id) && m.status === "not_started",
    );

    if (eligible.length === 0) {
      toast.error(
        "Hanya milestone berstatus Belum Mulai yang bisa dipilih untuk mulai",
      );

      return;
    }

    setIsBulkStarting(true);

    let successCount = 0;

    for (const m of eligible) {
      try {
        await updateStatusMutation.mutateAsync({
          milestoneId: m.id,

          data: { status: "in_progress" },
        });

        successCount += 1;
      } catch (err) {
        toast.error((err as Error).message || `Gagal memulai "${m.title}"`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} milestone dimulai`);
    }

    setIsBulkStarting(false);

    setSelectedIds([]);
  };

  const handleStatusChange = (
    milestone: Milestone,
    status: Exclude<MilestoneStatus, "completed">,
  ) => {
    if (status === "in_progress" && !milestone.targetDate) {
      setMilestoneToStart(milestone);

      setStartDialogOpen(true);

      return;
    }

    setStatusUpdatingId(milestone.id);

    updateStatusMutation.mutate(
      { milestoneId: milestone.id, data: { status } },

      {
        onSuccess: () => {
          toast.success("Status berhasil diperbarui");
        },

        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui status");
        },

        onSettled: () => {
          setStatusUpdatingId(null);
        },
      },
    );
  };

  const handleConfirmStart = async (targetDate: Date) => {
    if (!milestoneToStart) return;

    setIsStartingMilestone(true);

    try {
      // First update the target date

      await updateMutation.mutateAsync({
        milestoneId: milestoneToStart.id,

        data: { targetDate: targetDate.toISOString() },
      });

      // Then update the status

      await updateStatusMutation.mutateAsync({
        milestoneId: milestoneToStart.id,

        data: { status: "in_progress" },
      });

      toast.success("Milestone berhasil dimulai");

      setStartDialogOpen(false);

      setMilestoneToStart(null);
    } catch (error) {
      toast.error((error as Error).message || "Gagal memulai milestone");
    } finally {
      setIsStartingMilestone(false);
    }
  };

  const handleReorder = (orders: { id: string; orderIndex: number }[]) => {
    reorderMutation.mutate(
      { milestoneOrders: orders },

      {
        onError: (error) => {
          toast.error(error.message || "Gagal mengubah urutan milestone");
        },
      },
    );
  };

  const isLoading = isLoadingSupervisors || isLoadingMilestones;

  // Define tabs for reuse

  const tabs = [
    { label: "Bimbingan", to: "/tugas-akhir/bimbingan/student", end: true },

    { label: "Milestone", to: "/tugas-akhir/bimbingan/student/milestone" },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Milestone Tugas Akhir</h1>

          <p className="text-gray-500">Target dan capaian tugas akhir</p>
        </div>
      </div>

      <TabsNav preserveSearch tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data milestone..." />
        </div>
      ) : !hasThesis || thesisDetail?.isProposal ? (
        <RequirementsNotMet
          title="Syarat Mata Kuliah Belum Terpenuhi"
          description="Anda belum memenuhi persyaratan untuk mengambil mata kuliah Tugas Akhir."
          requirements={[
            {
              label: "Mengambil mata kuliah Tugas Akhir",

              met: false,

              description:
                "Anda harus tercatat mengambil mata kuliah Tugas Akhir (proposal disetujui).",
            },
          ]}
          homeUrl="/dashboard"
        />
      ) : (
        <>
          {isThesisInactive ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold mb-2">
                Tugas Akhir Tidak Aktif
              </h3>

              <p className="text-muted-foreground">
                Status tugas akhir Anda saat ini adalah{" "}
                <strong>{thesisDetail?.status}</strong>. Anda tidak dapat
                mengakses fitur milestone.
              </p>
            </div>
          ) : (
            <>
              {/* Seminar Readiness Status for Student */}

              {thesisId && (
                <SeminarReadinessStatusCard
                  thesisId={thesisId}
                  className="mb-4"
                />
              )}

              <MilestoneList
                milestones={milestones}
                progress={progress ?? null}
                isLoading={isLoading}
                isOwner={true}
                isSupervisor={false}
                onCreateNew={handleCreateNew}
                onCreateFromTemplates={handleCreateFromTemplates}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onProgressChange={handleProgressChange}
                onStatusChange={handleStatusChange}
                isProgressUpdating={updateProgressMutation.isPending}
                progressUpdatingId={progressUpdatingId}
                statusUpdatingId={statusUpdatingId}
                onReorder={handleReorder}
                isReordering={reorderMutation.isPending}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onClearSelection={() => setSelectedIds([])}
                onBulkStart={handleBulkStart}
                isBulkStarting={isBulkStarting}
              />

              {/* Create/Edit Dialog */}

              <MilestoneFormDialog
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                milestone={selectedMilestone}
                onSubmit={handleFormSubmit}
                isSubmitting={
                  createMutation.isPending || updateMutation.isPending
                }
                hideTargetDateOnEdit
              />

              {/* Template Selector Dialog */}

              <TemplateSelectorDialog
                open={templateDialogOpen}
                onOpenChange={setTemplateDialogOpen}
                templates={templates}
                isLoading={isLoadingTemplates}
                isSubmitting={createFromTemplatesMutation.isPending}
                onSubmit={handleTemplateSubmit}
              />

              {/* Start Milestone Target Date Dialog */}

              <TargetDateDialog
                open={startDialogOpen}
                onOpenChange={setStartDialogOpen}
                milestoneTitle={milestoneToStart?.title || ""}
                onSubmit={handleConfirmStart}
                isSubmitting={isStartingMilestone}
              />

              {/* Delete Confirmation Dialog */}

              <DeleteMilestoneDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                milestone={selectedMilestone}
                isDeleting={deleteMutation.isPending}
                onConfirm={handleConfirmDelete}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
