import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import { getStudentSupervisors, getMyThesisDetail, updateMyThesisTitle } from "@/services/studentGuidance.service";
import { Loading, Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  GraduationCap, 
  User, 
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  Check,
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";
import { toTitleCaseName, formatRoleName } from "@/lib/text";

import {
  MilestoneList,
  MilestoneFormDialog,
  TemplateSelectorDialog,
  DeleteMilestoneDialog,
  SeminarReadinessStatusCard,
  DefenceRequestCard,
} from "@/components/milestone";

import {
  useMilestones,
  useTemplates,
  useCreateMilestone,
  useCreateFromTemplates,
  useUpdateMilestone,
  useDeleteMilestone,
  useUpdateProgress,
  useUpdateStatus,
  useReorderMilestones,
} from "@/hooks/milestone";

import type {
  Milestone,
  MilestoneStatus,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "@/types/milestone.types";

export default function StudentMilestonePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  // Get thesisId from supervisors endpoint
  const { data: supervisorsData, isLoading: isLoadingSupervisors, error: supervisorsError } = useQuery({
    queryKey: ["student-supervisors"],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId || "";
  const hasThesis = !supervisorsError && !!thesisId;

  // Get thesis detail
  const { data: thesisDetail, isLoading: isLoadingThesis } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
    enabled: hasThesis,
  });

  // Title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Title update mutation
  const updateTitleMutation = useMutation({
    mutationFn: updateMyThesisTitle,
    onSuccess: () => {
      toast.success("Judul tugas akhir berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["my-thesis-detail"] });
      setIsEditingTitle(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui judul tugas akhir");
    },
  });

  const handleStartEditTitle = () => {
    setEditedTitle(thesisDetail?.title || "");
    setIsEditingTitle(true);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim()) {
      toast.error("Judul tidak boleh kosong");
      return;
    }
    if (editedTitle.trim().length < 10) {
      toast.error("Judul minimal 10 karakter");
      return;
    }
    updateTitleMutation.mutate(editedTitle.trim());
  };

  // Milestones data
  const { data: milestonesData, isLoading: isLoadingMilestones } = useMilestones(thesisId);
  const milestones = milestonesData?.milestones ?? [];
  const progress = milestonesData?.progress ?? null;
  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplates();

  // Mutations
  const createMutation = useCreateMilestone(thesisId);
  const createFromTemplatesMutation = useCreateFromTemplates(thesisId);
  const updateMutation = useUpdateMilestone(thesisId);
  const deleteMutation = useDeleteMilestone(thesisId);
  const updateProgressMutation = useUpdateProgress(thesisId);
  const updateStatusMutation = useUpdateStatus(thesisId);
  const reorderMutation = useReorderMilestones(thesisId);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkStarting, setIsBulkStarting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [progressUpdatingId, setProgressUpdatingId] = useState<string | null>(null);

  // Breadcrumbs
  const breadcrumb = useMemo(
    () => [
      { label: "Tugas Akhir" }, 
      { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, 
      { label: "Tugas Akhir Saya" }
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Handlers
  const handleCreateNew = () => {
    setSelectedMilestone(null);
    setFormDialogOpen(true);
  };

  const handleCreateFromTemplates = () => {
    setTemplateDialogOpen(true);
  };

  const handleEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setFormDialogOpen(true);
  };

  const handleDelete = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: CreateMilestoneDto | UpdateMilestoneDto) => {
    if (selectedMilestone) {
      updateMutation.mutate(
        { milestoneId: selectedMilestone.id, data: data as UpdateMilestoneDto },
        {
          onSuccess: () => {
            toast.success("Milestone berhasil diperbarui");
            setFormDialogOpen(false);
            setSelectedMilestone(null);
          },
          onError: (error) => {
            toast.error(error.message || "Gagal memperbarui milestone");
          },
        }
      );
    } else {
      createMutation.mutate(data as CreateMilestoneDto, {
        onSuccess: () => {
          toast.success("Milestone berhasil dibuat");
          setFormDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Gagal membuat milestone");
        },
      });
    }
  };

  const handleTemplateSubmit = (templateIds: string[], topicId: string) => {
    createFromTemplatesMutation.mutate(
      { templateIds, topicId },
      {
        onSuccess: (data) => {
          toast.success(`${data.length} milestone berhasil dibuat dari template`);
          setTemplateDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Gagal membuat milestone dari template");
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedMilestone) return;

    deleteMutation.mutate(selectedMilestone.id, {
      onSuccess: () => {
        toast.success("Milestone berhasil dihapus");
        setDeleteDialogOpen(false);
        setSelectedMilestone(null);
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menghapus milestone");
      },
    });
  };

  const handleProgressChange = (milestone: Milestone, newProgress: number) => {
    setProgressUpdatingId(milestone.id);
    updateProgressMutation.mutate(
      { milestoneId: milestone.id, data: { progressPercentage: newProgress } },
      {
        onSuccess: () => {
          toast.success("Progress berhasil diperbarui");
        },
        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui progress");
        },
        onSettled: () => {
          setProgressUpdatingId(null);
        }
      }
    );
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStart = async () => {
    const eligible = milestones.filter(
      (m) => selectedIds.includes(m.id) && m.status === "not_started"
    );
    if (eligible.length === 0) {
      toast.error("Hanya milestone berstatus Belum Mulai yang bisa dipilih untuk mulai");
      return;
    }
    setIsBulkStarting(true);
    let successCount = 0;
    for (const m of eligible) {
      try {
        await updateStatusMutation.mutateAsync({
          milestoneId: m.id,
          data: { status: "in_progress" },
        });
        successCount += 1;
      } catch (err) {
        toast.error((err as Error).message || `Gagal memulai "${m.title}"`);
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} milestone dimulai`);
    }
    setIsBulkStarting(false);
    setSelectedIds([]);
  };

  const handleStatusChange = (milestone: Milestone, status: Exclude<MilestoneStatus, "completed">) => {
    setStatusUpdatingId(milestone.id);
    updateStatusMutation.mutate(
      { milestoneId: milestone.id, data: { status } },
      {
        onSuccess: () => {
          toast.success("Status berhasil diperbarui");
        },
        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui status");
        },
        onSettled: () => {
          setStatusUpdatingId(null);
        },
      }
    );
  };

  const handleReorder = (orders: { id: string; orderIndex: number }[]) => {
    reorderMutation.mutate(
      { milestoneOrders: orders },
      {
        onError: (error) => {
          toast.error(error.message || "Gagal mengubah urutan milestone");
        },
      }
    );
  };

  const isLoading = isLoadingSupervisors || isLoadingMilestones || isLoadingThesis;

  // Define tabs for reuse
  const tabs = [
    { label: "Bimbingan", to: "/tugas-akhir/bimbingan/student", end: true },
    { label: "Pembimbing", to: "/tugas-akhir/bimbingan/supervisors" },
    { label: "Tugas Akhir Saya", to: "/tugas-akhir/bimbingan/milestone" },
    { label: "Riwayat", to: "/tugas-akhir/bimbingan/completed-history" },
  ];

  // Status mapping
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      aktif: { label: "Aktif", variant: "default" },
      lulus: { label: "Lulus", variant: "secondary" },
      selesai: { label: "Selesai", variant: "secondary" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Rating badge
  const getRatingBadge = (rating?: number) => {
    if (!rating) return null;
    const colors = {
      1: "bg-red-100 text-red-700 border-red-200",
      2: "bg-orange-100 text-orange-700 border-orange-200",
      3: "bg-yellow-100 text-yellow-700 border-yellow-200",
      4: "bg-emerald-100 text-emerald-700 border-emerald-200",
      5: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      <Badge variant="outline" className={colors[rating as keyof typeof colors] || ""}>
        Rating: {rating}/5
      </Badge>
    );
  };

  return (
    <div className="p-4">
      <TabsNav preserveSearch tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data milestone..." />
        </div>
      ) : !hasThesis ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Belum Terdaftar Tugas Akhir</h3>
          <p className="text-muted-foreground max-w-sm">
            {supervisorsError 
              ? `Terjadi kesalahan: ${(supervisorsError as Error).message}`
              : "Anda belum terdaftar dalam tugas akhir. Hubungi admin atau pembimbing untuk mendaftarkan tugas akhir Anda."
            }
          </p>
        </div>
      ) : (
        <>
          {/* My Thesis Detail Card */}
          {thesisDetail && (
            <Card className="mb-6 border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Detail Tugas Akhir</CardTitle>
                      <CardDescription>Informasi lengkap tugas akhir Anda</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(thesisDetail.status)}
                    {getRatingBadge(thesisDetail.rating ?? undefined)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Section - Editable */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Judul Tugas Akhir
                  </Label>
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Masukkan judul tugas akhir..."
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditTitle}
                        disabled={updateTitleMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveTitle}
                        disabled={updateTitleMutation.isPending}
                      >
                        {updateTitleMutation.isPending ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
                      <p className="text-lg font-semibold leading-relaxed">{thesisDetail.title}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={handleStartEditTitle}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Info Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Topic */}
                    {thesisDetail.topic && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Topik
                        </Label>
                        <p className="font-medium">{thesisDetail.topic.name}</p>
                      </div>
                    )}

                    {/* Academic Year */}
                    {thesisDetail.academicYear && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Tahun Akademik
                        </Label>
                        <p className="font-medium">
                          {thesisDetail.academicYear.year}/{thesisDetail.academicYear.year + 1} - Semester {thesisDetail.academicYear.semester}
                        </p>
                      </div>
                    )}

                    {/* Supervisors */}
                    {thesisDetail.supervisors && thesisDetail.supervisors.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Pembimbing
                        </Label>
                        <div className="space-y-2">
                          {thesisDetail.supervisors.map((sup) => (
                            <div key={sup.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="shrink-0">
                                {formatRoleName(sup.role)}
                              </Badge>
                              <span className="font-medium">{toTitleCaseName(sup.name || '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Examiners */}
                    {thesisDetail.examiners && thesisDetail.examiners.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Penguji
                        </Label>
                        <div className="space-y-2">
                          {thesisDetail.examiners.map((ex) => (
                            <div key={ex.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="shrink-0">
                                {formatRoleName(ex.role)}
                              </Badge>
                              <span className="font-medium">{toTitleCaseName(ex.name || '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Stats */}
                    {thesisDetail.stats && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Statistik Progress
                        </Label>
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Milestone</span>
                              <span className="font-medium">
                                {thesisDetail.stats.completedMilestones}/{thesisDetail.stats.totalMilestones}
                              </span>
                            </div>
                            <Progress 
                              value={thesisDetail.stats.totalMilestones > 0 
                                ? (thesisDetail.stats.completedMilestones / thesisDetail.stats.totalMilestones) * 100 
                                : 0
                              } 
                              className="h-2"
                            />
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Selesai: {thesisDetail.stats.completedMilestones}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>Berjalan: {thesisDetail.stats.inProgressMilestones}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-primary" />
                              <span>Sesi: {thesisDetail.stats.totalSessions}</span>
                            </div>
                            {(thesisDetail.stats.overdueMilestones ?? 0) > 0 && (
                              <div className="flex items-center gap-2 text-sm text-destructive">
                                <Clock className="h-4 w-4" />
                                <span>Terlambat: {thesisDetail.stats.overdueMilestones}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seminar Readiness Status for Student */}
          {thesisId && (
            <SeminarReadinessStatusCard thesisId={thesisId} className="mb-4" />
          )}

          {/* Defence Readiness Request for Student */}
          {thesisId && (
            <DefenceRequestCard thesisId={thesisId} className="mb-4" />
          )}

          <MilestoneList
            milestones={milestones}
            progress={progress ?? null}
            isLoading={isLoading}
            isOwner={true}
            isSupervisor={false}
            onCreateNew={handleCreateNew}
            onCreateFromTemplates={handleCreateFromTemplates}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onProgressChange={handleProgressChange}
            onStatusChange={handleStatusChange}
            isProgressUpdating={updateProgressMutation.isPending}
            progressUpdatingId={progressUpdatingId}
            statusUpdatingId={statusUpdatingId}
            onReorder={handleReorder}
            isReordering={reorderMutation.isPending}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onClearSelection={() => setSelectedIds([])}
            onBulkStart={handleBulkStart}
            isBulkStarting={isBulkStarting}
          />

          {/* Create/Edit Dialog */}
          <MilestoneFormDialog
            open={formDialogOpen}
            onOpenChange={setFormDialogOpen}
            milestone={selectedMilestone}
            onSubmit={handleFormSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            hideTargetDateOnEdit
          />

          {/* Template Selector Dialog */}
          <TemplateSelectorDialog
            open={templateDialogOpen}
            onOpenChange={setTemplateDialogOpen}
            templates={templates}
            isLoading={isLoadingTemplates}
            isSubmitting={createFromTemplatesMutation.isPending}
            onSubmit={handleTemplateSubmit}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteMilestoneDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            milestone={selectedMilestone}
            isDeleting={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  );
}
