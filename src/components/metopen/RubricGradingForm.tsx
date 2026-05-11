import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService, type RubricCriteriaItem } from "@/services/assessment.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading, Spinner } from "@/components/ui/spinner";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList } from "lucide-react";

interface RubricGradingFormProps {
    thesisId: string;
    formCode: "TA-03A" | "TA-03B";
    studentName?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    /** P1-10: Custom label tombol Submit (mis. "Submit Penilaian (atas konsensus dengan P2)"). */
    submitButtonLabel?: string;
    /** P0-08 / BR-21: Teks konfirmasi pre-submit yang menjelaskan finalitas. */
    submitConfirmText?: string;
}

type SelectedScore = {
    score: number;
    rubricId?: string;
};

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
    const [scores, setScores] = useState<Record<string, SelectedScore>>({});

    const { data: criteria, isLoading } = useQuery({
        queryKey: ["assessment-criteria", formCode],
        queryFn: () => assessmentService.getCriteria(formCode),
    });

    const submitMutation = useMutation({
        mutationFn: (criteriaScores: Array<{ criteriaId: string; rubricId?: string; score: number }>) => {
            if (formCode === "TA-03A") {
                return assessmentService.submitSupervisorScore(thesisId, {
                    scores: criteriaScores,
                });
            }
            return assessmentService.submitMetopenScore(thesisId, {
                scores: criteriaScores,
            });
        },
        onSuccess: (result) => {
            toast.success(
                result?.isFinalized
                    ? `Penilaian ${formCode} berhasil disimpan dan nilai akhir TA-03 sudah final`
                    : `Penilaian ${formCode} berhasil disimpan`
            );
            queryClient.invalidateQueries({ queryKey: ["supervisor-scoring-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-score-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-context", thesisId] });
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

    const handleRubricSelect = (criteriaId: string, rubricId: string, score: number) => {
        setScores((prev) => ({
            ...prev,
            [criteriaId]: { score, rubricId },
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

    const totalScore = Object.values(scores).reduce((sum, value) => sum + value.score, 0);
    const maxPossible = criteria?.reduce((sum, criterion) => sum + (criterion.maxScore ?? 100), 0) ?? 0;
    const allScored = criteria && criteria.length > 0 && criteria.every((criterion) => scores[criterion.id] != null);

    if (isLoading) {
        return (
            <Card className="flex min-h-[200px] items-center justify-center">
                <Loading size="lg" text="Memuat kriteria penilaian..." />
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

    const formLabel =
        formCode === "TA-03A"
            ? "Penilaian Pembimbing TA-03A (maks 75 poin)"
            : "Penilaian Koordinator Metopen TA-03B (maks 25 poin)";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-lg">{formLabel}</CardTitle>
                        <CardDescription>
                            {studentName ? <span className="font-medium">{studentName} - </span> : null}
                            Formulir {formCode} - {criteria.length} kriteria
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {criteria.map((criterion: RubricCriteriaItem, idx: number) => {
                        const maxWeight = criterion.maxScore ?? 100;
                        const label = criterion.name ?? criterion.cpmk?.description ?? `Kriteria ${idx + 1}`;
                        const hasRubrics = (criterion.assessmentRubrics?.length ?? 0) > 0;

                        return (
                            <div
                                key={criterion.id}
                                className="flex items-start gap-4 rounded-lg border bg-muted/20 p-3"
                            >
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium">{label}</p>
                                            {criterion.cpmk?.code ? (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {criterion.cpmk.code}
                                                </p>
                                            ) : null}
                                        </div>
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                            Maks: {maxWeight}
                                        </Badge>
                                    </div>

                                    {hasRubrics ? (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Pilih rubrik:
                                            </Label>
                                            <div className="grid gap-2">
                                                {criterion.assessmentRubrics.map((rubric) => {
                                                    const isSelected = scores[criterion.id]?.rubricId === rubric.id;

                                                    return (
                                                        <button
                                                            key={rubric.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleRubricSelect(
                                                                    criterion.id,
                                                                    rubric.id,
                                                                    rubric.maxScore
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-lg border px-3 py-2 text-left transition-colors",
                                                                isSelected
                                                                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                                                    : "border-border hover:border-primary/40 hover:bg-background"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-medium">
                                                                    {rubric.minScore}-{rubric.maxScore}
                                                                </span>
                                                                {isSelected ? (
                                                                    <Badge variant="default" className="text-[10px]">
                                                                        Dipilih
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {rubric.description}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor={`score-${criterion.id}`}
                                                className="shrink-0 text-xs text-muted-foreground"
                                            >
                                                Skor:
                                            </Label>
                                            <Input
                                                id={`score-${criterion.id}`}
                                                type="number"
                                                min={0}
                                                max={maxWeight}
                                                value={scores[criterion.id]?.score ?? ""}
                                                onChange={(e) =>
                                                    handleScoreChange(
                                                        criterion.id,
                                                        e.target.value,
                                                        maxWeight
                                                    )
                                                }
                                                className="h-8 w-24 text-sm"
                                                placeholder="0"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                / {maxWeight}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Total Skor: </span>
                        <span className="text-lg font-bold">{totalScore}</span>
                        <span className="text-muted-foreground"> / {maxPossible}</span>
                    </div>
                    <div className="flex gap-2">
                        {onCancel ? (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={submitMutation.isPending}
                            >
                                Batal
                            </Button>
                        ) : null}
                        {/* P0-08 / BR-21: Dialog konfirmasi pre-submit menjelaskan finalitas
                            agar Pembimbing 1 / Koordinator sadar konsekuensi sebelum submit. */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={!allScored || submitMutation.isPending}>
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
                                    <AlertDialogTitle>Konfirmasi Penilaian {formCode}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Total skor: <strong>{totalScore} / {maxPossible}</strong>
                                        <br />
                                        <br />
                                        {submitConfirmText ??
                                            "Setelah submit + cycle penilaian lengkap, nilai akan dikunci permanen (canon §5.7.2) dan memicu antrean TA-04 ke KaDep otomatis. Pastikan rubrik sudah benar."}
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
            </CardContent>
        </Card>
    );
}
