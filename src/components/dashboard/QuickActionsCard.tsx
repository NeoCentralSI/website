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
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  Users,
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
import { getSupervisorQueue } from "@/services/research-method/research-method.service";
import { getKadepQueue, getLecturerInbox } from "@/services/thesis-proposal/supervisor-request.service";
import { getAssignmentOverview } from "@/services/thesis-proposal/supervisor-assignment.service";
import { useLottie } from 'lottie-react';
import completeAnimation from '@/assets/lottie/complete.json';
import { useActiveAcademicYear } from "@/hooks/shared/useActiveAcademicYear";

const completeLottieOptions = {
  animationData: completeAnimation,
  loop: true,
  autoplay: true,
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  /** Items waiting; null for a plain shortcut (never dimmed, not in the total). */
  count: number | null;
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
  const { isKadep, isPembimbing, isAdmin } = useRole();
  const showAdminActions = isAdmin();
  const showKadepActions = isKadep();
  const showSupervisorActions = isPembimbing();
  const { academicYear } = useActiveAcademicYear();

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

  const { data: supervisorQueue, isLoading: loadingSupervisorScoring } = useQuery({
    queryKey: ["research-method", "supervisor-queue", academicYear?.id ?? "current"],
    queryFn: () => getSupervisorQueue(academicYear!.id),
    enabled: showSupervisorActions && Boolean(academicYear?.id),
  });

  const { data: kadepQueue, isLoading: loadingKadepQueue } = useQuery({
    queryKey: ["thesis-proposal", "supervisor-requests", "kadep"],
    queryFn: getKadepQueue,
    enabled: showKadepActions,
  });

  const { data: assignmentOverview, isLoading: loadingAssignment } = useQuery({
    queryKey: ["thesis-proposal", "supervisor-assignments", "current"],
    queryFn: () => getAssignmentOverview(),
    enabled: showKadepActions,
  });

  const { data: supervisorInbox, isLoading: loadingSupervisorInbox } = useQuery({
    queryKey: ["thesis-proposal", "supervisor-requests", "inbox"],
    queryFn: getLecturerInbox,
    enabled: showSupervisorActions,
  });

  const pendingSupervisor2Count = supervisor2RequestsData?.length || 0;
  const pendingRequestsCount = pendingRequestsData?.total || 0;
  const pendingApprovalsCount = pendingApprovalsData?.total || 0;
  const pendingSupervisorScoringCount = supervisorQueue?.rows?.filter((row) => row.canScore).length || 0;
  const pendingKadepCount = (kadepQueue?.department?.length || 0) + (kadepQueue?.overQuota?.length || 0);
  const pendingAssignmentCount = assignmentOverview?.needsIssue ? assignmentOverview.newCount : 0;
  const pendingSupervisorRequestCount = supervisorInbox?.waiting?.length || 0;

  const firstPendingApprovalId = pendingApprovalsData?.guidances?.[0]?.id;

  const supervisorActions: QuickAction[] = showSupervisorActions
    ? [
        {
          id: "pending-supervisor-requests",
          title: "Permohonan Pembimbing",
          description: "Mahasiswa yang mengajukan Anda sebagai pembimbing",
          count: pendingSupervisorRequestCount,
          icon: UserPlus,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          link: "/tugas-akhir/permohonan",
          loading: loadingSupervisorInbox,
        },
        {
          id: "pending-supervisor2",
          title: "Persetujuan Pembimbing 2",
          description: "Permintaan menjadi Pembimbing 2 yang menunggu jawaban Anda",
          count: pendingSupervisor2Count,
          icon: UserPlus,
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          link: "/tugas-akhir/permohonan",
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
          id: "pending-proposal-score",
          title: "Nilai Proposal",
          description: "Proposal final yang menunggu nilai pembimbing",
          count: pendingSupervisorScoringCount,
          icon: ShieldCheck,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          link: "/tugas-akhir/proposal",
          loading: loadingSupervisorScoring,
        },
      ]
    : [];

  const kadepActions: QuickAction[] = showKadepActions
    ? [
        {
          id: "kadep-supervisor-requests",
          title: "Pengajuan Pembimbing",
          description: "Pengajuan lewat departemen dan pengajuan di atas kuota",
          count: pendingKadepCount,
          icon: ShieldCheck,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          link: `/kelola/tugas-akhir/kadep/penetapan-pembimbing?tab=${kadepQueue?.department?.length ? "departemen" : "atas-kuota"}`,
          loading: loadingKadepQueue,
        },
        {
          id: "kadep-supervisor-assignment",
          title: "Penetapan Pembimbing",
          description: "Mahasiswa yang disetujui pembimbingnya dan belum ditetapkan",
          count: pendingAssignmentCount,
          icon: FileCheck,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          link: "/kelola/tugas-akhir/kadep/penetapan-pembimbing",
          loading: loadingAssignment,
        },
      ]
    : [];

  // The Admin's most used pages. No counts: they would need the full lists.
  const adminActions: QuickAction[] = showAdminActions
    ? [
        {
          id: "admin-seminar-verification",
          title: "Verifikasi Seminar Hasil",
          description: "Dokumen pendaftaran seminar hasil yang perlu diperiksa",
          count: null,
          icon: FileCheck,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          link: "/tugas-akhir/seminar-hasil",
          loading: false,
        },
        {
          id: "admin-defence-verification",
          title: "Verifikasi Sidang",
          description: "Dokumen pendaftaran sidang dan penjadwalannya",
          count: null,
          icon: CalendarClock,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          link: "/tugas-akhir/sidang",
          loading: false,
        },
        {
          id: "admin-yudisium",
          title: "Verifikasi Berkas Yudisium",
          description: "Berkas persyaratan peserta pada periode yudisium",
          count: null,
          icon: ClipboardCheck,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          link: "/yudisium",
          loading: false,
        },
        {
          id: "admin-students",
          title: "Data Mahasiswa",
          description: "Data induk mahasiswa",
          count: null,
          icon: Users,
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          link: "/master-data/mahasiswa",
          loading: false,
        },
      ]
    : [];

  const quickActions = [...adminActions, ...kadepActions, ...supervisorActions];
  const counted = quickActions.filter((action) => action.count !== null);
  const totalPending = counted.reduce((sum, action) => sum + (action.count ?? 0), 0);
  // "Semua Selesai" only when every action is a queue and all queues are empty.
  const allDone = counted.length === quickActions.length && totalPending === 0;
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
        ) : allDone ? (
          <div className="flex items-center gap-3 px-6 pb-4 text-muted-foreground">
            <CompleteLottie size="w-12 h-12 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Semua Selesai!</p>
              <p className="text-xs">Tidak ada antrean persetujuan yang aktif</p>
            </div>
          </div>
        ) : (
          // At most about three items high, the rest scrolls inside, so "Agenda Mendatang" below
          // stays in view at 1366×768 and 1920×1080.
          <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-56">
            <div className="space-y-3 px-6 pb-6">
              {quickActions.map((action) => (
                <Link key={action.id} to={action.link}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all",
                      "hover:shadow-md hover:border-primary/50 cursor-pointer",
                      action.count === null || action.count > 0 ? "border-gray-200" : "border-gray-200 opacity-60",
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
                        {action.count !== null && action.count > 0 && (
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
