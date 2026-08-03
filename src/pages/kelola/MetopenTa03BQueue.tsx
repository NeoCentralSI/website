import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    GraduationCap,
    Search,
    UserCircle2,
} from "lucide-react";

import { MetopenAttendanceUploadCard } from "@/components/metopen/MetopenAttendanceUploadCard";
import { MetricAction } from "@/components/metopen/MetricAction";
import { ResearchMethodScoreReadOnly } from "@/components/metopen/ResearchMethodScoreReadOnly";
import { RubricGradingForm } from "@/components/metopen/RubricGradingForm";
import { ProposalVersionHistory } from "@/components/thesis/ProposalVersionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Loading, Spinner } from "@/components/ui/spinner";
import { LocalTabsNav, type LocalTabItem } from "@/components/ui/tabs-nav";
import EmptyState from "@/components/ui/empty-state";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { assessmentService, type ScoringQueueItem } from "@/services/assessment.service";
import { useActiveAcademicYear } from "@/hooks/shared/useActiveAcademicYear";
import { toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";

const METOPEN_TA03B_QUEUE_KEY = ["assessment-metopen-queue"];
const METOPEN_TA03B_HISTORY_KEY = ["assessment-metopen-history"];
const METOPEN_SCORE_DETAIL_KEY = (thesisId?: string | null) => [
    "assessment-metopen-score-detail",
    thesisId,
];

type TabKey = "active" | "history";
type StatusFilter = "all" | "pending" | "auto_zeroed";

const TAB_ITEMS: LocalTabItem[] = [
    { value: "active", label: "Antrean Aktif" },
    { value: "history", label: "Riwayat Dinilai" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Semua proposal" },
    { value: "pending", label: "Menunggu dinilai" },
    { value: "auto_zeroed", label: "Nilai otomatis 0 presensi <75%" },
];

export default function MetopenTa03BQueue() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab: TabKey = searchParams.get("tab") === "history" ? "history" : "active";
    const statusParam = searchParams.get("status");
    const statusFilter: StatusFilter = STATUS_FILTERS.some((item) => item.value === statusParam)
        ? (statusParam as StatusFilter)
        : "pending";
    const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const { academicYear } = useActiveAcademicYear();

    const updateView = (tab: TabKey, status: StatusFilter = "all") => {
        const next = new URLSearchParams(searchParams);
        next.set("tab", tab);
        next.set("status", status);
        setSearchParams(next, { replace: true });
        setSelectedThesisId(null);
    };

    useEffect(() => {
        setBreadcrumbs([
            { label: "Metode Penelitian", href: "/kelola/metopen" },
            { label: "Penilaian TA-03B" },
        ]);
        setTitle("Penilaian Proposal TA-03B");
    }, [setBreadcrumbs, setTitle]);

    const {
        data: queue = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: [...METOPEN_TA03B_QUEUE_KEY, academicYear?.id],
        queryFn: () => assessmentService.getMetopenScoringQueue(academicYear!.id),
        enabled: Boolean(academicYear?.id),
    });

    const {
        data: history = [],
        isLoading: isHistoryLoading,
        isError: isHistoryError,
        error: historyError,
    } = useQuery({
        queryKey: [...METOPEN_TA03B_HISTORY_KEY, academicYear?.id],
        queryFn: () => assessmentService.getMetopenScoringHistory(academicYear!.id),
        enabled: Boolean(academicYear?.id),
        refetchInterval: 30_000,
    });

    const visibleItems: ScoringQueueItem[] = activeTab === "history" ? history : queue;
    const currentLoading = activeTab === "history" ? isHistoryLoading : isLoading;
    const currentError = activeTab === "history" ? isHistoryError : isError;
    const currentErrorValue = activeTab === "history" ? historyError : error;

    const downloadMutation = useMutation({
        mutationFn: () => {
            if (!academicYear?.id) throw new Error("Periode akademik aktif belum tersedia");
            return assessmentService.downloadMetopenScoresXlsx(academicYear.id);
        },
        onSuccess: () => {
            toast.success("Rekap nilai TA-03 sedang diunduh.");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Gagal mengunduh rekap nilai TA-03");
        },
    });

    const filteredQueue = useMemo(() => {
        const q = search.trim().toLowerCase();
        return visibleItems.filter((item) => {
            if (activeTab === "active" && statusFilter === "pending" && item.isScored) return false;
            if (
                activeTab === "history" &&
                statusFilter === "auto_zeroed" &&
                !("attendanceAutoZeroedAt" in item && item.attendanceAutoZeroedAt)
            ) return false;
            if (q) {
                const matches =
                    item.studentName.toLowerCase().includes(q) ||
                    item.studentNim.toLowerCase().includes(q) ||
                    item.proposedTitle.toLowerCase().includes(q);
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
        if (!selectedThesisId || !filteredQueue.some((item) => item.thesisId === selectedThesisId)) {
            setSelectedThesisId(filteredQueue[0].thesisId);
        }
    }, [filteredQueue, selectedThesisId, visibleItems.length]);

    const selectedItem =
        visibleItems.find((item) => item.thesisId === selectedThesisId) ?? null;

    const shouldLoadScoreDetail = Boolean(
        selectedItem?.thesisId && (activeTab === "history" || selectedItem.isScored),
    );

    const {
        data: selectedScoreDetail,
        isLoading: isScoreDetailLoading,
        isError: isScoreDetailError,
        error: scoreDetailError,
    } = useQuery({
        queryKey: METOPEN_SCORE_DETAIL_KEY(selectedItem?.thesisId),
        queryFn: () => assessmentService.getMetopenScoreDetail(selectedItem!.thesisId),
        enabled: shouldLoadScoreDetail,
    });

    const stats = useMemo(() => {
        const total = queue.length;
        const pending = queue.filter((item) => !item.isScored).length;
        const autoZeroed = history.filter((item) => item.attendanceAutoZeroedAt).length;
        return { total, pending, autoZeroed, history: history.length };
    }, [history, queue]);

    if (currentLoading) {
        return (
            <div className="py-12">
                <Loading
                    size="lg"
                    text={activeTab === "history" ? "Memuat riwayat penilaian TA-03B..." : "Memuat antrean penilaian TA-03B..."}
                />
            </div>
        );
    }

    if (currentError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeTab === "history" ? "Riwayat TA-03B gagal dimuat" : "Antrean TA-03B gagal dimuat"}
                    </CardTitle>
                    <CardDescription>
                        {currentErrorValue instanceof Error ? currentErrorValue.message : "Terjadi kesalahan."}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-base font-semibold tracking-tight sm:text-lg">Penilaian Proposal TA-03B</h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Antrean Koordinator untuk rubrik TA-03B. Penilaian berjalan
                        paralel setelah TA-04 awal terbit dan proposal final tersedia.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start border-violet-300 bg-background text-violet-800 hover:bg-violet-100"
                    onClick={() => downloadMutation.mutate()}
                    disabled={downloadMutation.isPending || !academicYear?.id}
                    title="Unduh rekap nilai TA-03A + TA-03B kelas Metopel terbaru dalam format SIA."
                >
                    {downloadMutation.isPending ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Unduh nilai TA-03 (Excel)
                        </>
                    )}
                </Button>
            </div>

            {/* Hero card ─────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                        <div className="space-y-1">
                            <CardTitle className="text-base">Ringkasan Antrean TA-03B</CardTitle>
                            <CardDescription className="text-xs">
                                Form manual memeriksa presensi Metopel terbaru sebelum submit.
                                Setelah dinilai, proposal pindah ke riwayat read-only dengan detail
                                rubrik dan versi proposal.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricAction
                        label="Total proposal di antrean"
                        value={stats.total}
                        active={activeTab === "active" && statusFilter === "all"}
                        onClick={() => updateView("active", "all")}
                    />
                    <MetricAction
                        label="Siap dinilai"
                        value={stats.pending}
                        tone="violet"
                        active={activeTab === "active" && statusFilter === "pending"}
                        onClick={() => updateView("active", "pending")}
                    />
                    <MetricAction
                        label="Nilai otomatis 0 presensi"
                        value={isHistoryLoading ? "—" : stats.autoZeroed}
                        tone="rose"
                        active={activeTab === "history" && statusFilter === "auto_zeroed"}
                        onClick={() => updateView("history", "auto_zeroed")}
                    />
                    <MetricAction
                        label="Riwayat dinilai"
                        value={isHistoryLoading ? "—" : stats.history}
                        tone="emerald"
                        active={activeTab === "history" && statusFilter === "all"}
                        onClick={() => updateView("history", "all")}
                    />
                </CardContent>
            </Card>

            <MetopenAttendanceUploadCard />

            <LocalTabsNav
                tabs={TAB_ITEMS}
                activeTab={activeTab}
                onTabChange={(value) => {
                    const tab = value as TabKey;
                    updateView(tab, tab === "active" ? "pending" : "all");
                }}
            />

            {/* Two-pane layout ───────────────────────────── */}
            {visibleItems.length === 0 ? (
                <EmptyState
                    size="sm"
                    title={
                        activeTab === "history"
                            ? "Belum ada riwayat proposal yang sudah dinilai TA-03B."
                            : "Belum ada proposal yang menunggu penilaian TA-03B."
                    }
                    description={
                        activeTab === "history"
                            ? "Proposal yang sudah memiliki skor Koordinator atau nilai otomatis 0 presensi akan tampil di sini."
                            : "Antrean ini hanya terbuka setelah KaDep memfinalisasi batch TA-04 awal (SK PDF) dan mahasiswa submit proposal final. Jika proposal sudah final tetapi belum muncul, pastikan status mahasiswa sudah 'TA-04 terbit, booking' di halaman KaDep. Jika presensi Metopel belum tersedia atau kurang dari 75%, form penilaian akan diblokir otomatis."
                    }
                />
            ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
                    {/* Queue panel ─────────────── */}
                    <Card className="self-start lg:sticky lg:top-4">
                        <CardHeader className="space-y-3 pb-3">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm">
                                    {activeTab === "history" ? "Riwayat Proposal" : "Antrean Proposal"}
                                </CardTitle>
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
                                {(activeTab === "active" || statusFilter === "auto_zeroed") && (
                                    <div className="space-y-1">
                                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Status
                                        </Label>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={(v) => {
                                                const nextStatus = v as StatusFilter;
                                                updateView(nextStatus === "auto_zeroed" ? "history" : activeTab, nextStatus);
                                            }}
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

                    {/* Detail panel ───────────────── */}
                    <div className="space-y-4">
                        {selectedItem ? (
                            <>
                                <ProposalSummaryCard item={selectedItem} />
                                <ProposalVersionHistory thesisId={selectedItem.thesisId} compact readOnly />
                                {selectedItem.isScored ? (
                                    <MetopenScoreDetailPanel
                                        score={selectedScoreDetail}
                                        isLoading={isScoreDetailLoading}
                                        isError={isScoreDetailError}
                                        error={scoreDetailError}
                                    />
                                ) : (
                                    <RubricGradingForm
                                        thesisId={selectedItem.thesisId}
                                        formCode="TA-03B"
                                        studentName={toTitleCaseName(selectedItem.studentName)}
                                        onSuccess={() => {
                                            queryClient.invalidateQueries({
                                                queryKey: METOPEN_TA03B_QUEUE_KEY,
                                            });
                                            queryClient.invalidateQueries({
                                                queryKey: METOPEN_TA03B_HISTORY_KEY,
                                            });
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <Card>
                                <CardContent className="py-8">
                                    <EmptyState
                                        size="sm"
                                        title="Belum ada proposal dipilih"
                                        description="Pilih proposal pada antrean di sebelah kiri untuk mulai mengisi rubrik TA-03B."
                                    />
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
// Sub-components
// ────────────────────────────────────────────────────────────

function QueueRow({
    item,
    isSelected,
    onSelect,
}: {
    item: ScoringQueueItem;
    isSelected: boolean;
    onSelect: () => void;
}) {
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
                        {toTitleCaseName(item.studentName)}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {item.studentNim}
                    </p>
                </div>
                {item.isScored ? (
                    <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                    >
                        <CheckCircle2 className="mr-0.5 h-3 w-3" />
                        Dinilai
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="shrink-0 border-amber-300 bg-amber-50 text-[10px] text-amber-800"
                    >
                        Menunggu
                    </Badge>
                )}
            </div>

            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{item.proposedTitle}</p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    TA-03A:{" "}
                    <strong className="text-foreground tabular-nums">
                        {item.supervisorScore ?? "—"}
                    </strong>
                </span>
                <span className="flex items-center gap-1">
                    TA-03B:{" "}
                    <strong className="text-foreground tabular-nums">
                        {item.existingScore ?? "—"}
                    </strong>
                </span>
            </div>
        </button>
    );
}

function ProposalSummaryCard({ item }: { item: ScoringQueueItem }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="text-sm">Ringkasan Proposal</CardTitle>
                        <CardDescription>
                            Konteks mahasiswa dan nilai TA-03A yang sudah masuk (jika ada).
                        </CardDescription>
                    </div>
                    {item.isScored ? (
                            <Badge variant="outline" className="w-fit max-w-full border-emerald-300 bg-emerald-50 text-emerald-800">
                                TA-03B sudah dinilai
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="w-fit max-w-full border-amber-300 bg-amber-50 text-amber-800">
                                Menunggu rubrik
                            </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        Mahasiswa
                    </p>
                    <p className="font-medium">{toTitleCaseName(item.studentName)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.studentNim}</p>
                </div>

                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Pembimbing 1
                    </p>
                    <p className="font-medium">
                        {item.supervisorName ? toTitleCaseName(item.supervisorName) : "—"}
                    </p>
                </div>

                <div className="sm:col-span-2 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Judul Proposal
                    </p>
                    <p className="font-medium leading-snug">{item.proposedTitle}</p>
                </div>

                <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Nilai TA-03A (Pembimbing)</p>
                    <p className="text-base font-semibold tabular-nums">
                        {item.supervisorScore ?? "—"}
                    </p>
                </div>

                <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Nilai TA-03B (Anda)</p>
                    <p className="text-base font-semibold tabular-nums">
                        {item.existingScore ?? "—"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function MetopenScoreDetailPanel({
    score,
    isLoading,
    isError,
    error,
}: {
    score: Awaited<ReturnType<typeof assessmentService.getMetopenScoreDetail>> | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
}) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-10">
                    <Loading text="Memuat detail rubrik TA-03B..." />
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Detail penilaian gagal dimuat</CardTitle>
                    <CardDescription>
                        {error instanceof Error ? error.message : "Terjadi kesalahan saat memuat detail rubrik."}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <ResearchMethodScoreReadOnly
            score={score}
            title="Detail Riwayat Penilaian TA-03"
            description="Nilai TA-03A/TA-03B dan descriptor rubrik tersimpan dalam mode read-only; koreksi tidak dilakukan dari halaman antrean."
            emptyText="Detail rubrik untuk proposal ini belum tersedia."
        />
    );
}
