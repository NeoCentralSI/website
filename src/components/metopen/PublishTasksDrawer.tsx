import { useState, useMemo, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Info,
    Rocket,
    Shield,
    Users,
    BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { usePublishMetopenTasks, useGetEligibleStudents } from '@/hooks/metopen/useMetopen';
import type { MetopenTemplate } from '@/types/metopen.types';

interface PublishTasksDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: MetopenTemplate | null;
}

export function PublishTasksDrawer({ open, onOpenChange, template }: PublishTasksDrawerProps) {
    const { data: eligibleStudents = [], isLoading: isLoadingStudents } = useGetEligibleStudents();

    // Extract unique classes
    const availableClasses = useMemo(() => {
        const classes = new Set<string>();
        eligibleStudents.forEach(s => {
            if (s.className) classes.add(s.className);
        });
        return Array.from(classes).sort();
    }, [eligibleStudents]);

    const [selectedClass, setSelectedClass] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');

    const publishMutation = usePublishMetopenTasks();

    // Reset when opened
    useEffect(() => {
        if (open && template) {
            if (availableClasses.length > 0 && !selectedClass) {
                setSelectedClass(availableClasses[0]);
            }
            const dueDays = template.defaultDueDays ?? 14;
            setDeadline(format(addDays(new Date(), dueDays), 'yyyy-MM-dd'));
        }
    }, [open, template, availableClasses, selectedClass]);

    const selectedStudentsCount = useMemo(() => {
        return eligibleStudents.filter(s => s.className === selectedClass).length;
    }, [eligibleStudents, selectedClass]);

    const handlePublish = () => {
        if (!template || !selectedClass || !deadline) return;

        const studentIdsToPublish = eligibleStudents
            .filter(s => s.className === selectedClass)
            .map(s => s.studentId);

        publishMutation.mutate(
            {
                templateIds: [template.id],
                studentIds: studentIdsToPublish,
                templateDeadlines: { [template.id]: new Date(deadline).toISOString() }
            },
            {
                onSuccess: () => {
                    setTimeout(() => onOpenChange(false), 1500);
                },
            }
        );
    };

    const isConfigValid = !!template && !!selectedClass && !!deadline && selectedStudentsCount > 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-[480px] w-full flex flex-col p-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-1 bg-muted/10">
                    <SheetTitle className="font-heading text-lg font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Assign Template
                    </SheetTitle>
                    <SheetDescription className="font-body text-[13px]">
                        Pilih kelas dan atur deadline untuk template ini.
                    </SheetDescription>
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Template Info Card */}
                    {template && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <p className="font-heading text-[15px] font-bold text-foreground">
                                    {template.name}
                                </p>
                                {template.isGateToAdvisorSearch && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold shrink-0">
                                        <Shield className="w-2.5 h-2.5" />
                                        Gate
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="font-semibold text-foreground">{template.weightPercentage ?? 0}%</span> Bobot
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-4 h-4 text-muted-foreground/70" />
                                    Default <span className="font-semibold text-foreground">+{template.defaultDueDays ?? 14}</span> hari
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="space-y-4">
                        {/* Pilih Kelas Dropdown */}
                        <div className="space-y-2">
                            <label className="font-body text-[12px] font-bold text-foreground uppercase tracking-wider block">
                                Pilih Kelas
                            </label>
                            {isLoadingStudents ? (
                                <div className="h-10 rounded-md border flex items-center px-3 bg-muted/50">
                                    <Spinner className="w-4 h-4 mr-2" />
                                    <span className="text-sm text-muted-foreground">Memuat kelas...</span>
                                </div>
                            ) : availableClasses.length === 0 ? (
                                <div className="h-10 rounded-md border border-dashed flex items-center px-3 bg-muted/20">
                                    <span className="text-sm text-muted-foreground">Belum ada kelas mahasiswa metopel.</span>
                                </div>
                            ) : (
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full text-[14px]">
                                        <SelectValue placeholder="Pilih kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableClasses.map(cls => (
                                            <SelectItem key={cls} value={cls}>
                                                {cls}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Selected Class Info */}
                        <motion.div
                            initial={false}
                            animate={{ opacity: selectedClass ? 1 : 0.5, height: 'auto' }}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white"
                        >
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="font-body text-[13px] font-semibold text-foreground">
                                    Mahasiswa Eligible
                                </p>
                                <p className="font-body text-[12px] text-muted-foreground">
                                    {selectedStudentsCount} mahasiswa di {selectedClass || 'kelas ini'}
                                </p>
                            </div>
                        </motion.div>

                        {/* Tanggal Deadline */}
                        <div className="space-y-2 pt-2">
                            <label className="font-body text-[12px] font-bold text-foreground uppercase tracking-wider block">
                                Tanggal Deadline untuk Kelas Ini
                            </label>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-primary shrink-0" />
                                <DatePicker
                                    value={deadline ? new Date(deadline) : undefined}
                                    onChange={(date) => setDeadline(date ? date.toISOString().split('T')[0] : '')}
                                    className="w-full"
                                />
                            </div>
                            {deadline && (
                                <p className="font-body text-xs text-muted-foreground pl-8">
                                    Akan jatuh tempo pada <span className="font-semibold text-foreground">{format(parseISO(deadline), 'd MMM yyyy', { locale: localeId })}</span>
                                </p>
                            )}
                        </div>

                        {/* Info Banner */}
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 flex items-start gap-3 mt-4">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="font-body text-[12px] text-blue-700 leading-relaxed">
                                Mahasiswa di kelas ini yang sudah pernah di-assign template ini otomatis dilewati.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <SheetFooter className="px-6 py-4 border-t border-border bg-white">
                    {publishMutation.isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-body text-sm font-semibold"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Berhasil Assign!
                        </motion.div>
                    ) : (
                        <Button
                            onClick={handlePublish}
                            disabled={!isConfigValid || publishMutation.isPending}
                            className="w-full h-11 gap-2 font-body text-sm font-semibold"
                        >
                            {publishMutation.isPending ? (
                                <>
                                    <Spinner className="h-4 w-4" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-4 h-4" />
                                    {selectedStudentsCount > 0
                                        ? `Assign ke ${selectedStudentsCount} Mahasiswa`
                                        : 'Pilih Kelas Terlebih Dahulu'}
                                </>
                            )}
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
