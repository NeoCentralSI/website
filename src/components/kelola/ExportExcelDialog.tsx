import { useState, useMemo } from "react";
import { format } from "date-fns";
import * as xlsx from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MasterDataThesis } from "@/services/masterDataTa.service";

interface ExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    theses: MasterDataThesis[];
    academicYears: { id: string; year: string; semester: string }[];
}

const RATINGS = [
    { id: "ONGOING", label: "Ongoing" },
    { id: "SLOW", label: "Lambat" },
    { id: "AT_RISK", label: "Berisiko" },
    { id: "FAILED", label: "Gagal" },
    { id: "CANCELLED", label: "Dibatalkan" },
];

export function ExportExcelDialog({ open, onOpenChange, theses, academicYears }: ExportExcelDialogProps) {
    const [academicYearId, setAcademicYearId] = useState<string>("all");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedRatings, setSelectedRatings] = useState<string[]>([]);

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(theses.map(t => t.status).filter(Boolean));
        return Array.from(statuses).sort();
    }, [theses]);

    const handleExport = () => {
        let filtered = theses;

        if (academicYearId !== "all") {
            filtered = filtered.filter(t => t.academicYear?.id === academicYearId);
        }

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(t => selectedStatuses.includes(t.status));
        }

        if (selectedRatings.length > 0) {
            filtered = filtered.filter(t => t.rating && selectedRatings.includes(t.rating));
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

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const toggleRating = (rating: string) => {
        setSelectedRatings(prev =>
            prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Export Data Tugas Akhir</DialogTitle>
                    <DialogDescription>Pilih filter data yang ingin diexport ke Excel.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {/* Academic Year */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Tahun Ajaran / Semester</Label>
                            <RadioGroup
                                value={academicYearId}
                                onValueChange={setAcademicYearId}
                                className="grid grid-cols-1 gap-2"
                            >
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
                                    <RadioGroupItem value="all" id="ay-all" />
                                    <Label htmlFor="ay-all" className="flex-1 cursor-pointer font-medium">Semua Semester</Label>
                                </div>
                                {academicYears?.map((ay) => (
                                    <div
                                        key={ay.id}
                                        className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                    >
                                        <RadioGroupItem value={ay.id} id={`ay-${ay.id}`} />
                                        <Label htmlFor={`ay-${ay.id}`} className="flex-1 cursor-pointer font-medium">
                                            {ay.year} - {ay.semester}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Statuses */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Status Tugas Akhir</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs h-auto py-1"
                                    onClick={() => setSelectedStatuses([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {uniqueStatuses.map((status) => (
                                    <div key={status} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`status-${status}`}
                                            checked={selectedStatuses.includes(status)}
                                            onCheckedChange={() => toggleStatus(status)}
                                        />
                                        <Label
                                            htmlFor={`status-${status}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {status}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedStatuses.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                    Kosongkan untuk menyertakan semua status.
                                </p>
                            )}
                        </div>

                        {/* Ratings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Rating / Kondisi</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs h-auto py-1"
                                    onClick={() => setSelectedRatings([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {RATINGS.map((rating) => (
                                    <div key={rating.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`rating-${rating.id}`}
                                            checked={selectedRatings.includes(rating.id)}
                                            onCheckedChange={() => toggleRating(rating.id)}
                                        />
                                        <Label
                                            htmlFor={`rating-${rating.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {rating.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedRatings.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                    Kosongkan untuk menyertakan semua rating.
                                </p>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleExport}>Download Excel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

