import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
    Ban,
    CheckCircle2,
    ClipboardCheck,
    FileSignature,
    GraduationCap,
    Search,
    UserCircle2,
} from "lucide-react";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { SupervisorScoreCard } from "@/components/metopen/SupervisorScoreCard";
import { ProposalVersionHistory } from "@/components/thesis/ProposalVersionHistory";
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
import { LocalTabsNav, type LocalTabItem } from "@/components/ui/tabs-nav";
import {
    assessmentService,
    type SupervisorScoringQueueItem,
    type Ta03AActionStatus,
} from "@/services/assessment.service";
import { toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";

const TA03A_QUEUE_KEY = ["assessment-supervisor-queue"];
const TA03A_HISTORY_KEY = ["assessment-supervisor-history"];

type TabKey = "active" | "history";
type StatusFilter = "all" | "needs_action" | "waiting" | "auto_zeroed";

const TAB_ITEMS: LocalTabItem[] = [
    { value: "active", label: "Antrean Aktif" },
    { value: "history", label: "Riwayat Dinilai" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "needs_action", label: "Perlu aksi saya" },
    { value: "waiting", label: "Menunggu rekan / TA-03B" },
    { value: "auto_zeroed", label: "Auto-zero presensi <75%" },
    { value: "all", label: "Semua proposal" },
];

const ACTION_LABELS: Record<Ta03AActionStatus, { label: string; tone: "amber" | "violet" | "blue" | "emerald" | "muted" | "destructive" }> = {
    p1_pending: { label: "Perlu input rubrik", tone: "amber" },
    p2_pending_cosign: { label: "Perlu co-sign", tone: "violet" },
    p1_waiting_cosign: { label: "Menunggu rekan / TA-03B", tone: "blue" },
    p2_waiting_p1: { label: "Menunggu Pembimbing 1 submit", tone: "muted" },
    auto_zeroed: { label: "Presensi <75% (auto-zero)", tone: "destructive" },
    finalized: { label: "Final dan terkunci", tone: "emerald" },
};

/**
 * BR-20 (canon §5.7.1) + BR-21 (canon §5.7.2) + BR-28 (canon §5.7.3):
 * Halaman antrean penilaian TA-03A untuk dosen pembimbing — bagian rangkaian
 * Metode Penelitian, gandeng dengan TA-03B (Koordinator Metopen).
 *
 * Konsekuensi BR-20: TA-03A adalah konsensus mufakat satu blok tanda tangan
 * — Pembimbing 1 master pengisi rubrik 0-75 + Pembimbing 2 co-sign audit-trail.
 * Halaman ini menggabungkan kedua surface jadi satu jendela navigasi:
 *   - P1 perlu input rubrik → form RubricGradingForm (di SupervisorScoreCard)
 *   - P2 perlu co-sign → tombol "Berikan Co-sign" (di SupervisorScoreCard)
 *
 * Detail panel kanan reuse `SupervisorScoreCard` yang sudah handle:
 *   - Klasifikasi role aktor via `getSupervisorContext` (P1/P2/null)
 *   - Banner finalitas BR-21 saat `isFinalized=true`
 *   - Banner auto-zero BR-28 saat `attendanceAutoZeroedAt!=null`
 */
export default function MetopenTa03AQueue() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [activeTab, setActiveTab] = useState<TabKey>("active");
    const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("needs_action");

    useEffect(() => {
        setBreadcrumbs([
            { label: "Metode Penelitian", href: "/kelola/metopen" },
            { label: "Penilaian TA-03A" },
        ]);
        setTitle("Penilaian Proposal TA-03A");
    }, [setBreadcrumbs, setTitle]);

    const {
        data: queue = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: TA03A_QUEUE_KEY,
        queryFn: () => assessmentService.getSupervisorScoringQueue(),
        refetchInterval: 30_000,
    });

    const {
        data: history = [],
        isLoading: isHistoryLoading,
        isError: isHistoryError,
        error: historyError,
    } = useQuery({
        queryKey: TA03A_HISTORY_KEY,
        queryFn: () => assessmentService.getSupervisorScoringHistory(),
        enabled: activeTab === "history",
        refetchInterval: 30_000,
    });

    const visibleItems: SupervisorScoringQueueItem[] = activeTab === "history" ? history : queue;
    const currentLoading = activeTab === "history" ? isHistoryLoading : isLoading;
    const currentError = activeTab === "history" ? isHistoryError : isError;
    const currentErrorValue = activeTab === "history" ? historyError : error;

    const stats = useMemo(() => {
        const total = queue.length;
        const needsAction = queue.filter((item) =>
            isNeedsActionStatus(item.actionStatus),
        ).length;
        const waiting = queue.filter((item) =>
            isWaitingStatus(item.actionStatus),
        ).length;
        const autoZeroed = queue.filter((item) => item.actionStatus === "auto_zeroed").length;
        return { total, needsAction, waiting, autoZeroed, history: history.length };
    }, [history.length, queue]);

    const filteredQueue = useMemo(() => {
        const q = search.trim().toLowerCase();
        return visibleItems.filter((item) => {
            if (activeTab === "active") {
                if (statusFilter === "needs_action" && !isNeedsActionStatus(item.actionStatus))
                    return false;
                if (statusFilter === "waiting" && !isWaitingStatus(item.actionStatus)) return false;
                if (statusFilter === "auto_zeroed" && item.actionStatus !== "auto_zeroed") return false;
            }
            if (q) {
                const matches =
                    (item.student?.fullName ?? "").toLowerCase().includes(q) ||
                    (item.student?.identityNumber ?? "").toLowerCase().includes(q) ||
                    (item.thesisTitle ?? "").toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [activeTab, search, statusFilter, visibleItems]);

    useEffect(() => {
        if (filteredQueue.length === 0) {
            if (visibleItems.length === 0) setSelectedThesisId(null);
            return;
        }
        if (
            !selectedThesisId ||
            !filteredQueue.some((item) => item.thesisId === selectedThesisId)
        ) {
            setSelectedThesisId(filteredQueue[0].thesisId);
        }
    }, [filteredQueue, selectedThesisId, visibleItems.length]);

    const selectedItem =
        visibleItems.find((item) => item.thesisId === selectedThesisId) ?? null;

    if (currentLoading) {
        return (
            <div className="py-12">
                <Loading
                    size="lg"
                    text={activeTab === "history" ? "Memuat riwayat penilaian TA-03A..." : "Memuat antrean penilaian TA-03A..."}
                />
            </div>
        );
    }

    if (currentError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {activeTab === "history" ? "Riwayat TA-03A gagal dimuat" : "Antrean TA-03A gagal dimuat"}
                    </CardTitle>
                    <CardDescription>
                        {currentErrorValue instanceof Error ? currentErrorValue.message : "Terjadi kesalahan."}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                        <div className="space-y-1">
                            <CardTitle className="text-base">
                                Antrean Penilaian Pembimbing
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Antrean terbuka setelah TA-04 awal terbit, mahasiswa submit proposal final,
                                dan presensi Metopel terbaru sudah diunggah Koordinator. Pembimbing 1
                                mengisi rubrik 0-75; Pembimbing 2 memberi co-sign konsensus. Mahasiswa
                                dengan presensi &lt;75% otomatis mendapat nilai 0 (BR-28). Penilaian
                                terkunci permanen setelah submit + co-sign + TA-03B (BR-21).
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="grid gap-3 sm:grid-cols-4">
                    <StatCard label="Total dalam antrean" value={stats.total} tone="muted" />
                    <StatCard label="Perlu aksi saya" value={stats.needsAction} tone="amber" />
                    <StatCard
                        label="Menunggu rekan / TA-03B"
                        value={stats.waiting}
                        tone="blue"
                    />
                    <StatCard
                        label="Riwayat dinilai"
                        value={stats.history}
                        tone="emerald"
                    />
                </CardContent>
            </Card>

            <LocalTabsNav
                tabs={TAB_ITEMS}
                activeTab={activeTab}
                onTabChange={(value) => {
                    setActiveTab(value as TabKey);
                    setSelectedThesisId(null);
                }}
            />

            {visibleItems.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">
                            {activeTab === "history"
                                ? "Belum ada riwayat proposal yang sudah dinilai TA-03A."
                                : "Belum ada proposal yang menunggu penilaian TA-03A."}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {activeTab === "history"
                                ? "Proposal yang sudah pernah memiliki skor, co-sign, finalisasi, atau auto-zero akan tampil di sini."
                                : "Proposal akan masuk ke antrean ini setelah TA-04 awal terbit, mahasiswa bimbingan Anda submit proposal final, dan presensi Metopel terbaru tersedia."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
                    <Card className="self-start lg:sticky lg:top-4">
                        <CardHeader className="space-y-3 pb-3">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm">Antrean Proposal</CardTitle>
                                <Badge variant="outline" className="text-xs tabular-nums">
                                    {filteredQueue.length} / {visibleItems.length}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari NIM, nama, atau judul..."
                                        className="h-9 pl-8 text-sm"
                                    />
                                </div>
                                {activeTab === "active" && (
                                    <div className="space-y-1">
                                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Status
                                        </Label>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_FILTERS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pt-0">
                            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                                {filteredQueue.length === 0 ? (
                                    <p className="py-8 text-center text-xs text-muted-foreground">
                                        Tidak ada proposal yang cocok dengan filter saat ini.
                                    </p>
                                ) : (
                                    filteredQueue.map((item) => (
                                        <QueueRow
                                            key={item.thesisId}
                                            item={item}
                                            isSelected={item.thesisId === selectedThesisId}
                                            onSelect={() => setSelectedThesisId(item.thesisId)}
                                        />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {selectedItem ? (
                            <>
                                <ProposalSummaryCard item={selectedItem} />
                                <ProposalVersionHistory thesisId={selectedItem.thesisId} compact readOnly />
                                <SupervisorScoreCard
                                    thesisId={selectedItem.thesisId}
                                    scoreData={{
                                        supervisorScore: selectedItem.supervisorScore,
                                        lecturerScore: selectedItem.lecturerScore,
                                        finalScore: selectedItem.finalScore,
                                        attendanceAutoZeroedAt: selectedItem.attendanceAutoZeroedAt,
                                        attendanceAutoZeroReason: selectedItem.attendanceAutoZeroReason,
                                    }}
                                />
                            </>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center text-sm text-muted-foreground">
                                    Pilih proposal pada antrean di sebelah kiri untuk membuka rubrik
                                    TA-03A atau tombol co-sign konsensus.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function isNeedsActionStatus(status: Ta03AActionStatus): boolean {
    return status === "p1_pending" || status === "p2_pending_cosign";
}

function isWaitingStatus(status: Ta03AActionStatus): boolean {
    return status === "p1_waiting_cosign" || status === "p2_waiting_p1";
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "muted" | "amber" | "blue" | "emerald" | "destructive";
}) {
    const toneClass: Record<typeof tone, string> = {
        muted: "border-slate-200 bg-slate-50/60",
        amber: "border-amber-200 bg-amber-50/60",
        blue: "border-blue-200 bg-blue-50/60",
        emerald: "border-emerald-200 bg-emerald-50/60",
        destructive: "border-destructive/30 bg-destructive/5",
    };
    return (
        <div className={cn("rounded-md border px-3 py-2.5", toneClass[tone])}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}

const ROLE_BADGE: Record<"P1" | "P2", { label: string; className: string }> = {
    P1: {
        label: "Anda Pembimbing 1",
        className: "border-blue-300 bg-blue-50 text-blue-800",
    },
    P2: {
        label: "Anda Pembimbing 2",
        className: "border-violet-300 bg-violet-50 text-violet-800",
    },
};

const ACTION_TONE_CLASS: Record<
    "amber" | "violet" | "blue" | "emerald" | "muted" | "destructive",
    string
> = {
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    muted: "border-border bg-muted/30 text-muted-foreground",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
};

function QueueRow({
    item,
    isSelected,
    onSelect,
}: {
    item: SupervisorScoringQueueItem;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const studentName = item.student?.fullName ?? "—";
    const studentNim = item.student?.identityNumber ?? "—";
    const action = ACTION_LABELS[item.actionStatus];
    const isAutoZero = item.actionStatus === "auto_zeroed";

    return (
        <button
            type="button"
            onClick={onSelect}
            data-selected={isSelected}
            className={cn(
                "w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-all",
                isSelected
                    ? "border-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                        {toTitleCaseName(studentName)}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {studentNim}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "shrink-0 text-[10px]",
                        ACTION_TONE_CLASS[action.tone],
                    )}
                >
                    {isAutoZero ? <Ban className="mr-0.5 h-3 w-3" /> : null}
                    {action.label}
                </Badge>
            </div>

            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                {item.thesisTitle ?? "—"}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span
                    className={cn(
                        "max-w-full rounded-full border px-1.5 py-0 font-medium",
                        ROLE_BADGE[item.actorRole].className,
                    )}
                >
                    {ROLE_BADGE[item.actorRole].label}
                </span>
                <span className="flex shrink-0 items-center gap-1 tabular-nums">
                    {item.supervisorScore != null ? (
                        <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            P1: <strong className="text-foreground">{item.supervisorScore}</strong>
                        </>
                    ) : (
                        <>P1: —</>
                    )}
                </span>
            </div>
        </button>
    );
}

function ProposalSummaryCard({ item }: { item: SupervisorScoringQueueItem }) {
    const action = ACTION_LABELS[item.actionStatus];
    const isAutoZero = item.actionStatus === "auto_zeroed";

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="text-sm">Ringkasan Proposal</CardTitle>
                        <CardDescription>
                            Konteks mahasiswa, partner pembimbing, dan status aksi yang Anda perlu
                            lakukan.
                        </CardDescription>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "w-fit max-w-full",
                            ACTION_TONE_CLASS[action.tone],
                        )}
                    >
                        {isAutoZero ? <Ban className="mr-1 h-3 w-3" /> : <FileSignature className="mr-1 h-3 w-3" />}
                        {action.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        Mahasiswa
                    </p>
                    <p className="font-medium">
                        {toTitleCaseName(item.student?.fullName ?? "—")}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {item.student?.identityNumber ?? "—"}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Peran Anda · Partner
                    </p>
                    <p className="font-medium">
                        {item.actorRole === "P1" ? "Pembimbing 1 (master)" : "Pembimbing 2 (co-sign)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Partner:{" "}
                        {item.partnerName ? toTitleCaseName(item.partnerName) : "(tidak ada)"}
                    </p>
                </div>

                <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Judul Proposal</p>
                    <p className="font-medium leading-snug">{item.thesisTitle ?? "—"}</p>
                </div>

                <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Skor TA-03A (Pembimbing)</p>
                    <p className="flex flex-wrap items-baseline gap-x-1 text-base font-semibold tabular-nums">
                        {item.supervisorScore ?? "—"}{" "}
                        <span className="text-xs text-muted-foreground">/ 75</span>
                    </p>
                    {item.coSignedAt ? (
                        <p className="mt-0.5 text-[11px] text-emerald-700">Co-sign tercatat</p>
                    ) : null}
                </div>

                <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Skor TA-03B (Koordinator)</p>
                    <p className="flex flex-wrap items-baseline gap-x-1 text-base font-semibold tabular-nums">
                        {item.lecturerScore ?? "—"}{" "}
                        <span className="text-xs text-muted-foreground">/ 25</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
