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
import { CheckCircle2, XCircle, AlertCircle, FileText, Clock, Download, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useDefenceReadinessManagement } from "@/hooks/milestone/useMilestone";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";
import { getApiUrl } from "@/config/api";

interface DefenceReadinessCardProps {
  thesisId: string;
  studentName: string;
  thesisTitle?: string;
  className?: string;
}

export function DefenceReadinessCard({
  thesisId,
  studentName,
  thesisTitle,
  className,
}: DefenceReadinessCardProps) {
  const {
    readinessStatus,
    isLoading,
    approve,
    revoke,
    isApproving,
    isRevoking,
  } = useDefenceReadinessManagement(thesisId);

  const [approveNotes, setApproveNotes] = useState("");
  const [revokeNotes, setRevokeNotes] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  if (!readinessStatus) {
    return null;
  }

  const { 
    thesisStatus, 
    finalDocument, 
    defenceReadiness, 
    supervisors, 
    currentUserRole, 
    currentUserHasApproved 
  } = readinessStatus;

  const isEligibleStatus = thesisStatus?.isEligible;
  const hasFinalDocument = !!finalDocument;
  const hasRequestedDefence = defenceReadiness?.hasRequestedDefence;
  const isFullyApproved = defenceReadiness?.isFullyApproved;

  // Don't show the card if status is not eligible for defence
  if (!isEligibleStatus) {
    return null;
  }

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
          ) : hasRequestedDefence ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
          Kesiapan Sidang
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
        {/* Thesis Status */}
        <div className="flex items-center justify-between text-sm">
          <span>Status Thesis</span>
          <Badge variant={isEligibleStatus ? "default" : "secondary"}>
            {thesisStatus?.name || "Unknown"}
          </Badge>
        </div>

        {/* Final Document Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumen Final
          </span>
          {hasFinalDocument ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Terupload
            </Badge>
          ) : (
            <Badge variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              Belum Upload
            </Badge>
          )}
        </div>

        {/* Final Document Info */}
        {finalDocument && (
          <div className="text-xs text-muted-foreground pl-6 space-y-2">
            <div>
              <p className="truncate" title={finalDocument.fileName}>
                {finalDocument.fileName}
              </p>
              <p>Diupload: {formatDateId(finalDocument.uploadedAt)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const url = finalDocument.filePath.startsWith("http") 
                    ? finalDocument.filePath 
                    : getApiUrl(`/${finalDocument.filePath}`);
                  window.open(url, "_blank");
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Lihat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const url = finalDocument.filePath.startsWith("http") 
                    ? finalDocument.filePath 
                    : getApiUrl(`/${finalDocument.filePath}`);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = finalDocument.fileName;
                  link.click();
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Defence Request Status */}
        <div className="flex items-center justify-between text-sm">
          <span>Permintaan Sidang</span>
          {hasRequestedDefence ? (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Diajukan
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Belum Diajukan
            </Badge>
          )}
        </div>

        {hasRequestedDefence && defenceReadiness?.requestedAt && (
          <p className="text-xs text-muted-foreground pl-6">
            Diajukan: {formatDateId(defenceReadiness.requestedAt)}
          </p>
        )}

        {/* Supervisor Approvals - Only show if defence has been requested */}
        {hasRequestedDefence && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium">Status Persetujuan</h4>

            {/* Pembimbing 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {defenceReadiness?.approvedBySupervisor1 ? (
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
              <Badge variant={defenceReadiness?.approvedBySupervisor1 ? "default" : "outline"}>
                {defenceReadiness?.approvedBySupervisor1 ? "Disetujui" : "Belum"}
              </Badge>
            </div>

            {/* Pembimbing 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {defenceReadiness?.approvedBySupervisor2 ? (
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
              <Badge variant={defenceReadiness?.approvedBySupervisor2 ? "default" : "outline"}>
                {defenceReadiness?.approvedBySupervisor2 ? "Disetujui" : "Belum"}
              </Badge>
            </div>
          </div>
        )}

        {/* Notes */}
        {defenceReadiness?.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Catatan:</span> {defenceReadiness.notes}
            </p>
          </div>
        )}

        {/* Approved At */}
        {defenceReadiness?.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Disetujui penuh pada: {formatDateId(defenceReadiness.approvedAt)}
          </p>
        )}

        {/* Actions - Only show if defence has been requested */}
        {isSupervisor && hasRequestedDefence && (
          <div className="pt-4 border-t space-y-2">
            {!hasFinalDocument && (
              <p className="text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Mahasiswa belum mengupload dokumen thesis final.
              </p>
            )}

            {hasFinalDocument && !currentUserHasApproved && (
              <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isApproving}>
                    {isApproving && <Spinner className="mr-2 h-4 w-4" />}
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui Kesiapan Sidang
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Setujui Kesiapan Sidang</DialogTitle>
                    <DialogDescription>
                      Anda akan menyetujui bahwa mahasiswa {toTitleCaseName(studentName)} siap untuk mendaftar sidang.
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
                      {isApproving && <Spinner className="mr-2 h-4 w-4" />}
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
                    {isRevoking && <Spinner className="mr-2 h-4 w-4" />}
                    <XCircle className="mr-2 h-4 w-4" />
                    Cabut Persetujuan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cabut Persetujuan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda akan mencabut persetujuan kesiapan sidang untuk mahasiswa {toTitleCaseName(studentName)}.
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
                      {isRevoking && <Spinner className="mr-2 h-4 w-4" />}
                      Cabut
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Waiting for request message */}
        {isSupervisor && !hasRequestedDefence && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              <Clock className="h-4 w-4 inline mr-1" />
              Menunggu mahasiswa mengajukan permintaan sidang
            </p>
          </div>
        )}

        {/* Fully Approved Status */}
        {isFullyApproved && (
          <div className="pt-2 border-t">
            <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mahasiswa Siap Daftar Sidang
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
