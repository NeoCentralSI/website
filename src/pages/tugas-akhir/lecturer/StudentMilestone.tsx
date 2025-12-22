import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toTitleCaseName } from "@/lib/text";

import {
  MilestoneList,
  ValidationDialog,
  FeedbackDialog,
} from "@/components/milestone";

import {
  useMilestones,
  useValidateMilestone,
  useRequestRevision,
  useAddFeedback,
} from "@/hooks/milestone";

import { getMyStudents } from "@/services/lecturerGuidance.service";

import type { Milestone } from "@/types/milestone.types";

export default function LecturerStudentMilestonePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  // Get student info and thesisId
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["lecturer-my-students"],
    queryFn: () => getMyStudents(),
  });

  // Find student
  const student = useMemo(
    () => studentsData?.students?.find((s) => s.studentId === studentId),
    [studentsData, studentId]
  );

  const thesisId = student?.thesisId || "";

  // Milestones data
  const { data: milestonesData, isLoading: isLoadingMilestones } = useMilestones(thesisId);
  const milestones = milestonesData?.milestones ?? [];
  const progress = milestonesData?.progress ?? null;

  // Supervisor mutations
  const validateMutation = useValidateMilestone(thesisId);
  const revisionMutation = useRequestRevision(thesisId);
  const feedbackMutation = useAddFeedback(thesisId);

  // Dialog states
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" },
      { label: "Bimbingan" },
      { label: "Mahasiswa" },
      { label: student ? toTitleCaseName(student.fullName) : "Milestone" },
    ],
    [student]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Handlers
  const handleValidate = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setValidationDialogOpen(true);
  };

  const handleRequestRevision = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setValidationDialogOpen(true);
  };

  const handleAddFeedback = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setFeedbackDialogOpen(true);
  };

  const handleValidationSubmit = (data: { isValid: boolean; notes?: string }) => {
    if (!selectedMilestone) return;

    if (data.isValid) {
      validateMutation.mutate(
        { milestoneId: selectedMilestone.id, data: { supervisorNotes: data.notes } },
        {
          onSuccess: () => {
            toast.success("Milestone berhasil divalidasi");
            setValidationDialogOpen(false);
            setSelectedMilestone(null);
          },
          onError: (error) => {
            toast.error(error.message || "Gagal memvalidasi milestone");
          },
        }
      );
    } else {
      revisionMutation.mutate(
        { milestoneId: selectedMilestone.id, data: { revisionNotes: data.notes || "" } },
        {
          onSuccess: () => {
            toast.success("Permintaan revisi berhasil dikirim");
            setValidationDialogOpen(false);
            setSelectedMilestone(null);
          },
          onError: (error) => {
            toast.error(error.message || "Gagal meminta revisi");
          },
        }
      );
    }
  };

  const handleFeedbackSubmit = (notes: string) => {
    if (!selectedMilestone) return;

    feedbackMutation.mutate(
      { milestoneId: selectedMilestone.id, data: { feedback: notes } },
      {
        onSuccess: () => {
          toast.success("Feedback berhasil ditambahkan");
          setFeedbackDialogOpen(false);
          setSelectedMilestone(null);
        },
        onError: (error) => {
          toast.error(error.message || "Gagal menambahkan feedback");
        },
      }
    );
  };

  const isLoading = isLoadingStudents || isLoadingMilestones;

  // If student not found
  if (!isLoading && !student) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/tugas-akhir/bimbingan/lecturer/my-students")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Mahasiswa Tidak Ditemukan</h3>
          <p className="text-muted-foreground max-w-sm">
            Mahasiswa dengan ID tersebut tidak ditemukan atau Anda tidak memiliki
            akses ke mahasiswa ini.
          </p>
        </div>
      </div>
    );
  }

  // If no thesis
  if (!isLoading && !thesisId) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/tugas-akhir/bimbingan/lecturer/my-students")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Tugas Akhir Tidak Ditemukan</h3>
          <p className="text-muted-foreground max-w-sm">
            Mahasiswa ini belum memiliki tugas akhir yang terdaftar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/tugas-akhir/bimbingan/lecturer/my-students")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            Milestone: {student ? toTitleCaseName(student.fullName) : "-"}
          </h1>
          {student?.thesisTitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {student.thesisTitle}
            </p>
          )}
        </div>
      </div>

      <MilestoneList
        milestones={milestones}
        progress={progress ?? null}
        isLoading={isLoading}
        isOwner={false}
        isSupervisor={true}
        onValidate={handleValidate}
        onRequestRevision={handleRequestRevision}
        onAddFeedback={handleAddFeedback}
      />

      {/* Validation Dialog */}
      <ValidationDialog
        open={validationDialogOpen}
        onOpenChange={setValidationDialogOpen}
        milestone={selectedMilestone}
        isSubmitting={validateMutation.isPending || revisionMutation.isPending}
        onValidate={handleValidationSubmit}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        milestone={selectedMilestone}
        isSubmitting={feedbackMutation.isPending}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
