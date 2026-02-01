import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CustomTable } from "@/components/layout/CustomTable";
import type { Column } from "@/components/layout/CustomTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, RefreshCw, X, Eye, Bell, AlertTriangle, Trash2 } from "lucide-react";
import { useThesesList, useFilterOptions } from "@/hooks/monitoring";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { ThesisListItem, WarningType } from "@/services/monitoring.service";
import { sendWarningToStudent, deleteThesisFromMonitoring } from "@/services/monitoring.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth.store";
import { monitoringKeys } from "@/hooks/monitoring/useMonitoring";

// Status badge color mapping
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Bimbingan": "default",
  "Acc Seminar": "secondary",
  "Selesai": "secondary",
  "Gagal": "destructive",
};

function getStatusBadge(status: string) {
  const variant = statusVariants[status] || "outline";
  
  if (status === "Acc Seminar") {
    return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
  }
  if (status === "Selesai") {
    return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
  }
  
  return <Badge variant={variant}>{status}</Badge>;
}

// Rating badge config
const getRatingConfig = (rating?: string) => {
  switch (rating) {
    case "ONGOING":
      return { variant: "outline" as const, label: "Ongoing", className: "border-green-500 text-green-600 bg-green-50", needsWarning: false };
    case "SLOW":
      return { variant: "secondary" as const, label: "Slow", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", needsWarning: true };
    case "AT_RISK":
      return { variant: "destructive" as const, label: "At Risk", className: "", needsWarning: true };
    case "FAILED":
      return { variant: "destructive" as const, label: "Gagal", className: "", needsWarning: true };
    default:
      return { variant: "outline" as const, label: "Ongoing", className: "border-green-500 text-green-600 bg-green-50", needsWarning: false };
  }
};

function getProgressColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 50) return "bg-amber-500";
  if (percent >= 25) return "bg-orange-500";
  return "bg-red-500";
}

interface ThesesTableProps {
  isSyncing?: boolean;
  academicYear?: string;
  initialRating?: string;
}

