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
import { getThesisActivityLabel, getThesisActivityOptions, getThesisStatusLabel, getThesisTerminationReasonLabel, THESIS_STATUS_LABELS } from "@/lib/thesisLabels";

interface ExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    theses: MasterDataThesis[];
    academicYears: { id: string; year: string; semester: string }[];
}

const ACTIVITY_LEVELS = getThesisActivityOptions().map(({ value, label }) => ({ id: value as string, label }));
const STATUS_ORDER = Object.keys(THESIS_STATUS_LABELS);

export function ExportExcelDialog({ open, onOpenChange, theses, academicYears }: ExportExcelDialogProps) {
    const [academicYearId, setAcademicYearId] = useState<string>("all");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(theses.map(t => t.status).filter(Boolean));
        return Array.from(statuses).sort((a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b));
    }, [theses]);

    const handleExport = () => {
        let filtered = theses;

        if (academicYearId !== "all") {
            filtered = filtered.filter(t => t.academicYear?.id === academicYearId);
        }

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(t => selectedStatuses.includes(t.status));
        }

        if (selectedActivities.length > 0) {
            filtered = filtered.filter(t => t.activityLevel && selectedActivities.includes(t.activityLevel));
        }

        const excelData = filtered.map((t, index) => ({
            "No": index + 1,
            "NIM": t.student?.nim || "-",
            "Nama Mahasiswa": t.student?.name || "-",
            "Judul Tugas Akhir": t.title || "-",
            "Topik": t.topic?.name || "-",
            "Tahun Ajaran": t.academicYear ? `${t.academicYear.year} - ${t.academicYear.semester}` : "-",
            // Derived, read-only: ignored when the file is imported back.
            "Aktivitas": getThesisActivityLabel(t.activityLevel),
            "Masa Bimbingan": t.supervisionClock?.elapsedLabel ?? "-",
            "Status": getThesisStatusLabel(t.status),
            // Same columns as the import, so an exported file imports back
            "Alasan Penghentian": t.terminationReason ? getThesisTerminationReasonLabel(t.terminationReason) : "-",
            "Catatan Penghentian": t.terminationNote || "-",
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

    const toggleActivity = (level: string) => {
        setSelectedActivities(prev =>
            prev.includes(level) ? prev.filter(r => r !== level) : [...prev, level]
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
                                            {getThesisStatusLabel(status)}
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

                        {/* Activity levels */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Aktivitas</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs h-auto py-1"
                                    onClick={() => setSelectedActivities([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {ACTIVITY_LEVELS.map((level) => (
                                    <div key={level.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`activity-${level.id}`}
                                            checked={selectedActivities.includes(level.id)}
                                            onCheckedChange={() => toggleActivity(level.id)}
                                        />
                                        <Label
                                            htmlFor={`activity-${level.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {level.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedActivities.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                    Kosongkan untuk menyertakan semua tingkat aktivitas. Tingkat aktivitas hanya ada untuk tugas akhir berstatus Penelitian.
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

