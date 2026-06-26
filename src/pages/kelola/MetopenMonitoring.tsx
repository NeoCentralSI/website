import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    Search,
    UserMinus,
    Users,
} from "lucide-react";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { assessmentService } from "@/services/assessment.service";
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

const ADVISOR_FILTERS: { value: AdvisorFilter; label: string }[] = [
    { value: "all", label: "Semua status pembimbing" },
    { value: "no_advisor", label: "Belum mencari pembimbing" },
    { value: "pending_review", label: "Menunggu dosen" },
    { value: "pending_kadep", label: "Menunggu KaDep" },
    { value: "active_pre_ta04", label: "Booking pembimbing" },
    { value: "active_official", label: "Bimbingan resmi (TA-04)" },
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
    { value: "auto_zero", label: "Auto-zero (presensi <75%)" },
];

const IMPORT_FILTERS: { value: ImportFilter; label: string }[] = [
    { value: "all", label: "Semua mahasiswa" },
    { value: "in_import", label: "Hadir di import presensi" },
    { value: "missing_import", label: "Belum ada di import" },
];

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
    auto_zero: { label: "Auto-zero", className: "bg-rose-100 text-rose-900 border-rose-300" },
};

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function MetopenMonitoring() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [search, setSearch] = useState("");
    const [advisorFilter, setAdvisorFilter] = useState<AdvisorFilter>("all");
    const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
    const [importFilter, setImportFilter] = useState<ImportFilter>("all");

    useEffect(() => {
        setBreadcrumbs([
            { label: "Metode Penelitian", href: "/kelola/metopen" },
            { label: "Monitoring Kelas" },
        ]);
        setTitle("Monitoring Kelas Metopen");
    }, [setBreadcrumbs, setTitle]);

    const { data, isLoading, isError, error } = useQuery<MonitoringResponse>({
        queryKey: QUERY_KEY,
        queryFn: () => assessmentService.getMetopenMonitoring(),
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
            return true;
        });
    }, [data?.students, search, advisorFilter, scoreFilter, importFilter]);

    const hasActiveFilter =
        Boolean(search.trim()) ||
        advisorFilter !== "all" ||
        scoreFilter !== "all" ||
        importFilter !== "all";

    if (isLoading) {
        return (
            <div className="py-12">
                <Loading size="lg" text="Memuat dashboard monitoring Metopen..." />
            </div>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monitoring gagal dimuat</CardTitle>
                    <CardDescription>
                        {error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga."}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) return null;

    const { attendanceImport, stats, unmatchedRecords } = data;

    return (
        <div className="p-6 space-y-6">
            <HeroCard
                totalEligible={stats.totalEligibleSia}
                totalInImport={stats.totalInImport}
                attendanceEligible={stats.attendanceEligible}
                hasImport={Boolean(attendanceImport)}
            />

            {/* Stat cards: 1→2→4 cols fluid ─────────────── */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={<Users className="h-4 w-4" />}
                    label="Eligible SIA"
                    value={stats.totalEligibleSia}
                    hint={`${stats.totalInImport} di import · ${stats.missingFromImport} belum di import`}
                    accent="muted"
                />
                <StatCard
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                    label="Presensi eligible (≥75%)"
                    value={stats.attendanceEligible}
                    hint={`${stats.attendanceIneligible} ineligible`}
                    accent="emerald"
                />
                <StatCard
                    icon={<UserMinus className="h-4 w-4 text-amber-700" />}
                    label="Belum mencari pembimbing"
                    value={stats.advisorByCategory.no_advisor}
                    hint={`${stats.advisorByCategory.pending_review} menunggu dosen · ${stats.advisorByCategory.pending_kadep} menunggu KaDep`}
                    accent="amber"
                />
                <StatCard
                    icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
                    label="Unmatched di import"
                    value={stats.unmatchedInImport}
                    hint="NIM di xlsx tidak ditemukan di SIA"
                    accent="rose"
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
                                label="Auto-zero"
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
                        <strong>Penilaian TA-03B</strong> untuk membuka gating BR-28 dan menampilkan kolom
                        presensi di tabel di bawah.
                    </CardContent>
                </Card>
            )}

            {/* Filter card ──────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Filter &amp; Pencarian</CardTitle>
                        {hasActiveFilter ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setAdvisorFilter("all");
                                    setScoreFilter("all");
                                    setImportFilter("all");
                                }}
                                className="text-xs text-primary hover:underline"
                            >
                                Reset semua filter
                            </button>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                            <Label htmlFor="monitoring-search">Cari NIM, nama, atau judul</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="monitoring-search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Ketik untuk filter..."
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="xl:col-span-3">
                            <FilterSelect
                                label="Status pembimbing"
                                value={advisorFilter}
                                options={ADVISOR_FILTERS}
                                onChange={(v) => setAdvisorFilter(v as AdvisorFilter)}
                            />
                        </div>
                        <div className="xl:col-span-2">
                            <FilterSelect
                                label="Status nilai"
                                value={scoreFilter}
                                options={SCORE_FILTERS}
                                onChange={(v) => setScoreFilter(v as ScoreFilter)}
                            />
                        </div>
                        <div className="xl:col-span-2">
                            <FilterSelect
                                label="Sumber data"
                                value={importFilter}
                                options={IMPORT_FILTERS}
                                onChange={(v) => setImportFilter(v as ImportFilter)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student list ──────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-sm">
                            Mahasiswa Eligible Metopen ({filteredStudents.length})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {filteredStudents.length} dari {stats.totalEligibleSia} mahasiswa
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="px-0 pb-4">
                    {/* Mobile, tablet, lg desktop — card list (sampai <1280px) */}
                    <div className="space-y-2.5 px-4 xl:hidden">
                        {filteredStudents.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Tidak ada mahasiswa yang cocok dengan filter saat ini.
                            </p>
                        ) : (
                            filteredStudents.map((row) => (
                                <StudentRowMobile key={row.studentId} row={row} />
                            ))
                        )}
                    </div>

                    {/* xl+ — tabel padat (≥1280px viewport, area konten ≥~1024px setelah sidebar) */}
                    <div className="hidden xl:block">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                    <TableHead className="w-10">No</TableHead>
                                    <TableHead className="min-w-[180px]">Mahasiswa</TableHead>
                                    <TableHead className="w-32">Presensi</TableHead>
                                    <TableHead className="w-40">Status Pembimbing</TableHead>
                                    <TableHead className="min-w-[150px]">Pembimbing 1 / 2</TableHead>
                                    <TableHead className="text-right w-12">Pres<br /><span className="text-[10px] font-normal text-muted-foreground">/20</span></TableHead>
                                    <TableHead className="text-right w-12">Kont<br /><span className="text-[10px] font-normal text-muted-foreground">/40</span></TableHead>
                                    <TableHead className="text-right w-12">Strk<br /><span className="text-[10px] font-normal text-muted-foreground">/25</span></TableHead>
                                    <TableHead className="text-right w-12">Resp<br /><span className="text-[10px] font-normal text-muted-foreground">/15</span></TableHead>
                                    <TableHead className="text-right w-14">Final<br /><span className="text-[10px] font-normal text-muted-foreground">/100</span></TableHead>
                                    <TableHead className="w-28">Status Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada mahasiswa yang cocok dengan filter saat ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((row) => (
                                        <StudentRowDesktop key={row.studentId} row={row} />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Unmatched records ─────────────────────────── */}
            {unmatchedRecords.length > 0 ? (
                <Card className="border-rose-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-rose-700" />
                            Unmatched di Import Presensi ({unmatchedRecords.length})
                        </CardTitle>
                        <CardDescription>
                            NIM berikut muncul di file xlsx upload tapi tidak ditemukan di SIA. Periksa
                            kembali format file presensi atau lakukan sinkronisasi data SIA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-4">
                        <div className="space-y-2 px-4 md:hidden">
                            {unmatchedRecords.map((row, idx) => (
                                <UnmatchedRowMobile key={`${row.identityNumber}-${idx}`} row={row} />
                            ))}
                        </div>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead className="w-36">NIM</TableHead>
                                        <TableHead>Nama (dari xlsx)</TableHead>
                                        <TableHead className="w-40">Presensi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {unmatchedRecords.map((row, idx) => (
                                        <TableRow key={`${row.identityNumber}-${idx}`}>
                                            <TableCell className="text-xs">{idx + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.identityNumber}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {toTitleCaseName(row.fullName ?? "-")}
                                            </TableCell>
                                            <TableCell>
                                                <AttendanceCell row={row} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
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
}: {
    totalEligible: number;
    totalInImport: number;
    attendanceEligible: number;
    hasImport: boolean;
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
                        <CardTitle className="text-base">Monitoring Kelas Metopen</CardTitle>
                        <CardDescription className="text-xs">
                            Pantau progress per mahasiswa eligible SIA: pencarian pembimbing dan
                            rincian nilai TA-03 sesuai layout template SIA (Presentasi 20 + Konten 40 +
                            Struktur 25 + Respons 15 = 100).
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
                    />
                    <ProgressMetric
                        label="Eligible BR-28 vs di import"
                        valueLabel={`${attendanceEligible} / ${totalInImport} mahasiswa`}
                        percent={attendanceCoverage}
                        helper="Mahasiswa dengan presensi ≥75% terhadap yang sudah di-import."
                        tone="emerald"
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
}: {
    label: string;
    valueLabel: string;
    percent: number;
    helper: string;
    tone: "blue" | "emerald";
}) {
    return (
        <div className="rounded-md border bg-background/80 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold tabular-nums">{percent}%</p>
            </div>
            <p className="mt-1 text-sm font-medium tabular-nums">{valueLabel}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full transition-all",
                        tone === "blue" ? "bg-blue-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{helper}</p>
        </div>
    );
}

const STAT_CARD_ACCENTS: Record<"muted" | "emerald" | "amber" | "rose", string> = {
    muted: "border-border",
    emerald: "border-emerald-200/80 bg-emerald-50/30",
    amber: "border-amber-200/80 bg-amber-50/30",
    rose: "border-rose-200/80 bg-rose-50/30",
};

function StatCard({
    icon,
    label,
    value,
    hint,
    accent = "muted",
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    hint?: string;
    accent?: keyof typeof STAT_CARD_ACCENTS;
}) {
    return (
        <Card className={cn(STAT_CARD_ACCENTS[accent])}>
            <CardContent className="space-y-1 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {icon}
                    <span>{label}</span>
                </div>
                <p className="text-2xl font-semibold tabular-nums">{value}</p>
                {hint ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">{hint}</p>
                ) : null}
            </CardContent>
        </Card>
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
                    "text-[10px]",
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

function StudentRowDesktop({ row }: { row: MonitoringStudentRow }) {
    return (
        <TableRow>
            <TableCell className="text-xs align-top">{row.rowNumber}</TableCell>
            <TableCell className="align-top whitespace-normal">
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
            </TableCell>
            <TableCell className="align-top">
                <AttendanceCell row={row} />
            </TableCell>
            <TableCell className="align-top whitespace-normal">
                <div className="space-y-1">
                    <AdvisorStatusBadge row={row} />
                    {row.advisorRequest.routeLabel ? (
                        <p className="text-xs text-muted-foreground break-words">{row.advisorRequest.routeLabel}</p>
                    ) : null}
                    {row.advisorRequest.acceptedOverNormal ? (
                        <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-800 text-[10px]"
                        >
                            Overquota sah
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell className="align-top whitespace-normal">
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
            </TableCell>
            <ScoreCell value={row.score.presentasi} />
            <ScoreCell value={row.score.proposalKonten} />
            <ScoreCell value={row.score.proposalStruktur} />
            <ScoreCell value={row.score.kemampuanRespon} />
            <TableCell className="text-right text-sm font-semibold tabular-nums align-top">
                {formatScore(row.score.finalScore)}
            </TableCell>
            <TableCell className="align-top">
                <ScoreCompletenessBadge row={row} />
            </TableCell>
        </TableRow>
    );
}

function ScoreCell({ value }: { value: number | null | undefined }) {
    return (
        <TableCell
            className={cn(
                "text-right text-sm tabular-nums align-top",
                value == null ? "text-muted-foreground" : "",
            )}
        >
            {formatScore(value)}
        </TableCell>
    );
}

function StudentRowMobile({ row }: { row: MonitoringStudentRow }) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                        #{row.rowNumber} · {toTitleCaseName(row.fullName ?? "-")}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {row.identityNumber}
                    </p>
                </div>
                <ScoreCompletenessBadge row={row} />
            </div>

            {row.advisorRequest.proposedTitle ? (
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                    {row.advisorRequest.proposedTitle}
                </p>
            ) : null}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Status pembimbing
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                        <AdvisorStatusBadge row={row} />
                        {row.advisorRequest.acceptedOverNormal ? (
                            <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-800 text-[10px]"
                            >
                                Overquota sah
                            </Badge>
                        ) : null}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Presensi Metopel
                    </p>
                    <div className="mt-1">
                        <AttendanceCell row={row} />
                    </div>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <p>
                    <span className="font-medium">P1:</span>{" "}
                    {row.supervisors.pembimbing1.fullName
                        ? toTitleCaseName(row.supervisors.pembimbing1.fullName)
                        : "—"}
                </p>
                <p>
                    <span className="font-medium">P2:</span>{" "}
                    {row.supervisors.pembimbing2.fullName
                        ? toTitleCaseName(row.supervisors.pembimbing2.fullName)
                        : "—"}
                </p>
            </div>

            <div className="mt-2 grid grid-cols-5 gap-1 rounded-md border bg-muted/20 p-2 text-center">
                <ScoreChip label="Pres" value={row.score.presentasi} max={20} />
                <ScoreChip label="Kont" value={row.score.proposalKonten} max={40} />
                <ScoreChip label="Strk" value={row.score.proposalStruktur} max={25} />
                <ScoreChip label="Resp" value={row.score.kemampuanRespon} max={15} />
                <ScoreChip label="Final" value={row.score.finalScore} max={100} bold />
            </div>
        </div>
    );
}

function ScoreChip({
    label,
    value,
    max,
    bold = false,
}: {
    label: string;
    value: number | null;
    max: number;
    bold?: boolean;
}) {
    return (
        <div>
            <p className="text-[9px] uppercase text-muted-foreground tracking-wide">{label}</p>
            <p
                className={cn(
                    "tabular-nums",
                    bold ? "text-sm font-semibold" : "text-xs",
                    value == null ? "text-muted-foreground" : "",
                )}
            >
                {value == null ? "—" : value}
                <span className="text-[9px] text-muted-foreground">/{max}</span>
            </p>
        </div>
    );
}

function UnmatchedRowMobile({ row }: { row: MonitoringUnmatchedRow }) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{row.identityNumber}</p>
                    <p className="text-sm font-medium leading-tight">
                        {toTitleCaseName(row.fullName ?? "-")}
                    </p>
                </div>
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-[10px]">
                    Unmatched
                </Badge>
            </div>
            <div className="mt-2">
                <AttendanceCell row={row} />
            </div>
        </div>
    );
}
