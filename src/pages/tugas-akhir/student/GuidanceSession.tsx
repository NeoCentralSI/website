import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  User,
  Target,
  FileText,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  NotebookPen,
  GraduationCap,
  CalendarClock,
  BookOpen,
  ListTodo,
  MessageSquare,
  Sparkles,
  PenLine,
} from "lucide-react";
import { PdfViewer } from "@/components/pdf";
import { getStudentGuidanceDetail, submitSessionSummary } from "@/services/studentGuidance.service";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";

export default function GuidanceSessionPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { guidanceId } = useParams<{ guidanceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [sessionSummary, setSessionSummary] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  // Fetch guidance detail
  const { data, isLoading, error } = useQuery({
    queryKey: ["guidance-session", guidanceId],
    queryFn: () => getStudentGuidanceDetail(guidanceId!),
    enabled: !!guidanceId,
  });

  const guidance = data?.guidance;

  // Submit mutation (menunggu approval dosen)
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!guidanceId) throw new Error("Guidance not found");
      return submitSessionSummary(guidanceId, { sessionSummary, actionItems });
    },
    onSuccess: () => {
      toast.success("Catatan bimbingan berhasil dikirim, menunggu approval dosen");
      queryClient.invalidateQueries({ queryKey: ["needs-summary"] });
      queryClient.invalidateQueries({ queryKey: ["student-guidances"] });
      queryClient.invalidateQueries({ queryKey: ["completed-history"] });
      queryClient.invalidateQueries({ queryKey: ["guidance-session", guidanceId] });
      navigate("/tugas-akhir/bimbingan/student");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengirim catatan bimbingan");
    },
  });

  const handleSubmit = () => {
    if (!sessionSummary.trim()) {
      toast.error("Ringkasan bimbingan wajib diisi");
      return;
    }
    submitMutation.mutate();
  };

  const isSubmitting = submitMutation.isPending;

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" },
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan/student" },
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

  // Status check
  const needsSummary = guidance?.status === "accepted" || guidance?.status === "summary_pending";
  const isCompleted = guidance?.status === "completed";
  const hasSummary = !!guidance?.sessionSummary;

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
            <Link to="/tugas-akhir/bimbingan/student">
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
            <Link to="/tugas-akhir/bimbingan/student">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sesi Bimbingan</h1>
            <p className="text-muted-foreground">
              {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing")}
            </p>
          </div>
        </div>

        <Badge
          variant={isCompleted ? "default" : needsSummary ? "secondary" : "outline"}
          className={
            isCompleted
              ? "bg-green-100 text-green-700 border-green-200 h-9 px-3"
              : needsSummary
              ? "bg-amber-100 text-amber-700 border-amber-200 h-9 px-3"
              : "h-9 px-3"
          }
        >
          {isCompleted ? "Selesai" : needsSummary ? "Perlu Diisi Catatan" : guidance.status}
        </Badge>
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
            {/* Left Column - Session Info (1/3 width on large screens) */}
            <div className="space-y-6">
              {/* Supervisor Card */}
              <Card className="border-l-4 border-l-primary overflow-hidden">
                <CardHeader className="pb-3 bg-linear-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Dosen Pembimbing
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-lg truncate">
                        {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing")}
                      </p>
                      <p className="text-sm text-muted-foreground">Pembimbing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card className="border-l-4 border-l-blue-500 overflow-hidden">
                <CardHeader className="pb-3 bg-linear-to-r from-blue-500/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                    Jadwal Bimbingan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
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
                        {isCompleted ? "✓ Selesai" : needsSummary ? "Perlu Isi Catatan" : guidance?.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Card */}
              {guidance.milestoneTitles && guidance.milestoneTitles.length > 0 && (
                <Card className="border-l-4 border-l-violet-500 overflow-hidden">
                  <CardHeader className="pb-3 bg-linear-to-r from-violet-500/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-violet-500" />
                      Milestone Dibahas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {guidance.milestoneTitles.map((title: string, idx: number) => (
                        <Badge key={idx} className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Initial Notes Card */}
              {guidance.notes && (
                <Card className="border-l-4 border-l-slate-400 overflow-hidden">
                  <CardHeader className="pb-3 bg-linear-to-r from-slate-400/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      Catatan Awal
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dikirim saat mengajukan bimbingan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-wrap bg-slate-50/80 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                      {guidance.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Session Notes (2/3 width on large screens) */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4 border-b bg-linear-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center">
                        <NotebookPen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Catatan Sesi Bimbingan</CardTitle>
                        <CardDescription className="text-xs">
                          {isCompleted || hasSummary 
                            ? "Ringkasan dan feedback dari sesi bimbingan"
                            : "Isi catatan setelah sesi bimbingan selesai"
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        isCompleted
                          ? "bg-green-100 text-green-700 border-green-200"
                          : hasSummary
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }
                    >
                      {isCompleted ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Selesai</>
                      ) : hasSummary ? (
                        <><Clock className="h-3 w-3 mr-1" /> Menunggu Approval</>
                      ) : (
                        <><PenLine className="h-3 w-3 mr-1" /> Perlu Diisi</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {isCompleted || hasSummary ? (
                    // View mode - already filled
                    <>
                      <Alert className="border-green-200 bg-linear-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-700 dark:text-green-400">
                          {isCompleted ? "Sesi Bimbingan Selesai" : "Menunggu Approval Dosen"}
                        </AlertTitle>
                        <AlertDescription className="text-green-600 dark:text-green-500 text-sm">
                          {isCompleted 
                            ? "Catatan bimbingan sudah diisi dan disetujui dosen pembimbing."
                            : "Catatan sudah dikirim dan menunggu persetujuan dosen pembimbing."
                          }
                        </AlertDescription>
                      </Alert>

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
                            <div className="h-6 w-6 rounded bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                              <ListTodo className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <Label className="text-sm font-semibold">Arahan / Action Items</Label>
                          </div>
                          <div className="p-4 bg-linear-to-br from-amber-50/50 to-slate-50/50 dark:from-amber-950/20 dark:to-slate-950/20 rounded-lg border border-amber-100/50 dark:border-amber-900/30">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {guidance.actionItems}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Supervisor Feedback */}
                      {guidance.supervisorFeedback && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            <Label className="text-sm font-semibold">Feedback Dosen</Label>
                          </div>
                          <div className="p-4 bg-linear-to-br from-violet-50/50 to-slate-50/50 dark:from-violet-950/20 dark:to-slate-950/20 rounded-lg border border-violet-100/50 dark:border-violet-900/30">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {guidance.supervisorFeedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Edit mode - needs to fill
                    <>
                      <Alert className="border-amber-200 bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
                        <PenLine className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-700 dark:text-amber-400">Isi Catatan Bimbingan</AlertTitle>
                        <AlertDescription className="text-amber-600 dark:text-amber-500 text-sm">
                          Silakan isi catatan bimbingan setelah sesi selesai. Dosen pembimbing akan mereview dan menyetujui catatan Anda.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <Label htmlFor="sessionSummary" className="text-sm font-semibold">
                              Ringkasan Bimbingan <span className="text-destructive">*</span>
                            </Label>
                          </div>
                          <Textarea
                            id="sessionSummary"
                            value={sessionSummary}
                            onChange={(e) => setSessionSummary(e.target.value)}
                            placeholder="Tuliskan ringkasan pembahasan selama sesi bimbingan..."
                            rows={5}
                            className="resize-none border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
                          />
                          <p className="text-xs text-muted-foreground">
                            Deskripsikan apa saja yang dibahas dalam sesi bimbingan
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                              <ListTodo className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <Label htmlFor="actionItems" className="text-sm font-semibold">
                              Arahan / Action Items
                            </Label>
                          </div>
                          <Textarea
                            id="actionItems"
                            value={actionItems}
                            onChange={(e) => setActionItems(e.target.value)}
                            placeholder="Tuliskan saran, arahan, atau tugas yang diberikan dosen pembimbing..."
                            rows={4}
                            className="resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                          />
                          <p className="text-xs text-muted-foreground">
                            Apa yang harus dikerjakan sebelum bimbingan selanjutnya
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => navigate("/tugas-akhir/bimbingan/student")}
                          disabled={isSubmitting}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Kembali
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting || !sessionSummary.trim()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Kirim Catatan
                            </>
                          )}
                        </Button>
                      </div>
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
