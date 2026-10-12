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
import { Eye, CalendarCheck, Milestone, Bell, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Loading, Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toast } from "sonner";
import { Supervisor2RequestsSection } from "@/components/bimbingan/Supervisor2RequestsSection";
import { LecturerThesisChangeRequestPanel } from "@/components/thesis-change-request/LecturerThesisChangeRequestPanel";
import { LecturerTransferStudentsDialog, type TransferStudent } from "@/components/thesis-change-request/LecturerTransferStudentsDialog";
import { useAuth } from "@/hooks/shared/useAuth";
import { MyStudentsCharts } from "@/components/bimbingan/MyStudentsCharts";
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { ThesisActivityBadge } from '@/components/shared/ThesisActivityBadge';
import { SupervisionClockCell } from '@/components/shared/SupervisionClockCell';

/** Supervisor position of a "my students" row, from the role name the API sends. */
function toSupervisorPosition(roleName?: string | null): TransferStudent["position"] {
  const normalized = String(roleName ?? "").toLowerCase().replace(/[\s_]/g, "");
  if (normalized === "pembimbing1") return "pembimbing_1";
  if (normalized === "pembimbing2") return "pembimbing_2";
  return null;
}

/**
 * Fixed layout: every column but "Mahasiswa" has a width, so the table fills the card
 * without a horizontal scrollbar at 1366 px with the sidebar open. Below the minimum
 * width (phones) it scrolls, with the action column pinned to the right.
 */
const MY_STUDENTS_TABLE_CLASS = "table-fixed min-w-[960px]";

/** A warning can be sent while the activity level is Lambat or Berisiko. */
const needsWarning = (level?: string | null): level is WarningType => level === "slow" || level === "at_risk";

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

  // Student selection state for "Alihkan Mahasiswa"
  const { user } = useAuth();
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
    if (!student?.thesisId || !needsWarning(student.activityLevel)) return;
    sendWarningMutation.mutate({
      thesisId: student.thesisId,
      warningType: student.activityLevel,
    });
  };

  // Filter data based on search query: name, NIM, thesis title (and email, as before)
  const filteredData = useMemo(() => {
    if (!data?.students) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.students;

    return data.students.filter((student: MyStudentItem) =>
      [student.fullName, student.identityNumber, student.thesisTitle, student.email]
        .some((value) => value?.toLowerCase().includes(query))
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
      width: 44,
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
      // The only column without a width: it takes what the fixed columns leave.
      key: 'fullName',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-semibold" title={toTitleCaseName(row.fullName)}>{toTitleCaseName(row.fullName)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{row.identityNumber || '-'}</span>
          </div>
          {row.thesisTitle ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="truncate text-sm text-muted-foreground">{row.thesisTitle}</p>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">{row.thesisTitle}</TooltipContent>
            </Tooltip>
          ) : (
            <p className="text-sm text-muted-foreground">Judul belum ditentukan</p>
          )}
          {row.thesisStatus && <ThesisStatusBadge status={row.thesisStatus} className="text-xs" />}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Milestone',
      width: 150,
      render: (row) => {
        const total = row.totalMilestones || 0;
        const completed = row.completedMilestones || 0;
        const progress = row.milestoneProgress || 0;

        return (
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Milestone className="h-3 w-3" />
                {completed}/{total}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {row.latestMilestone && (
              <div className="truncate text-xs text-muted-foreground" title={row.latestMilestone}>
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
      width: 150,
      render: (row) => (
        <div className="min-w-0 space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{row.completedGuidanceCount || 0} sesi</span>
          </div>
          {row.lastGuidanceAt || row.lastGuidanceDate ? (
            <div className="flex flex-wrap gap-x-1 text-xs text-muted-foreground" title={formatDateTimeWib(row.lastGuidanceAt)}>
              <span>Terakhir:</span>
              <span className="whitespace-nowrap">{row.lastGuidanceAt ? formatDateShortId(row.lastGuidanceAt) : row.lastGuidanceDate}</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Belum pernah</div>
          )}
        </div>
      ),
    },
    {
      key: 'supervisionClock',
      header: 'Masa Bimbingan',
      width: 190,
      render: (row) => <SupervisionClockCell clock={row.supervisionClock} wrap />,
    },
    {
      key: 'activity',
      header: 'Aktivitas',
      width: 124,
      render: (row) => (
        <div className="flex items-center gap-2">
          <ThesisActivityBadge level={row.activityLevel} className="whitespace-nowrap" />
          {needsWarning(row.activityLevel) && (
            <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="Perlu perhatian" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 96,
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => {
        // Only an active supervisor relation may send a warning (backend rule).
        const canWarn = needsWarning(row.activityLevel) && (row.supervisorStatus ?? "active") === "active";
        return (
          <div className="flex items-center justify-end gap-1">
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

  // "Alihkan Mahasiswa" hands over this lecturer's own active position on a research thesis.
  const transferStudents = useMemo<TransferStudent[]>(
    () =>
      selectedStudents
        .filter((s) => s.thesisId && s.thesisStatus === "research" && (s.supervisorStatus ?? "active") === "active")
        .map((s) => ({
          thesisId: s.thesisId as string,
          name: s.fullName,
          identityNumber: s.identityNumber ?? null,
          position: toSupervisorPosition(s.roles?.[0]),
        })),
    [selectedStudents],
  );
  const transferBlockReason =
    selectedStudents.length === 0
      ? "Centang mahasiswa yang akan dialihkan lebih dulu."
      : transferStudents.length !== selectedStudents.length
        ? "Hanya mahasiswa dengan tugas akhir berstatus Penelitian yang masih Anda bimbing yang dapat dialihkan."
        : null;

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

      {/* Pengajuan Perubahan Tugas Akhir: menunggu persetujuan dosen ini, berjalan, dan riwayat */}
      <LecturerThesisChangeRequestPanel />

      {/* Permintaan Pembimbing 2 fase proposal (alur Metode Penelitian). Untuk TA fase
          penelitian, Pembimbing 2 ditambahkan lewat Pengajuan Perubahan di atas. */}
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
          tableClassName={MY_STUDENTS_TABLE_CLASS}
          total={filteredData.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchValue={searchQuery}
          searchPlaceholder="Cari nama, NIM, atau judul..."
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* The wrapper keeps the tooltip working while the button is disabled. */}
                    <span tabIndex={transferBlockReason ? 0 : -1}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={!!transferBlockReason}
                        onClick={() => setTransferDialogOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Alihkan Mahasiswa{transferStudents.length > 0 ? ` (${transferStudents.length})` : ''}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{transferBlockReason ?? 'Alihkan mahasiswa terpilih ke dosen lain'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  <span>Aktivitas saat ini:</span>
                  <ThesisActivityBadge level={warningDialog.student?.activityLevel} />
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

      {/* Alihkan Mahasiswa: one change request per selected student, same batch */}
      <LecturerTransferStudentsDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        students={transferStudents}
        currentLecturerId={user?.id}
        onSuccess={() => {
          setSelectedStudentIds(new Set());
          queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
        }}
      />
    </div>
  );
}
