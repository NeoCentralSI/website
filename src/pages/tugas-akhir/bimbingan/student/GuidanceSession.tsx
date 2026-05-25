import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import EmptyState from "@/components/ui/empty-state";
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
  NotebookPen,
  CalendarClock,
  BookOpen,
  ListTodo,
  MessageSquare,
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
    staleTime: 0,
    refetchInterval: (query) => {
      // Poll every 20s if waiting for approval
      return query.state.data?.guidance?.status === "summary_pending" ? 20000 : false;
    },
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
    let url = "";
    // If path starts with http, it's already a full URL
    if (path.startsWith("http")) return path;
    // If path starts with /uploads/ or uploads/, use it as-is (just prepend base URL)
    if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
      // Add leading slash if missing
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      url = getApiUrl(normalizedPath);
    } else {
      // Otherwise, add /uploads/ prefix
      url = getApiUrl(`/uploads/${path}`);
    }

    const token = localStorage.getItem("accessToken");
    if (token && path.includes("thesis/")) {
      url += (url.includes("?") ? "&" : "?") + `token=${token}`;
    }
    return url;
  };

  const documentUrl = getDocumentUrl();

  // Status check
  const needsSummary = guidance?.status === "accepted" || guidance?.status === "summary_pending";
  const isCompleted = guidance?.status === "completed";
  const hasSummary = !!guidance?.sessionSummary;

  // Timing check
  const guidanceDate = guidance?.approvedDate || guidance?.requestedDate;
  const isTimeArrived = guidanceDate ? new Date(guidanceDate) <= new Date() : false;

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
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-lg border-orange-200 bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary">
            <Link to="/tugas-akhir/bimbingan/student">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sesi Bimbingan</h1>
            <p className="text-sm text-muted-foreground">
              {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing")}
            </p>
          </div>
        </div>

        <Badge
          variant={isCompleted ? "default" : needsSummary ? "secondary" : "outline"}
          className={
            isCompleted
              ? "h-8 border-green-200 bg-green-50 px-3 text-green-700 hover:bg-green-50"
              : needsSummary
                ? "h-8 border-amber-200 bg-amber-50 px-3 text-amber-700 hover:bg-amber-50"
                : "h-8 px-3"
          }
        >
          {isCompleted ? "Selesai" : needsSummary ? "Perlu Diisi Catatan" : guidance.status}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-orange-100 bg-orange-50/60 p-1">
          <TabsTrigger value="info" className="gap-2 data-[state=active]:border-orange-200 data-[state=active]:text-primary">
            <NotebookPen className="h-4 w-4" />
            <span className="hidden sm:inline">Informasi & Catatan</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2 data-[state=active]:border-orange-200 data-[state=active]:text-primary" disabled={!documentUrl}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumen</span>
            <span className="sm:hidden">Dokumen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Info & Catatan Bimbingan */}
        <TabsContent value="info" className="mt-4 space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
            {/* Left Column - Session Info (1/3 width on large screens) */}
            <div className="space-y-4">
              {/* Supervisor Card */}
              <Card className="gap-0 overflow-hidden rounded-xl border-gray-200 border-l-2 border-l-orange-300 py-0 shadow-none">
                <CardHeader className="border-b border-orange-100 bg-orange-50/25 px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-primary" />
                    Dosen Pembimbing
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-primary">
                      {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing").slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing")}
                      </p>
                      <p className="text-sm text-muted-foreground">Pembimbing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card className="gap-0 overflow-hidden rounded-xl border-gray-200 border-l-2 border-l-orange-300 py-0 shadow-none">
                <CardHeader className="border-b border-orange-100 bg-orange-50/25 px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Jadwal Bimbingan
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-5">
                  <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/35 px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-orange-100 bg-white text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {guidance.approvedDateFormatted ||
                          guidance.requestedDateFormatted ||
                          (guidance.approvedDate
                            ? formatDateId(guidance.approvedDate)
                            : guidance.requestedDate
                              ? formatDateId(guidance.requestedDate)
                              : "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted ? "Selesai" : needsSummary ? "Perlu isi catatan" : guidance?.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Card */}
              {guidance.milestoneTitles && guidance.milestoneTitles.length > 0 && (
                <Card className="gap-0 overflow-hidden rounded-xl border-gray-200 border-l-2 border-l-orange-300 py-0 shadow-none">
                  <CardHeader className="border-b border-orange-100 bg-orange-50/25 px-5 py-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4 text-primary" />
                      Milestone Dibahas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 py-5">
                    <div className="flex flex-wrap gap-2">
                      {guidance.milestoneTitles.map((title: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-50">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Initial Notes Card */}
              {guidance.notes && (
                <Card className="gap-0 overflow-hidden rounded-xl border-gray-200 border-l-2 border-l-orange-300 py-0 shadow-none">
                  <CardHeader className="border-b border-orange-100 bg-orange-50/25 px-5 py-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Catatan Awal
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dikirim saat mengajukan bimbingan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 py-5">
                    <p className="rounded-lg border border-orange-100 bg-orange-50/25 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {guidance.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Session Notes (2/3 width on large screens) */}
            <div>
              <Card className="h-full gap-0 overflow-hidden rounded-xl border-gray-200 border-t-2 border-t-orange-300 py-0 shadow-none">
                <CardHeader className="border-b border-orange-100 bg-orange-50/20 px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-primary">
                        <NotebookPen className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Catatan Sesi Bimbingan</CardTitle>
                        <CardDescription className="text-xs">
                          {isCompleted || hasSummary
                            ? "Ringkasan dan feedback dari sesi bimbingan"
                            : "Isi catatan setelah sesi bimbingan selesai"
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isCompleted
                          ? "w-fit border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
                          : hasSummary
                            ? "w-fit border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
                            : "w-fit border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
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
                <CardContent className="space-y-6 p-5">
                  {isCompleted || hasSummary ? (
                    // View mode - already filled
                    <>
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-sm text-green-700">
                          {isCompleted ? "Sesi Bimbingan Selesai" : "Menunggu Approval Dosen"}
                        </AlertTitle>
                        <AlertDescription className="text-sm text-green-600">
                          {isCompleted
                            ? "Catatan bimbingan sudah diisi dan disetujui dosen pembimbing."
                            : "Catatan sudah dikirim dan menunggu persetujuan dosen pembimbing."
                          }
                        </AlertDescription>
                      </Alert>

                      {/* Session Summary */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-semibold">Ringkasan Bimbingan</Label>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {guidance.sessionSummary || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Action Items */}
                      {guidance.actionItems && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-semibold">Arahan / Action Items</Label>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-semibold">Feedback Dosen</Label>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                      {!isTimeArrived ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-orange-100 bg-orange-50/20 px-6 py-12 text-center">
                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-primary">
                            <Clock className="h-5 w-5" />
                          </div>
                          <h3 className="mb-2 text-base font-semibold">Belum Waktu Bimbingan</h3>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Catatan sesi bimbingan baru dapat diisi setelah waktu bimbingan tiba {guidance.approvedDateFormatted ? `(${guidance.approvedDateFormatted})` : ''}.
                          </p>
                        </div>
                      ) : (
                        <>
                          <Alert className="border-amber-200 bg-amber-50">
                            <PenLine className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-sm text-amber-700">Isi Catatan Bimbingan</AlertTitle>
                            <AlertDescription className="text-sm text-amber-600">
                              Silakan isi catatan bimbingan setelah sesi selesai. Dosen pembimbing akan mereview dan menyetujui catatan Anda.
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
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
                                className="resize-none border-gray-200 bg-white focus:border-primary focus:ring-primary/20"
                              />
                              <p className="text-xs text-muted-foreground">
                                Deskripsikan apa saja yang dibahas dalam sesi bimbingan
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <ListTodo className="h-4 w-4 text-muted-foreground" />
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
                                className="resize-none border-gray-200 bg-white focus:border-primary focus:ring-primary/20"
                              />
                              <p className="text-xs text-muted-foreground">
                                Apa yang harus dikerjakan sebelum bimbingan selanjutnya
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
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
