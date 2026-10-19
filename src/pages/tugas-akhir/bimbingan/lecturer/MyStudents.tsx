import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents, sendWarningToStudent, type MyStudentsFilter, type WarningType } from "@/services/lecturerGuidance.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Default "Aktif" (research + on_leave); finished and failed students stay reachable.
// "Fase Proposal" lists the students whose proposal guidance this lecturer supervises.
const STUDENT_FILTERS: { value: MyStudentsFilter; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "proposal", label: "Fase Proposal" },
  { value: "completed", label: "Selesai" },
  { value: "failed", label: "Gagal" },
  { value: "all", label: "Semua" },
];
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toTitleCaseName, formatDateShortId, formatDateTimeWib } from "@/lib/text";
import { STICKY_ACTION_COLUMN_CLASS } from "@/lib/guidanceCells";
import { CLIP_CELL } from "@/lib/tableColumnWidths";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { Eye, CalendarCheck, Milestone, Bell, AlertTriangle, ArrowRightLeft, ClipboardCheck, FilePenLine } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TableIconAction } from "@/components/shared/TableIconAction";
import { useAuth } from "@/hooks/shared";
import {
  LecturerTransferStudentsDialog,
  toSupervisorPosition,
  toTransferStudents,
} from "@/components/thesis-change-request/LecturerTransferStudentsDialog";
import {
  OpenThesisChangeRequestLauncher,
  ThesisChangeRequestFormLauncher,
} from "@/components/thesis-change-request/ThesisChangeRequestLaunchers";
import { EvaluationFormLauncher } from "@/components/thesis-guidance-evaluation/EvaluationFormLauncher";
import { Loading, Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toast } from "sonner";
import { MyStudentsCharts } from "@/components/bimbingan/MyStudentsCharts";
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { ThesisActivityBadge } from '@/components/shared/ThesisActivityBadge';
import { SupervisionClockCell } from '@/components/shared/SupervisionClockCell';

/**
 * Fixed layout: every column but "Mahasiswa" has a width, so the table fills the card. The
 * minimum width keeps "Mahasiswa" as wide as its longest badge ("Berhenti Studi
 * Sementara (BSS)", MY_STUDENTS_NAME_MIN_WIDTH) next to the fixed columns (782 px, Aksi with four
 * icons); below it the table scrolls, with the action column pinned to the right.
 */
const MY_STUDENTS_TABLE_CLASS = "table-fixed min-w-[1014px]";

/** A warning can be sent while the activity level is Lambat or Berisiko. */
const needsWarning = (level?: string | null): level is WarningType => level === "slow" || level === "at_risk";

/** An active relation of this lecturer (a replaced supervisor's row is read-only). */
const isActiveSupervisor = (row: MyStudentItem) => (row.supervisorStatus ?? "active") === "active" && !row.noLongerSupervising;

/**
 * "Ajukan Perubahan" for an active Pembimbing 1 or 2 (disabled with the
 * reason when a rule blocks it); "Isi Evaluasi" only when the evaluation is due and the viewer is
 * Pembimbing 1.
 */
