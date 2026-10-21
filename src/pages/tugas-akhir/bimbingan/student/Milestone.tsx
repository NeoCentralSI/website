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
import { ThesisClosedAlert } from "@/components/thesis/ThesisClosedAlert";
import { ThesisActionBlockedAlert } from "@/components/thesis/ThesisActionBlockedAlert";
import { ThesisPhaseBadge } from "@/components/shared/ThesisPhaseBadge";
import { getGuidanceActionBlockReason, type ThesisPhase } from "@/lib/thesisLabels";

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

  const { data: thesisDetail, isError: isThesisDetailError } = useQuery({
    queryKey: ["my-thesis-detail"],

    queryFn: getMyThesisDetail,

    enabled: hasThesis,
  });

  // The detail endpoint answers 404 only when the student has no thesis at all.
  const isNotInThesisPhase = isThesisDetailError;
  // The current phase is editable; the other phase is listed below, read-only.
  const currentPhase: ThesisPhase = thesisDetail?.currentPhase ?? "research";
  const otherPhase: ThesisPhase = currentPhase === "proposal" ? "research" : "proposal";

  // A stopped or finished thesis keeps its milestones visible,
  // read-only, under a ribbon with the day it was closed.
  const closedStatus = thesisDetail?.status === "failed" || thesisDetail?.status === "completed" ? thesisDetail.status : null;
  const isThesisStopped = !!closedStatus;

  // Milestone writes for `research`, or `proposal` after Penetapan Pembimbing;
  // buttons stay visible but disabled with the reason.
  const actionBlockReason = thesisDetail
    ? getGuidanceActionBlockReason(thesisDetail.status, "Anda", {
        repeatingProposal: thesisDetail.repeatingProposal,
        proposalPhaseOpen: thesisDetail.proposalPhaseOpen,
      })
    : null;

  // Milestones data

  const { data: milestonesData, isLoading: isLoadingMilestones } =
    useMilestones(thesisId, undefined, currentPhase, !!thesisDetail);

  const { data: otherPhaseData } = useMilestones(thesisId, undefined, otherPhase, !!thesisDetail);

  const milestones = milestonesData?.milestones ?? [];

  const progress = milestonesData?.progress ?? null;

  // Proposal templates are general; thesis-phase templates follow the topic.
  const { data: templates = [], isLoading: isLoadingTemplates } =
    useTemplates(undefined, { phase: currentPhase, enabled: !!thesisDetail });

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

    setTitle("Milestone Tugas Akhir");
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

  // The milestone lists wait for the thesis detail, which says the current phase.
  const isLoading = isLoadingSupervisors || isLoadingMilestones || (hasThesis && !thesisDetail && !isThesisDetailError);

  // Define tabs for reuse

  const tabs = [
    { label: "Bimbingan", to: "/tugas-akhir/bimbingan/student", end: true },

    { label: "Milestone", to: "/tugas-akhir/bimbingan/student/milestone" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
          Milestone Tugas Akhir
          {thesisDetail && <ThesisPhaseBadge phase={currentPhase} />}
        </h1>
        <p className="text-muted-foreground">Target dan capaian tugas akhir pada fase berjalan</p>
      </div>

      <TabsNav preserveSearch tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data milestone..." />
        </div>
      ) : !hasThesis || isNotInThesisPhase ? (
        <RequirementsNotMet
          title="Belum Ada Tugas Akhir"
          description="Milestone tersedia setelah Anda memiliki tugas akhir dan pembimbing."
          requirements={[
            {
              label: "Pengajuan pembimbing disetujui",
              met: false,
              description:
                "Ajukan pembimbing di Tugas Akhir > Proposal. Milestone fase proposal terbuka setelah Ketua Departemen menerbitkan Penetapan Pembimbing.",
            },
          ]}
          homeUrl="/dashboard"
        />
      ) : (
        <>
          {(
            <>
              {/* Readiness cards removed, now only shown in Overview */}

              {closedStatus ? (
                <ThesisClosedAlert status={closedStatus} closedAt={closedStatus === "failed" ? thesisDetail?.terminatedAt : thesisDetail?.completedAt} />
              ) : (
                <ThesisActionBlockedAlert reason={actionBlockReason} />
              )}

              <MilestoneList
                milestones={milestones}
                progress={progress ?? null}
                isLoading={isLoading}
                isOwner={!isThesisStopped}
                isSupervisor={false}
                onCreateNew={handleCreateNew}
                onCreateFromTemplates={handleCreateFromTemplates}
                createDisabledReason={actionBlockReason}
                templateDisabledReason={
                  currentPhase === "research" && thesisDetail && !thesisDetail.topic
                    ? "Tugas akhir Anda belum memiliki topik, sehingga template belum dapat dipasang. Topik diisi oleh Admin/Sekretaris Departemen melalui Data Master Tugas Akhir."
                    : null
                }
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
                readOnlyMilestones={otherPhaseData?.milestones ?? []}
                readOnlyPhase={otherPhase}
                currentPhase={currentPhase}
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
                thesisTopicId={thesisDetail?.topic?.id ?? null}
                thesisTopicName={thesisDetail?.topic?.name ?? null}
                isLoading={isLoadingTemplates}
                isSubmitting={createFromTemplatesMutation.isPending}
                onSubmit={handleTemplateSubmit}
                generalOnly={currentPhase === "proposal"}
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
