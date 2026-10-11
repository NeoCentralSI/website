import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents, sendWarningToStudent, type MyStudentsFilter, type WarningType } from "@/services/lecturerGuidance.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// K21: default "Aktif" (research + on_leave); finished and failed students stay reachable.
const STUDENT_FILTERS: { value: MyStudentsFilter; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Selesai" },
  { value: "failed", label: "Gagal" },
  { value: "all", label: "Semua" },
];
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toTitleCaseName, formatDateShortId, formatDateTimeWib } from "@/lib/text";
import { STICKY_ACTION_COLUMN_CLASS } from "@/lib/guidanceCells";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
import { Eye, Clock, CalendarCheck, Milestone, Bell, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Loading, Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Supervisor2RequestsSection } from "@/components/bimbingan/Supervisor2RequestsSection";
import { IncomingTransfersSection } from "@/components/bimbingan/IncomingTransfersSection";
import { TransferStudentsDialog } from "@/components/bimbingan/TransferStudentsDialog";
import { MyStudentsCharts } from "@/components/bimbingan/MyStudentsCharts";
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { THESIS_RATING_LABELS } from '@/lib/thesisLabels';

const getDaysRemaining = (deadlineDate?: string | null) => {
  if (!deadlineDate) return null;
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getRatingConfig = (rating?: string) => {
  switch (rating) {
    case "ONGOING":
      return { variant: "outline" as const, label: THESIS_RATING_LABELS.ONGOING, className: "border-green-500 text-green-600 bg-green-50", needsWarning: false };
    case "SLOW":
      return { variant: "secondary" as const, label: THESIS_RATING_LABELS.SLOW, className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", needsWarning: true };
    case "AT_RISK":
      return { variant: "destructive" as const, label: THESIS_RATING_LABELS.AT_RISK, className: "", needsWarning: true };
    case "FAILED":
      return { variant: "destructive" as const, label: THESIS_RATING_LABELS.FAILED, className: "bg-red-500 text-white hover:bg-red-600", needsWarning: true };
    case "CANCELLED":
      return { variant: "secondary" as const, label: THESIS_RATING_LABELS.CANCELLED, className: "bg-slate-500 text-white hover:bg-slate-600", needsWarning: false };
    default:
      return { variant: "secondary" as const, label: "-", className: "", needsWarning: false };
  }
};

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" }, { label: "Mahasiswa Bimbingan" }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle("Mahasiswa Bimbingan");
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  // Student selection state for transfer
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Warning dialog state
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    student: MyStudentItem | null;
  }>({ open: false, student: null });

  const [studentFilter, setStudentFilter] = useState<MyStudentsFilter>("active");
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lecturer-my-students', studentFilter],
    queryFn: () => getMyStudents({ status: studentFilter }),
  });

  // Send warning mutation
  const sendWarningMutation = useMutation({
    mutationFn: ({ thesisId, warningType }: { thesisId: string; warningType: WarningType }) =>
      sendWarningToStudent(thesisId, warningType),
    onSuccess: (data) => {
      toast.success(data.message || "Peringatan berhasil dikirim");
      setWarningDialog({ open: false, student: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengirim peringatan");
    },
  });

  const handleSendWarning = () => {
    const student = warningDialog.student;
    if (!student?.thesisId || !student?.thesisRating) return;
    sendWarningMutation.mutate({
      thesisId: student.thesisId,
      warningType: student.thesisRating as WarningType,
    });
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!data?.students) return [];
    if (!searchQuery.trim()) return data.students;

    const query = searchQuery.toLowerCase();
    return data.students.filter((student: MyStudentItem) =>
      toTitleCaseName(student.fullName).toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  }, [data?.students, searchQuery]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, pageSize]);

  const columns: Column<MyStudentItem>[] = useMemo(() => [
    {
      key: 'select',
      header: () => {
        const allSelected = paginatedData.length > 0 && paginatedData.every(s => selectedStudentIds.has(s.studentId));
        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              const next = new Set(selectedStudentIds);
              if (checked) {
                paginatedData.forEach(s => next.add(s.studentId));
              } else {
                paginatedData.forEach(s => next.delete(s.studentId));
              }
              setSelectedStudentIds(next);
            }}
          />
        );
      },
      render: (row) => (
        <Checkbox
          checked={selectedStudentIds.has(row.studentId)}
          onCheckedChange={(checked) => {
            const next = new Set(selectedStudentIds);
            if (checked) {
              next.add(row.studentId);
            } else {
              next.delete(row.studentId);
            }
            setSelectedStudentIds(next);
          }}
        />
      ),
    },
    {
      key: 'fullName',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-medium">{toTitleCaseName(row.fullName)}</div>
          <div className="text-xs text-muted-foreground">{row.identityNumber || '-'}</div>
        </div>
      ),
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      render: (row) => (
        <div className="space-y-1">
          <div className="max-w-[220px] whitespace-normal break-words line-clamp-2 font-medium" title={row.thesisTitle}>
            {row.thesisTitle || '-'}
          </div>
          {row.thesisStatus && <ThesisStatusBadge status={row.thesisStatus} className="text-xs" />}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress Milestone',
      render: (row) => {
        const total = row.totalMilestones || 0;
        const completed = row.completedMilestones || 0;
        const progress = row.milestoneProgress || 0;

        return (
          <div className="space-y-1.5 min-w-24">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Milestone className="h-3 w-3" />
                {completed}/{total}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {row.latestMilestone && (
              <div className="text-xs text-muted-foreground truncate max-w-28" title={row.latestMilestone}>
                {row.latestMilestone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'guidanceCount',
      header: 'Bimbingan',
      render: (row) => (
        <div className="space-y-0.5 text-sm">
          <div className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{row.completedGuidanceCount || 0}x</span>
          </div>
          {row.lastGuidanceAt || row.lastGuidanceDate ? (
            <div className="text-xs text-muted-foreground" title={formatDateTimeWib(row.lastGuidanceAt)}>
              Terakhir: {row.lastGuidanceAt ? formatDateShortId(row.lastGuidanceAt) : row.lastGuidanceDate}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Belum pernah</div>
          )}
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Sisa Waktu',
      render: (row) => {
        const days = getDaysRemaining(row.deadlineDate);
        if (days === null) return <span className="text-muted-foreground">-</span>;

        if (days < 0) {
          return (
            <Badge variant="destructive" className="items-center gap-1">
              <Clock className="h-3 w-3" />
              Lewat {Math.abs(days)} hari
            </Badge>
          );
        }

        if (days <= 30) {
          return (
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 items-center gap-1">
              <Clock className="h-3 w-3" />
              {days} hari
            </Badge>
          );
        }

        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{days} hari</span>
          </div>
        );
      }
    },
    {
      key: 'thesisRating',
      header: 'Rating',
      render: (row) => {
        const config = getRatingConfig(row.thesisRating);
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
      key: 'actions',
      header: 'Aksi',
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => {
        const config = getRatingConfig(row.thesisRating);
        // Only an active supervisor relation may send a warning (backend rule).
        const canWarn = config.needsWarning && (row.supervisorStatus ?? "active") === "active";
        return (
          <div className="flex items-center gap-1">
            {canWarn && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWarningDialog({ open: true, student: row })}
                      className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Kirim Peringatan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kirim Peringatan ke Mahasiswa</p>
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
                    onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/my-students/${row.thesisId}`)}
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
      }
    }
  ], [navigate, selectedStudentIds, paginatedData]);

  // Get selected student items
  const selectedStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((s: MyStudentItem) => selectedStudentIds.has(s.studentId));
  }, [data?.students, selectedStudentIds]);

  // Define tabs for reuse
  const tabs = [
    { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
    { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mahasiswa Bimbingan</h1>
        <p className="text-muted-foreground">Daftar mahasiswa yang Anda bimbing</p>
      </div>

      <TabsNav tabs={tabs} />

      {/* Distribution Charts */}
      {!isLoading && data?.students && data.students.length > 0 && (
        <MyStudentsCharts students={data.students} />
      )}

      {/* Incoming Transfer Requests Section */}
      <IncomingTransfersSection />

      {/* Pembimbing 2 Requests Section */}
      <Supervisor2RequestsSection />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data mahasiswa bimbingan..." />
        </div>
      ) : (
        <CustomTable
          columns={columns}
          data={paginatedData}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          total={filteredData.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1); // Reset to page 1 on search
          }}
          emptyText="Tidak ada mahasiswa bimbingan"
          rowKey={(row) => row.thesisId ?? row.studentId}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={studentFilter}
                onValueChange={(v) => {
                  setStudentFilter(v as MyStudentsFilter);
                  setPage(1);
                  setSelectedStudentIds(new Set());
                }}
              >
                <SelectTrigger className="h-9 w-32" aria-label="Filter status tugas akhir">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStudents.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setTransferDialogOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer ({selectedStudents.length})
                </Button>
              )}
              <RefreshButton
                onClick={() => refetch()}
                isRefreshing={isFetching && !isLoading}
              />
            </div>
          }
        />
      )}

      {/* Warning Confirmation Dialog */}
      <AlertDialog open={warningDialog.open} onOpenChange={(open) => setWarningDialog({ open, student: open ? warningDialog.student : null })}>
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
                  <p className="font-medium">{toTitleCaseName(warningDialog.student?.fullName || "")}</p>
                  <p className="text-sm">{warningDialog.student?.identityNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>Status saat ini:</span>
                  <Badge
                    variant={getRatingConfig(warningDialog.student?.thesisRating).variant}
                    className={getRatingConfig(warningDialog.student?.thesisRating).className}
                  >
                    {getRatingConfig(warningDialog.student?.thesisRating).label}
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

      {/* Transfer Students Dialog */}
      <TransferStudentsDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        selectedStudents={selectedStudents}
        onSuccess={() => {
          setSelectedStudentIds(new Set());
          queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
        }}
      />
    </div>
  );
}
