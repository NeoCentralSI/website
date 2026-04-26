import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInternshipAssessment, submitLecturerAssessment } from '@/services/internship';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, GraduationCap, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import InternshipTable from '@/components/internship/InternshipTable';

interface Rubric {
    id: string;
    levelName: string;
    rubricLevelDescription: string;
    minScore: number;
    maxScore: number;
}

interface Cpmk {
    id: string;
    code: string;
    name: string;
    weight: number;
    assessorType: 'LECTURER' | 'FIELD';
    rubrics: Rubric[];
}

interface ScoreEntry {
    cpmkId: string;
    chosenRubricId: string;
    score: number | undefined;
}

export default function LecturerNilaiTab() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const queryClient = useQueryClient();
    const [selectedScores, setSelectedScores] = useState<Record<string, ScoreEntry>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data: assessmentData, isLoading, error } = useQuery({
        queryKey: ['internship-assessment', internshipId],
        queryFn: () => getInternshipAssessment(internshipId!),
        enabled: !!internshipId,
    });

    useEffect(() => {
        if (assessmentData?.data?.lecturerScores) {
            const initialScores: Record<string, ScoreEntry> = {};
            assessmentData.data.lecturerScores.forEach((s: any) => {
                const cpmk = assessmentData.data.cpmks.find((c: any) => 
                    c.rubrics.some((r: any) => r.id === s.chosenRubricId)
                );
                if (cpmk) {
                    initialScores[cpmk.id] = {
                        cpmkId: cpmk.id,
                        chosenRubricId: s.chosenRubricId,
                        score: s.score
                    };
                }
            });
            setSelectedScores(initialScores);
        }
    }, [assessmentData]);

    const mutation = useMutation({
        mutationFn: (scores: ScoreEntry[]) => submitLecturerAssessment(internshipId!, scores.filter(s => s.score !== undefined).map(s => ({
            chosenRubricId: s.chosenRubricId,
            score: s.score!
        }))),
        onSuccess: () => {
            toast.success('Nilai berhasil disimpan');
            queryClient.invalidateQueries({ queryKey: ['internship-assessment', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            setIsDirty(false);
            setIsEditing(false);
        },
        onError: (err: any) => {
            toast.error(err.message || 'Gagal menyimpan nilai');
        }
    });

    const resetEditing = () => {
        if (assessmentData?.data?.lecturerScores) {
            const initialScores: Record<string, ScoreEntry> = {};
            assessmentData.data.lecturerScores.forEach((s: any) => {
                const cpmk = assessmentData.data.cpmks.find((c: any) => 
                    c.rubrics.some((r: any) => r.id === s.chosenRubricId)
                );
                if (cpmk) {
                    initialScores[cpmk.id] = {
                        cpmkId: cpmk.id,
                        chosenRubricId: s.chosenRubricId,
                        score: s.score
                    };
                }
            });
            setSelectedScores(initialScores);
        }
        setIsDirty(false);
        setIsEditing(false);
    }

    const handleScoreChange = (cpmkId: string, val: string) => {
        if (!isEditing) return;
        
        const rawScore = val === "" ? undefined : parseFloat(val);
        const cpmk = assessmentData?.data?.cpmks.find((c: any) => c.id === cpmkId);
        
        if (!cpmk) return;

        const matchingRubric = cpmk.rubrics.find((r: any) => rawScore !== undefined && rawScore >= r.minScore && rawScore <= r.maxScore);
        
        setSelectedScores(prev => ({
            ...prev,
            [cpmkId]: { 
                cpmkId,
                chosenRubricId: matchingRubric?.id || "", 
                score: rawScore 
            }
        }));
        setIsDirty(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-destructive gap-2">
                <AlertCircle className="h-8 w-8" />
                <p>Gagal memuat data penilaian.</p>
            </div>
        );
    }

    const cpmks: Cpmk[] = assessmentData?.data?.cpmks || [];
    const lecturerCpmks = cpmks.filter(c => c.assessorType === 'LECTURER');
    const fieldCpmks = cpmks.filter(c => c.assessorType === 'FIELD');
    const internshipStatus = assessmentData?.data?.internship?.status;
    const isCompleted = internshipStatus === 'COMPLETED';

    const calculateCurrentTotal = () => {
        let totalScore = 0;
        Object.values(selectedScores).forEach(s => {
            const cpmk = cpmks.find(c => c.id === s.cpmkId);
            if (cpmk && s.score !== undefined) {
                totalScore += (s.score * cpmk.weight / 100);
            }
        });

        assessmentData?.data?.fieldScores?.forEach((fs: any) => {
            const cpmk = cpmks.find(c => c.rubrics.some(r => r.id === fs.chosenRubricId));
            if (cpmk) {
                totalScore += (fs.score * cpmk.weight / 100);
            }
        });

        return totalScore;
    };

    const currentTotal = calculateCurrentTotal();
    
    const getGrade = (score: number) => {
        if (score >= 80) return "A";
        if (score >= 75) return "A-";
        if (score >= 70) return "B+";
        if (score >= 65) return "B";
        if (score >= 60) return "B-";
        if (score >= 55) return "C+";
        if (score >= 50) return "C";
        if (score >= 45) return "D";
        return "E";
    };

    const onSave = () => {
        const scoresToSubmit = Object.values(selectedScores);
        const validScores = scoresToSubmit.filter(s => s.score !== undefined && s.chosenRubricId !== "");
        if (validScores.length < lecturerCpmks.length) {
            toast.warning('Beberapa kriteria belum dinilai atau nilai di luar rentang');
            return;
        }
        mutation.mutate(scoresToSubmit);
    };

    const flattenedRubrics = lecturerCpmks.flatMap((cpmk, cpmkIdx) => 
        cpmk.rubrics.map((rubric, rubricIdx) => ({
            ...rubric,
            cpmkName: cpmk.name,
            cpmkId: cpmk.id,
            cpmkCode: cpmk.code,
            cpmkNo: cpmkIdx + 1,
            isFirst: rubricIdx === 0,
            rubricCount: cpmk.rubrics.length
        }))
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-none">
                                Penilaian Kerja Praktik
                            </h2>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                Berikan penilaian berdasarkan rubrik CPMK yang tersedia.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nilai Akhir (Estimasi)</p>
                        <div className="flex items-center gap-3 justify-end mt-0.5">
                            <span className="text-3xl font-black text-slate-900">{currentTotal.toFixed(2)}</span>
                            <Badge variant="outline" className="text-sm font-bold bg-primary/5 text-primary border-primary/20 px-2 py-0.5 rounded-lg">
                                {getGrade(currentTotal)}
                            </Badge>
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="border-l border-slate-100 pl-6">
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} size="sm" className="font-bold">
                                    Edit Penilaian
                                </Button>
                            ) : (
                                <Button onClick={resetEditing} variant="ghost" size="sm" className="font-bold text-slate-500 hover:text-red-500 hover:bg-red-50">
                                    Batal
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Penilaian Dosen</h3>
                </div>

                <InternshipTable
                    columns={[
                        {
                            key: 'no',
                            header: 'No',
                            className: 'w-12 text-center',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => <span className="text-xs font-bold text-slate-400">{row.cpmkNo}</span>
                        },
                        {
                            key: 'cpmk',
                            header: 'Kriteria Penilaian',
                            className: 'w-[15%]',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => (
                                <div className="flex flex-col gap-1 py-1">
                                    <span className="font-bold text-slate-900 text-xs leading-tight">{row.cpmkName}</span>
                                    <span className="text-[10px] font-bold text-primary uppercase">{row.cpmkCode}</span>
                                </div>
                            )
                        },
                        {
                            key: 'level',
                            header: 'Nama Level',
                            className: 'w-[12%]',
                            render: (row) => {
                                const isSelected = selectedScores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className={cn(
                                        "text-[10px] font-black uppercase tracking-tight py-1 px-2 rounded-md inline-block transition-colors",
                                        isSelected ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400"
                                    )}>
                                        {row.levelName}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'description',
                            header: 'Kriteria & Poin Penilaian',
                            render: (row) => {
                                const isSelected = selectedScores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className="py-2 flex items-start gap-2">
                                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 animate-in zoom-in duration-300" />}
                                        <div 
                                            className={cn(
                                                "text-xs leading-relaxed prose prose-slate prose-xs max-w-none transition-all", 
                                                isSelected ? "text-slate-900 font-semibold" : "text-slate-600"
                                            )}
                                            dangerouslySetInnerHTML={{ __html: row.rubricLevelDescription || "" }}
                                        />
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'range',
                            header: 'Range Skor',
                            className: 'w-24 text-center',
                            render: (row) => {
                                const isSelected = selectedScores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className={cn(
                                        "text-[10px] py-1 tabular-nums transition-colors rounded-full px-3 font-bold",
                                        isSelected ? "bg-primary/10 text-primary" : "bg-slate-100/50 text-slate-400"
                                    )}>
                                        {row.minScore} - {row.maxScore}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'score',
                            header: 'Nilai',
                            className: 'w-32 text-center',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => {
                                const cpmk = lecturerCpmks.find(c => c.id === row.cpmkId);
                                if (!cpmk) return null;
                                const min = Math.min(...cpmk.rubrics.map(r => r.minScore));
                                const max = Math.max(...cpmk.rubrics.map(r => r.maxScore));
                                
                                return (
                                    <div className="flex flex-col items-center gap-2 py-1">
                                        <Input
                                            type="number"
                                            min={min}
                                            max={max}
                                            placeholder={`${min}-${max}`}
                                            className="h-9 w-20 text-center font-bold text-xs tabular-nums border-slate-200 focus:border-primary focus:ring-primary/20 rounded-lg bg-white shadow-none"
                                            value={selectedScores[row.cpmkId]?.score ?? ""}
                                            onChange={(e) => handleScoreChange(row.cpmkId, e.target.value)}
                                            disabled={!isEditing || isCompleted}
                                        />
                                        {selectedScores[row.cpmkId]?.score !== undefined && selectedScores[row.cpmkId].chosenRubricId === "" && (
                                            <span className="text-[9px] font-bold text-red-500 uppercase animate-pulse">Luar Rentang</span>
                                        )}
                                    </div>
                                );
                            }
                        }
                    ]}
                    data={flattenedRubrics}
                    total={flattenedRubrics.length}
                    page={1}
                    pageSize={flattenedRubrics.length}
                    onPageChange={() => {}}
                    hidePagination={true}
                    rowKey={(row) => row.id}
                    className="rounded-2xl border-slate-200 overflow-hidden shadow-sm"
                    rowProps={(row) => ({
                        className: cn(
                            "transition-colors",
                            selectedScores[row.cpmkId]?.chosenRubricId === row.id ? "bg-primary/[0.03]" : "bg-white"
                        )
                    })}
                />

                {isEditing && (
                    <div className="flex justify-end pt-2">
                        <Button 
                            size="sm" 
                            onClick={onSave}
                            disabled={!isDirty || mutation.isPending}
                            className="gap-2 font-bold px-6 shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Simpan Penilaian
                        </Button>
                    </div>
                )}
            </div>

            {/* Field Assessment (Read Only Info) */}
            {fieldCpmks.length > 0 && (
                <div className="mt-12 pt-10 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Penilaian Pembimbing Lapangan</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fieldCpmks.map(cpmk => {
                            const scoreData = assessmentData?.data?.fieldScores?.find((fs: any) => 
                                cpmk.rubrics.some(r => r.id === fs.chosenRubricId)
                            );

                            return (
                                <Card key={cpmk.id} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                                    <CardHeader className="py-5 px-6 bg-slate-50/50 border-b border-slate-100">
                                        <CardTitle className="text-sm font-bold text-slate-800 leading-tight">{cpmk.name}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase">Bobot: {cpmk.weight}%</CardDescription>
                                    </CardHeader>
                                    <CardContent className="py-6 px-6">
                                        {scoreData ? (
                                            <div className="flex items-end justify-between">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-lg">
                                                    TERVERIFIKASI
                                                </Badge>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Skor</p>
                                                    <p className="text-3xl font-black text-slate-900 leading-none">{scoreData.score.toFixed(1)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between opacity-50">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-bold text-[10px] px-2 py-0.5 rounded-lg">
                                                    BELUM TERSEDIA
                                                </Badge>
                                                <span className="text-2xl font-black text-slate-300">-</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
