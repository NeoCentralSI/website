import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  User,
  Target,
  FileText,
  Send,
  Loader2,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
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
      <Loading text="Memuat detail sesi bimbingan..." />
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

      <div className="grid grid-cols-1 gap-6">
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
                  <User className="h-4 w-4" />
                  <span>Pembimbing</span>
                </div>
                <p className="font-medium text-base">
                  {toTitleCaseName(guidance.supervisorName || "Dosen Pembimbing")}
                </p>
              </div>

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

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {guidance.type === "offline" ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  <span>{guidance.type === "offline" ? "Lokasi" : "Mode"}</span>
                </div>
                <p className="font-medium text-base">
                  {guidance.type === "offline" ? guidance.location || "-" : "Online"}
                  {guidance.meetingUrl && (
                    <a
                      href={guidance.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-primary hover:underline inline-flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Link
                    </a>
                  )}
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
                  <div className="text-sm text-muted-foreground mb-2">Catatan Awal</div>
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                    {guidance.notes}
                  </p>
                </div>
              </>
            )}

            {documentUrl && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Dokumen</div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={documentUrl} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      {guidance.document?.fileName || "Buka Dokumen"}
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Catatan Bimbingan Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Catatan Sesi Bimbingan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isCompleted || hasSummary ? (
              // View mode - already filled
              <>
                <Alert className="border-green-200 bg-green-50/80">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 text-sm">
                    Catatan bimbingan sudah diisi dan disetujui dosen pembimbing
                  </AlertDescription>
                </Alert>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Ringkasan Bimbingan</Label>
                  <div className="p-4 bg-muted/30 rounded-md border whitespace-pre-wrap text-sm">
                    {guidance.sessionSummary || "-"}
                  </div>
                </div>

                {guidance.actionItems && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Arahan / Action Items</Label>
                    <div className="p-4 bg-muted/30 rounded-md border whitespace-pre-wrap text-sm">
                      {guidance.actionItems}
                    </div>
                  </div>
                )}

                {guidance.supervisorFeedback && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Feedback Dosen</Label>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md whitespace-pre-wrap text-sm">
                      {guidance.supervisorFeedback}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Edit mode - needs to fill
              <>
                <Alert className="border-amber-200 bg-amber-50/80">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    Silakan isi catatan bimbingan setelah sesi selesai. Dosen pembimbing akan
                    mereview dan menyetujui catatan Anda.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="sessionSummary" className="text-sm">
                    Ringkasan Bimbingan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="sessionSummary"
                    value={sessionSummary}
                    onChange={(e) => setSessionSummary(e.target.value)}
                    placeholder="Tuliskan ringkasan pembahasan selama sesi bimbingan..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deskripsikan apa saja yang dibahas dalam sesi bimbingan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionItems" className="text-sm">Arahan / Action Items</Label>
                  <Textarea
                    id="actionItems"
                    value={actionItems}
                    onChange={(e) => setActionItems(e.target.value)}
                    placeholder="Tuliskan saran, arahan, atau tugas yang diberikan dosen pembimbing..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Apa yang harus dikerjakan sebelum bimbingan selanjutnya
                  </p>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/tugas-akhir/bimbingan/student")}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !sessionSummary.trim()}
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
  );
}
