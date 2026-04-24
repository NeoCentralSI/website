import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    createStudentCplScore,
    deleteStudentCplScore,
    exportStudentCplScores,
    getStudentCplScores,
    importStudentCplScores,
    updateStudentCplScore,
    type CreateStudentCplScorePayload,
    type StudentCplImportResult,
    type StudentCplScoreFilters,
    type UpdateStudentCplScorePayload,
} from "@/services/master-data/student-cpl-score.service";

const QUERY_KEY = ["student-cpl-scores"];

export function useStudentCplScore() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<StudentCplScoreFilters>({});

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...QUERY_KEY, filters],
        queryFn: () => getStudentCplScores(filters),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

    const createMutation = useMutation({
        mutationFn: (payload: CreateStudentCplScorePayload) => createStudentCplScore(payload),
        onSuccess: () => {
            invalidate();
            toast.success("Nilai CPL manual berhasil ditambahkan");
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            studentId,
            cplId,
            payload,
        }: {
            studentId: string;
            cplId: string;
            payload: UpdateStudentCplScorePayload;
        }) => updateStudentCplScore(studentId, cplId, payload),
        onSuccess: () => {
            invalidate();
            toast.success("Nilai CPL manual berhasil diubah");
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ studentId, cplId }: { studentId: string; cplId: string }) =>
            deleteStudentCplScore(studentId, cplId),
        onSuccess: () => {
            invalidate();
            toast.success("Nilai CPL manual berhasil dihapus");
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const importMutation = useMutation({
        mutationFn: (file: File) => importStudentCplScores(file),
        onSuccess: (result: StudentCplImportResult) => {
            invalidate();
            if (result.failed === 0) {
                toast.success(`Import berhasil (${result.success}/${result.total})`);
            } else {
                toast.warning(`Import selesai: ${result.success} sukses, ${result.failed} gagal`);
            }
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const exportMutation = useMutation({
        mutationFn: exportStudentCplScores,
        onSuccess: () => toast.success("Export berhasil diunduh"),
        onError: (error: Error) => toast.error(error.message),
    });

    const studentOptions = useMemo(() => {
        const map = new Map<string, { id: string; label: string }>();
        for (const row of data?.data ?? []) {
            if (!map.has(row.studentId)) {
                map.set(row.studentId, {
                    id: row.studentId,
                    label: `${row.student?.identityNumber ?? "-"} - ${row.student?.fullName ?? row.studentId}`,
                });
            }
        }
        return Array.from(map.values());
    }, [data?.data]);

    const cplOptions = useMemo(() => {
        const map = new Map<string, { id: string; label: string }>();
        for (const row of data?.data ?? []) {
            if (!map.has(row.cplId)) {
                map.set(row.cplId, {
                    id: row.cplId,
                    label: `${row.cpl?.code ?? "-"} - ${row.cpl?.description ?? row.cplId}`,
                });
            }
        }
        return Array.from(map.values());
    }, [data?.data]);

    return {
        data: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        isFetching,
        refetch,
        filters,
        setFilters,
        studentOptions,
        cplOptions,
        createScore: (payload: CreateStudentCplScorePayload) => createMutation.mutateAsync(payload),
        updateScore: (studentId: string, cplId: string, payload: UpdateStudentCplScorePayload) =>
            updateMutation.mutateAsync({ studentId, cplId, payload }),
        deleteScore: (studentId: string, cplId: string) => deleteMutation.mutate({ studentId, cplId }),
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
