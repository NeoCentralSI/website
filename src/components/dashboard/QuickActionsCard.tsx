import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  FileCheck,
  Send,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/shared/useRole";
import {
  getPendingApproval,
  getPendingRequests,
  getSupervisor2Requests,
} from "@/services/lecturerGuidance.service";
import { assessmentService } from "@/services/assessment.service";
import { advisorRequestService } from "@/services/advisorRequest.service";
import { metopenTitleService } from "@/services/metopenTitle.service";
import { useLottie } from 'lottie-react';
import completeAnimation from '@/assets/lottie/complete.json';

const completeLottieOptions = {
  animationData: completeAnimation,
  loop: true,
  autoplay: true,
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  link: string;
  loading: boolean;
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
  const { isKadep, isPembimbing } = useRole();
  const showKadepActions = isKadep();
  const showSupervisorActions = isPembimbing();

  const { data: supervisor2RequestsData, isLoading: loadingSupervisor2 } = useQuery({
    queryKey: ["supervisor2-requests-count"],
    queryFn: () => getSupervisor2Requests(),
    enabled: showSupervisorActions,
  });

  const { data: pendingRequestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ["lecturer-pending-requests-count"],
    queryFn: () => getPendingRequests({ pageSize: 100 }),
    enabled: showSupervisorActions,
  });

  const { data: pendingApprovalsData, isLoading: loadingApprovals } = useQuery({
    queryKey: ["lecturer-pending-approvals-count"],
    queryFn: () => getPendingApproval({ pageSize: 100 }),
    enabled: showSupervisorActions,
  });

  const { data: supervisorScoringQueue, isLoading: loadingSupervisorScoring } = useQuery({
    queryKey: ["supervisor-scoring-queue"],
    queryFn: () => assessmentService.getSupervisorScoringQueue(),
    enabled: showSupervisorActions,
  });

  const { data: kadepQueue, isLoading: loadingKadepQueue } = useQuery({
    queryKey: ["dashboard-kadep-queue"],
    queryFn: async () => (await advisorRequestService.getKadepQueue()).data,
    enabled: showKadepActions,
  });

  const { data: pendingTitleReports = [], isLoading: loadingTitleReports } = useQuery({
    queryKey: ["dashboard-kadep-title-reports"],
    queryFn: async () => (await metopenTitleService.getPendingTitleReports()).data,
    enabled: showKadepActions,
  });

  const pendingSupervisor2Count = supervisor2RequestsData?.length || 0;
  const pendingRequestsCount = pendingRequestsData?.total || 0;
  const pendingApprovalsCount = pendingApprovalsData?.total || 0;
  const pendingSupervisorScoringCount = supervisorScoringQueue?.length || 0;
  const pendingKadepEscalatedCount = kadepQueue?.escalated?.length || 0;
  const pendingTitleReportCount = pendingTitleReports.length;

  const firstPendingApprovalId = pendingApprovalsData?.guidances?.[0]?.id;
  const firstSupervisorScoringThesisId = supervisorScoringQueue?.[0]?.thesisId;

  const supervisorActions: QuickAction[] = showSupervisorActions
    ? [
        {
          id: "pending-supervisor2",
          title: "Approval Pembimbing",
          description: "Approve permintaan Pembimbing 2",
          count: pendingSupervisor2Count,
          icon: UserPlus,
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          link: "/tugas-akhir/bimbingan/lecturer/my-students",
          loading: loadingSupervisor2,
        },
        {
          id: "pending-requests",
          title: "Permintaan Bimbingan",
          description: "Konfirmasi jadwal bimbingan mahasiswa",
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
          description: "Review ringkasan sesi yang diajukan mahasiswa",
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
          id: "pending-ta03a",
          title: "Penilaian TA-03A",
          description: "Proposal final yang menunggu nilai pembimbing",
          count: pendingSupervisorScoringCount,
          icon: ShieldCheck,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          link: firstSupervisorScoringThesisId
            ? `/tugas-akhir/bimbingan/lecturer/my-students/${firstSupervisorScoringThesisId}`
            : "/tugas-akhir/bimbingan/lecturer/my-students",
          loading: loadingSupervisorScoring,
        },
      ]
    : [];

  const kadepActions: QuickAction[] = showKadepActions
    ? [
        {
          id: "kadep-escalated",
          title: "Keputusan TA-01 / TA-02",
          description: "Validasi kuota merah dan penetapan jalur departemen",
          count: pendingKadepEscalatedCount,
          icon: ShieldCheck,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          link: "/kelola/tugas-akhir/kadep/pembimbing",
          loading: loadingKadepQueue,
        },
        {
          id: "kadep-title-reports",
          title: "Pengesahan TA-04",
          description: "Review proposal yang siap disahkan KaDep",
          count: pendingTitleReportCount,
          icon: Send,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          link: "/kelola/tugas-akhir/kadep/pengesahan-judul",
          loading: loadingTitleReports,
        },
      ]
    : [];

  const quickActions = [...kadepActions, ...supervisorActions];
  const totalPending = quickActions.reduce((sum, action) => sum + action.count, 0);
  const isLoading = quickActions.some((action) => action.loading);

  if (quickActions.length === 0) {
    return null;
  }

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
      <CardContent className="flex-1 p-0 overflow-hidden">
        {isLoading ? (
          <div className="px-6 pb-6">
            <Loading text="Memuat aksi cepat..." className="py-4" size="sm" />
          </div>
        ) : totalPending === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground px-6">
            <CompleteLottie size="w-24 h-24" />
            <p className="font-medium mt-2">Semua Selesai!</p>
            <p className="text-sm">Tidak ada antrean persetujuan yang aktif.</p>
          </div>
        ) : (
          <ScrollArea className="h-full max-h-100">
            <div className="space-y-3 px-6 pb-6">
              {quickActions.map((action) => (
                <Link key={action.id} to={action.link}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all",
                      "hover:shadow-md hover:border-primary/50 cursor-pointer",
                      action.count > 0 ? "border-primary/20" : "border-border opacity-60",
                    )}
                  >
                    <div className={cn("p-2 rounded-lg shrink-0", action.bgColor)}>
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
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
