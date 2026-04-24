import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Spinner, Loading } from "@/components/ui/spinner";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    onDownloadTemplate: () => void;
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
    onDownloadTemplate,
    onExport,
    isExporting,
}: StudentCplScoreTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<StudentCplScore | null>(null);

    const sourceBadge = (source: string) =>
        source === "manual" ? (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">MANUAL</Badge>
        ) : (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">SIA</Badge>
        );

    const statusBadge = useMemo(
        () => ({
            calculated: "bg-slate-100 text-slate-700 border-slate-200",
            verified: "bg-green-100 text-green-700 border-green-200",
            finalized: "bg-purple-100 text-purple-700 border-purple-200",
        }),
        []
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loading size="lg" text="Memuat data nilai CPL mahasiswa..." />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Filter studentId"
                        value={filters.studentId ?? ""}
                        onChange={(e) => onFiltersChange({ ...filters, studentId: e.target.value || undefined })}
                        className="w-[220px]"
                    />
                    <Input
                        placeholder="Filter cplId"
                        value={filters.cplId ?? ""}
                        onChange={(e) => onFiltersChange({ ...filters, cplId: e.target.value || undefined })}
                        className="w-[220px]"
                    />
                    <Select
                        value={filters.source ?? "ALL"}
                        onValueChange={(value) =>
                            onFiltersChange({ ...filters, source: value === "ALL" ? undefined : (value as "SIA" | "MANUAL") })
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Source</SelectItem>
                            <SelectItem value="SIA">SIA</SelectItem>
                            <SelectItem value="MANUAL">MANUAL</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status ?? "ALL"}
                        onValueChange={(value) =>
                            onFiltersChange({
                                ...filters,
                                status: value === "ALL" ? undefined : (value as CplScoreStatus),
                            })
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="calculated">calculated</SelectItem>
                            <SelectItem value="verified">verified</SelectItem>
                            <SelectItem value="finalized">finalized</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{data.length} data ditemukan</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={onImportClick}>
                            <Upload className="mr-2 h-4 w-4" /> Import Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
                            {isExporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                            Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mahasiswa</TableHead>
                                <TableHead>CPL</TableHead>
                                <TableHead>Skor</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                        Tidak ada data nilai CPL mahasiswa.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => {
                                    const isManual = item.source === "manual";
                                    return (
                                        <TableRow key={`${item.studentId}-${item.cplId}`}>
                                            <TableCell>
                                                <div className="font-medium">{item.student?.fullName ?? "-"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.student?.identityNumber ?? item.studentId}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.cpl?.code ?? "-"}</div>
                                                <div className="text-xs text-muted-foreground">{item.cpl?.description ?? item.cplId}</div>
                                            </TableCell>
                                            <TableCell>{item.score}</TableCell>
                                            <TableCell>{sourceBadge(item.source)}</TableCell>
                                            <TableCell>
                                                <Badge className={statusBadge[item.status]}>{item.status}</Badge>
                                            </TableCell>
                                            <TableCell>
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
                                                        className={`h-8 w-8 ${
                                                            isManual
                                                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                : "text-red-400 hover:text-red-500"
                                                        }`}
                                                        onClick={() => setDeleteTarget(item)}
                                                        disabled={!isManual || isDeleting}
                                                        title={isManual ? "Hapus" : "Data SIA tidak dapat dihapus"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

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
