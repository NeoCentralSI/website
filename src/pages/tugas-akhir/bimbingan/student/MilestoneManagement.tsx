import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { MilestoneList } from "@/components/milestone/MilestoneList";
import { useQuery } from "@tanstack/react-query";
import { getMyThesisDetail } from "@/services/studentGuidance.service";
import { useMilestoneManagement, useTemplates } from "@/hooks/milestone";
import { Loading } from "@/components/ui/spinner";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Milestone, MilestoneStatus, CreateMilestoneDto, UpdateMilestoneDto } from "@/types/milestone.types";
import { TabsNav } from "@/components/ui/tabs-nav";
import { MilestoneFormDialog, TemplateSelectorDialog } from "@/components/milestone";

export default function StudentMilestoneManagement() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tugas Akhir", href: "/tugas-akhir" },
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan/student" },
      { label: "Milestone" },
    ]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  const { data: thesisDetail, isLoading: isLoadingThesis } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
  });

  const thesisId = thesisDetail?.id || "";

  const {
    milestones,
    progress,
    isLoading,
    updateStatus,
    updateProgress,
    updateMilestone,
    deleteMilestone,
    reorderMilestones,
    submitForReview,
    createMilestone,
    createFromTemplates,
  } = useMilestoneManagement(thesisId);

  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplates();

  const handleStatusChange = (milestone: Milestone, status: Exclude<MilestoneStatus, "completed">) => {
    if (status === "pending_review") {
      submitForReview({ milestoneId: milestone.id });
    } else {
      updateStatus({ milestoneId: milestone.id, data: { status } });
    }
  };

  const handleProgressChange = (milestone: Milestone, newProgress: number) => {
    updateProgress({ milestoneId: milestone.id, data: { progressPercentage: newProgress } });
  };

  if (isLoadingThesis) {
    return <Loading size="lg" text="Memuat data tugas akhir..." />;
  }

  if (!thesisId) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal Memuat</AlertTitle>
        <AlertDescription>Tugas Akhir aktif tidak ditemukan.</AlertDescription>
      </Alert>
    );
  }

  const guidancePhase = thesisDetail?.isProposal ? 'proposal' : 'thesis';
  const phaseLabel = guidancePhase === 'proposal' ? 'Logbook Proposal' : 'Logbook Tugas Akhir';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Milestone Tugas Akhir</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${guidancePhase === 'proposal' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {phaseLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Kelola target pencapaian dan progres Tugas Akhir Anda</p>
      </div>

      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/student/milestone', end: true },
        ]}
      />

      <MilestoneList
        milestones={milestones}
        progress={progress}
        isLoading={isLoading}
        isOwner={true}
        isSupervisor={false}
        onStatusChange={handleStatusChange}
        onProgressChange={handleProgressChange}
        onCreateNew={() => {
          setSelectedMilestone(null);
          setFormDialogOpen(true);
        }}
        onCreateFromTemplates={() => setTemplateDialogOpen(true)}
        onEdit={(m) => {
          setSelectedMilestone(m);
          setFormDialogOpen(true);
        }}
        onDelete={(m) => deleteMilestone(m.id)}
        onReorder={(orders) => reorderMilestones({ milestoneOrders: orders })}
      />

      <MilestoneFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        milestone={selectedMilestone || undefined}
        onSubmit={(data) => {
          if (selectedMilestone) {
            updateMilestone({ milestoneId: selectedMilestone.id, data: data as UpdateMilestoneDto });
            setFormDialogOpen(false);
            setSelectedMilestone(null);
          } else {
            createMilestone(data as CreateMilestoneDto);
            setFormDialogOpen(false);
          }
        }}
      />

      <TemplateSelectorDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates || []}
        isLoading={isLoadingTemplates}
        onSubmit={(templateIds, topicId) => {
          createFromTemplates({ templateIds, topicId });
          setTemplateDialogOpen(false);
        }}
      />
    </div>
  );
}
