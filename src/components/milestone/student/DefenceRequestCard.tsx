import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, FileText, Upload, PartyPopper, AlertCircle, ExternalLink, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useDefenceReadinessStatus, useRequestDefence } from "@/hooks/milestone/useMilestone";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { getApiUrl } from "@/config/api";
import { apiRequest } from "@/services/auth.service";

interface DefenceRequestCardProps {
  thesisId: string;
  className?: string;
}

// Upload document API call
async function uploadDocument(file: File, thesisId: string): Promise<{ id: string; fileName: string; filePath: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", "Final Thesis");
  formData.append("thesisId", thesisId);

  const response = await apiRequest(getApiUrl("/documents/upload"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengupload dokumen");
  }

  const result = await response.json();
  return result.data;
}

export function DefenceRequestCard({
  thesisId,
  className,
}: DefenceRequestCardProps) {
  const { data: readinessStatus, isLoading, refetch } = useDefenceReadinessStatus(thesisId);
  const requestDefenceMutation = useRequestDefence();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file, thesisId),
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupload dokumen");
    },
  });

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
    supervisors 
  } = readinessStatus;

  const isEligibleStatus = thesisStatus?.isEligible;
  const hasFinalDocument = !!finalDocument;
  const hasRequestedDefence = defenceReadiness?.hasRequestedDefence;
  const isFullyApproved = defenceReadiness?.isFullyApproved;

  // Find supervisors
  const supervisor1 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_1);
  const supervisor2 = supervisors?.find(s => s.role === ROLES.PEMBIMBING_2);

  // Don't show the card if status is not eligible for defence
  if (!isEligibleStatus) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error("Hanya file PDF yang diperbolehkan");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    try {
      // Upload document first
      const uploadedDoc = await uploadMutation.mutateAsync(selectedFile);
      
      // Then request defence
      requestDefenceMutation.mutate(
        { thesisId, documentId: uploadedDoc.id },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            refetch();
          },
        }
      );
    } catch {
      // Error already handled by mutation
    }
  };

  const isSubmitting = uploadMutation.isPending || requestDefenceMutation.isPending;

  return (
    <Card className={cn(
      isFullyApproved 
        ? "border-green-200 bg-green-50/50" 
        : hasRequestedDefence 
          ? "border-blue-200 bg-blue-50/50" 
          : "border-yellow-200 bg-yellow-50/50",
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isFullyApproved ? (
            <PartyPopper className="h-5 w-5 text-green-600" />
          ) : hasRequestedDefence ? (
            <Clock className="h-5 w-5 text-blue-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          Kesiapan Sidang
        </CardTitle>
        <CardDescription>
          {isFullyApproved
            ? "Semua pembimbing telah menyetujui. Anda dapat mendaftar sidang."
            : hasRequestedDefence
              ? "Permintaan sidang telah diajukan. Menunggu persetujuan pembimbing."
              : "Upload dokumen thesis final untuk mengajukan permintaan sidang."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between text-sm">
          <span>Status Thesis</span>
          <Badge variant="default">{thesisStatus?.name || "Unknown"}</Badge>
        </div>

        {/* Fully Approved Alert */}
        {isFullyApproved && (
          <Alert className="border-green-300 bg-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Siap Daftar Sidang!</AlertTitle>
            <AlertDescription className="text-green-700">
              Selamat! Kedua pembimbing telah menyetujui kesiapan sidang Anda. 
              Silakan hubungi admin atau akses menu pendaftaran sidang.
            </AlertDescription>
          </Alert>
        )}

        {/* Final Document Info */}
        {hasFinalDocument && finalDocument && (
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={finalDocument.fileName}>
                  {finalDocument.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Diupload: {formatDateId(finalDocument.uploadedAt)}
                </p>
                <div className="flex gap-2 mt-2">
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
              <Badge variant="secondary" className="shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terupload
              </Badge>
            </div>
          </div>
        )}

        {/* Request Defence Button - Only if not requested yet */}
        {!hasRequestedDefence && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload & Ajukan Permintaan Sidang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajukan Permintaan Sidang</DialogTitle>
                <DialogDescription>
                  Upload dokumen thesis final Anda dalam format PDF untuk mengajukan permintaan sidang.
                  Pembimbing akan mereview dan memberikan persetujuan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Dokumen Thesis Final (PDF)</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      File terpilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maksimal ukuran file: 10MB
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={!selectedFile || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Ajukan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Supervisor Approval Status - Only show if defence has been requested */}
        {hasRequestedDefence && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status Persetujuan Pembimbing</h4>

            {/* Pembimbing 1 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div className="flex items-center gap-2">
                {defenceReadiness?.approvedBySupervisor1 ? (
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
              <Badge variant={defenceReadiness?.approvedBySupervisor1 ? "default" : "outline"}>
                {defenceReadiness?.approvedBySupervisor1 ? "Disetujui" : "Menunggu"}
              </Badge>
            </div>

            {/* Pembimbing 2 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div className="flex items-center gap-2">
                {defenceReadiness?.approvedBySupervisor2 ? (
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
              <Badge variant={defenceReadiness?.approvedBySupervisor2 ? "default" : "outline"}>
                {defenceReadiness?.approvedBySupervisor2 ? "Disetujui" : "Menunggu"}
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

        {/* Approval Date */}
        {defenceReadiness?.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Disetujui penuh pada: {formatDateId(defenceReadiness.approvedAt)}
          </p>
        )}

        {/* Request Date */}
        {hasRequestedDefence && defenceReadiness?.requestedAt && !isFullyApproved && (
          <p className="text-xs text-muted-foreground">
            Diajukan pada: {formatDateId(defenceReadiness.requestedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
