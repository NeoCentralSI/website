import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { getStudentDetail, validateMilestone, createMilestoneForStudent, type CreateMilestoneForStudentDto } from "@/services/lecturerGuidance.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import { FileText, CheckCircle2, Clock, AlertTriangle, Download, ArrowLeft, Check, BookOpen, Calendar, Bell, PartyPopper, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SeminarReadinessCard } from "@/components/milestone/lecturer/SeminarReadinessCard";
import { DefenceReadinessCard } from "@/components/milestone/lecturer/DefenceReadinessCard";
import { ChangeRequestReviewCard } from "@/components/tugas-akhir/lecturer/ChangeRequestReviewCard";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Belum Dimulai",
  in_progress: "Sedang Dikerjakan",
  pending_review: "Menunggu Review",
  revision_needed: "Revisi",
  completed: "Selesai",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "outline",
  in_progress: "secondary",
  pending_review: "secondary",
  revision_needed: "destructive",
  completed: "default",
};

export default function LecturerMyStudentDetailPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { thesisId } = useParams<{ thesisId: string }>();
  const queryClient = useQueryClient();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  
  // Create milestone dialog state
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneTargetDate, setMilestoneTargetDate] = useState<Date | undefined>();
  const [milestoneSupervisorNotes, setMilestoneSupervisorNotes] = useState("");

  // Helper to convert backend URLs to absolute URLs
  const getDocumentUrl = (path: string): string => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // Backend returns paths WITH /uploads/ prefix, so we need to use it as-is
    // getApiUrl() just prepends base URL: http://localhost:3000 + /uploads/thesis/file.pdf
    return getApiUrl(path);
  };

  // Initial breadcrumb, will be updated when data is loaded
  const baseBreadcrumb = useMemo(() => [
    { label: "Tugas Akhir" }, 
    { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" }, 
    { label: "Mahasiswa Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/my-students" },
    { label: "Detail Mahasiswa" }
  ], []);
  
  useEffect(() => {
    setBreadcrumbs(baseBreadcrumb);
    setTitle(undefined);
  }, [baseBreadcrumb, setBreadcrumbs, setTitle]);

  const { data: detailData, isLoading, isError } = useQuery({
    queryKey: ['student-detail', thesisId],
    queryFn: () => getStudentDetail(thesisId!).then(res => res.data),
    enabled: !!thesisId
  });

  const progressPercentage = useMemo(() => {
    if (!detailData?.milestones?.length) return 0;
    const completed = detailData.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / detailData.milestones.length) * 100);
  }, [detailData?.milestones]);

  const validateMutation = useMutation({
    mutationFn: (milestoneId: string) => validateMilestone(milestoneId),
    onSuccess: () => {
        toast.success("Milestone berhasil divalidasi");
        queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
    },
    onError: (error: Error) => {
        toast.error(error.message);
    },
    onSettled: () => {
        setValidatingId(null);
    }
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data: CreateMilestoneForStudentDto) => createMilestoneForStudent(thesisId!, data),
    onSuccess: () => {
        toast.success("Milestone berhasil dibuat untuk mahasiswa");
        queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
        setCreateMilestoneOpen(false);
        resetMilestoneForm();
    },
    onError: (error: Error) => {
        toast.error(error.message);
    }
  });

  const resetMilestoneForm = () => {
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneTargetDate(undefined);
    setMilestoneSupervisorNotes("");
  };

  const handleCreateMilestone = () => {
    if (!milestoneTitle.trim()) {
        toast.error("Judul milestone wajib diisi");
        return;
    }
    createMilestoneMutation.mutate({
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        targetDate: milestoneTargetDate?.toISOString(),
        supervisorNotes: milestoneSupervisorNotes.trim() || undefined,
    });
  };

  const handleValidate = () => {
    if (selectedMilestoneId) {
        const id = selectedMilestoneId;
        setValidatingId(id);
        setSelectedMilestoneId(null);
        validateMutation.mutate(id);
    }
  };

  // Update breadcrumb with student name when data is loaded
  useEffect(() => {
    if (detailData?.student.fullName) {
        setBreadcrumbs([
            { label: "Tugas Akhir" }, 
            { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" }, 
            { label: "Mahasiswa Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/my-students" },
            { label: toTitleCaseName(detailData.student.fullName) }
        ]);
    }
  }, [detailData, setBreadcrumbs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
        case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case "in_progress": return <Clock className="h-5 w-5 text-blue-500" />;
        case "revision_needed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
        default: return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
            <Spinner className="h-10 w-10 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Memuat detail mahasiswa...</p>
        </div>
    );
  }

  if (isError || !detailData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-100">
             <EmptyState 
               title="Terjadi Kesalahan" 
               description="Gagal memuat data mahasiswa. Silakan coba lagi."
               showButton
               buttonText="Kembali"
               onButtonClick={() => window.location.href = '/tugas-akhir/bimbingan/lecturer/my-students'}
             />
        </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="shrink-0">
                <Link to="/tugas-akhir/bimbingan/lecturer/my-students">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
            <h1 className="text-2xl font-bold tracking-tight">{toTitleCaseName(detailData.student.fullName)}</h1>
            <p className="text-muted-foreground">
                {detailData.student.nim} • {detailData.student.email}
            </p>
            </div>
        </div>
      
        <div className="flex items-center gap-2">
             <Badge variant="outline" className="text-sm px-3 py-1 h-9">
                {formatRoleName(detailData.status)}
            </Badge>
        </div>
      </div>

      {/* Alert Banner ketika milestone 100% */}
      {progressPercentage === 100 && (
        <Alert className="border-green-200 bg-green-50">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Milestone Selesai 100%!</AlertTitle>
          <AlertDescription className="text-green-700">
            Mahasiswa ini telah menyelesaikan keseluruhan milestone. Silakan review kembali progress dan berikan approval agar mahasiswa dapat mendaftar seminar.
          </AlertDescription>
        </Alert>
      )}

      {/* Change Request Review Card - tampilkan jika ada pending request */}
      {thesisId && (
        <ChangeRequestReviewCard
          thesisId={thesisId}
          studentName={detailData.student.fullName}
        />
      )}

      {/* Seminar Readiness Card - tampilkan jika milestone 100% */}
      {progressPercentage === 100 && thesisId && (
        <SeminarReadinessCard
          thesisId={thesisId}
          studentName={detailData.student.fullName}
          thesisTitle={detailData.title}
        />
      )}

      {/* Defence Readiness Card - tampilkan berdasarkan status thesis */}
      {thesisId && (
        <DefenceReadinessCard
          thesisId={thesisId}
          studentName={detailData.student.fullName}
          thesisTitle={detailData.title}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Thesis Info & Documents */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4" />
                        Informasi Skripsi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-medium text-lg leading-relaxed text-foreground">
                            {detailData.title || <span className="text-muted-foreground italic">Judul belum ditentukan</span>}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="secondary" className="font-normal rounded-md">
                                {toTitleCaseName(detailData.status)}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1.5">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                 <Calendar className="h-4 w-4" />
                                 <span>Mulai</span>
                             </div>
                             <p className="font-medium pl-6">
                                {detailData.startDate ? formatDateId(detailData.startDate) : '-'}
                             </p>
                        </div>

                         <div className="space-y-1.5">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                 <Clock className="h-4 w-4" />
                                 <span>Deadline</span>
                             </div>
                             <div className="pl-6">
                                <p className="font-medium">
                                    {detailData.deadlineDate ? formatDateId(detailData.deadlineDate) : '-'}
                                </p>
                                {detailData.deadlineDate && (() => {
                                     const days = Math.ceil((new Date(detailData.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                     if (days < 0) return (
                                        <Badge variant="destructive" className="mt-1 h-5 px-1.5 text-[10px] font-normal">
                                            Expired {Math.abs(days)} hari
                                        </Badge>
                                     );
                                     if (days <= 30) return (
                                        <Badge variant="outline" className="mt-1 h-5 px-1.5 text-[10px] font-normal text-orange-600 bg-orange-50 border-orange-200">
                                            Sisa {days} hari
                                        </Badge>
                                     );
                                     return (
                                        <span className="text-xs text-muted-foreground mt-0.5 block">
                                            {days} hari lagi
                                        </span>
                                     );
                                })()}
                             </div>
                        </div>
                    </div>
                    
                    <div className="pt-2 space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Progres Kelulusan</span>
                                <span className="font-bold text-primary">{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Mahasiswa telah menyelesaikan <span className="font-medium text-foreground">{detailData.milestones.filter(m => m.status === 'completed').length}</span> dari <span className="font-medium text-foreground">{detailData.milestones.length}</span> tahapan skripsi.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Dokumen Proposal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {detailData.proposalDocument ? (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-md border">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{detailData.proposalDocument.fileName}</p>
                                        <p className="text-xs text-muted-foreground">Proposal</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={getDocumentUrl(detailData.proposalDocument.url)} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <EmptyState 
                              size="sm" 
                              title="Belum Ada Proposal" 
                              description="Belum ada dokumen proposal" 
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Dokumen Skripsi (Draft Akhir)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {detailData.document ? (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-md border">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="h-8 w-8 text-green-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{detailData.document.fileName}</p>
                                        <p className="text-xs text-muted-foreground">Draft Skripsi</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={getDocumentUrl(detailData.document.url)} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <EmptyState 
                              size="sm" 
                              title="Belum Ada Draft" 
                              description="Belum ada draft skripsi" 
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Right Column: Milestones */}
        <div className="space-y-6">
            <Card className="h-full border-none shadow-none lg:border lg:shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Riwayat Milestone</CardTitle>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCreateMilestoneOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah
                    </Button>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                     <div className="relative border-l ml-3 space-y-8 my-2">
                        {detailData.milestones && detailData.milestones.length > 0 ? (
                            detailData.milestones.map((milestone) => (
                                <div key={milestone.id} className="ml-6 relative group pb-2">
                                    {validatingId === milestone.id && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded transition-all">
                                            <Spinner className="h-6 w-6 text-primary" />
                                        </div>
                                    )}
                                    <span className={cn(
                                        "absolute -left-9.25 top-1 p-1 rounded-full border bg-background z-10",
                                        milestone.status === 'completed' ? "border-green-500 text-green-500" : "border-border text-muted-foreground"
                                    )}>
                                         {getStatusIcon(milestone.status)}
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-medium text-sm leading-snug mt-0.5">{milestone.title}</h4>
                                            {milestone.status !== 'completed' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className={cn(
                                                        "h-6 w-6 transition-opacity",
                                                        milestone.progressPercentage < 100 ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:bg-green-50 text-green-600"
                                                    )}
                                                    title={milestone.progressPercentage < 100 ? "Milestone belum mencapai 100%" : "Validasi Milestone"}
                                                    disabled={milestone.progressPercentage < 100}
                                                    onClick={() => setSelectedMilestoneId(milestone.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Proses</span>
                                                <span>{milestone.progressPercentage || 0}%</span>
                                            </div>
                                            <Progress value={milestone.progressPercentage || 0} className="h-1.5" />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                                            <Badge variant={STATUS_VARIANTS[milestone.status] || "outline"} className="text-[10px] h-5 px-1.5 font-normal">
                                                {STATUS_LABELS[milestone.status] || milestone.status.replace(/_/g, " ")}
                                            </Badge>
                                            {milestone.progressPercentage === 100 && milestone.status === 'in_progress' && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1 animate-pulse text-red-600 border-red-600 bg-transparent">
                                                    <Bell className="h-3 w-3" />
                                                    Perlu Approval
                                                </Badge>
                                            )}
                                            {milestone.updatedAt && (
                                                <span className="text-xs text-muted-foreground/70">
                                                    {formatDateId(milestone.updatedAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="-ml-3">
                              <EmptyState 
                                size="sm" 
                                title="Belum Ada Milestone" 
                                description="Belum ada milestone yang tercatat" 
                              />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <AlertDialog open={!!selectedMilestoneId} onOpenChange={(open) => !open && setSelectedMilestoneId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Validasi Milestone</AlertDialogTitle>
                <AlertDialogDescription>
                    Apakah Anda yakin ingin menyetujui milestone ini sebagai selesai?
                    Tindakan ini akan mengubah status milestone menjadi <strong>Selesai</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleValidate} disabled={validateMutation.isPending}>
                    {validateMutation.isPending ? "Memproses..." : "Ya, Validasi"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Milestone Dialog */}
      <Dialog 
        open={createMilestoneOpen} 
        onOpenChange={(open) => {
            setCreateMilestoneOpen(open);
            if (!open) resetMilestoneForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Tambah Milestone untuk Mahasiswa</DialogTitle>
            </DialogHeader>
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateMilestone();
                }}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <Label htmlFor="milestone-title">
                        Judul Milestone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="milestone-title"
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        placeholder="Contoh: Revisi Bab 4"
                        disabled={createMilestoneMutation.isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="milestone-description">Deskripsi</Label>
                    <Textarea
                        id="milestone-description"
                        value={milestoneDescription}
                        onChange={(e) => setMilestoneDescription(e.target.value)}
                        placeholder="Deskripsi detail milestone..."
                        rows={3}
                        disabled={createMilestoneMutation.isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Target Tanggal</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !milestoneTargetDate && "text-muted-foreground"
                                )}
                                disabled={createMilestoneMutation.isPending}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {milestoneTargetDate 
                                    ? format(milestoneTargetDate, "PPP", { locale: localeId })
                                    : "Pilih tanggal target"
                                }
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                mode="single"
                                selected={milestoneTargetDate}
                                onSelect={setMilestoneTargetDate}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="milestone-notes">Catatan untuk Mahasiswa</Label>
                    <Textarea
                        id="milestone-notes"
                        value={milestoneSupervisorNotes}
                        onChange={(e) => setMilestoneSupervisorNotes(e.target.value)}
                        placeholder="Instruksi atau catatan untuk mahasiswa..."
                        rows={3}
                        disabled={createMilestoneMutation.isPending}
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateMilestoneOpen(false)}
                        disabled={createMilestoneMutation.isPending}
                    >
                        Batal
                    </Button>
                    <Button 
                        type="submit"
                        disabled={createMilestoneMutation.isPending || !milestoneTitle.trim()}
                    >
                        {createMilestoneMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            "Simpan Milestone"
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
