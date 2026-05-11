import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInternshipAssessment, submitLecturerAssessment } from '@/services/internship';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import InternshipTable from '@/components/internship/InternshipTable';
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
    const internshipData = assessmentData?.data?.internship;
    const isCompleted = internshipData?.status === 'COMPLETED' || internshipData?.lecturerAssessmentStatus === 'COMPLETED';

    const calculateCurrentTotal = () => {
        let totalScore = 0;
        Object.values(selectedScores).forEach(s => {
            const cpmk = cpmks.find(c => c.id === s.cpmkId);
            if (cpmk && s.score !== undefined) {
                totalScore += (s.score * cpmk.weight / 100);
            }
        });

        return totalScore;
    };

    const currentTotal = calculateCurrentTotal();

    const TotalRow = (
        <div className="bg-slate-50/50 border-t border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div>
                    <p className="font-bold uppercase tracking-tight text-slate-500 text-[11px]">Total Nilai</p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-center sm:text-right">
                    <div className="flex items-baseline gap-2 justify-center sm:justify-end">
                        <span className="text-2xl font-black text-slate-900 leading-none">{currentTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

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
                                        "text-xs font-bold uppercase tracking-tight py-1 px-2 rounded-md inline-block",
                                        isSelected ? "bg-amber-100 text-amber-700" : ""
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
                                                isSelected ? "text-slate-900 font-semibold" : ""
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
                                        "text-xs py-1 tabular-nums bg-slate-100/50 rounded-full px-3",
                                        isSelected ? "bg-amber-100 text-amber-700" : ""
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
                                            className="text-center font-bold text-xs tabular-nums border-slate-200 focus:border-primary focus:ring-primary/20 rounded-lg bg-white shadow-none"
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
                    className="rounded-2xl border-slate-200 overflow-hidden"
                    appendRow={TotalRow}
                    actions={
                        <div className="flex items-center gap-2">
                            {!isCompleted && (
                                <>
                                    {!isEditing ? (
                                        <Button onClick={() => setIsEditing(true)} size="sm" className="font-bold h-9">
                                            Edit Penilaian
                                        </Button>
                                    ) : (
                                        <>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        size="sm" 
                                                        disabled={!isDirty || mutation.isPending}
                                                        className="gap-2 font-bold h-9 px-4"
                                                    >
                                                        {mutation.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                        Simpan Nilai
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Konfirmasi Penilaian</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Apakah Anda yakin ingin menyimpan penilaian ini? 
                                                            Setelah disimpan, nilai <span className="font-bold text-slate-900">tidak akan bisa diubah lagi</span>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={onSave} className="bg-primary text-white hover:bg-primary/90">
                                                            Ya, Simpan
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <Button onClick={resetEditing} variant="ghost" size="sm" className="font-bold h-9 text-slate-500 hover:text-red-500 hover:bg-red-50">
                                                Batal
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    }
                    rowProps={(row) => ({
                        className: cn(
                            "transition-colors",
                            selectedScores[row.cpmkId]?.chosenRubricId === row.id ? "bg-primary/[0.03]" : "bg-white"
                        )
                    })}
                />
        </div>
    );
}
