import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    UserMinus,
    Users,
} from "lucide-react";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { MetricAction } from "@/components/metopen/MetricAction";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/spinner";
import { assessmentService } from "@/services/assessment.service";
import { useActiveAcademicYear } from "@/hooks/shared/useActiveAcademicYear";
import type {
    AdvisorStatusCategory,
    MonitoringResponse,
    MonitoringStudentRow,
    MonitoringUnmatchedRow,
    ScoreCompleteness,
} from "@/types/metopenMonitoring.types";
import { formatDateId, toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";

const QUERY_KEY = ["assessment-metopen-monitoring"] as const;

// ────────────────────────────────────────────────────────────
// Filter constants
// ────────────────────────────────────────────────────────────

type AdvisorFilter = "all" | AdvisorStatusCategory;
type ScoreFilter = "all" | ScoreCompleteness;
type ImportFilter = "all" | "in_import" | "missing_import";
type AttendanceFilter = "all" | "eligible" | "ineligible" | "no_record";

const ADVISOR_FILTERS: { value: AdvisorFilter; label: string }[] = [
    { value: "all", label: "Semua status pembimbing" },
    { value: "no_advisor", label: "Belum mencari pembimbing" },
    { value: "pending_review", label: "Menunggu dosen" },
    { value: "pending_kadep", label: "Menunggu KaDep" },
    { value: "active_pre_ta04", label: "Booking / TA-04 awal" },
    { value: "active_official", label: "Beban aktif TA" },
    { value: "released", label: "Booking dilepas" },
    { value: "revision", label: "Revisi TA-02" },
    { value: "rejected", label: "Ditolak" },
    { value: "withdrawn", label: "Ditarik / Dibatalkan" },
];

const SCORE_FILTERS: { value: ScoreFilter; label: string }[] = [
    { value: "all", label: "Semua status nilai" },
    { value: "none", label: "Belum dinilai" },
    { value: "partial_ta03a", label: "TA-03A saja" },
    { value: "partial_ta03b", label: "TA-03B saja" },
    { value: "complete_pending", label: "Lengkap (belum publish)" },
    { value: "published", label: "Final published" },
    { value: "auto_zero", label: "Nilai otomatis 0 (presensi <75%)" },
];

const IMPORT_FILTERS: { value: ImportFilter; label: string }[] = [
    { value: "all", label: "Semua mahasiswa" },
    { value: "in_import", label: "Hadir di import presensi" },
    { value: "missing_import", label: "Belum ada di import" },
];

const ATTENDANCE_FILTERS: { value: AttendanceFilter; label: string }[] = [
    { value: "all", label: "Semua status presensi" },
    { value: "eligible", label: "Eligible (≥75%)" },
    { value: "ineligible", label: "Kurang dari 75%" },
    { value: "no_record", label: "Belum ada data presensi" },
];

function readFilter<T extends string>(
    params: URLSearchParams,
    key: string,
    options: ReadonlyArray<{ value: T }>,
    fallback: T,
): T {
    const value = params.get(key);
    return options.some((option) => option.value === value) ? (value as T) : fallback;
}

function setOptionalParam(params: URLSearchParams, key: string, value: string) {
    if (value === "all") params.delete(key);
    else params.set(key, value);
}

// ────────────────────────────────────────────────────────────
// Format helpers
// ────────────────────────────────────────────────────────────

function formatPercent(value: number | null | undefined) {
    if (value == null) return "-";
    return `${(value * 100).toFixed(2)}%`;
}

function formatScore(value: number | null | undefined) {
    if (value == null) return "—";
    return String(value);
}

const ADVISOR_BADGE_VARIANTS: Record<AdvisorStatusCategory, string> = {
    no_advisor: "bg-slate-100 text-slate-700 border-slate-200",
    pending_review: "bg-amber-50 text-amber-800 border-amber-200",
    pending_kadep: "bg-blue-50 text-blue-800 border-blue-200",
    active_pre_ta04: "bg-emerald-50 text-emerald-800 border-emerald-200",
    active_official: "bg-emerald-100 text-emerald-900 border-emerald-300",
    released: "bg-zinc-100 text-zinc-800 border-zinc-300",
    revision: "bg-orange-50 text-orange-800 border-orange-200",
    rejected: "bg-rose-50 text-rose-800 border-rose-200",
    withdrawn: "bg-zinc-100 text-zinc-700 border-zinc-200",
    other: "bg-muted text-foreground border-border",
};

const SCORE_BADGE_VARIANTS: Record<ScoreCompleteness, { label: string; className: string }> = {
    none: { label: "Belum dinilai", className: "bg-slate-100 text-slate-700 border-slate-200" },
    partial_ta03a: { label: "Parsial TA-03A", className: "bg-amber-50 text-amber-800 border-amber-200" },
    partial_ta03b: { label: "Parsial TA-03B", className: "bg-amber-50 text-amber-800 border-amber-200" },
    complete_pending: {
        label: "Lengkap, belum publish",
        className: "bg-blue-50 text-blue-800 border-blue-200",
    },
    published: { label: "Final", className: "bg-emerald-100 text-emerald-900 border-emerald-300" },
    auto_zero: { label: "Nilai otomatis 0", className: "bg-rose-100 text-rose-900 border-rose-300" },
};

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function MetopenMonitoring() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [advisorFilter, setAdvisorFilter] = useState<AdvisorFilter>(() => readFilter(searchParams, "advisor", ADVISOR_FILTERS, "all"));
    const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(() => readFilter(searchParams, "score", SCORE_FILTERS, "all"));
    const [importFilter, setImportFilter] = useState<ImportFilter>(() => readFilter(searchParams, "import", IMPORT_FILTERS, "all"));
    const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>(() => readFilter(searchParams, "attendance", ATTENDANCE_FILTERS, "all"));
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const unmatchedRef = useRef<HTMLDivElement | null>(null);
    const studentsTableRef = useRef<HTMLDivElement | null>(null);
    const {
        academicYear,
        label: academicYearLabel,
        isLoading: isAcademicYearLoading,
        error: academicYearError,
    } = useActiveAcademicYear();
    const academicYearId = academicYear?.id ?? null;

    const commitFilters = ({
        advisor = advisorFilter,
        score = scoreFilter,
        importStatus = importFilter,
        attendance = attendanceFilter,
        clearSearch = false,
    }: {
        advisor?: AdvisorFilter;
        score?: ScoreFilter;
        importStatus?: ImportFilter;
        attendance?: AttendanceFilter;
        clearSearch?: boolean;
    }) => {
        setAdvisorFilter(advisor);
        setScoreFilter(score);
        setImportFilter(importStatus);
        setAttendanceFilter(attendance);
        if (clearSearch) setSearch("");
        setPage(1);

        const next = new URLSearchParams(searchParams);
        setOptionalParam(next, "advisor", advisor);
        setOptionalParam(next, "score", score);
        setOptionalParam(next, "import", importStatus);
        setOptionalParam(next, "attendance", attendance);
        setSearchParams(next, { replace: true });
    };

    /** Filter lalu scroll ke tabel mahasiswa (CTA MetricAction "Lihat data" / ProgressMetric). */
    const revealStudentsTable = (filters: Parameters<typeof commitFilters>[0]) => {
        commitFilters(filters);
        requestAnimationFrame(() => {
            studentsTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    useEffect(() => {
        setBreadcrumbs([
            { label: "Metode Penelitian", href: "/kelola/metopen" },
            { label: "Monitoring Kelas" },
        ]);
        setTitle("Monitoring Kelas Metopen");
    }, [setBreadcrumbs, setTitle]);

    useEffect(() => {
        setAdvisorFilter(readFilter(searchParams, "advisor", ADVISOR_FILTERS, "all"));
        setScoreFilter(readFilter(searchParams, "score", SCORE_FILTERS, "all"));
        setImportFilter(readFilter(searchParams, "import", IMPORT_FILTERS, "all"));
        setAttendanceFilter(readFilter(searchParams, "attendance", ATTENDANCE_FILTERS, "all"));
        setPage(1);
    }, [searchParams]);

    const { data, isLoading, isError, error, isFetching } = useQuery<MonitoringResponse>({
        queryKey: [...QUERY_KEY, academicYearId],
        queryFn: () => assessmentService.getMetopenMonitoring(academicYearId!),
        enabled: Boolean(academicYearId),
    });

    const filteredStudents = useMemo(() => {
        if (!data?.students) return [];
        const q = search.trim().toLowerCase();
        return data.students.filter((row) => {
            if (q) {
                const hit =
                    (row.fullName ?? "").toLowerCase().includes(q) ||
                    (row.identityNumber ?? "").toLowerCase().includes(q) ||
                    (row.advisorRequest.proposedTitle ?? "").toLowerCase().includes(q);
                if (!hit) return false;
            }
            if (advisorFilter !== "all" && row.advisorRequest.statusCategory !== advisorFilter)
                return false;
            if (scoreFilter !== "all" && row.score.completeness !== scoreFilter) return false;
            if (importFilter === "in_import" && !row.isInImport) return false;
            if (importFilter === "missing_import" && row.isInImport) return false;
            if (attendanceFilter === "eligible" && row.attendance?.isEligible !== true) return false;
            if (attendanceFilter === "ineligible" && row.attendance?.isEligible !== false) return false;
            if (attendanceFilter === "no_record" && row.attendance !== null) return false;
            return true;
        });
    }, [data?.students, search, advisorFilter, scoreFilter, importFilter, attendanceFilter]);

    const paginatedStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, page, pageSize]);

    const hasActiveFilter =
        Boolean(search.trim()) ||
        advisorFilter !== "all" ||
        scoreFilter !== "all" ||
        importFilter !== "all" ||
        attendanceFilter !== "all";

    const studentColumns = useMemo<Column<MonitoringStudentRow>[]>(
        () => [
            {
                key: "no",
                header: "No",
                width: 48,
                className: "align-top",
                render: (row) => <span className="text-xs">{row.rowNumber}</span>,
            },
            {
                key: "mahasiswa",
                header: "Mahasiswa",
                className: "align-top min-w-[180px]",
                render: (row) => (
                    <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium leading-tight break-words">
                            {toTitleCaseName(row.fullName ?? "-")}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{row.identityNumber}</p>
                        {row.advisorRequest.proposedTitle ? (
                            <p
                                className="text-xs text-muted-foreground line-clamp-2 break-words"
                                title={row.advisorRequest.proposedTitle}
                            >
                                <span className="font-medium">Judul:</span>{" "}
                                {row.advisorRequest.proposedTitle}
                            </p>
                        ) : null}
                    </div>
                ),
            },
            {
                key: "presensi",
                header: "Presensi",
                width: 140,
                className: "align-top",
                render: (row) => <AttendanceCell row={row} />,
            },
            {
                key: "advisor",
                header: "Status Pembimbing",
                width: 160,
                className: "align-top",
                render: (row) => (
                    <div className="space-y-1">
                        <AdvisorStatusBadge row={row} />
                        {row.advisorRequest.routeLabel ? (
                            <p className="text-xs text-muted-foreground break-words">
                                {row.advisorRequest.routeLabel}
                            </p>
                        ) : null}
                        {row.advisorRequest.acceptedOverNormal ? (
                            <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-800 text-xs"
                            >
                                Overquota sah
                            </Badge>
                        ) : null}
                    </div>
                ),
            },
            {
                key: "supervisors",
                header: "Pembimbing 1 / 2",
                className: "align-top min-w-[150px]",
                render: (row) => (
                    <div className="space-y-0.5 min-w-0">
                        <p className="text-xs break-words">
                            <span className="font-medium">P1:</span>{" "}
                            {row.supervisors.pembimbing1.fullName
                                ? toTitleCaseName(row.supervisors.pembimbing1.fullName)
                                : "—"}
                        </p>
                        <p className="text-xs break-words">
                            <span className="font-medium">P2:</span>{" "}
                            {row.supervisors.pembimbing2.fullName
                                ? toTitleCaseName(row.supervisors.pembimbing2.fullName)
                                : "—"}
                        </p>
                    </div>
                ),
            },
            {
                key: "presentasi",
                header: () => (
                    <span className="text-right block">
                        Pres
                        <br />
                        <span className="text-[10px] font-normal text-muted-foreground">/20</span>
                    </span>
                ),
                className: "text-right align-top",
                width: 56,
                render: (row) => <ScoreValue value={row.score.presentasi} />,
            },
            {
                key: "konten",
                header: () => (
                    <span className="text-right block">
                        Kont
                        <br />
                        <span className="text-[10px] font-normal text-muted-foreground">/40</span>
                    </span>
                ),
                className: "text-right align-top",
                width: 56,
                render: (row) => <ScoreValue value={row.score.proposalKonten} />,
            },
            {
                key: "struktur",
                header: () => (
                    <span className="text-right block">
                        Strk
                        <br />
                        <span className="text-[10px] font-normal text-muted-foreground">/25</span>
                    </span>
                ),
                className: "text-right align-top",
                width: 56,
                render: (row) => <ScoreValue value={row.score.proposalStruktur} />,
            },
            {
                key: "respon",
                header: () => (
                    <span className="text-right block">
                        Resp
                        <br />
                        <span className="text-[10px] font-normal text-muted-foreground">/15</span>
                    </span>
                ),
                className: "text-right align-top",
                width: 56,
                render: (row) => <ScoreValue value={row.score.kemampuanRespon} />,
            },
            {
                key: "final",
                header: () => (
                    <span className="text-right block">
                        Final
                        <br />
                        <span className="text-[10px] font-normal text-muted-foreground">/100</span>
                    </span>
                ),
                className: "text-right align-top",
                width: 64,
                render: (row) => (
                    <span className="text-sm font-semibold tabular-nums">
                        {formatScore(row.score.finalScore)}
                    </span>
                ),
            },
            {
                key: "scoreStatus",
                header: "Status Nilai",
                width: 120,
                className: "align-top",
                render: (row) => <ScoreCompletenessBadge row={row} />,
            },
        ],
        [],
    );

    const unmatchedColumns = useMemo<Column<MonitoringUnmatchedRow & { _idx: number }>[]>(
        () => [
            {
                key: "no",
                header: "No",
                width: 48,
                render: (row) => <span className="text-xs">{row._idx + 1}</span>,
            },
            {
                key: "nim",
                header: "NIM",
                width: 140,
                render: (row) => (
                    <span className="font-mono text-xs">{row.identityNumber}</span>
                ),
            },
            {
                key: "nama",
                header: "Nama (dari xlsx)",
                render: (row) => (
                    <span className="text-sm">{toTitleCaseName(row.fullName ?? "-")}</span>
                ),
            },
            {
                key: "presensi",
                header: "Presensi",
                width: 160,
                render: (row) => <AttendanceCell row={row} />,
            },
        ],
        [],
    );

    if (isLoading || isAcademicYearLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
                <Loading size="lg" text="Memuat dashboard monitoring Metopen..." />
            </div>
        );
    }

    if (isError || academicYearError || !academicYearId) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Monitoring gagal dimuat</CardTitle>
                        <CardDescription>
                            {error instanceof Error
                                ? error.message
                                : academicYearError instanceof Error
                                  ? academicYearError.message
                                  : "Periode akademik aktif belum tersedia."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!data) return null;

    const { attendanceImport, stats, unmatchedRecords } = data;
    const unmatchedWithIndex = unmatchedRecords.map((row, idx) => ({ ...row, _idx: idx }));

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">Monitoring Kelas Metopen</h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                    Pantau progress per mahasiswa eligible SIA: pencarian pembimbing dan rincian nilai
                    TA-03 sesuai layout template SIA untuk periode {academicYearLabel ?? "-"}.
                </p>
            </div>

            <HeroCard
                totalEligible={stats.totalEligibleSia}
                totalInImport={stats.totalInImport}
                attendanceEligible={stats.attendanceEligible}
                hasImport={Boolean(attendanceImport)}
                onShowMissing={() =>
                    revealStudentsTable({
                        advisor: "all",
                        score: "all",
                        importStatus: "missing_import",
                        attendance: "all",
                        clearSearch: true,
                    })
                }
                onShowEligible={() =>
                    revealStudentsTable({
                        advisor: "all",
                        score: "all",
                        importStatus: "all",
                        attendance: "eligible",
                        clearSearch: true,
                    })
                }
            />

            {/* Stat cards: 1→2→4 cols fluid ─────────────── */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                <MetricAction
                    icon={<Users className="h-4 w-4" />}
                    label="Eligible SIA"
                    value={stats.totalEligibleSia}
                    hint={`${stats.totalInImport} di import · ${stats.missingFromImport} belum di import`}
                    active={!hasActiveFilter}
                    onClick={() =>
                        revealStudentsTable({
                            advisor: "all",
                            score: "all",
                            importStatus: "all",
                            attendance: "all",
                            clearSearch: true,
                        })
                    }
                />
                <MetricAction
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                    label="Presensi eligible (≥75%)"
                    value={stats.attendanceEligible}
                    hint={`${stats.attendanceIneligible} ineligible`}
                    tone="emerald"
                    active={attendanceFilter === "eligible"}
                    onClick={() =>
                        revealStudentsTable({
                            advisor: "all",
                            score: "all",
                            importStatus: "all",
                            attendance: "eligible",
                            clearSearch: true,
                        })
                    }
                />
                <MetricAction
                    icon={<UserMinus className="h-4 w-4 text-amber-700" />}
                    label="Belum mencari pembimbing"
                    value={stats.advisorByCategory.no_advisor}
                    hint={`${stats.advisorByCategory.pending_review} menunggu dosen · ${stats.advisorByCategory.pending_kadep} menunggu KaDep`}
                    tone="amber"
                    active={advisorFilter === "no_advisor"}
                    onClick={() =>
                        revealStudentsTable({
                            advisor: "no_advisor",
                            score: "all",
                            importStatus: "all",
                            attendance: "all",
                            clearSearch: true,
                        })
                    }
                />
                <MetricAction
                    icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
                    label="Unmatched di import"
                    value={stats.unmatchedInImport}
                    hint="NIM di xlsx tidak ditemukan di SIA"
                    tone="rose"
                    onClick={() => unmatchedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                />
            </div>

            {/* Attendance import card ─────────────────────── */}
            {attendanceImport ? (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Sumber Presensi Aktif</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {formatDateId(attendanceImport.uploadedAt)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 text-sm grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                            <Field label="Kelas" value={attendanceImport.classCode ?? "-"} mono />
                            <Field label="Semester" value={attendanceImport.semesterLabel ?? "-"} />
                            <Field
                                label="Threshold"
                                value={formatPercent(attendanceImport.thresholdPercent)}
                            />
                            <Field
                                label="Matched / Total"
                                value={`${attendanceImport.matchedRows} / ${attendanceImport.totalRows}`}
                                mono
                            />
                            <Field
                                label="Eligible"
                                value={String(attendanceImport.eligibleRows)}
                                tone="emerald"
                            />
                            <Field
                                label="Kurang 75%"
                                value={String(attendanceImport.ineligibleRows)}
                                tone="rose"
                            />
                            <Field
                                label="Nilai otomatis 0"
                                value={String(attendanceImport.autoZeroedCount)}
                                tone="rose"
                            />
                            <Field
                                label="Filter"
                                value={attendanceImport.filterLabel ?? "-"}
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-amber-200 bg-amber-50/60">
                    <CardContent className="py-6 text-sm text-amber-900">
                        Belum ada import presensi Metopel. Unggah file melalui halaman{" "}
                        <strong>Penilaian TA-03B</strong> untuk membuka penilaian berbasis presensi dan
                        menampilkan kolom presensi di tabel di bawah.
                    </CardContent>
                </Card>
            )}

            {/* Filter card ──────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Filter Status</CardTitle>
                        {hasActiveFilter ? (
                            <button
                                type="button"
                                onClick={() => {
                                    commitFilters({ advisor: "all", score: "all", importStatus: "all", attendance: "all", clearSearch: true });
                                }}
                                className="text-xs text-primary hover:underline"
                            >
                                Reset semua filter
                            </button>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                        <FilterSelect
                            label="Status pembimbing"
                            value={advisorFilter}
                            options={ADVISOR_FILTERS}
                            onChange={(v) => {
                                commitFilters({ advisor: v as AdvisorFilter });
                            }}
                        />
                        <FilterSelect
                            label="Status nilai"
                            value={scoreFilter}
                            options={SCORE_FILTERS}
                            onChange={(v) => {
                                commitFilters({ score: v as ScoreFilter });
                            }}
                        />
                        <FilterSelect
                            label="Sumber data"
                            value={importFilter}
                            options={IMPORT_FILTERS}
                            onChange={(v) => {
                                commitFilters({ importStatus: v as ImportFilter });
                            }}
                        />
                        <FilterSelect
                            label="Status presensi"
                            value={attendanceFilter}
                            options={ATTENDANCE_FILTERS}
                            onChange={(v) => commitFilters({ attendance: v as AttendanceFilter })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div ref={studentsTableRef} className="scroll-mt-6 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <p className="text-sm font-medium">
                        Mahasiswa Eligible Metopen ({filteredStudents.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                        dari {stats.totalEligibleSia} mahasiswa eligible SIA
                    </p>
                </div>
                <CustomTable<MonitoringStudentRow>
                    columns={studentColumns}
                    data={paginatedStudents}
                    loading={false}
                    isRefreshing={isFetching && !isLoading}
                    total={filteredStudents.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                    searchValue={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    emptyText="Tidak ada mahasiswa yang cocok dengan filter saat ini."
                    rowKey={(row) => row.studentId}
                />
            </div>

            {/* Unmatched records ─────────────────────────── */}
                <div ref={unmatchedRef} className="scroll-mt-6 space-y-2">
                    <div className="flex items-start gap-2 px-1">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                        <div>
                            <p className="text-sm font-medium">
                                Unmatched di Import Presensi ({unmatchedRecords.length})
                            </p>
                            <p className="text-xs text-muted-foreground">
                                NIM berikut muncul di file xlsx upload tapi tidak ditemukan di SIA.
                            </p>
                        </div>
                    </div>
                    <CustomTable<MonitoringUnmatchedRow & { _idx: number }>
                        columns={unmatchedColumns}
                        data={unmatchedWithIndex}
                        total={unmatchedWithIndex.length}
                        page={1}
                        pageSize={Math.max(unmatchedWithIndex.length, 10)}
                        onPageChange={() => undefined}
                        emptyText="Tidak ada data unmatched."
                        rowKey={(row) => `${row.identityNumber}-${row._idx}`}
                    />
                </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function HeroCard({
    totalEligible,
    totalInImport,
    attendanceEligible,
    hasImport,
    onShowMissing,
    onShowEligible,
}: {
    totalEligible: number;
    totalInImport: number;
    attendanceEligible: number;
    hasImport: boolean;
    onShowMissing: () => void;
    onShowEligible: () => void;
}) {
    const importCoverage =
        totalEligible > 0 ? Math.round((totalInImport / totalEligible) * 100) : 0;
    const attendanceCoverage =
        totalInImport > 0 ? Math.round((attendanceEligible / totalInImport) * 100) : 0;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                    <div className="space-y-1">
                        <CardTitle className="text-base">Ringkasan Cakupan Kelas</CardTitle>
                        <CardDescription className="text-xs">
                            Presentasi 20 + Konten 40 + Struktur 25 + Respons 15 = 100 (template SIA).
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
                    <ProgressMetric
                        label="Cakupan import vs SIA"
                        valueLabel={`${totalInImport} / ${totalEligible} mahasiswa`}
                        percent={importCoverage}
                        helper={
                            hasImport
                                ? "Selisih = mahasiswa eligible SIA yang belum di-import."
                                : "Belum ada import presensi."
                        }
                        tone="blue"
                        actionLabel="Lihat yang belum di-import"
                        onClick={onShowMissing}
                    />
                    <ProgressMetric
                        label="Memenuhi ambang 75% vs di import"
                        valueLabel={`${attendanceEligible} / ${totalInImport} mahasiswa`}
                        percent={attendanceCoverage}
                        helper="Mahasiswa dengan presensi ≥75% terhadap yang sudah di-import."
                        tone="emerald"
                        actionLabel="Lihat mahasiswa eligible"
                        onClick={onShowEligible}
                    />
                </CardContent>
        </Card>
    );
}

function ProgressMetric({
    label,
    valueLabel,
    percent,
    helper,
    tone,
    actionLabel,
    onClick,
}: {
    label: string;
    valueLabel: string;
    percent: number;
    helper: string;
    tone: "blue" | "emerald";
    actionLabel: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full rounded-md border bg-background/80 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold tabular-nums">{percent}%</p>
            </div>
            <p className="mt-1 text-sm font-medium tabular-nums">{valueLabel}</p>
            <Progress
                value={percent}
                className={cn(
                    "mt-2 h-1.5 bg-muted",
                    tone === "blue"
                        ? "[&_[data-slot=progress-indicator]]:bg-blue-500"
                        : "[&_[data-slot=progress-indicator]]:bg-emerald-500",
                )}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">{helper}</p>
            <p className="mt-2 text-[11px] font-medium text-primary">{actionLabel}</p>
        </button>
    );
}

function Field({
    label,
    value,
    mono = false,
    tone,
}: {
    label: string;
    value: string;
    mono?: boolean;
    tone?: "emerald" | "rose";
}) {
    const toneClass = tone === "emerald" ? "text-emerald-700" : tone === "rose" ? "text-rose-700" : "";
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "font-medium",
                    mono ? "font-mono text-sm" : "",
                    toneClass,
                )}
            >
                {value}
            </p>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Row renderers
// ────────────────────────────────────────────────────────────

function AdvisorStatusBadge({
    row,
}: {
    row: MonitoringStudentRow | MonitoringUnmatchedRow;
}) {
    const { statusCategory, statusLabel } = row.advisorRequest;
    return (
        <Badge
            variant="outline"
            className={cn(ADVISOR_BADGE_VARIANTS[statusCategory] ?? ADVISOR_BADGE_VARIANTS.other, "text-xs")}
        >
            {statusLabel}
        </Badge>
    );
}

function ScoreCompletenessBadge({
    row,
}: {
    row: MonitoringStudentRow | MonitoringUnmatchedRow;
}) {
    const entry = SCORE_BADGE_VARIANTS[row.score.completeness];
    return (
        <Badge variant="outline" className={cn(entry.className, "text-xs")}>
            {entry.label}
        </Badge>
    );
}

function AttendanceCell({
    row,
}: {
    row: MonitoringStudentRow | MonitoringUnmatchedRow;
}) {
    if (!row.attendance) {
        return (
            <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 text-xs">
                Belum di import
            </Badge>
        );
    }
    const { attendancePercentage, isEligible, presentCount, totalMeetings } = row.attendance;
    return (
        <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold tabular-nums">
                    {presentCount}/{totalMeetings}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                    ({formatPercent(attendancePercentage)})
                </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full transition-all",
                        isEligible ? "bg-emerald-500" : "bg-rose-500",
                    )}
                    style={{ width: `${Math.min(100, Math.round(attendancePercentage * 100))}%` }}
                />
            </div>
            <Badge
                variant="outline"
                className={cn(
                    "text-xs",
                    isEligible
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                )}
            >
                {isEligible ? "Eligible" : "Ineligible"}
            </Badge>
        </div>
    );
}

function ScoreValue({ value }: { value: number | null | undefined }) {
    return (
        <span
            className={cn(
                "text-sm tabular-nums",
                value == null ? "text-muted-foreground" : "",
            )}
        >
            {formatScore(value)}
        </span>
    );
}
