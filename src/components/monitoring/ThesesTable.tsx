import { useState, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CustomTable } from "@/components/layout/CustomTable";
import type { Column } from "@/components/layout/CustomTable";
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
import { CheckCircle2, XCircle, Eye, Bell, AlertTriangle } from "lucide-react";
import { useThesesList, monitoringKeys } from "@/hooks/monitoring";
import { useRole } from "@/hooks/shared/useRole";
import { toTitleCaseName, formatDateShortId, formatLecturerName } from "@/lib/text";
import type { ThesisListItem, WarningType } from "@/services/monitoring.service";
import { sendWarningToStudent } from "@/services/monitoring.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { TableIconAction } from "@/components/shared/TableIconAction";
import { getThesisActivityOptions, getThesisStatusLabel, THESIS_ON_LEAVE_LABEL } from "@/lib/thesisLabels";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { SupervisionClockCell } from "@/components/shared/SupervisionClockCell";
import { CLIP_CELL } from "@/lib/tableColumnWidths";

/**
 * Fixed layout: every column but "Mahasiswa" has a width (884 px), so the table fits the card at
 * 1366 px without scrolling sideways; "Mulai" sits under the name, the seminar approvals under
 * Progress, and the last activity under Aktivitas.
 */
const THESES_TABLE_CLASS = "table-fixed min-w-[1000px]";

const ALL_OPTION = { label: "Semua", value: "" };
/** "Cuti" is not a thesis status: it matches the theses paused by the student's leave. */
const ON_LEAVE_FILTER = "on_leave";
const STATUS_OPTIONS = [
  ALL_OPTION,
  ...(["research", "completed", "failed"] as const).map((value) => ({ label: getThesisStatusLabel(value), value })),
  { label: THESIS_ON_LEAVE_LABEL, value: ON_LEAVE_FILTER },
];
const SEMINAR_OPTIONS = [
  ALL_OPTION,
  { label: "Acc seminar lengkap", value: "approved" },
  { label: "Belum acc seminar", value: "pending" },
];
const ACTIVITY_OPTIONS = [ALL_OPTION, ...getThesisActivityOptions()];

