import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Clock, Loader2, PartyPopper, AlertCircle, Bell, Target, GraduationCap } from "lucide-react";
import { useSeminarReadinessStatus, useRemindSeminarApproval } from "@/hooks/milestone/useMilestone";
import { Button } from "@/components/ui/button";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";
import { Progress } from "@/components/ui/progress";

interface SeminarReadinessStatusCardProps {
  thesisId: string;
  className?: string;
  variant?: "card" | "embedded";
  displayMode?: "full" | "guidance" | "milestone";
}

export function SeminarReadinessStatusCard({
  thesisId,
  className,
  variant = "card",
  displayMode = "full",
}: SeminarReadinessStatusCardProps) {
  const { data: readinessStatus, isLoading } = useSeminarReadinessStatus(thesisId);
  const remindMutation = useRemindSeminarApproval();

  if (isLoading) {
    if (variant === "embedded") {
      return (
        <div className={cn("flex items-center justify-center py-4", className)}>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!readinessStatus) {
    return null;
  }

  const { milestoneProgress, guidanceProgress, seminarReadiness, supervisors } = readinessStatus;
  const isMilestoneComplete = milestoneProgress?.isComplete;
  const isGuidanceComplete = guidanceProgress?.isComplete;
  const isFullyApproved = seminarReadiness?.isFullyApproved;

  // Find supervisors
  const supervisor1 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_1);
  const supervisor2 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_2);

  const guidanceCount = guidanceProgress?.completed ?? 0;
  const guidanceRequired = guidanceProgress?.required ?? 8;
  const guidancePercent = Math.min(Math.round((guidanceCount / guidanceRequired) * 100), 100);

  const milestomeCompleted = milestoneProgress?.completed ?? 0;
  const milestoneTotal = milestoneProgress?.total ?? 0;
  const milestonePercent = milestoneTotal > 0 ? Math.round((milestomeCompleted / milestoneTotal) * 100) : 0;

  const renderRequirements = () => (
    <div className={cn("space-y-4", variant === "card" && "p-0")}>
      {variant === "card" && (
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Kesiapan Seminar
          </CardTitle>
          <CardDescription>
            Penuhi persyaratan bimbingan dan milestone untuk mendapat persetujuan seminar
          </CardDescription>
        </CardHeader>
      )}
      
      <div className="space-y-4">
        {/* Guidance Progress Indicator */}
        {(displayMode === "full" || displayMode === "guidance") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className={cn("h-4 w-4", isGuidanceComplete ? "text-green-600" : "text-primary")} />
                <span className="font-semibold">Syarat Bimbingan</span>
              </div>
              <span className={cn("font-medium", isGuidanceComplete ? "text-green-600" : "text-muted-foreground")}>
                {guidanceCount} / {guidanceRequired} Sesi
              </span>
            </div>
            <Progress value={guidancePercent} className={cn("h-2", isGuidanceComplete ? "[&>div]:bg-green-600 bg-green-100" : "")} />
            <p className="text-[10px] text-muted-foreground italic">
              * Minimal 8 kali bimbingan disetujui
            </p>
          </div>
        )}

        {/* Milestone Progress Indicator */}
        {(displayMode === "full" || displayMode === "milestone") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Target className={cn("h-4 w-4", isMilestoneComplete ? "text-green-600" : "text-primary")} />
                <span className="font-semibold">Syarat Milestone</span>
              </div>
              <span className={cn("font-medium", isMilestoneComplete ? "text-green-600" : "text-muted-foreground")}>
                {milestomeCompleted} / {milestoneTotal} Tahapan ({milestonePercent}%)
              </span>
            </div>
            <Progress value={milestonePercent} className={cn("h-2", isMilestoneComplete ? "[&>div]:bg-green-600 bg-green-100" : "")} />
            <p className="text-[10px] text-muted-foreground italic">
              * Minimal status milestone 100% selesai
            </p>
          </div>
        )}

        {/* Combined status message if full or if only one is not complete */}
        {displayMode === "full" && (
          <div className="flex flex-col gap-1.5 pt-1">
            {!isGuidanceComplete && !isMilestoneComplete && (
              <p className="text-xs text-yellow-600 font-medium flex items-center gap-1.5 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Lengkapi bimbingan dan milestone Anda.
              </p>
            )}
            {isGuidanceComplete && !isMilestoneComplete && (
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-100">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Bimbingan cukup. Selesaikan milestone Anda.
              </p>
            )}
            {!isGuidanceComplete && isMilestoneComplete && (
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-100">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Milestone selesai. Lengkapi sesi bimbingan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderApprovalStatus = () => (
    <div className="space-y-4">
      {variant === "card" && (
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {isFullyApproved ? (
              <PartyPopper className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
            Kesiapan Seminar
            {!isFullyApproved && milestoneProgress?.isComplete && guidanceProgress?.isComplete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                onClick={() => remindMutation.mutate(thesisId)}
                disabled={remindMutation.isPending}
                title="Kirim pengingat ke dosen pembimbing"
              >
                {remindMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {isFullyApproved
              ? "Semua pembimbing telah menyetujui. Anda dapat mendaftar seminar."
              : "Milestone 100% selesai. Menunggu persetujuan pembimbing."}
          </CardDescription>
        </CardHeader>
      )}

      {/* Embedded Title if not Card */}
      {variant === "embedded" && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isFullyApproved ? (
              <PartyPopper className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-semibold">Status Kesiapan Seminar</span>
          </div>
          {!isFullyApproved && milestoneProgress?.isComplete && guidanceProgress?.isComplete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
              onClick={() => remindMutation.mutate(thesisId)}
              disabled={remindMutation.isPending}
              title="Kirim pengingat ke dosen pembimbing"
            >
              {remindMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Bell className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* Fully Approved Alert */}
      {isFullyApproved && (
        <Alert className="border-green-300 bg-green-100/50 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 text-sm">Siap Daftar Seminar!</AlertTitle>
          <AlertDescription className="text-green-700 text-xs">
            Kedua pembimbing telah menyetujui kesiapan seminar Anda.
          </AlertDescription>
        </Alert>
      )}

      {/* Supervisor Approval Status */}
      <div className="space-y-2">
        {variant === "card" && <h4 className="text-sm font-medium">Status Persetujuan Pembimbing</h4>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pembimbing 1 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              {seminarReadiness?.approvedBySupervisor1 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold block truncate">Pembimbing 1</span>
                {supervisor1?.name && (
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {toTitleCaseName(supervisor1.name)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor1 ? "default" : "outline"} className="text-[10px] px-1.5 h-5 shrink-0">
              {seminarReadiness?.approvedBySupervisor1 ? "Selesai" : "Menunggu"}
            </Badge>
          </div>

          {/* Pembimbing 2 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              {seminarReadiness?.approvedBySupervisor2 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold block truncate">Pembimbing 2</span>
                {supervisor2?.name && (
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {toTitleCaseName(supervisor2.name)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor2 ? "default" : "outline"} className="text-[10px] px-1.5 h-5 shrink-0">
              {seminarReadiness?.approvedBySupervisor2 ? "Selesai" : "Menunggu"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Notes */}
      {seminarReadiness?.notes && (
        <div className="pt-2 border-t border-dashed">
          <p className="text-xs text-muted-foreground italic">
            <span className="font-semibold not-italic">Catatan:</span> {seminarReadiness.notes}
          </p>
        </div>
      )}

      {/* Approval Date */}
      {seminarReadiness?.approvedAt && variant === "card" && (
        <p className="text-[10px] text-muted-foreground italic">
          Disetujui penuh pada: {formatDateId(seminarReadiness.approvedAt)}
        </p>
      )}
    </div>
  );

  const shouldRenderRequirements = !isMilestoneComplete || !isGuidanceComplete || displayMode !== "full";

  if (variant === "embedded") {
    return (
      <div className={cn("mt-2 pt-4 border-t", className)}>
        {/* Always show requirements/progress bars if in full mode or if not complete */}
        {shouldRenderRequirements && renderRequirements()}
        
        {/* If complete but not fully approved, OR if fully approved, show approval info */}
        {displayMode === "full" && (isMilestoneComplete && isGuidanceComplete) && (
          <div className={cn(shouldRenderRequirements && "mt-6 pt-4 border-t border-dashed")}>
            {renderApprovalStatus()}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      isFullyApproved ? "border-green-200 bg-green-50/20 shadow-sm" : "border-yellow-200 bg-yellow-50/20 shadow-sm",
      className
    )}>
      <CardContent className="pt-6">
        {shouldRenderRequirements && renderRequirements()}
        
        {displayMode === "full" && (isMilestoneComplete && isGuidanceComplete) && (
          <div className={cn(shouldRenderRequirements && "mt-6 pt-4 border-t border-dashed")}>
            {renderApprovalStatus()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
