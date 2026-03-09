import { useState, useMemo } from "react";
import { format } from "date-fns";
import * as xlsx from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MasterDataThesis } from "@/services/masterDataTa.service";

interface ExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    theses: MasterDataThesis[];
    academicYears: { id: string; year: string; semester: string }[];
}

export function ExportExcelDialog({ open, onOpenChange, theses, academicYears }: ExportExcelDialogProps) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [yearMode, setYearMode] = useState("all");
    const [selectedYear, setSelectedYear] = useState("none");
    const [startYear, setStartYear] = useState("none");
    const [endYear, setEndYear] = useState("none");

    const uniqueYears = useMemo(() => {
        const years = new Set(academicYears.map(ay => ay.year));
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [academicYears]);

    const handleExport = () => {
        let filtered = theses;

        if (statusFilter === "active") {
            filtered = filtered.filter(t => !["Selesai", "Dibatalkan", "Gagal"].includes(t.status));
        }

        if (yearMode === "single" && selectedYear !== "none") {
            filtered = filtered.filter(t => t.academicYear?.year === selectedYear);
        } else if (yearMode === "range" && startYear !== "none" && endYear !== "none") {
            const start = parseInt(startYear);
            const end = parseInt(endYear);
            const min = Math.min(start, end);
            const max = Math.max(start, end);

            filtered = filtered.filter(t => {
                if (!t.academicYear) return false;
                const yearNum = parseInt(t.academicYear.year);
                return yearNum >= min && yearNum <= max;
            });
        }

        const excelData = filtered.map((t, index) => ({
            "No": index + 1,
            "NIM": t.student?.nim || "-",
            "Nama Mahasiswa": t.student?.name || "-",
            "Judul Tugas Akhir": t.title || "-",
            "Topik": t.topic?.name || "-",
            "Tahun Ajaran": t.academicYear ? `${t.academicYear.year} - ${t.academicYear.semester}` : "-",
            "Rating": t.rating || "-",
            "Status": t.status || "-",
            "Pembimbing 1": t.supervisors.find(s => s.roleName === "Pembimbing 1")?.name || "-",
            "Pembimbing 2": t.supervisors.find(s => s.roleName === "Pembimbing 2")?.name || "-",
            "Tanggal Mulai": t.startDate ? format(new Date(t.startDate), "dd MMM yyyy") : "-"
        }));

        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data TA");

        const colWidths = [
            { wch: 5 },
            { wch: 15 },
            { wch: 30 },
            { wch: 50 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 },
        ];
        worksheet["!cols"] = colWidths;

        xlsx.writeFile(workbook, `Data_Master_TA_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Data Tugas Akhir</DialogTitle>
                    <DialogDescription>Pilih filter data yang ingin diexport ke Excel.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Status Tugas Akhir</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif Saja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Tahun Ajaran</Label>
                        <Select value={yearMode} onValueChange={setYearMode}>
                            <SelectTrigger><SelectValue placeholder="Pilih mode tahun..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun</SelectItem>
                                <SelectItem value="single">Pilih Tahun Tertentu</SelectItem>
                                <SelectItem value="range">Pilih Rentang Tahun</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {yearMode === "single" && (
                        <div className="grid gap-2">
                            <Label>Pilih Tahun</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger><SelectValue placeholder="Pilih tahun..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Silahkan Pilih --</SelectItem>
                                    {uniqueYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {yearMode === "range" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tahun Awal</Label>
                                <Select value={startYear} onValueChange={setStartYear}>
                                    <SelectTrigger><SelectValue placeholder="Tahun awal..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Pilih --</SelectItem>
                                        {uniqueYears.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Tahun Akhir</Label>
                                <Select value={endYear} onValueChange={setEndYear}>
                                    <SelectTrigger><SelectValue placeholder="Tahun akhir..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Pilih --</SelectItem>
                                        {uniqueYears.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleExport}>Download Excel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
