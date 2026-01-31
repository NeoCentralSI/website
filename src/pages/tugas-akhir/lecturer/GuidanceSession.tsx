import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  User,
  Target,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Hash,
  NotebookPen,
} from "lucide-react";
import { PdfViewer } from "@/components/pdf";
import { 
  getLecturerGuidanceDetail, 
  approveSessionSummary,
} from "@/services/lecturerGuidance.service";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";

export default function LecturerGuidanceSessionPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { guidanceId } = useParams<{ guidanceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");

  // Fetch guidance detail
  const { data, isLoading, error } = useQuery({
    queryKey: ["lecturer-guidance-session", guidanceId],
    queryFn: () => getLecturerGuidanceDetail(guidanceId!),
    enabled: !!guidanceId,
  });

  const guidance = data?.guidance;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => {
      if (!guidanceId) throw new Error("Guidance not found");
      return approveSessionSummary(guidanceId);
    },
    onSuccess: () => {
      toast.success("Catatan bimbingan berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["lecturer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lecturer-guidance-session", guidanceId] });
      navigate("/tugas-akhir/bimbingan/lecturer/requests");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyetujui catatan bimbingan");
    },
  });

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" },
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" },
      { label: "Sesi Bimbingan" },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Document preview URL
  const getDocumentUrl = () => {
    if (!guidance?.document?.filePath) return null;
    const path = guidance.document.filePath;
    // If path starts with http, it's already a full URL
    if (path.startsWith("http")) return path;
    // If path starts with /uploads/ or uploads/, use it as-is (just prepend base URL)
    if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
      // Add leading slash if missing
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return getApiUrl(normalizedPath);
    }
    // Otherwise, add /uploads/ prefix
    return getApiUrl(`/uploads/${path}`);
  };

  const documentUrl = getDocumentUrl();

  // Status
  const isPendingApproval = guidance?.status === "summary_pending";
  const isCompleted = guidance?.status === "completed";
  const isAccepted = guidance?.status === "accepted";
  const hasSummary = !!guidance?.sessionSummary;

  // Status badge
  const getStatusBadge = () => {
    if (isCompleted)
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Selesai
        </Badge>
      );
    if (isPendingApproval)
      return (
        <Badge className="bg-violet-100 text-violet-700 border-violet-200">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu Approval
        </Badge>
      );
    if (isAccepted)
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Berjalan
        </Badge>
      );
    return (
      <Badge variant="outline">
        {guidance?.status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail sesi bimbingan..." />
      </div>
    );
  }

  if (error || !guidance) {
    return (
      <div className="space-y-6 mt-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/tugas-akhir/bimbingan/lecturer/requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sesi Bimbingan</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Data bimbingan tidak ditemukan
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/tugas-akhir/bimbingan/lecturer/requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sesi Bimbingan</h1>
            <p className="text-muted-foreground">
              {toTitleCaseName(guidance.studentName || "-")}
            </p>
          </div>
        </div>
        
        {getStatusBadge()}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="gap-2">
            <NotebookPen className="h-4 w-4" />
            <span className="hidden sm:inline">Informasi & Catatan</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2" disabled={!documentUrl}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumen</span>
            <span className="sm:hidden">Dokumen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Info & Catatan Bimbingan */}
        <TabsContent value="info" className="mt-6 space-y-6">
          {/* Student & Thesis Info Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informasi Mahasiswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Nama</span>
                  </div>
                  <p className="font-medium text-base">
                    {toTitleCaseName(guidance.studentName || "-")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>NIM</span>
                  </div>
                  <p className="font-medium text-base">{guidance.studentNim || "-"}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium text-base">{guidance.studentEmail || "-"}</p>
                </div>
              </div>

              {guidance.thesisTitle && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Judul Skripsi</div>
                    <p className="font-medium leading-relaxed">{guidance.thesisTitle}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Guidance Info Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Informasi Bimbingan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Waktu Bimbingan</span>
                  </div>
                  <p className="font-medium text-base">
                    {guidance.approvedDateFormatted ||
                      guidance.requestedDateFormatted ||
                      (guidance.approvedDate
                        ? formatDateId(guidance.approvedDate)
                        : guidance.requestedDate
                        ? formatDateId(guidance.requestedDate)
                        : "-")}
                  </p>
                </div>
              </div>

              {guidance.milestoneTitles && guidance.milestoneTitles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Target className="h-4 w-4" />
                      <span>Milestone</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {guidance.milestoneTitles.map((title, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs font-normal">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {guidance.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Catatan Mahasiswa</div>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                      {guidance.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <NotebookPen className="h-4 w-4" />
                Catatan Sesi Bimbingan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasSummary ? (
                <Alert className="border-amber-200 bg-amber-50/80">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    Mahasiswa belum mengisi catatan bimbingan. Tunggu mahasiswa untuk mengisi
                    ringkasan dan arahan dari sesi bimbingan.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {isPendingApproval && (
                    <Alert className="border-violet-200 bg-violet-50/80">
                      <Clock className="h-4 w-4 text-violet-600" />
                      <AlertDescription className="text-violet-700 text-sm">
                        Mahasiswa telah mengisi catatan. Silakan review dan setujui untuk
                        menyelesaikan sesi bimbingan.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isCompleted && (
                    <Alert className="border-green-200 bg-green-50/80">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 text-sm">
                        Catatan bimbingan telah disetujui. Sesi bimbingan selesai.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Ringkasan Bimbingan
                    </Label>
                    <div className="p-4 bg-muted/30 rounded-md border whitespace-pre-wrap text-sm">
                      {guidance.sessionSummary || "-"}
                    </div>
                  </div>

                  {guidance.actionItems && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Arahan / Action Items
                      </Label>
                      <div className="p-4 bg-muted/30 rounded-md border whitespace-pre-wrap text-sm">
                        {guidance.actionItems}
                      </div>
                    </div>
                  )}

                  {guidance.summarySubmittedAtFormatted && (
                    <p className="text-xs text-muted-foreground">
                      Dikirim pada: {guidance.summarySubmittedAtFormatted}
                    </p>
                  )}

                  {isPendingApproval && (
                    <>
                      <Separator />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate("/tugas-akhir/bimbingan/lecturer/requests")}
                        >
                          Kembali
                        </Button>
                        <Button
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Setujui Catatan
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dokumen */}
        <TabsContent value="document" className="mt-6">
          {documentUrl ? (
            <PdfViewer
              url={documentUrl}
              className="min-h-[600px]"
              showToolbar={true}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada dokumen yang diunggah</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