/** Distinct non-empty values as select options, sorted by their label. */
function optionsOf(values: (string | null | undefined)[], label: (value: string) => string = (value) => value) {
  return [...new Set(values.filter((value): value is string => !!value))]
    .map((value) => ({ value, label: label(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
}

function ApprovalIcon({ approved, label }: { approved: boolean; label: string }) {
  return approved ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-label={`${label}: disetujui`} />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" aria-label={`${label}: belum`} />
  );
}

/** A warning can be sent while the activity level is Lambat or Berisiko. */
const needsWarning = (level?: string | null): level is WarningType => level === "slow" || level === "at_risk";

function getProgressColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 50) return "bg-amber-500";
  if (percent >= 25) return "bg-orange-500";
  return "bg-red-500";
}

interface ThesesTableProps {
  isSyncing?: boolean;
  academicYear?: string;
  /** Initial activity filter (`active` | `slow` | `at_risk`), e.g. from `?activity=`. */
  initialActivity?: string;
  /** The page's semester select, first on the right of the toolbar. */
  semesterSelect?: ReactNode;
  /** Page actions (e.g. the report download), just before Muat Ulang. */
  extraActions?: ReactNode;
  /** Muat Ulang of the whole page (charts too); the table alone when absent. */
  onRefresh?: () => void;
}

export function ThesesTable({ isSyncing = false, academicYear, initialActivity, semesterSelect, extraActions, onRefresh }: ThesesTableProps) {
  const navigate = useNavigate();
  const { isKadep, isSekdep, isGkm } = useRole();
  // Backend rule: the department roles (KaDep, Sekdep, GKM) may warn any thesis
  // from monitoring; supervisors warn their own active students from the lecturer page.
  const canSendWarning = isKadep() || isSekdep() || isGkm();
  const queryClient = useQueryClient();

  // Warning dialog state
  const [warningDialog, setWarningDialog] = useState<{
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
      // The cards and this table read the same theses: fetch them again.
      void queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengirim peringatan");
    },
  });

  const handleSendWarning = () => {
    const thesis = warningDialog.thesis;
    if (!thesis?.id || !needsWarning(thesis.activityLevel)) return;
    sendWarningMutation.mutate({
      thesisId: thesis.id,
      warningType: thesis.activityLevel,
    });
  };
  // Every filter runs in the browser on the theses of the semester (the list is small).
  const [statusFilter, setStatusFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [lecturerFilter, setLecturerFilter] = useState("");
  const [seminarFilter, setSeminarFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState(initialActivity ?? "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const apiFilters = useMemo(() => ({ academicYear, page: 1, pageSize: 1000 }), [academicYear]);
  const { data, isLoading, refetch, isFetching } = useThesesList(apiFilters);
  const isLoadingAny = isLoading || isFetching || isSyncing;
  const rows = useMemo(() => data?.data ?? [], [data?.data]);

  // Column filter options come from the rows themselves.
  const topicOptions = useMemo(() => optionsOf(rows.map((t) => t.topic?.name ?? null)), [rows]);
  const lecturerOptions = useMemo(
    () => optionsOf(rows.flatMap((t) => [t.supervisors.pembimbing1, t.supervisors.pembimbing2]), formatLecturerName),
    [rows],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((thesis) => {
      if (statusFilter === ON_LEAVE_FILTER ? !thesis.isOnLeave : statusFilter && thesis.status !== statusFilter) return false;
      if (topicFilter && thesis.topic?.name !== topicFilter) return false;
      if (lecturerFilter && thesis.supervisors.pembimbing1 !== lecturerFilter && thesis.supervisors.pembimbing2 !== lecturerFilter) return false;
      if (seminarFilter === "approved" && !thesis.seminarApproval.isFullyApproved) return false;
      if (seminarFilter === "pending" && thesis.seminarApproval.isFullyApproved) return false;
      if (activityFilter && thesis.activityLevel !== activityFilter) return false;
      if (!query) return true;
      return [
        thesis.student.name,
        thesis.student.nim,
        thesis.title,
        thesis.topic?.name,
        thesis.supervisors.pembimbing1,
        thesis.supervisors.pembimbing2,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter, topicFilter, lecturerFilter, seminarFilter, activityFilter]);

  // The rows change with the semester; never stay on a page that no longer exists.
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = !!(search || statusFilter || topicFilter || lecturerFilter || seminarFilter || activityFilter);
  const onFilter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  const columns: Column<ThesisListItem>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      className: CLIP_CELL,
      render: (thesis) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium" title={toTitleCaseName(thesis.student.name)}>{toTitleCaseName(thesis.student.name)}</p>
          <p className="text-xs text-muted-foreground">{thesis.student.nim}</p>
          {/* The semester the thesis started in; the semester filter is about when it runs. */}
          <p className="truncate text-xs text-muted-foreground" title="Semester mulai">Mulai: {thesis.startSemester || "-"}</p>
        </div>
      ),
    },
    {
      key: "topic",
      header: "Topik",
      width: 128,
      className: CLIP_CELL,
      filter: { type: "select", value: topicFilter, onChange: onFilter(setTopicFilter), options: [ALL_OPTION, ...topicOptions] },
      render: (thesis) => (
        <span className="line-clamp-2 whitespace-normal break-words text-sm" title={thesis.topic?.name || undefined}>
          {thesis.topic?.name || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: 120,
      className: CLIP_CELL,
      filter: { type: "select", value: statusFilter, onChange: onFilter(setStatusFilter), options: STATUS_OPTIONS },
      render: (thesis) => <ThesisStatusBadge status={thesis.status} onLeave={thesis.isOnLeave} className="whitespace-nowrap" />,
    },
    {
      key: "progress",
      header: "Progress",
      width: 124,
      className: CLIP_CELL,
      filter: { type: "select", value: seminarFilter, onChange: onFilter(setSeminarFilter), options: SEMINAR_OPTIONS },
      render: (thesis) => (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(thesis.progress.percent)}`}
              style={{ width: `${thesis.progress.percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {thesis.progress.completed}/{thesis.progress.total} ({thesis.progress.percent}%)
          </span>
          {/* Persetujuan seminar of each supervisor (green = disetujui). */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Persetujuan seminar pembimbing">
            Acc
            <ApprovalIcon approved={thesis.seminarApproval.supervisor1} label="Pembimbing 1" />
            {thesis.seminarApproval.hasPembimbing2 && (
              <ApprovalIcon approved={thesis.seminarApproval.supervisor2} label="Pembimbing 2" />
            )}
          </span>
        </div>
      ),
    },
    {
      key: "supervisors",
      header: "Pembimbing",
      width: 156,
      className: CLIP_CELL,
      filter: { type: "select", value: lecturerFilter, onChange: onFilter(setLecturerFilter), options: [ALL_OPTION, ...lecturerOptions] },
      render: (thesis) => (
        <div className="min-w-0 space-y-0.5 text-sm">
          {thesis.supervisors.pembimbing1 && (
            <p className="truncate" title={formatLecturerName(thesis.supervisors.pembimbing1)}>
              1. {formatLecturerName(thesis.supervisors.pembimbing1)}
            </p>
          )}
          {thesis.supervisors.pembimbing2 && (
            <p className="truncate text-muted-foreground" title={formatLecturerName(thesis.supervisors.pembimbing2)}>
              2. {formatLecturerName(thesis.supervisors.pembimbing2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "supervisionClock",
      header: "Masa Bimbingan",
      width: 136,
      className: CLIP_CELL,
      render: (thesis) => <SupervisionClockCell clock={thesis.supervisionClock} wrap />,
    },
    {
      key: "activity",
      header: "Aktivitas",
      width: 132,
      className: CLIP_CELL,
      filter: { type: "select", value: activityFilter, onChange: onFilter(setActivityFilter), options: ACTIVITY_OPTIONS },
      render: (thesis) => (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <ThesisActivityBadge level={thesis.activityLevel} className="whitespace-nowrap" />
            {needsWarning(thesis.activityLevel) && (
              <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="Perlu perhatian" />
            )}
          </div>
          {/* Last approval of a session summary, a milestone or the seminar readiness. */}
          <span className="text-xs text-muted-foreground" title="Aktivitas terakhir: persetujuan catatan bimbingan, milestone, atau seminar">
            {formatDateShortId(thesis.lastActivity)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      width: 88,
      className: "text-center",
      render: (thesis) => (
        <div className="flex items-center justify-center gap-1">
          {needsWarning(thesis.activityLevel) && canSendWarning && (
            <TableIconAction icon={Bell} label="Kirim Peringatan" onClick={() => setWarningDialog({ open: true, thesis })} />
          )}
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => navigate(`/tugas-akhir/monitoring/${thesis.id}`)} />
        </div>
      ),
    },
  ];

  // Toolbar: search on the left; semester, Download Laporan and Muat Ulang on the right.
  const actions = (
    <>
      {semesterSelect}
      {extraActions}
      <RefreshButton
        onClick={() => (onRefresh ? onRefresh() : void refetch())}
        isRefreshing={isLoadingAny && !isLoading}
      />
    </>
  );

  return (
    <>
      <CustomTable<ThesisListItem>
        columns={columns}
        data={paginatedData}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        total={filtered.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Cari nama, NIM, judul, atau pembimbing..."
        enableColumnFilters
        tableClassName={THESES_TABLE_CLASS}
        actions={actions}
        emptyText={hasFilters ? "Tidak ada tugas akhir yang cocok dengan pencarian atau filter." : "Tidak ada data tugas akhir"}
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
                  <span>Aktivitas saat ini:</span>
                  <ThesisActivityBadge level={warningDialog.thesis?.activityLevel} />
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


    </>
  );
}
