import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, Loader2, PartyPopper } from "lucide-react";
import { useSeminarReadinessStatus } from "@/hooks/milestone/useMilestone";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";

interface SeminarReadinessStatusCardProps {
  thesisId: string;
  className?: string;
}

export function SeminarReadinessStatusCard({
  thesisId,
  className,
}: SeminarReadinessStatusCardProps) {
  const { data: readinessStatus, isLoading } = useSeminarReadinessStatus(thesisId);

  if (isLoading) {
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

  const { milestoneProgress, seminarReadiness, supervisors } = readinessStatus;
  const isMilestoneComplete = milestoneProgress?.isComplete;
  const isFullyApproved = seminarReadiness?.isFullyApproved;

  // Find supervisors
  const supervisor1 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_1);
  const supervisor2 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_2);

  // If milestone not complete, show different message
  if (!isMilestoneComplete) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Kesiapan Seminar
          </CardTitle>
          <CardDescription>
            Selesaikan semua milestone untuk mendapat persetujuan seminar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Progress:</span>
            <Badge variant="secondary">
              {milestoneProgress?.completed ?? 0} / {milestoneProgress?.total ?? 0} milestone
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      isFullyApproved ? "border-green-200 bg-green-50/50" : "border-yellow-200 bg-yellow-50/50",
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isFullyApproved ? (
            <PartyPopper className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-600" />
          )}
          Kesiapan Seminar
        </CardTitle>
        <CardDescription>
          {isFullyApproved
            ? "Semua pembimbing telah menyetujui. Anda dapat mendaftar seminar."
            : "Milestone 100% selesai. Menunggu persetujuan pembimbing."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fully Approved Alert */}
        {isFullyApproved && (
          <Alert className="border-green-300 bg-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Siap Daftar Seminar!</AlertTitle>
            <AlertDescription className="text-green-700">
              Selamat! Kedua pembimbing telah menyetujui kesiapan seminar Anda. 
              Silakan hubungi admin atau akses menu pendaftaran seminar.
            </AlertDescription>
          </Alert>
        )}

        {/* Supervisor Approval Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Status Persetujuan Pembimbing</h4>

          {/* Pembimbing 1 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2">
              {seminarReadiness?.approvedBySupervisor1 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <span className="text-sm font-medium">Pembimbing 1</span>
                {supervisor1?.name && (
                  <p className="text-xs text-muted-foreground">
                    {toTitleCaseName(supervisor1.name)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor1 ? "default" : "outline"}>
              {seminarReadiness?.approvedBySupervisor1 ? "Disetujui" : "Menunggu"}
            </Badge>
          </div>

          {/* Pembimbing 2 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2">
              {seminarReadiness?.approvedBySupervisor2 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <span className="text-sm font-medium">Pembimbing 2</span>
                {supervisor2?.name && (
                  <p className="text-xs text-muted-foreground">
                    {toTitleCaseName(supervisor2.name)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor2 ? "default" : "outline"}>
              {seminarReadiness?.approvedBySupervisor2 ? "Disetujui" : "Menunggu"}
            </Badge>
          </div>
        </div>

        {/* Notes */}
        {seminarReadiness?.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Catatan:</span> {seminarReadiness.notes}
            </p>
          </div>
        )}

        {/* Approval Date */}
        {seminarReadiness?.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Disetujui penuh pada: {formatDateId(seminarReadiness.approvedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
