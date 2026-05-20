import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, BookOpen, GraduationCap, Copy, Pencil } from 'lucide-react';
import {
    getGuidanceQuestions,
    getGuidanceCriteria,
    copyInternshipGuidance,
} from '@/services/internship';
import { getAcademicYearsAPI } from '@/services/admin.service';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { DuplicateDataDialog } from './DuplicateDataDialog';
import { ManageWeekPanel } from './ManageWeekPanel';

export function GuidanceMasterPanel() {
    const [searchParams, setSearchParams] = useSearchParams();
    const academicYearId = searchParams.get('academicYearId') || 'all';
    
    // Read week from URL search params
    const activeWeekStr = searchParams.get('week');
    const activeWeek = activeWeekStr ? parseInt(activeWeekStr) : null;

    const updateParams = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    const setAcademicYearId = (id: string) => updateParams({ academicYearId: id });

    // Load Academic Years
    const { data: ayData } = useQuery({
        queryKey: ['academic-years-all'],
        queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
    });
    const academicYears = ayData?.academicYears || [];

    // Automatically select active academic year on load if none selected
    useEffect(() => {
        if (academicYears.length > 0 && academicYearId === 'all') {
            const active = academicYears.find(ay => ay.isActive);
            if (active) setAcademicYearId(active.id);
        }
    }, [academicYears, academicYearId]);

    // Queries for questions and criteria (to show count on week list)
    const { data: questions = [], isLoading: loadingQuestions } = useQuery({
        queryKey: ['guidance-questions', academicYearId],
        queryFn: () => getGuidanceQuestions(academicYearId),
    });

    const { data: criteria = [], isLoading: loadingCriteria } = useQuery({
        queryKey: ['guidance-criteria', academicYearId],
        queryFn: () => getGuidanceCriteria(academicYearId),
    });

    const qc = useQueryClient();
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [addWeekDialogOpen, setAddWeekDialogOpen] = useState(false);
    const [newWeekInput, setNewWeekInput] = useState<number>(1);

    // Compute unique week numbers based on existing questions and criteria
    const weeks = useMemo(() => {
        const weekSet = new Set<number>();
        questions.forEach(q => weekSet.add(q.weekNumber));
        criteria.forEach(c => weekSet.add(c.weekNumber));
        return Array.from(weekSet).sort((a, b) => a - b);
    }, [questions, criteria]);

    // Handle adding a new week (opens input dialog)
    const handleAddWeek = () => {
        const maxWeek = weeks.length > 0 ? Math.max(...weeks) : 8;
        setNewWeekInput(maxWeek + 1);
        setAddWeekDialogOpen(true);
    };

    const handleConfirmAddWeek = (e: React.FormEvent) => {
        e.preventDefault();
        if (newWeekInput <= 0) {
            toast.error("Nomor minggu harus lebih besar dari 0");
            return;
        }
        setAddWeekDialogOpen(false);
        updateParams({ week: String(newWeekInput) });
    };

    const isLoading = loadingQuestions || loadingCriteria;

    const weekTableData = useMemo(() => {
        return weeks.map(weekNum => ({
            weekNumber: weekNum,
            questionsCount: questions.filter(q => q.weekNumber === weekNum).length,
            criteriaCount: criteria.filter(c => c.weekNumber === weekNum).length,
        }));
    }, [weeks, questions, criteria]);

    const columns: Column<typeof weekTableData[0]>[] = useMemo(() => [
        {
            key: 'index',
            header: '#',
            width: 60,
            render: (_, index) => <span className="text-muted-foreground font-medium">{index + 1}</span>,
        },
        {
            key: 'weekNumber',
            header: 'Minggu',
            render: (row) => <span className="font-bold text-slate-800">Minggu {row.weekNumber}</span>,
        },
        {
            key: 'questionsCount',
            header: 'Pertanyaan Mahasiswa',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{row.questionsCount} Pertanyaan</span>
                </div>
            ),
        },
        {
            key: 'criteriaCount',
            header: 'Kriteria Penilaian Dosen',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{row.criteriaCount} Kriteria</span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 120,
            render: (row) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-semibold gap-1 hover:text-primary"
                    onClick={() => updateParams({ week: String(row.weekNumber) })}
                >
                    <Pencil className="size-3.5" />
                </Button>
            ),
        },
    ], [weeks, questions, criteria]);

    return (
        <div className="space-y-6">
            {activeWeek !== null ? (
                // WEEK DETAIL/CONFIG VIEW
                <ManageWeekPanel 
                    academicYearId={academicYearId}
                    activeWeek={activeWeek}
                    onBack={() => updateParams({ week: undefined })}
                />
            ) : (
                // WEEK LIST VIEW
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-800">Daftar Minggu Bimbingan</h2>
                            <p className="text-xs text-muted-foreground">
                                Kelola struktur bimbingan mingguan mahasiswa dan kriteria penilaian dosen pembimbing.
                            </p>
                        </div>
                    </div>

                    <InternshipTable
                        columns={columns as any}
                        data={weekTableData}
                        loading={isLoading}
                        total={weekTableData.length}
                        page={1}
                        pageSize={weekTableData.length || 10}
                        onPageChange={() => {}}
                        hidePagination={true}
                        emptyText="Belum ada data minggu bimbingan."
                        actions={
                            <div className="flex items-center gap-2">
                                <Select value={academicYearId} onValueChange={setAcademicYearId}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="Pilih Tahun Ajaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                        {academicYears.map((ay) => (
                                            <SelectItem key={ay.id} value={ay.id}>
                                                <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                                    {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                                    onClick={() => setDuplicateDialogOpen(true)}
                                    disabled={academicYearId === 'all'}
                                >
                                    <Copy className="size-4 text-primary" />
                                    <span>Duplikat</span>
                                </Button>
                                <Button size="sm" onClick={handleAddWeek} className="h-9 gap-1">
                                    <Plus className="size-4" />
                                    Tambah Minggu
                                </Button>
                            </div>
                        }
                    />
                </div>
            )}

            {/* Duplicate Dialog */}
            <DuplicateDataDialog
                open={duplicateDialogOpen}
                onOpenChange={setDuplicateDialogOpen}
                onDuplicate={async (fromId) => {
                    await copyInternshipGuidance(fromId, academicYearId);
                    qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
                    qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
                }}
                academicYears={academicYears}
                currentYearId={academicYearId}
                title="Duplikat Data Bimbingan"
                description="Salin semua pertanyaan mahasiswa dan kriteria penilaian dosen dari tahun ajaran lain ke tahun ajaran terpilih saat ini."
                targetName="bimbingan"
            />

            {/* Add Week Dialog */}
            <Dialog open={addWeekDialogOpen} onOpenChange={setAddWeekDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Minggu Bimbingan</DialogTitle>
                        <DialogDescription>
                            Tentukan nomor minggu bimbingan baru yang ingin dikonfigurasi.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConfirmAddWeek}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="newWeekNumber" className="font-semibold text-slate-700">Nomor Minggu</Label>
                                <Input
                                    id="newWeekNumber"
                                    type="number"
                                    min={1}
                                    value={newWeekInput}
                                    onChange={(e) => setNewWeekInput(parseInt(e.target.value) || 0)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddWeekDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit">
                                Lanjut
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default GuidanceMasterPanel;
