import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService, type ScoreSubmissionDto } from "@/services/assessment.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList } from "lucide-react";

interface RubricGradingFormProps {
    thesisId: string;
    formCode: "TA-03A" | "TA-03B";
    studentName?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function RubricGradingForm({
    thesisId,
    formCode,
    studentName,
    onSuccess,
    onCancel,
}: RubricGradingFormProps) {
    const queryClient = useQueryClient();
    const [scores, setScores] = useState<Record<string, number>>({});

    const { data: criteria, isLoading } = useQuery({
        queryKey: ["assessment-criteria", formCode],
        queryFn: () => assessmentService.getCriteria(formCode),
    });

    const submitMutation = useMutation({
        mutationFn: (dto: ScoreSubmissionDto) => {
            if (formCode === "TA-03A") {
                return assessmentService.submitSupervisorScore(thesisId, dto);
            }
            return assessmentService.submitMetopenScore(thesisId, dto);
        },
        onSuccess: () => {
            toast.success(`Penilaian ${formCode} berhasil disimpan`);
            queryClient.invalidateQueries({ queryKey: ["metopen-grading-summary"] });
            queryClient.invalidateQueries({ queryKey: ["assessment"] });
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
        setScores((prev) => ({ ...prev, [criteriaId]: Math.min(Math.max(0, num), maxWeight) }));
    };

    const handleSubmit = () => {
        if (!criteria || criteria.length === 0) return;

        const unscored = criteria.filter((c) => scores[c.id] == null);
        if (unscored.length > 0) {
            toast.error(`Masih ada ${unscored.length} kriteria yang belum dinilai`);
            return;
        }

        const dto: ScoreSubmissionDto = {
            scores: criteria.map((c) => ({
                criteriaId: c.id,
                score: scores[c.id] ?? 0,
            })),
        };

        submitMutation.mutate(dto);
    };

    const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
    const maxPossible = criteria?.reduce((sum, c) => sum + c.maxWeight, 0) ?? 0;
    const allScored = criteria && criteria.length > 0 && criteria.every((c) => scores[c.id] != null);

    if (isLoading) {
        return (
            <Card className="min-h-[200px] flex items-center justify-center">
                <Loading size="lg" text="Memuat kriteria penilaian..." />
            </Card>
        );
    }

    if (!criteria || criteria.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">Belum ada kriteria penilaian untuk {formCode}.</p>
                    <p className="text-xs text-muted-foreground mt-1">Admin perlu menambahkan kriteria CPMK terlebih dahulu.</p>
                </CardContent>
            </Card>
        );
    }

    const formLabel = formCode === "TA-03A" ? "Penilaian Pembimbing (70%)" : "Penilaian Pengampu (30%)";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <div>
                        <CardTitle className="text-lg">{formLabel}</CardTitle>
                        <CardDescription>
                            {studentName && <span className="font-medium">{studentName} &mdash; </span>}
                            Formulir {formCode} &bull; {criteria.length} kriteria
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {criteria.map((c, idx) => (
                        <div key={c.id} className="flex items-start gap-4 p-3 border rounded-lg bg-muted/20">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        {c.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                        Maks: {c.maxWeight}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`score-${c.id}`} className="text-xs text-muted-foreground shrink-0">
                                        Skor:
                                    </Label>
                                    <Input
                                        id={`score-${c.id}`}
                                        type="number"
                                        min={0}
                                        max={c.maxWeight}
                                        value={scores[c.id] ?? ""}
                                        onChange={(e) => handleScoreChange(c.id, e.target.value, c.maxWeight)}
                                        className="w-24 h-8 text-sm"
                                        placeholder="0"
                                    />
                                    <span className="text-xs text-muted-foreground">/ {c.maxWeight}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Total Skor: </span>
                        <span className="font-bold text-lg">{totalScore}</span>
                        <span className="text-muted-foreground"> / {maxPossible}</span>
                    </div>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} disabled={submitMutation.isPending}>
                                Batal
                            </Button>
                        )}
                        <Button onClick={handleSubmit} disabled={!allScored || submitMutation.isPending}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {submitMutation.isPending ? "Menyimpan..." : "Simpan Penilaian"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