export function ThesesTable({ isSyncing = false, academicYear, initialRating }: ThesesTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Check if user is Kadep (can delete FAILED thesis)
  const isKadep = user?.roles?.some(role => role.name === 'Ketua Departemen') ?? false;
  
  // Warning dialog state
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    thesis: ThesisListItem | null;
  }>({ open: false, thesis: null });

  // Delete dialog state (for FAILED thesis)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    thesis: ThesisListItem | null;
  }>({ open: false, thesis: null });

  // Send warning mutation
  const sendWarningMutation = useMutation({
    mutationFn: ({ thesisId, warningType }: { thesisId: string; warningType: WarningType }) =>
      sendWarningToStudent(thesisId, warningType),
    onSuccess: (data) => {
      toast.success(data.message || "Peringatan berhasil dikirim");
      setWarningDialog({ open: false, thesis: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengirim peringatan");
    },
  });

  // Delete thesis mutation
  const deleteThesisMutation = useMutation({
    mutationFn: (thesisId: string) =>
      deleteThesisFromMonitoring(thesisId, "Dihapus oleh Kadep karena status FAILED (gagal > 1 tahun)"),
    onSuccess: () => {
      toast.success("Thesis berhasil dihapus");
      setDeleteDialog({ open: false, thesis: null });
      // Invalidate and refetch monitoring data
      queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus thesis");
    },
  });

  const handleSendWarning = () => {
    const thesis = warningDialog.thesis;
    if (!thesis?.id || !thesis?.rating) return;
    sendWarningMutation.mutate({
      thesisId: thesis.id,
      warningType: thesis.rating as WarningType,
    });
  };

  const handleDeleteThesis = () => {
    const thesis = deleteDialog.thesis;
    if (!thesis?.id) return;
    deleteThesisMutation.mutate(thesis.id);
  };
  // Filter state for dropdowns (backend filtering)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [lecturerFilter, setLecturerFilter] = useState<string | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<string | undefined>(initialRating);
  
  // Frontend pagination & search state
  const [frontendSearch, setFrontendSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch ALL data with pageSize 1000 to disable backend pagination
  // Filters (status, lecturer, academicYear) are still applied on backend
  const apiFilters = useMemo(() => ({
    status: statusFilter,
    lecturerId: lecturerFilter,
    academicYear,
    page: 1,
    pageSize: 1000, // Fetch all data for frontend pagination & search
  }), [statusFilter, lecturerFilter, academicYear]);

  const { data, isLoading, refetch, isFetching } = useThesesList(apiFilters);
  const isLoadingAny = isLoading || isFetching || isSyncing;
  const { data: filterOptions } = useFilterOptions();

  // Frontend search & rating filter applied to ALL data
  const searchFilteredData = useMemo(() => {
    if (!data?.data) return [];
    
    let filtered = data.data;
    
    // Apply rating filter (frontend)
    if (ratingFilter) {
      filtered = filtered.filter((thesis) => thesis.rating === ratingFilter);
    }
    
    // Apply search filter
    if (frontendSearch.trim()) {
      const searchLower = frontendSearch.toLowerCase();
      filtered = filtered.filter((thesis) => 
        thesis.student.name.toLowerCase().includes(searchLower) ||
        thesis.student.nim.toLowerCase().includes(searchLower) ||
        thesis.title?.toLowerCase().includes(searchLower) ||
        thesis.supervisors.pembimbing1?.toLowerCase().includes(searchLower) ||
        thesis.supervisors.pembimbing2?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [data?.data, frontendSearch, ratingFilter]);

  // Frontend pagination - slice the search-filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return searchFilteredData.slice(startIndex, startIndex + pageSize);
  }, [searchFilteredData, page, pageSize]);

  const handleFilterChange = useCallback((key: 'status' | 'lecturerId' | 'rating', value: string | undefined) => {
    if (key === 'status') {
      setStatusFilter(value === "all" ? undefined : value);
    } else if (key === 'lecturerId') {
      setLecturerFilter(value === "all" ? undefined : value);
    } else if (key === 'rating') {
      setRatingFilter(value === "all" ? undefined : value);
    }
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFrontendSearch(value);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter(undefined);
    setLecturerFilter(undefined);
    setRatingFilter(undefined);
    setFrontendSearch("");
    setPage(1);
  }, []);

  const hasActiveFilters = statusFilter || lecturerFilter || ratingFilter || frontendSearch;

  const columns: Column<ThesisListItem>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      render: (thesis) => (
        <div className="space-y-0.5">
          <p className="font-medium">{toTitleCaseName(thesis.student.name)}</p>
          <p className="text-sm text-muted-foreground">{thesis.student.nim}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Judul",
      render: (thesis) => (
        <p className="max-w-62.5 truncate" title={thesis.title}>
          {thesis.title}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (thesis) => getStatusBadge(thesis.status),
    },
    {
      key: "progress",
      header: "Progress",
      className: "text-center",
      render: (thesis) => (
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(thesis.progress.percent)}`}
              style={{ width: `${thesis.progress.percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {thesis.progress.completed}/{thesis.progress.total} ({thesis.progress.percent}%)
          </span>
        </div>
      ),
    },
    {
      key: "supervisors",
      header: "Pembimbing",
      render: (thesis) => (
        <div className="space-y-0.5 text-sm">
          {thesis.supervisors.pembimbing1 && (
            <p className="truncate max-w-37.5" title={thesis.supervisors.pembimbing1}>
              1. {toTitleCaseName(thesis.supervisors.pembimbing1)}
            </p>
          )}
          {thesis.supervisors.pembimbing2 && (
            <p className="truncate max-w-37.5 text-muted-foreground" title={thesis.supervisors.pembimbing2}>
              2. {toTitleCaseName(thesis.supervisors.pembimbing2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "seminarApproval",
      header: "Acc Seminar",
      className: "text-center",
      render: (thesis) => (
        <div className="flex justify-center gap-1">
          <span title="Pembimbing 1">
            {thesis.seminarApproval.supervisor1 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/40" />
            )}
          </span>
          <span title="Pembimbing 2">
            {thesis.seminarApproval.supervisor2 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/40" />
            )}
          </span>
        </div>
      ),
    },
    {
      key: "lastActivity",
      header: "Aktivitas Terakhir",
      render: (thesis) => (
        <span className="text-sm text-muted-foreground">
          {formatDateId(thesis.lastActivity)}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (thesis) => {
        const config = getRatingConfig(thesis.rating);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className={cn("whitespace-nowrap", config.className)}>
              {config.label}
            </Badge>
            {config.needsWarning && (
              <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-center w-24",
      render: (thesis) => {
        const config = getRatingConfig(thesis.rating);
        return (
          <div className="flex items-center justify-center gap-1">
            {config.needsWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setWarningDialog({ open: true, thesis })}
                      className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Kirim Peringatan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kirim Peringatan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Delete button for FAILED thesis (Kadep only) */}
            {isKadep && thesis.rating === 'FAILED' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteDialog({ open: true, thesis })}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Hapus Thesis</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hapus Thesis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/tugas-akhir/monitoring/${thesis.id}`)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Detail</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lihat Detail</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const actions = (
    <>
      <Select
        value={statusFilter || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          {filterOptions?.statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label} ({status.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={lecturerFilter || "all"}
        onValueChange={(value) => handleFilterChange("lecturerId", value)}
      >
        <SelectTrigger className="w-50">
          <SelectValue placeholder="Pembimbing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Pembimbing</SelectItem>
          {filterOptions?.supervisors.map((supervisor) => (
            <SelectItem key={supervisor.value} value={supervisor.value}>
              {toTitleCaseName(supervisor.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={ratingFilter || "all"}
        onValueChange={(value) => handleFilterChange("rating", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Rating</SelectItem>
          <SelectItem value="ONGOING">Ongoing</SelectItem>
          <SelectItem value="SLOW">Slow</SelectItem>
          <SelectItem value="AT_RISK">At Risk</SelectItem>
          <SelectItem value="FAILED">Gagal</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isFetching}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </>
  );

  return (
    <>
      <CustomTable<ThesisListItem>
        columns={columns}
        data={paginatedData}
        loading={isLoadingAny}
        total={searchFilteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchValue={frontendSearch}
        onSearchChange={handleSearchChange}
        actions={actions}
        emptyText="Tidak ada data tugas akhir"
        rowKey={(row) => row.id}
      />

      {/* Warning Confirmation Dialog */}
      <AlertDialog open={warningDialog.open} onOpenChange={(open) => setWarningDialog({ open, thesis: open ? warningDialog.thesis : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Kirim Peringatan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan mengirim notifikasi peringatan ke mahasiswa:
                </p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="font-medium">{toTitleCaseName(warningDialog.thesis?.student.name || "")}</p>
                  <p className="text-sm">{warningDialog.thesis?.student.nim}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>Status saat ini:</span>
                  <Badge 
                    variant={getRatingConfig(warningDialog.thesis?.rating).variant}
                    className={getRatingConfig(warningDialog.thesis?.rating).className}
                  >
                    {getRatingConfig(warningDialog.thesis?.rating).label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mahasiswa akan menerima notifikasi push dan in-app notification untuk mengingatkan progress tugas akhir mereka.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendWarningMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendWarning}
              disabled={sendWarningMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {sendWarningMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Kirim Peringatan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Thesis Dialog (Kadep only - for FAILED thesis) */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !deleteThesisMutation.isPending && setDeleteDialog({ open, thesis: open ? deleteDialog.thesis : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Tugas Akhir?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Apakah Anda yakin ingin menghapus tugas akhir ini?</p>
                {deleteDialog.thesis && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="font-medium">{deleteDialog.thesis.student?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{deleteDialog.thesis.student?.nim}</p>
                    <p className="text-sm">{deleteDialog.thesis.title}</p>
                    <Badge variant="destructive" className="mt-2">
                      Rating: FAILED
                    </Badge>
                  </div>
                )}
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium">⚠️ Perhatian:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Tindakan ini tidak dapat dibatalkan</li>
                    <li>Semua data bimbingan terkait akan dihapus</li>
                    <li>Mahasiswa dapat mengajukan topik baru setelah penghapusan</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteThesisMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteThesis}
              disabled={deleteThesisMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteThesisMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Tugas Akhir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