const canAskChange = (row: MyStudentItem) => !!row.thesisId && !!row.changeRequest && isActiveSupervisor(row) && !!toSupervisorPosition(row.roles?.[0]);
const canFillEvaluation = (row: MyStudentItem) =>
  !!row.thesisId && isActiveSupervisor(row) && !!row.supervisionClock?.evaluationDue && toSupervisorPosition(row.roles?.[0]) === "pembimbing_1";

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" }, { label: "Mahasiswa Bimbingan" }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle("Mahasiswa Bimbingan");
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Warning dialog state
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    student: MyStudentItem | null;
  }>({ open: false, student: null });

  // Row actions and the "Alihkan" bulk action.
  const [selectedThesisIds, setSelectedThesisIds] = useState<Set<string>>(new Set());
  const [transferOpen, setTransferOpen] = useState(false);
  const [changeFormThesisId, setChangeFormThesisId] = useState<string | null>(null);
  const [openRequestThesisId, setOpenRequestThesisId] = useState<string | null>(null);
  const [evaluationThesisId, setEvaluationThesisId] = useState<string | null>(null);

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

  // Ticked students that may still be handed over (the list reloads after every change).
  const transferStudents = useMemo(
    () => toTransferStudents((data?.students ?? []).filter((row) => row.thesisId && selectedThesisIds.has(row.thesisId))),
    [data?.students, selectedThesisIds],
  );
  const selectableOnPage = paginatedData.filter((row) => row.thesisId && row.changeRequest?.canTransfer);
  const allOnPageSelected = selectableOnPage.length > 0 && selectableOnPage.every((row) => selectedThesisIds.has(row.thesisId as string));
  const toggleSelected = (thesisIds: string[], checked: boolean) =>
    setSelectedThesisIds((previous) => {
      const next = new Set(previous);
      for (const thesisId of thesisIds) {
        if (checked) next.add(thesisId);
        else next.delete(thesisId);
      }
      return next;
    });

  const columns: Column<MyStudentItem>[] = useMemo(() => [
    {
      // Only the students that may be handed over can be ticked.
      key: 'select',
      header: () => (
        <Checkbox
          checked={allOnPageSelected}
          disabled={selectableOnPage.length === 0}
          onCheckedChange={(checked) => toggleSelected(selectableOnPage.map((row) => row.thesisId as string), !!checked)}
          aria-label="Pilih semua mahasiswa yang dapat dialihkan di halaman ini"
        />
      ),
      width: 44,
      render: (row) => {
        const reason = row.changeRequest?.transferBlockReason ?? (row.changeRequest ? null : "Mahasiswa ini tidak dapat dialihkan.");
        const disabled = !row.thesisId || !row.changeRequest?.canTransfer;
        return (
          <span className="inline-flex" title={disabled ? reason ?? undefined : "Pilih untuk dialihkan"}>
            <Checkbox
              checked={!!row.thesisId && selectedThesisIds.has(row.thesisId)}
              disabled={disabled}
              onCheckedChange={(checked) => row.thesisId && toggleSelected([row.thesisId], !!checked)}
              aria-label={`Pilih ${toTitleCaseName(row.fullName)}`}
            />
          </span>
        );
      },
    },
    {
      // The only column without a width: it takes what the fixed columns leave.
      key: 'fullName',
      header: 'Mahasiswa',
      className: CLIP_CELL,
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
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {row.thesisStatus && <ThesisStatusBadge status={row.thesisStatus} className="max-w-full truncate text-xs" />}
            {/* A running change request; the marker opens its detail. */}
            {row.changeRequest?.hasOpenRequest && row.thesisId && (
              <button
                type="button"
                onClick={() => setOpenRequestThesisId(row.thesisId as string)}
                title="Lihat pengajuan perubahan yang sedang berjalan"
              >
                <Badge variant="warning" className="max-w-full truncate whitespace-nowrap text-xs">Perubahan berjalan</Badge>
              </button>
            )}
            {/* A replaced supervisor reads the student under "Semua" only. */}
            {row.noLongerSupervising && (
              <Badge variant="outline" className="max-w-full truncate text-xs text-muted-foreground">Tidak lagi membimbing</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Milestone',
      width: 140,
      className: CLIP_CELL,
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
      width: 140,
      className: CLIP_CELL,
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
      width: 170,
      className: CLIP_CELL,
      render: (row) => <SupervisionClockCell clock={row.supervisionClock} wrap />,
    },
    {
      key: 'activity',
      header: 'Aktivitas',
      width: 124,
      className: CLIP_CELL,
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
      // Four icons at most: Isi Evaluasi, Ajukan Perubahan, Kirim Peringatan, Detail.
      width: 164,
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => {
        // Only an active supervisor relation may send a warning (backend rule); a replaced
        // supervisor's row is read-only.
        const canWarn = needsWarning(row.activityLevel) && (row.supervisorStatus ?? "active") === "active" && !row.noLongerSupervising;
        return (
          <div className="flex items-center justify-end gap-1">
            {canFillEvaluation(row) && (
              <TableIconAction icon={ClipboardCheck} label="Isi Evaluasi" onClick={() => setEvaluationThesisId(row.thesisId as string)} />
            )}
            {canAskChange(row) && (
              <TableIconAction
                icon={FilePenLine}
                label="Ajukan Perubahan"
                disabled={!row.changeRequest?.canSubmit}
                disabledReason={row.changeRequest?.blockReason}
                onClick={() => setChangeFormThesisId(row.thesisId as string)}
              />
            )}
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
  ], [navigate, allOnPageSelected, selectableOnPage, selectedThesisIds]);

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

      {/* Only the summary and the students table; Permohonan has its own page.
          "Ajukan Perubahan", "Isi Evaluasi" and "Alihkan" act on the rows. */}
      {!isLoading && data?.students && data.students.length > 0 && (
        <MyStudentsCharts students={data.students} />
      )}

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
              {/* Appears with the number of ticked students. */}
              {transferStudents.length > 0 && (
                <Button variant="outline" className="h-9 gap-1.5" onClick={() => setTransferOpen(true)}>
                  <ArrowRightLeft className="h-4 w-4" />
                  Alihkan ({transferStudents.length})
                </Button>
              )}
              <Select
                value={studentFilter}
                onValueChange={(v) => {
                  setStudentFilter(v as MyStudentsFilter);
                  setPage(1);
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
              <RefreshButton
                onClick={() => refetch()}
                isRefreshing={isFetching && !isLoading}
              />
            </div>
          }
        />
      )}

      <LecturerTransferStudentsDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        students={transferStudents}
        currentLecturerId={user?.id}
        onSuccess={() => setSelectedThesisIds(new Set())}
      />
      {changeFormThesisId && (
        <ThesisChangeRequestFormLauncher thesisId={changeFormThesisId} onClose={() => setChangeFormThesisId(null)} />
      )}
      {openRequestThesisId && (
        <OpenThesisChangeRequestLauncher thesisId={openRequestThesisId} onClose={() => setOpenRequestThesisId(null)} />
      )}
      {evaluationThesisId && (
        <EvaluationFormLauncher thesisId={evaluationThesisId} onClose={() => setEvaluationThesisId(null)} />
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

    </div>
  );
}
