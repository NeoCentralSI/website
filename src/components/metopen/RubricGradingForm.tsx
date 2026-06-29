import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    ClipboardList,
    Eye,
    Info,
    Lock,
    ShieldCheck,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading, Spinner } from "@/components/ui/spinner";
import { assessmentService, type RubricCriteriaItem } from "@/services/assessment.service";
import {
    TA03A_KONTEN_SUB_CRITERIA,
    findLevelByScore,
    getRubricLevelsByKind,
    getTierMeta,
    mergeOfficialWithDbRubrics,
    resolveCriteriaRubricKind,
    type MergedRubricLevel,
    type RubricLevel,
    type SubCriterion,
} from "@/lib/metopenRubric";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
// Types & helpers
// ────────────────────────────────────────────────────────────

interface RubricGradingFormProps {
    thesisId: string;
    formCode: "TA-03A" | "TA-03B";
    studentName?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    /** P1-10: Custom label tombol Submit. */
    submitButtonLabel?: string;
    /** P0-08 / BR-21: Teks konfirmasi pre-submit yang menjelaskan finalitas. */
    submitConfirmText?: string;
}

/** State per kriteria — rubricId untuk kriteria yang punya `assessmentRubrics`
 *  (record DB), atau null untuk kriteria scalar / sub-breakdown. */
type CriteriaScoreState = {
    score: number;
    rubricId?: string;
};

/** State sub-kriteria CPMK-02 (UI-only, score dijumlahkan ke parent). */
type SubScoreState = {
    score: number;
    levelTier: string;
};

