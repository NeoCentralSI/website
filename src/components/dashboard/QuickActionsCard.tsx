import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { 
  CheckCircle, 
  ClipboardCheck, 
  FileCheck, 
  ArrowRight,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingRequests, getPendingApproval } from "@/services/lecturerGuidance.service";
import { getMilestones, getSeminarReadinessStatus } from "@/services/milestone.service";
import { getMyStudents } from "@/services/lecturerGuidance.service";
import { useLottie } from 'lottie-react';
import completeAnimation from '@/assets/lottie/complete.json';

// Lottie options for complete animation
const completeLottieOptions = {
  animationData: completeAnimation,
  loop: true,
  autoplay: true,
};

function CompleteLottie({ size = "w-24 h-24" }: { size?: string }) {
  const { View, setSpeed } = useLottie(completeLottieOptions);
  
  React.useEffect(() => {
    setSpeed(0.5);
  }, [setSpeed]);

  return <div className={size}>{View}</div>;
}

interface QuickActionsCardProps {
  className?: string;
}

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  // Fetch pending guidance requests
  const { data: pendingRequestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ["lecturer-pending-requests-count"],
    queryFn: () => getPendingRequests({ pageSize: 100 }),
  });

  // Fetch pending summary approvals
  const { data: pendingApprovalsData, isLoading: loadingApprovals } = useQuery({
    queryKey: ["lecturer-pending-approvals-count"],
    queryFn: () => getPendingApproval({ pageSize: 100 }),
  });

  // Fetch students to get their milestones
  const { data: studentsData } = useQuery({
    queryKey: ["my-students-for-milestones"],
    queryFn: () => getMyStudents(),
  });

  // Fetch milestones for each student to check for 100% progress
  const { data: pendingMilestonesData, isLoading: loadingMilestones } = useQuery({
    queryKey: ["pending-milestone-validations"],
    queryFn: async () => {
      if (!studentsData?.students) return [];
      
      // Get all students' thesis IDs
      const studentsWithThesis = studentsData.students
        .filter((s: any) => !!s.thesisId)
        .map((s: any) => ({ studentId: s.studentId, thesisId: s.thesisId, fullName: s.fullName }));

      // Fetch milestones for each thesis
      const allMilestones = await Promise.all(
        studentsWithThesis.map(async (student: any) => {
          try {
            const result = await getMilestones(student.thesisId);
            return result.milestones.map((m: any) => ({
              ...m,
              thesisId: student.thesisId,
              studentId: student.studentId,
              studentName: student.fullName || '',
            }));
          } catch {
            return [];
          }
        })
      );

      // Flatten and filter for milestones that are 100% and waiting for validation
      const flatMilestones = allMilestones.flat();
      return flatMilestones.filter(
        (m: any) => m.progressPercentage === 100 && m.status === "in_progress"
      );
    },
    enabled: !!studentsData?.students,
  });

  // Fetch pending seminar readiness approvals
  const { data: pendingSeminarData, isLoading: loadingSeminar } = useQuery({
    queryKey: ["pending-seminar-approvals"],
    queryFn: async () => {
      if (!studentsData?.students) return [];
      
      // Get all students' thesis IDs
      const studentsWithThesis = studentsData.students
        .filter((s: any) => !!s.thesisId)
        .map((s: any) => ({ studentId: s.studentId, thesisId: s.thesisId, fullName: s.fullName }));

      // Fetch seminar readiness for each thesis
      const readinessStatuses = await Promise.all(
        studentsWithThesis.map(async (student: any) => {
          try {
            const result = await getSeminarReadinessStatus(student.thesisId);
            return {
              ...result,
              studentName: student.fullName,
            };
          } catch {
            return null;
          }
        })
      );

      // Filter for students where:
      // 1. Milestone is 100% complete
      // 2. Current user has not yet approved
      return readinessStatuses.filter(
        (r: any) => r && r.milestoneProgress?.isComplete && r.currentUserRole && !r.currentUserHasApproved
      );
    },
    enabled: !!studentsData?.students,
  });

  const pendingRequestsCount = pendingRequestsData?.total || 0;
  const pendingApprovalsCount = pendingApprovalsData?.total || 0;
  const pendingMilestonesCount = pendingMilestonesData?.length || 0;
  const pendingSeminarCount = pendingSeminarData?.length || 0;
  
  // Get first pending approval's guidanceId for direct link to session page
  const firstPendingApprovalId = pendingApprovalsData?.guidances?.[0]?.id;
  // Get first pending milestone's thesisId for direct link to student detail
  const firstPendingMilestoneThesisId = pendingMilestonesData?.[0]?.thesisId;
  // Get first pending seminar's thesisId for direct link
  const firstPendingSeminarThesisId = pendingSeminarData?.[0]?.thesisId;

  const totalPending = pendingRequestsCount + pendingApprovalsCount + pendingMilestonesCount + pendingSeminarCount;

  const quickActions = [
    {
      id: "pending-requests",
      title: "Permintaan Bimbingan",
      description: "Konfirmasi jadwal bimbingan",
      count: pendingRequestsCount,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/tugas-akhir/bimbingan/lecturer/requests",
      loading: loadingRequests,
    },
    {
      id: "pending-approvals",
      title: "Catatan Bimbingan",
      description: "Approve catatan dari mahasiswa",
      count: pendingApprovalsCount,
      icon: FileCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: firstPendingApprovalId 
        ? `/tugas-akhir/bimbingan/lecturer/session/${firstPendingApprovalId}`
        : "/tugas-akhir/bimbingan/lecturer/requests",
      loading: loadingApprovals,
    },
    {
      id: "pending-milestones",
      title: "Milestone Progress",
      description: "Validasi milestone 100%",
      count: pendingMilestonesCount,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: firstPendingMilestoneThesisId 
        ? `/tugas-akhir/bimbingan/lecturer/my-students/${firstPendingMilestoneThesisId}`
        : "/tugas-akhir/bimbingan/lecturer/my-students",
      loading: loadingMilestones,
    },
    {
      id: "pending-seminar",
      title: "Acc Seminar",
      description: "Approve kesiapan seminar",
      count: pendingSeminarCount,
      icon: GraduationCap,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      link: firstPendingSeminarThesisId 
        ? `/tugas-akhir/bimbingan/lecturer/my-students/${firstPendingSeminarThesisId}`
        : "/tugas-akhir/bimbingan/lecturer/my-students",
      loading: loadingSeminar,
    },
  ];

  const isLoading = loadingRequests || loadingApprovals || loadingMilestones || loadingSeminar;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Quick Actions
          {totalPending > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalPending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {isLoading ? (
          <Loading text="Memuat aksi cepat..." className="py-4" size="sm" />
        ) : totalPending === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CompleteLottie size="w-24 h-24" />
            <p className="font-medium mt-2">Semua Selesai!</p>
            <p className="text-sm">Tidak ada yang perlu di-approve</p>
          </div>
        ) : (
          quickActions.map((action) => (
            <Link key={action.id} to={action.link}>
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                "hover:shadow-md hover:border-primary/50 cursor-pointer",
                action.count > 0 ? "border-primary/20" : "border-border opacity-60"
              )}>
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  action.bgColor
                )}>
                  <action.icon className={cn("h-5 w-5", action.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                    {action.count > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
