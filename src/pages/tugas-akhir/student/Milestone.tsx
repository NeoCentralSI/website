import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import { getStudentSupervisors } from "@/services/studentGuidance.service";

import {
  MilestoneList,
  MilestoneFormDialog,
  TemplateSelectorDialog,
  DeleteMilestoneDialog,
} from "@/components/milestone";

import {
  useMilestones,
  useTemplates,
  useCreateMilestone,
  useCreateFromTemplates,
  useUpdateMilestone,
  useDeleteMilestone,
  useUpdateProgress,
  useSubmitForReview,
} from "@/hooks/milestone";

import type {
  Milestone,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "@/types/milestone.types";

export default function StudentMilestonePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  // Get thesisId from supervisors endpoint
  const { data: supervisorsData, isLoading: isLoadingSupervisors, error: supervisorsError } = useQuery({
    queryKey: ["student-supervisors"],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId || "";
  const hasThesis = !supervisorsError && !!thesisId;

  // Milestones data
  const { data: milestonesData, isLoading: isLoadingMilestones } = useMilestones(thesisId);
  const milestones = milestonesData?.milestones ?? [];
  const progress = milestonesData?.progress ?? null;
  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplates();

  // Mutations
  const createMutation = useCreateMilestone(thesisId);
  const createFromTemplatesMutation = useCreateFromTemplates(thesisId);
  const updateMutation = useUpdateMilestone(thesisId);
  const deleteMutation = useDeleteMilestone(thesisId);
  const updateProgressMutation = useUpdateProgress(thesisId);
  const submitForReviewMutation = useSubmitForReview(thesisId);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" }, 
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, 
      { label: "Milestone" }
    ],
    []
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
        }
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

  const handleTemplateSubmit = (templateIds: string[]) => {
    createFromTemplatesMutation.mutate(
      { templateIds },
      {
        onSuccess: (data) => {
          toast.success(`${data.length} milestone berhasil dibuat dari template`);
          setTemplateDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Gagal membuat milestone dari template");
        },
      }
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
    updateProgressMutation.mutate(
      { milestoneId: milestone.id, data: { progressPercentage: newProgress } },
      {
        onSuccess: () => {
          toast.success("Progress berhasil diperbarui");
        },
        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui progress");
        },
      }
    );
  };

  const handleSubmitReview = (milestone: Milestone) => {
    submitForReviewMutation.mutate(
      { milestoneId: milestone.id },
      {
        onSuccess: () => {
          toast.success("Milestone berhasil diajukan untuk review");
        },
        onError: (error) => {
          toast.error(error.message || "Gagal mengajukan milestone untuk review");
        },
      }
    );
  };

  const isLoading = isLoadingSupervisors || isLoadingMilestones;

  // If no thesis or error
  if (!isLoading && !hasThesis) {
    return (
      <div className="p-4">
        <TabsNav
          preserveSearch
          tabs={[
            { label: "Bimbingan", to: "/tugas-akhir/bimbingan/student", end: true },
            { label: "Pembimbing", to: "/tugas-akhir/bimbingan/supervisors" },
            { label: "Milestone", to: "/tugas-akhir/bimbingan/milestone" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Belum Terdaftar Tugas Akhir</h3>
          <p className="text-muted-foreground max-w-sm">
            {supervisorsError 
              ? `Terjadi kesalahan: ${(supervisorsError as Error).message}`
              : "Anda belum terdaftar dalam tugas akhir. Hubungi admin atau pembimbing untuk mendaftarkan tugas akhir Anda."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: "Bimbingan", to: "/tugas-akhir/bimbingan/student", end: true },
          { label: "Pembimbing", to: "/tugas-akhir/bimbingan/supervisors" },
          { label: "Milestone", to: "/tugas-akhir/bimbingan/milestone" },
        ]}
      />

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
        onSubmitReview={handleSubmitReview}
      />

      {/* Create/Edit Dialog */}
      <MilestoneFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        milestone={selectedMilestone}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
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

      {/* Delete Confirmation Dialog */}
      <DeleteMilestoneDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        milestone={selectedMilestone}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
