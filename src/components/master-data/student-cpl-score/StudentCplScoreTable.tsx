import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Spinner } from "@/components/ui/spinner";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CplScoreStatus, StudentCplScore } from "@/services/master-data/student-cpl-score.service";

interface StudentCplScoreTableProps {
    data: StudentCplScore[];
    isLoading: boolean;
    isFetching: boolean;
    filters: {
        studentId?: string;
        cplId?: string;
        source?: "SIA" | "MANUAL";
        status?: CplScoreStatus;
    };
    onFiltersChange: (next: {
        studentId?: string;
        cplId?: string;
        source?: "SIA" | "MANUAL";
        status?: CplScoreStatus;
    }) => void;
    onRefresh: () => void;
    onCreate: () => void;
    onEdit: (item: StudentCplScore) => void;
    onDelete: (item: StudentCplScore) => void;
    isDeleting: boolean;
    onImportClick: () => void;
    onExport: () => void;
    isExporting: boolean;
}

export function StudentCplScoreTable({
    data,
    isLoading,
    isFetching,
    filters,
    onFiltersChange,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    isDeleting,
    onImportClick,
    onExport,
    isExporting,
}: StudentCplScoreTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<StudentCplScore | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const sourceBadge = (source: string) =>
        String(source).toUpperCase() === "SIA" ? (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">SIA</Badge>
        ) : (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">MANUAL</Badge>
        );

    const statusBadge = {
        calculated: "bg-slate-100 text-slate-700 border-slate-200",
        verified: "bg-green-100 text-green-700 border-green-200",
        finalized: "bg-purple-100 text-purple-700 border-purple-200",
    } as const;
    const statusLabel = {
        calculated: "Dihitung",
        verified: "Diverifikasi",
        finalized: "Final",
    } as const;

    const filteredData = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return data;

        return data.filter((item) => {
            const studentText = `${item.student?.fullName ?? ""} ${item.student?.identityNumber ?? ""}`.toLowerCase();
            const cplText = `${item.cpl?.code ?? ""} ${item.cpl?.description ?? ""}`.toLowerCase();
            return studentText.includes(term) || cplText.includes(term);
        });
    }, [data, search]);

    const pagedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<StudentCplScore>[]>(
        () => [
            {
                key: "mahasiswa",
                header: "Mahasiswa",
                width: 220,
                render: (item) => (
                    <div>
                        <div className="font-medium">{item.student?.fullName ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.student?.identityNumber ?? item.studentId}</div>
                    </div>
                ),
            },
            {
                key: "cpl",
                header: "CPL",
                width: 420,
                className: "w-[420px] max-w-[420px] whitespace-normal",
                render: (item) => (
                    <div className="w-[420px] max-w-[420px]">
                        <div className="font-medium">{item.cpl?.code ?? "-"}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{item.cpl?.description ?? item.cplId}</div>
                    </div>
                ),
            },
            {
                key: "score",
                header: "Skor",
                width: 80,
                className: "text-center",
                render: (item) => item.score,
            },
            {
                key: "source",
                header: "Sumber",
                width: 100,
                filter: {
                    type: "select",
                    value: filters.source ?? "ALL",
                    onChange: (value: string) =>
                        onFiltersChange({
                            ...filters,
                            source: value === "ALL" ? undefined : (value as "SIA" | "MANUAL"),
                        }),
                    options: [
                        { label: "Semua", value: "ALL" },
                        { label: "SIA", value: "SIA" },
                        { label: "MANUAL", value: "MANUAL" },
                    ],
                },
                render: (item) => sourceBadge(item.source),
            },
            {
                key: "status",
                header: "Status",
                width: 130,
                filter: {
                    type: "select",
                    value: filters.status ?? "ALL",
                    onChange: (value: string) =>
                        onFiltersChange({
                            ...filters,
                            status: value === "ALL" ? undefined : (value as CplScoreStatus),
                        }),
                    options: [
                        { label: "Semua", value: "ALL" },
                        { label: "Dihitung", value: "calculated" },
                        { label: "Diverifikasi", value: "verified" },
                        { label: "Final", value: "finalized" },
                    ],
                },
                render: (item) => <Badge className={statusBadge[item.status]}>{statusLabel[item.status]}</Badge>,
            },
            {
                key: "actions",
                header: "Aksi",
                width: 100,
                className: "text-right",
                render: (item) => {
                    const isManual = String(item.source).toUpperCase() === "MANUAL";
                    return (
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(item)}
                                disabled={!isManual}
                                title={isManual ? "Ubah" : "Data SIA tidak dapat diubah"}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${isManual ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-red-400 hover:text-red-500"}`}
                                onClick={() => setDeleteTarget(item)}
                                disabled={!isManual || isDeleting}
                                title={isManual ? "Hapus" : "Data SIA tidak dapat dihapus"}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [filters, isDeleting, onEdit, onFiltersChange]
    );

    return (
        <>
            <CustomTable
                columns={columns}
                data={pagedData}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={filteredData.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                searchValue={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                enableColumnFilters
                emptyText="Tidak ada data nilai CPL mahasiswa."
                rowKey={(item) => `${item.studentId}-${item.cplId}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onImportClick}>
                            <Upload className="mr-2 h-4 w-4" /> Import Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
                            {isExporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} Export Excel
                        </Button>
                        <Button size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Data
                        </Button>
                        <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />
                    </div>
                }
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Nilai CPL Manual</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data nilai CPL manual akan dihapus permanen dan tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteTarget) onDelete(deleteTarget);
                                setDeleteTarget(null);
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
