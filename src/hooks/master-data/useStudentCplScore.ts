import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    createStudentCplScore,
    deleteStudentCplScore,
    exportStudentCplScores,
    getStudentCplScoreOptions,
    getStudentCplScores,
    importStudentCplScores,
    parseStudentCplImportFile,
    updateStudentCplScore,
    type CreateStudentCplScorePayload,
    type StudentCplImportResult,
    type StudentCplScoreFilters,
    type UpdateStudentCplScorePayload,
} from "@/services/master-data/student-cpl-score.service";

const QUERY_KEY = ["student-cpl-scores"];

export function useStudentCplScore() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<StudentCplScoreFilters>({
        source: "MANUAL",
        status: "finalized",
    });

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...QUERY_KEY, filters],
        queryFn: () => getStudentCplScores(filters),
    });
    const { data: allScoresData } = useQuery({
        queryKey: [...QUERY_KEY, "all"],
        queryFn: () => getStudentCplScores({}),
    });
    const { data: optionsData } = useQuery({
        queryKey: [...QUERY_KEY, "options"],
        queryFn: getStudentCplScoreOptions,
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
        mutationFn: async (file: File) => {
            const rows = await parseStudentCplImportFile(file);
            if (rows.length === 0) {
                throw new Error("File Excel kosong atau tidak valid.");
            }
            return importStudentCplScores(rows, allScoresData?.data ?? [], optionsData ?? { students: [], cpls: [] });
        },
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
        mutationFn: () => exportStudentCplScores(allScoresData?.data ?? []),
        onSuccess: () => toast.success("Export berhasil diunduh"),
        onError: (error: Error) => toast.error(error.message),
    });

    const studentOptions = useMemo(() => {
        return (optionsData?.students ?? []).map((student) => ({
            id: student.id,
            label: `${student.fullName ?? "-"} (${student.identityNumber ?? "-"})`,
        }));
    }, [optionsData?.students]);

    const cplOptions = useMemo(() => {
        return (optionsData?.cpls ?? []).map((cpl) => ({
            id: cpl.id,
            label: `${cpl.code ?? "-"} - ${cpl.description} | Min: ${cpl.minimalScore}${cpl.isActive ? "" : " (Nonaktif)"}`,
        }));
    }, [optionsData?.cpls]);

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
