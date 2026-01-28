import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useSeminarReadinessManagement } from "@/hooks/milestone/useMilestone";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";

interface SeminarReadinessCardProps {
  thesisId: string;
  studentName: string;
  thesisTitle?: string;
  className?: string;
}

export function SeminarReadinessCard({
  thesisId,
  studentName,
  thesisTitle,
  className,
}: SeminarReadinessCardProps) {
  const {
    readinessStatus,
    isLoading,
    approve,
    revoke,
    isApproving,
    isRevoking,
  } = useSeminarReadinessManagement(thesisId);

  const [approveNotes, setApproveNotes] = useState("");
  const [revokeNotes, setRevokeNotes] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

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

  const { milestoneProgress, seminarReadiness, supervisors, currentUserRole, currentUserHasApproved } = readinessStatus;
  const isMilestoneComplete = milestoneProgress?.isComplete;
  const isFullyApproved = seminarReadiness?.isFullyApproved;

  const handleApprove = () => {
    approve(approveNotes || undefined);
    setApproveNotes("");
    setApproveDialogOpen(false);
  };

  const handleRevoke = () => {
    revoke(revokeNotes || undefined);
    setRevokeNotes("");
    setRevokeDialogOpen(false);
  };

  // Find supervisor1 and supervisor2 from the supervisors array
  const supervisor1 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_1);
  const supervisor2 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_2);

  // Check if current user is a supervisor (has a role)
  const isSupervisor = !!currentUserRole;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFullyApproved ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : isMilestoneComplete ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
          Kesiapan Seminar
        </CardTitle>
        <CardDescription>
          {toTitleCaseName(studentName)}
          {thesisTitle && (
            <span className="block text-xs mt-1 truncate" title={thesisTitle}>
              {thesisTitle}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Milestone Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress Milestone</span>
            <Badge variant={isMilestoneComplete ? "default" : "secondary"}>
              {milestoneProgress?.percentComplete ?? 0}%
            </Badge>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                isMilestoneComplete ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${milestoneProgress?.percentComplete ?? 0}%` }}
            />
          </div>
          {milestoneProgress && (
            <p className="text-xs text-muted-foreground">
              {milestoneProgress.completed} dari {milestoneProgress.total} milestone selesai
            </p>
          )}
        </div>

        {/* Supervisor Approvals */}
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-sm font-medium">Status Persetujuan</h4>

          {/* Pembimbing 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {seminarReadiness?.approvedBySupervisor1 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                Pembimbing 1
                {supervisor1?.name && (
                  <span className="text-muted-foreground ml-1">
                    ({toTitleCaseName(supervisor1.name)})
                  </span>
                )}
              </span>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor1 ? "default" : "outline"}>
              {seminarReadiness?.approvedBySupervisor1 ? "Disetujui" : "Belum"}
            </Badge>
          </div>

          {/* Pembimbing 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {seminarReadiness?.approvedBySupervisor2 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                Pembimbing 2
                {supervisor2?.name && (
                  <span className="text-muted-foreground ml-1">
                    ({toTitleCaseName(supervisor2.name)})
                  </span>
                )}
              </span>
            </div>
            <Badge variant={seminarReadiness?.approvedBySupervisor2 ? "default" : "outline"}>
              {seminarReadiness?.approvedBySupervisor2 ? "Disetujui" : "Belum"}
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

        {/* Approved At */}
        {seminarReadiness?.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Disetujui penuh pada: {formatDateId(seminarReadiness.approvedAt)}
          </p>
        )}

        {/* Actions */}
        {isSupervisor && (
          <div className="pt-4 border-t space-y-2">
            {!isMilestoneComplete && (
              <p className="text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Milestone harus 100% selesai sebelum dapat disetujui untuk seminar.
              </p>
            )}

            {isMilestoneComplete && !currentUserHasApproved && (
              <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isApproving}>
                    {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui Kesiapan Seminar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Setujui Kesiapan Seminar</DialogTitle>
                    <DialogDescription>
                      Anda akan menyetujui bahwa mahasiswa {toTitleCaseName(studentName)} siap untuk mendaftar seminar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approve-notes">Catatan (Opsional)</Label>
                      <Textarea
                        id="approve-notes"
                        placeholder="Tambahkan catatan jika diperlukan..."
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleApprove} disabled={isApproving}>
                      {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Setujui
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {currentUserHasApproved && (
              <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={isRevoking}>
                    {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <XCircle className="mr-2 h-4 w-4" />
                    Cabut Persetujuan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cabut Persetujuan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda akan mencabut persetujuan kesiapan seminar untuk mahasiswa {toTitleCaseName(studentName)}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="revoke-notes">Alasan (Opsional)</Label>
                    <Textarea
                      id="revoke-notes"
                      placeholder="Berikan alasan pencabutan..."
                      value={revokeNotes}
                      onChange={(e) => setRevokeNotes(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevoke} disabled={isRevoking}>
                      {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cabut
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Fully Approved Status */}
        {isFullyApproved && (
          <div className="pt-2 border-t">
            <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mahasiswa Siap Daftar Seminar
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
