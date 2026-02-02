import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  BookOpen,
  ListTodo,
  CalendarClock,
  MessageSquareText,
  GraduationCap,
  Sparkles,
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
      navigate("/tugas-akhir/bimbingan/lecturer/scheduled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyetujui catatan bimbingan");
    },
  });

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" },
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/scheduled" },
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
            <Link to="/tugas-akhir/bimbingan/lecturer/scheduled">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sesi Bimbingan</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <EmptyState
              title="Data Tidak Ditemukan"
              description="Data bimbingan tidak ditemukan"
              size="sm"
            />
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
            <Link to="/tugas-akhir/bimbingan/lecturer/scheduled">
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
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Student & Session Info (1/3 width on large screens) */}
            <div className="space-y-6">
              {/* Student Info Card */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Mahasiswa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {toTitleCaseName(guidance.studentName || "-")}
                      </p>
                      <p className="text-sm text-muted-foreground">{guidance.studentNim || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{guidance.studentEmail || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Session Schedule Card */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                    Jadwal Bimbingan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        {guidance.approvedDateFormatted ||
                          guidance.requestedDateFormatted ||
                          (guidance.approvedDate
                            ? formatDateId(guidance.approvedDate)
                            : guidance.requestedDate
                            ? formatDateId(guidance.requestedDate)
                            : "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted ? "Selesai" : isPendingApproval ? "Menunggu Approval" : isAccepted ? "Berjalan" : guidance?.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thesis Title Card */}
              {guidance.thesisTitle && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                      Judul Tugas Akhir
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{guidance.thesisTitle}</p>
                  </CardContent>
                </Card>
              )}

              {/* Milestone Card */}
              {guidance.milestoneTitles && guidance.milestoneTitles.length > 0 && (
                <Card className="border-l-4 border-l-violet-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-violet-500" />
                      Milestone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {guidance.milestoneTitles.map((title: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Student Notes Card */}
              {guidance.notes && (
                <Card className="border-l-4 border-l-slate-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquareText className="h-4 w-4 text-slate-500" />
                      Catatan dari Mahasiswa
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dikirim saat mengajukan bimbingan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {guidance.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Session Summary (2/3 width on large screens) */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center">
                        <NotebookPen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Catatan Sesi Bimbingan</CardTitle>
                        <CardDescription className="text-xs">
                          Ringkasan dan arahan dari sesi bimbingan
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {!hasSummary ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Menunggu Catatan Mahasiswa</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Mahasiswa belum mengisi catatan bimbingan. Catatan akan muncul di sini setelah mahasiswa mengisi ringkasan dan arahan dari sesi bimbingan.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Status Alert */}
                      {isPendingApproval && (
                        <Alert className="border-violet-200 bg-linear-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20">
                          <Sparkles className="h-4 w-4 text-violet-600" />
                          <AlertTitle className="text-violet-700 dark:text-violet-400">Review Catatan</AlertTitle>
                          <AlertDescription className="text-violet-600 dark:text-violet-500 text-sm">
                            Mahasiswa telah mengisi catatan bimbingan. Silakan review dan setujui untuk menyelesaikan sesi ini.
                          </AlertDescription>
                        </Alert>
                      )}

                      {isCompleted && (
                        <Alert className="border-green-200 bg-linear-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-700 dark:text-green-400">Sesi Selesai</AlertTitle>
                          <AlertDescription className="text-green-600 dark:text-green-500 text-sm">
                            Catatan bimbingan telah disetujui dan sesi bimbingan selesai.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Session Summary */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <Label className="text-sm font-semibold">Ringkasan Bimbingan</Label>
                        </div>
                        <div className="p-4 bg-linear-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-slate-950/20 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {guidance.sessionSummary || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Action Items */}
                      {guidance.actionItems && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                              <ListTodo className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <Label className="text-sm font-semibold">Arahan / Action Items</Label>
                          </div>
                          <div className="p-4 bg-linear-to-br from-green-50/50 to-slate-50/50 dark:from-green-950/20 dark:to-slate-950/20 rounded-lg border border-green-100/50 dark:border-green-900/30">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {guidance.actionItems}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Submission Info */}
                      {guidance.summarySubmittedAtFormatted && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Catatan dikirim pada: {guidance.summarySubmittedAtFormatted}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isPendingApproval && (
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => navigate("/tugas-akhir/bimbingan/lecturer/scheduled")}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                          </Button>
                          <Button
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
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
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Dokumen */}
        <TabsContent value="document" className="mt-6">
          {documentUrl ? (
            <PdfViewer
              url={documentUrl}
              className="min-h-150"
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