function formatPercent(value?: number | null) {
    if (value == null) return "-";
    return `${(value * 100).toFixed(2)}%`;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function RubricGradingForm({
    thesisId,
    formCode,
    studentName,
    onSuccess,
    onCancel,
    submitButtonLabel,
    submitConfirmText,
}: RubricGradingFormProps) {
    const queryClient = useQueryClient();

    /** Score per criteria.id (DB-level). */
    const [scores, setScores] = useState<Record<string, CriteriaScoreState>>({});

    /** Sub-scores untuk kriteria "Konten" (CPMK-02 supervisor) — UI-only.
     *  Outer key = criteriaId DB, inner = sub key (pendahuluan dst). */
    const [subScores, setSubScores] = useState<Record<string, Record<string, SubScoreState>>>({});

    const { data: criteria, isLoading } = useQuery({
        queryKey: ["assessment-criteria", formCode],
        queryFn: () => assessmentService.getCriteria(formCode),
    });

    const {
        data: attendanceEligibility,
        isLoading: isAttendanceLoading,
        isError: isAttendanceError,
        error: attendanceError,
    } = useQuery({
        queryKey: ["assessment-attendance-eligibility", thesisId],
        queryFn: () => assessmentService.getMetopenAttendanceEligibility(thesisId),
        enabled: !!thesisId,
    });

    const submitMutation = useMutation({
        mutationFn: (criteriaScores: Array<{ criteriaId: string; rubricId?: string; score: number }>) => {
            if (formCode === "TA-03A") {
                return assessmentService.submitSupervisorScore(thesisId, { scores: criteriaScores });
            }
            return assessmentService.submitMetopenScore(thesisId, { scores: criteriaScores });
        },
        onSuccess: (result) => {
            toast.success(
                result?.isFinalized
                    ? `Penilaian ${formCode} disimpan. Nilai akhir TA-03 sudah final.`
                    : `Penilaian ${formCode} berhasil disimpan.`,
            );
            queryClient.invalidateQueries({ queryKey: ["supervisor-scoring-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-history"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-history"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-score-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-score-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-context", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["assessment-attendance-eligibility", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["metopel-seminar-eligibility"] });
            queryClient.invalidateQueries({ queryKey: ["metopel-proposal-approval"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-kadep-title-reports"] });
            queryClient.invalidateQueries({ queryKey: ["student-detail", thesisId] });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Gagal menyimpan penilaian");
        },
    });

    // Sinkronkan sub-score CPMK-02 ke parent score (UI total → submission)
    useEffect(() => {
        if (!criteria) return;
        for (const criterion of criteria) {
            const kind = resolveCriteriaRubricKind(
                criterion.name ?? criterion.metopenCpmk?.description ?? null,
                criterion.maxScore,
                criterion.metopenCpmk?.code,
            );
            if (kind !== "konten-sub") continue;

            const subState = subScores[criterion.id] ?? {};
            const subTotal = Object.values(subState).reduce((sum, s) => sum + (s?.score ?? 0), 0);
            const allFilled = TA03A_KONTEN_SUB_CRITERIA.every((sub) => subState[sub.key] != null);

            setScores((prev) => {
                const current = prev[criterion.id]?.score;
                if (allFilled) {
                    if (current === subTotal) return prev;
                    return { ...prev, [criterion.id]: { score: subTotal } };
                }
                if (current == null) return prev;
                const { [criterion.id]: _omit, ...rest } = prev;
                return rest;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subScores, criteria]);

    // ────────────────────────────────────────────
    // Handlers
    // ────────────────────────────────────────────

    const handleLevelSelect = (
        criteriaId: string,
        rubricId: string | undefined,
        score: number,
    ) => {
        setScores((prev) => ({ ...prev, [criteriaId]: { score, rubricId } }));
    };

    const handleScoreChange = (criteriaId: string, value: string, maxWeight: number) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            setScores((prev) => {
                const next = { ...prev };
                delete next[criteriaId];
                return next;
            });
            return;
        }
        setScores((prev) => ({
            ...prev,
            [criteriaId]: { score: Math.min(Math.max(0, num), maxWeight) },
        }));
    };

    const handleSubLevelSelect = (
        criteriaId: string,
        subKey: string,
        level: RubricLevel,
        score?: number,
    ) => {
        setSubScores((prev) => ({
            ...prev,
            [criteriaId]: {
                ...(prev[criteriaId] ?? {}),
                [subKey]: { score: score ?? level.maxScore, levelTier: level.tier },
            },
        }));
    };

    const validateAndBuildPayload = () => {
        if (!criteria || criteria.length === 0) return null;
        const unscored = criteria.filter((criterion) => scores[criterion.id] == null);
        if (unscored.length > 0) {
            toast.error(`Masih ada ${unscored.length} kriteria yang belum dinilai`);
            return null;
        }
        return criteria.map((criterion) => ({
            criteriaId: criterion.id,
            rubricId: scores[criterion.id]?.rubricId,
            score: scores[criterion.id]?.score ?? 0,
        }));
    };

    const handleSubmitConfirmed = () => {
        const payload = validateAndBuildPayload();
        if (!payload) return;
        submitMutation.mutate(payload);
    };

    // ────────────────────────────────────────────
    // Derived totals
    // ────────────────────────────────────────────

    const totalScore = useMemo(
        () => Object.values(scores).reduce((sum, value) => sum + value.score, 0),
        [scores],
    );
    const maxPossible = useMemo(
        () => criteria?.reduce((sum, criterion) => sum + (criterion.maxScore ?? 100), 0) ?? 0,
        [criteria],
    );
    const allScored = Boolean(
        criteria && criteria.length > 0 && criteria.every((criterion) => scores[criterion.id] != null),
    );

    // ────────────────────────────────────────────
    // Render — guard branches
    // ────────────────────────────────────────────

    if (isLoading || isAttendanceLoading) {
        return (
            <Card className="flex min-h-[200px] items-center justify-center">
                <Loading
                    size="lg"
                    text={isAttendanceLoading ? "Memeriksa presensi Metopel..." : "Memuat kriteria penilaian..."}
                />
            </Card>
        );
    }

    if (isAttendanceError) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert className="border-destructive/30">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertTitle>Gagal memeriksa presensi Metopel</AlertTitle>
                        <AlertDescription>
                            {attendanceError instanceof Error ? attendanceError.message : "Coba muat ulang halaman."}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (
        attendanceEligibility?.status === "missing_import" ||
        attendanceEligibility?.status === "not_found"
    ) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <AlertTitle className="text-amber-900">
                            Penilaian {formCode} belum dapat dibuka
                        </AlertTitle>
                        <AlertDescription className="text-amber-800">
                            {attendanceEligibility.message}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (attendanceEligibility?.status === "ineligible") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Ban className="h-4 w-4 text-destructive" />
                        Presensi Metopel kurang dari 75%
                    </CardTitle>
                    <CardDescription>
                        Nilai TA-03A dan TA-03B otomatis 0 tanpa review proposal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="border-destructive/30 bg-destructive/5">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertTitle>Mahasiswa tidak eligible untuk dinilai</AlertTitle>
                        <AlertDescription>
                            Presensi tercatat {formatPercent(attendanceEligibility.attendancePercentage)} (
                            {attendanceEligibility.presentCount ?? 0}/{attendanceEligibility.totalMeetings ?? 0}{" "}
                            pertemuan). Ambang minimal:{" "}
                            {formatPercent(attendanceEligibility.thresholdPercent)}.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!criteria || criteria.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">Belum ada kriteria penilaian untuk {formCode}.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Admin perlu menambahkan kriteria CPMK terlebih dahulu.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // ────────────────────────────────────────────
    // Render — main form
    // ────────────────────────────────────────────

    const formMeta =
        formCode === "TA-03A"
            ? {
                  title: "Penilaian Pembimbing — TA-03A",
                  subtitle: "Maksimum 75 poin (Presentasi 20 + Konten 40 + Respons 15)",
                  accent: "from-blue-500/10 to-sky-500/5",
                  border: "border-blue-200",
              }
            : {
                  title: "Penilaian Koordinator Metopen — TA-03B",
                  subtitle: "Maksimum 25 poin (Penulisan sistematis proposal)",
                  accent: "from-violet-500/10 to-fuchsia-500/5",
                  border: "border-violet-200",
              };

    return (
        <Card className={cn("overflow-hidden", formMeta.border)}>
            <CardHeader className={cn("bg-gradient-to-br pb-4", formMeta.accent)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background shadow-sm">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <CardTitle className="text-base">{formMeta.title}</CardTitle>
                            <CardDescription className="text-xs">
                                {formMeta.subtitle}
                                {studentName ? (
                                    <>
                                        {" "}
                                        · <span className="font-medium text-foreground">{studentName}</span>
                                    </>
                                ) : null}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start">
                        <Badge variant="outline" className="bg-background text-xs">
                            {criteria.length} kriteria
                        </Badge>
                    </div>
                </div>

                {attendanceEligibility?.status === "eligible" ? (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>
                            Presensi Metopel{" "}
                            <strong>{formatPercent(attendanceEligibility.attendancePercentage)}</strong> (
                            {attendanceEligibility.presentCount ?? 0}/{attendanceEligibility.totalMeetings ?? 0}{" "}
                            pertemuan) — eligible untuk dinilai.
                        </span>
                    </div>
                ) : null}
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
                <div className="space-y-4">
                    {criteria.map((criterion: RubricCriteriaItem, idx: number) => (
                        <CriterionSection
                            key={criterion.id}
                            index={idx}
                            criterion={criterion}
                            scoreState={scores[criterion.id] ?? null}
                            subScoreState={subScores[criterion.id] ?? null}
                            onLevelSelect={(rubricId, score) =>
                                handleLevelSelect(criterion.id, rubricId, score)
                            }
                            onScoreChange={(value, maxWeight) =>
                                handleScoreChange(criterion.id, value, maxWeight)
                            }
                            onSubLevelSelect={(subKey, level, score) =>
                                handleSubLevelSelect(criterion.id, subKey, level, score)
                            }
                        />
                    ))}
                </div>

                {/* Summary footer ─────────────────────── */}
                <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-5 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Total skor
                            </span>
                            <span className="text-2xl font-bold tabular-nums">{totalScore}</span>
                            <span className="text-sm text-muted-foreground">/ {maxPossible}</span>
                            <span
                                className={cn(
                                    "rounded-md px-2 py-0.5 text-[11px] font-medium",
                                    allScored
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800",
                                )}
                            >
                                {allScored ? "Siap submit" : "Belum lengkap"}
                            </span>
                        </div>

                        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
                            {onCancel ? (
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={submitMutation.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    Batal
                                </Button>
                            ) : null}

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={!allScored || submitMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {submitMutation.isPending ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                {submitButtonLabel ?? "Simpan Penilaian"}
                                            </>
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-amber-600" />
                                            Konfirmasi Penilaian {formCode}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                            <div className="space-y-3 text-sm">
                                                <div className="rounded-md border bg-muted/30 p-3">
                                                    <p className="text-xs text-muted-foreground">Total skor</p>
                                                    <p className="text-lg font-semibold">
                                                        {totalScore}{" "}
                                                        <span className="text-muted-foreground">
                                                            / {maxPossible}
                                                        </span>
                                                    </p>
                                                </div>
                                                <p>
                                                    {submitConfirmText ??
                                                        "Setelah submit + cycle penilaian lengkap, nilai akan dikunci permanen (canon §5.7.2) dan memicu antrean TA-04 ke KaDep otomatis. Pastikan rubrik sudah benar."}
                                                </p>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSubmitConfirmed}>
                                            Ya, Submit Penilaian
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

interface CriterionSectionProps {
    index: number;
    criterion: RubricCriteriaItem;
    scoreState: CriteriaScoreState | null;
    subScoreState: Record<string, SubScoreState> | null;
    onLevelSelect: (rubricId: string | undefined, score: number) => void;
    onScoreChange: (value: string, maxWeight: number) => void;
    onSubLevelSelect: (subKey: string, level: RubricLevel, score?: number) => void;
}

function CriterionSection({
    index,
    criterion,
    scoreState,
    subScoreState,
    onLevelSelect,
    onScoreChange,
    onSubLevelSelect,
}: CriterionSectionProps) {
    const maxWeight = criterion.maxScore ?? 100;
    const cpmkCode = criterion.metopenCpmk?.code ?? null;
    const cpmkDesc = criterion.metopenCpmk?.description ?? null;
    const label = criterion.name ?? cpmkDesc ?? `Kriteria ${index + 1}`;
    const kind = resolveCriteriaRubricKind(label, criterion.maxScore, cpmkCode);

    const dbRubrics = criterion.metopenAssessmentRubrics ?? [];
    const officialLevels = getRubricLevelsByKind(kind);

    // Merge: bila official levels tersedia (resmi PDF), pasangkan dengan DB
    // rubric records yang match by (minScore, maxScore). Submission menyertakan
    // rubricId yang valid bila ada match — backend validation lolos.
    const mergedLevels = officialLevels
        ? mergeOfficialWithDbRubrics(officialLevels, dbRubrics)
        : null;

    const renderHeader = (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-semibold leading-tight">{label}</p>
                    {cpmkCode ? (
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">{cpmkCode}</span>
                            {cpmkDesc ? <span className="ml-1.5">— {cpmkDesc}</span> : null}
                        </p>
                    ) : null}
                </div>
            </div>
            <Badge variant="outline" className="shrink-0 self-start text-xs">
                Maks {maxWeight}
            </Badge>
        </header>
    );

    return (
        <section className="rounded-lg border bg-card p-4 shadow-xs">
            {renderHeader}

            {/* Body — cabang per kind */}
            <div className="mt-3 space-y-3">
                {kind === "konten-sub" ? (
                    <KontenSubBreakdown
                        criterion={criterion}
                        subScoreState={subScoreState}
                        onSubLevelSelect={onSubLevelSelect}
                    />
                ) : mergedLevels ? (
                    <OfficialRubricSelector
                        merged={mergedLevels}
                        selectedScore={scoreState?.score ?? null}
                        onSelect={(merged, score) =>
                            onLevelSelect(merged.dbRubricId ?? undefined, score)
                        }
                    />
                ) : dbRubrics.length > 0 ? (
                    <DbRubricSelector
                        rubrics={dbRubrics}
                        selectedRubricId={scoreState?.rubricId ?? null}
                        selectedScore={scoreState?.score ?? null}
                        onSelect={onLevelSelect}
                    />
                ) : (
                    <ScalarInput
                        criteriaId={criterion.id}
                        maxWeight={maxWeight}
                        currentScore={scoreState?.score ?? null}
                        onChange={onScoreChange}
                    />
                )}
            </div>
        </section>
    );
}

// Variant 1: DB rubric records (existing flow — two-step: pilih level → fine-tune skor)
function DbRubricSelector({
    rubrics,
    selectedRubricId,
    selectedScore,
    onSelect,
}: {
    rubrics: NonNullable<RubricCriteriaItem["metopenAssessmentRubrics"]>;
    selectedRubricId: string | null;
    selectedScore: number | null;
    onSelect: (rubricId: string, score: number) => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
                Pilih level rubrik, lalu tentukan skor spesifik dalam range:
            </Label>
            <div className="grid gap-2">
                {rubrics.map((rubric) => {
                    const isSelected = selectedRubricId === rubric.id;
                    return (
                        <div key={rubric.id} className="space-y-0">
                            <button
                                type="button"
                                data-selected={isSelected}
                                onClick={() => onSelect(rubric.id, rubric.maxScore)}
                                className={cn(
                                    "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                                    isSelected
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                                    isSelected && rubric.minScore !== rubric.maxScore ? "rounded-b-none" : "",
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="shrink-0 text-sm font-medium tabular-nums">
                                        {rubric.minScore}–{rubric.maxScore}
                                    </span>
                                    {isSelected ? (
                                        <Badge variant="default" className="max-w-full text-[10px]">
                                            Dipilih · {selectedScore ?? rubric.maxScore}
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{rubric.description}</p>
                            </button>
                            {isSelected && rubric.minScore !== rubric.maxScore ? (
                                <div className="flex flex-col gap-2 rounded-b-lg border border-t-0 border-primary/20 bg-primary/5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                                    <input
                                        type="range"
                                        min={rubric.minScore}
                                        max={rubric.maxScore}
                                        value={selectedScore ?? rubric.maxScore}
                                        onChange={(e) =>
                                            onSelect(rubric.id, parseInt(e.target.value, 10))
                                        }
                                        className="h-2 w-full min-w-0 flex-1 cursor-pointer accent-primary"
                                    />
                                    <div className="flex items-center justify-end gap-1.5 sm:shrink-0">
                                        <Input
                                            type="number"
                                            min={rubric.minScore}
                                            max={rubric.maxScore}
                                            value={selectedScore ?? rubric.maxScore}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value, 10);
                                                if (!isNaN(v)) {
                                                    const clamped = Math.min(Math.max(v, rubric.minScore), rubric.maxScore);
                                                    onSelect(rubric.id, clamped);
                                                }
                                            }}
                                            className="h-8 w-20 text-center text-sm tabular-nums"
                                        />
                                        <span className="text-xs text-muted-foreground">/ {rubric.maxScore}</span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Variant 2: Official rubric levels (FE constants, dbRubricId attached bila DB
// punya rubric records dengan minScore+maxScore yang sama dengan PDF resmi).
// Two-step: pilih level → fine-tune skor dalam range level tersebut.
function OfficialRubricSelector({
    merged,
    selectedScore,
    onSelect,
}: {
    merged: MergedRubricLevel[];
    selectedScore: number | null;
    onSelect: (merged: MergedRubricLevel, score: number) => void;
}) {
    const levels = merged.map((m) => m.level);
    const selectedLevel =
        selectedScore != null ? findLevelByScore(levels, selectedScore) : null;
    const hasDbBacking = merged.some((m) => m.dbRubricId != null);

    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span>
                    Pilih satu level kualitas, lalu tentukan skor spesifik dalam range
                    {hasDbBacking ? " (tersinkron rubrik master)" : ""}.
                </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                {merged.map(({ level, dbRubricId }) => {
                    const isSelected = selectedLevel?.tier === level.tier;
                    const meta = getTierMeta(level.tier);
                    return (
                        <div key={level.tier} className="space-y-0">
                            <button
                                type="button"
                                data-selected={isSelected}
                                onClick={() => onSelect({ level, dbRubricId }, level.maxScore)}
                                className={cn(
                                    "group flex w-full flex-col items-stretch gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/30",
                                    "data-[selected=true]:ring-2",
                                    meta.rowClassName,
                                    isSelected ? "border-current shadow-xs" : "border-border",
                                    isSelected ? "rounded-b-none" : "",
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                                meta.chipClassName,
                                            )}
                                        >
                                            {level.label}
                                        </span>
                                        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                                            {level.minScore}–{level.maxScore}
                                        </span>
                                    </div>
                                    {isSelected ? (
                                        <Badge variant="default" className="max-w-full text-[10px]">
                                            Dipilih · {selectedScore}
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">{level.description}</p>
                            </button>
                            {isSelected && level.minScore !== level.maxScore ? (
                                <div className="flex flex-col gap-2 rounded-b-lg border border-t-0 border-current/20 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                                    <input
                                        type="range"
                                        min={level.minScore}
                                        max={level.maxScore}
                                        value={selectedScore ?? level.maxScore}
                                        onChange={(e) =>
                                            onSelect({ level, dbRubricId }, parseInt(e.target.value, 10))
                                        }
                                        className="h-2 w-full min-w-0 flex-1 cursor-pointer accent-primary"
                                    />
                                    <div className="flex items-center justify-end gap-1.5 sm:shrink-0">
                                        <Input
                                            type="number"
                                            min={level.minScore}
                                            max={level.maxScore}
                                            value={selectedScore ?? level.maxScore}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value, 10);
                                                if (!isNaN(v)) {
                                                    const clamped = Math.min(Math.max(v, level.minScore), level.maxScore);
                                                    onSelect({ level, dbRubricId }, clamped);
                                                }
                                            }}
                                            className="h-8 w-20 text-center text-sm tabular-nums"
                                        />
                                        <span className="text-xs text-muted-foreground">/ {level.maxScore}</span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Variant 3: Scalar input (kriteria tanpa rubric)
function ScalarInput({
    criteriaId,
    maxWeight,
    currentScore,
    onChange,
}: {
    criteriaId: string;
    maxWeight: number;
    currentScore: number | null;
    onChange: (value: string, maxWeight: number) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <Label
                    htmlFor={`score-${criteriaId}`}
                    className="shrink-0 text-xs text-muted-foreground"
                >
                    Skor (0–{maxWeight}):
                </Label>
                <Input
                    id={`score-${criteriaId}`}
                    type="number"
                    min={0}
                    max={maxWeight}
                    value={currentScore ?? ""}
                    onChange={(e) => onChange(e.target.value, maxWeight)}
                    className="h-9 w-28 text-sm sm:w-32"
                    placeholder="0"
                />
                <span className="text-xs text-muted-foreground">/ {maxWeight}</span>
            </div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3" />
                Kriteria ini tidak memiliki rubrik level di master DB.
            </p>
        </div>
    );
}

// Variant 4: Konten CPMK-02 — 4 sub × 0-10 → auto-aggregate ke parent (0-40)
function KontenSubBreakdown({
    criterion,
    subScoreState,
    onSubLevelSelect,
}: {
    criterion: RubricCriteriaItem;
    subScoreState: Record<string, SubScoreState> | null;
    onSubLevelSelect: (subKey: string, level: RubricLevel, score?: number) => void;
}) {
    const subState = subScoreState ?? {};
    const subTotal = Object.values(subState).reduce((sum, s) => sum + (s?.score ?? 0), 0);
    const filledCount = Object.keys(subState).length;
    const allFilled = filledCount === TA03A_KONTEN_SUB_CRITERIA.length;

    return (
        <div className="space-y-3">
            <div className="flex flex-col items-start justify-between gap-2 rounded-md border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs text-blue-900">
                    <Info className="h-3.5 w-3.5 text-blue-700" />
                    <span>
                        CPMK-02 dinilai melalui <strong>4 sub-kriteria × 0-10</strong>. Sistem akan
                        menjumlahkan otomatis menjadi skor parent maksimum <strong>40</strong>.
                    </span>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "shrink-0 text-xs tabular-nums",
                        allFilled
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-amber-300 bg-amber-50 text-amber-800",
                    )}
                >
                    {subTotal} / {criterion.maxScore ?? 40}
                </Badge>
            </div>

            <div className="grid gap-3">
                {TA03A_KONTEN_SUB_CRITERIA.map((sub, subIdx) => (
                    <SubCriterionCard
                        key={sub.key}
                        sub={sub}
                        subIdx={subIdx}
                        currentLevelTier={subState[sub.key]?.levelTier ?? null}
                        currentScore={subState[sub.key]?.score ?? null}
                        onSelect={(level, score) => onSubLevelSelect(sub.key, level, score)}
                    />
                ))}
            </div>
        </div>
    );
}

function SubCriterionCard({
    sub,
    subIdx,
    currentLevelTier,
    currentScore,
    onSelect,
}: {
    sub: SubCriterion;
    subIdx: number;
    currentLevelTier: string | null;
    currentScore: number | null;
    onSelect: (level: RubricLevel, score?: number) => void;
}) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-2">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{sub.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sub.helper}</p>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "shrink-0 self-start text-xs tabular-nums",
                        currentScore != null
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "text-muted-foreground",
                    )}
                >
                    {currentScore != null ? `${currentScore} / ${sub.maxScore}` : `0 / ${sub.maxScore}`}
                </Badge>
            </div>

            <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label={`Sub-kriteria ${subIdx + 1}`}>
                {sub.levels.map((level) => {
                    const isSelected = currentLevelTier === level.tier;
                    const meta = getTierMeta(level.tier);
                    return (
                        <div key={level.tier} className="flex flex-col">
                            <button
                                type="button"
                                data-selected={isSelected}
                                onClick={() => onSelect(level)}
                                className={cn(
                                    "flex h-full flex-col gap-1 rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-background",
                                    "data-[selected=true]:ring-2",
                                    meta.rowClassName,
                                    isSelected ? "border-current bg-card shadow-xs" : "border-border bg-card/60",
                                    isSelected && level.minScore !== level.maxScore ? "rounded-b-none" : "",
                                )}
                                title={level.description}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <span
                                        className={cn(
                                            "shrink-0 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                                            meta.chipClassName,
                                        )}
                                    >
                                        {level.label}
                                    </span>
                                    <span className="shrink-0 text-[11px] font-semibold tabular-nums">
                                        {level.minScore}–{level.maxScore}
                                    </span>
                                </div>
                                <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                                    {level.description}
                                </p>
                            </button>
                            {isSelected && level.minScore !== level.maxScore ? (
                                <div className="flex items-center gap-2 rounded-b-md border border-t-0 border-current/20 bg-muted/40 px-2 py-1.5">
                                    <input
                                        type="range"
                                        min={level.minScore}
                                        max={level.maxScore}
                                        value={currentScore ?? level.maxScore}
                                        onChange={(e) =>
                                            onSelect(level, parseInt(e.target.value, 10))
                                        }
                                        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                                    />
                                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-primary">
                                        {currentScore ?? level.maxScore}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
