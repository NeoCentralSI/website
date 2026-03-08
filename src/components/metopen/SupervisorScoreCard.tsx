import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, CheckCircle2 } from "lucide-react";
import { useInputSupervisorScore } from "@/hooks/metopen/useMetopenGrading";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

interface ComponentProps {
    thesisId: string;
    scoreData?: StudentDetail["researchMethodScore"];
}

export function SupervisorScoreCard({ thesisId, scoreData }: ComponentProps) {
    const [score, setScore] = useState<number | ''>('');
    const mutateScore = useInputSupervisorScore();

    useEffect(() => {
        if (scoreData?.supervisorScore != null) {
            setScore(scoreData.supervisorScore);
        }
    }, [scoreData]);

    const handleSubmit = () => {
        if (score === '') return;
        mutateScore.mutate({ thesisId, score: Number(score) });
    };

    return (
        <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-base text-indigo-900">Evaluasi Metodologi Penelitian</CardTitle>
                </div>
                <CardDescription>
                    Berikan nilai akhir (0-100) untuk evaluasi metodologi penelitian mahasiswa ini berdasarkan progress bimbingan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="supervisorScore" className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Nilai Bimbingan</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="supervisorScore"
                                type="number"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-24 bg-white font-medium"
                                placeholder="0-100"
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={score === '' || Number(score) < 0 || Number(score) > 100 || mutateScore.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {mutateScore.isPending ? "Menyimpan..." : "Simpan Nilai"}
                            </Button>
                            {scoreData?.supervisorScore != null && score === scoreData.supervisorScore && (
                                <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" /> Tersimpan
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
