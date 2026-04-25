import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createCplStudentScore,
    deleteCplStudentScore,
    exportCplStudentScores,
    getCplStudentOptions,
    getCplStudents,
    importCplStudentScores,
    updateCplStudentScore,
    type CplStudentImportResult,
    type CplStudentScoreStatus,
} from '@/services/master-data/cpl.service';

interface UseCplStudentsFilters {
    search?: string;
    source?: 'SIA' | 'MANUAL';
    status?: CplStudentScoreStatus;
}

export function useCplStudents(cplId: string) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<UseCplStudentsFilters>({});
    const [optionSearch, setOptionSearch] = useState('');

    const queryKey = useMemo(() => ['cpl-students', cplId], [cplId]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...queryKey, filters],
        queryFn: () => getCplStudents(cplId, filters),
        enabled: Boolean(cplId),
    });

    const { data: optionsData } = useQuery({
        queryKey: [...queryKey, 'options', optionSearch],
        queryFn: () => getCplStudentOptions(cplId, optionSearch),
        enabled: Boolean(cplId),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey });

    const createMutation = useMutation({
        mutationFn: (payload: { studentId: string; score: number; status?: string }) => createCplStudentScore(cplId, payload),
        onSuccess: () => {
            invalidate();
            toast.success('Nilai CPL mahasiswa berhasil ditambahkan');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ studentId, score, status }: { studentId: string; score: number; status?: string }) =>
            updateCplStudentScore(cplId, studentId, { score, status }),
        onSuccess: () => {
            invalidate();
            toast.success('Nilai CPL mahasiswa berhasil diubah');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (studentId: string) => deleteCplStudentScore(cplId, studentId),
        onSuccess: () => {
            invalidate();
            toast.success('Nilai CPL mahasiswa berhasil dihapus');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const importMutation = useMutation({
        mutationFn: (file: File) => importCplStudentScores(cplId, file),
        onSuccess: (result: CplStudentImportResult) => {
            invalidate();
            if (result.failedCount === 0) {
                toast.success(`Import berhasil (${result.successCount}/${result.totalRows})`);
            } else {
                toast.warning(
                    `Import selesai: ${result.successCount} sukses, ${result.failedCount} gagal`
                );
            }
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const exportMutation = useMutation({
        mutationFn: () => exportCplStudentScores(cplId),
        onSuccess: () => toast.success('Export nilai CPL berhasil diunduh'),
        onError: (error: Error) => toast.error(error.message),
    });

    const studentOptions = useMemo(() => {
        return (optionsData ?? []).map((student) => ({
            value: student.id,
            label: `${student.fullName ?? '-'} (${student.identityNumber ?? '-'})`,
        }));
    }, [optionsData]);

    return {
        cpl: data?.cpl ?? null,
        data: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        isFetching,
        refetch,
        filters,
        setFilters,
        optionSearch,
        setOptionSearch,
        studentOptions,
        createScore: (payload: { studentId: string; score: number; status?: string }) => createMutation.mutateAsync(payload),
        updateScore: (studentId: string, score: number, status?: string) => updateMutation.mutateAsync({ studentId, score, status }),
        deleteScore: (studentId: string) => deleteMutation.mutate(studentId),
        importScores: (file: File) => importMutation.mutateAsync(file),
        exportScores: () => exportMutation.mutateAsync(),
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isImporting: importMutation.isPending,
        isExporting: exportMutation.isPending,
        importResult: importMutation.data ?? null,
    };
}
