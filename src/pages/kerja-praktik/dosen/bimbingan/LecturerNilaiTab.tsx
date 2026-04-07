import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInternshipAssessment, submitLecturerAssessment } from '@/services/internship.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, GraduationCap, CheckCircle2, AlertCircle, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    score: number;
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
        mutationFn: (scores: ScoreEntry[]) => submitLecturerAssessment(internshipId!, scores.map(s => ({
            chosenRubricId: s.chosenRubricId,
            score: s.score
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
        // Re-calculate initial state from cached data
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
    const canEdit = !isCompleted && isEditing;

    const handleSelectRubric = (cpmkId: string, rubric: Rubric) => {
        if (!canEdit) return;
        
        setSelectedScores(prev => {
            const current = prev[cpmkId];
            // If selecting same rubric, don't change score unless it was out of range
            let newScore = current?.score || rubric.minScore;
            if (newScore < rubric.minScore || newScore > rubric.maxScore) {
                newScore = Math.floor((rubric.minScore + rubric.maxScore) / 2);
            }

            return {
                ...prev,
                [cpmkId]: {
                    cpmkId,
                    chosenRubricId: rubric.id,
                    score: newScore
                }
            };
        });
        setIsDirty(true);
    };


    const handleScoreChange = (cpmkId: string, value: string) => {
        if (!canEdit) return;
        
        const numValue = parseFloat(value);

        if (isNaN(numValue) && value !== '') return;

        setSelectedScores(prev => {
            const current = prev[cpmkId];
            if (!current) return prev;
            
            const currentRubric = lecturerCpmks
                .find(c => c.id === cpmkId)
                ?.rubrics.find(r => r.id === current.chosenRubricId);

            let score = isNaN(numValue) ? 0 : numValue;
            
            // Limit to max score immediately
            if (currentRubric && score > currentRubric.maxScore) {
                score = currentRubric.maxScore;
            }

            return {
                ...prev,
                [cpmkId]: { ...current, score }
            }
        });
        setIsDirty(true);
    };

    const handleScoreBlur = (cpmkId: string) => {
        if (!canEdit) return;
        
        setSelectedScores(prev => {
            const current = prev[cpmkId];
            if (!current) return prev;
            
            const currentRubric = lecturerCpmks
                .find(c => c.id === cpmkId)
                ?.rubrics.find(r => r.id === current.chosenRubricId);

            if (currentRubric) {
                let score = current.score;
                if (score < currentRubric.minScore) score = currentRubric.minScore;
                if (score > currentRubric.maxScore) score = currentRubric.maxScore;
                
                return {
                    ...prev,
                    [cpmkId]: { ...current, score }
                };
            }
            return prev;
        });
    };


    const calculateCurrentTotal = () => {
        let totalScore = 0;

        // Sum existing lecturer scores from state
        Object.values(selectedScores).forEach(s => {
            const cpmk = cpmks.find(c => c.id === s.cpmkId);
            if (cpmk) {
                totalScore += (s.score * cpmk.weight / 100);
            }
        });

        // Sum field scores from data (read-only)
        assessmentData?.data?.fieldScores?.forEach((fs: any) => {
            const cpmk = cpmks.find(c => c.rubrics.some(r => r.id === fs.chosenRubricId));
            if (cpmk) {
                totalScore += (fs.score * cpmk.weight / 100);
            }
        });

        return totalScore;
    };

    const currentTotal = calculateCurrentTotal();
    
    // Grade Mapping helper
    const getGrade = (score: number) => {
        if (score >= 85) return "A";
        if (score >= 80) return "A-";
        if (score >= 75) return "B+";
        if (score >= 70) return "B";
        if (score >= 65) return "B-";
        if (score >= 60) return "C+";
        if (score >= 55) return "C";
        if (score >= 40) return "D";
        return "E";
    };

    const onSave = () => {
        const scoresToSubmit = Object.values(selectedScores);
        if (scoresToSubmit.length < lecturerCpmks.length) {
            toast.warning('Beberapa kriteria belum dinilai');
        }
        mutation.mutate(scoresToSubmit);
    };

    return (
        <div className="space-y-6 pb-20 -m-6 p-6 bg-gray-50/50 min-h-[calc(100vh-200px)]">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Penilaian Kerja Praktik
                        </h2>
                        {isCompleted && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Selesai
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                        Berikan penilaian berdasarkan rubrik CPMK yang tersedia.
                    </p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Estimasi Nilai Akhir</p>
                        <div className="flex items-center gap-3 justify-end">
                            <span className="text-3xl font-black text-primary">{currentTotal.toFixed(2)}</span>
                            <Badge variant="outline" className="text-lg bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                {getGrade(currentTotal)}
                            </Badge>
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="border-l pl-6 flex flex-col gap-2">
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} size="sm">
                                    Edit Penilaian
                                </Button>
                            ) : (
                                <Button onClick={resetEditing} variant="outline" size="sm">
                                    Batal
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {/* Lecturer Assessment Sections */}
            <div className="space-y-8">
                {lecturerCpmks.map((cpmk, index) => (
                    <div key={cpmk.id} className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{cpmk.name}</h3>
                                <Badge variant="secondary" className="mt-1 font-mono text-[10px] uppercase tracking-tighter">
                                    {cpmk.code} • Bobot: {cpmk.weight}%
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                            {cpmk.rubrics.map((rubric) => {
                                const isSelected = selectedScores[cpmk.id]?.chosenRubricId === rubric.id;
                                return (
                                    <motion.div
                                        key={rubric.id}
                                        onClick={() => handleSelectRubric(cpmk.id, rubric)}
                                        className={cn(
                                            "flex flex-col h-full p-5 rounded-xl border-2 cursor-pointer",
                                            isSelected 
                                                ? "bg-primary/5 border-primary ring-2 ring-primary/5" 
                                                : "bg-white border border-gray-200 hover:border-primary/80",
                                            isCompleted && "cursor-default opacity-80"
                                        )}


                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                isSelected ? "text-primary font-black" : "text-gray-400"
                                            )}>
                                                {rubric.levelName}
                                            </span>
                                            {isSelected && (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div 
                                            className="text-[12px] leading-relaxed text-gray-600 mb-4 flex-1 prose-sm [&>ol]:list-decimal [&>ul]:list-disc [&>ol]:ml-4 [&>ul]:ml-4 [&>li]:pl-1"
                                            dangerouslySetInnerHTML={{ __html: rubric.rubricLevelDescription }}
                                        />

                                        <div className={cn(
                                            "mt-auto pt-3 border-t text-center text-xs font-bold",
                                            isSelected ? "border-primary/20 text-primary" : "border-gray-200 text-gray-400"
                                        )}>
                                            Range: {rubric.minScore} - {rubric.maxScore}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {selectedScores[cpmk.id] && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 flex items-center justify-end gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10"
                                >
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`score-${cpmk.id}`} className="text-sm font-bold text-primary">
                                            Skor Kriteria:
                                        </Label>
                                        <div className="relative w-24">
                                            {(() => {
                                                const currentRubric = cpmk.rubrics.find(r => r.id === selectedScores[cpmk.id]?.chosenRubricId);
                                                const isInvalid = currentRubric && (selectedScores[cpmk.id].score < currentRubric.minScore || selectedScores[cpmk.id].score > currentRubric.maxScore);

                                                return (
                                                    <Input
                                                        id={`score-${cpmk.id}`}
                                                        type="number"
                                                        disabled={isCompleted}
                                                        value={selectedScores[cpmk.id]?.score}
                                                        onChange={(e) => handleScoreChange(cpmk.id, e.target.value)}
                                                        onBlur={() => handleScoreBlur(cpmk.id)}
                                                        className={cn(
                                                            "bg-white font-bold text-center pr-2 transition-colors",
                                                            isInvalid ? "border-destructive ring-1 ring-destructive/20 text-destructive" : "border-primary/30"
                                                        )}
                                                        min={currentRubric?.minScore}
                                                        max={currentRubric?.maxScore}
                                                    />
                                                );
                                            })()}
                                        </div>

                                    </div>
                                    
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                                                    <Info className="h-4 w-4 text-primary" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs text-xs">
                                                <p>Input skor harus berada di rentang yang dipilih. Angka ini akan dikalikan dengan bobot kriteria ({cpmk.weight}%) untuk perhitungan nilai akhir.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <div className="text-right ml-4 border-l border-primary/20 pl-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Kontribusi Nilai</p>
                                        <p className="text-lg font-black text-primary">
                                            {(selectedScores[cpmk.id].score * cpmk.weight / 100).toFixed(2)}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Field Assessment (Read Only Info) */}
            {fieldCpmks.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-600">Penilaian Pembimbing Lapangan</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fieldCpmks.map(cpmk => {
                            const scoreData = assessmentData?.data?.fieldScores?.find((fs: any) => 
                                cpmk.rubrics.some(r => r.id === fs.chosenRubricId)
                            );

                            return (
                                <Card key={cpmk.id} className="bg-gray-50/50 border-gray-200">
                                    <CardHeader className="py-4 px-5">
                                        <CardTitle className="text-sm font-bold text-gray-700">{cpmk.name}</CardTitle>
                                        <CardDescription className="text-[10px]">Bobot: {cpmk.weight}%</CardDescription>
                                    </CardHeader>
                                    <CardContent className="py-4 px-5 pt-0">
                                        {scoreData ? (
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Sudah Dinilai
                                                </Badge>
                                                <span className="text-xl font-bold text-gray-900">{scoreData.score.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between opacity-50">
                                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                                                    Belum Tersedia
                                                </Badge>
                                                <span className="text-xl font-bold text-gray-300">-</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Save Button Sticky */}
            {isEditing && (

                <div className="fixed bottom-8 right-8 z-50">
                    <Button 
                        size="lg" 
                        onClick={onSave}
                        disabled={!isDirty || mutation.isPending}
                        className={cn(
                            "shadow-2xl shadow-primary/40 px-8 py-6 rounded-full transition-all flex items-center gap-3",
                            !isDirty ? "scale-90 opacity-0 pointer-events-none" : "scale-100"
                        )}
                    >
                        {mutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        <span className="font-bold text-lg">Simpan Penilaian</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
