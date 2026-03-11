import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { getFilterOptions, downloadProgressReportPdf } from "@/services/monitoring.service";
import type { ReportFilterOptions } from "@/services/monitoring.service";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

interface DownloadReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultAcademicYear?: string;
}

const RATINGS = [
    { id: "ONGOING", label: "Ongoing" },
    { id: "SLOW", label: "Lambat" },
    { id: "AT_RISK", label: "Berisiko" },
    { id: "FAILED", label: "Gagal" },
];

export function DownloadReportDialog({
    open,
    onOpenChange,
    defaultAcademicYear,
}: DownloadReportDialogProps) {
    const [academicYearId, setAcademicYearId] = useState<string>(defaultAcademicYear || "all");
    const [selectedStatusIds, setSelectedStatusIds] = useState<string[]>([]);
    const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch filter options (academic years and statuses)
    const { data: filterOptions, isLoading } = useQuery({
        queryKey: ["monitoring-filters"],
        queryFn: getFilterOptions,
    });

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const options: ReportFilterOptions = {
                academicYearId,
                statusIds: selectedStatusIds.length > 0 ? selectedStatusIds : undefined,
                ratings: selectedRatings.length > 0 ? selectedRatings : undefined,
            };

            const blob = await downloadProgressReportPdf(options);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            const academicYearLabel = academicYearId === "all"
                ? "Semua"
                : filterOptions?.academicYears?.find(ay => ay.value === academicYearId)?.label || "Report";

            link.setAttribute("download", `Laporan_Monitoring_TA_${academicYearLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Laporan berhasil diunduh");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengunduh laporan");
        } finally {
            setIsDownloading(false);
        }
    };

    const toggleStatus = (id: string) => {
        setSelectedStatusIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleRating = (id: string) => {
        setSelectedRatings(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-primary" />
                        Download Laporan Monitoring
                    </DialogTitle>
                    <DialogDescription>
                        Pilih kriteria data yang ingin disertakan dalam laporan PDF.
                    </DialogDescription>
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
                                {filterOptions?.academicYears?.map((ay) => (
                                    <div
                                        key={ay.value}
                                        className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                    >
                                        <RadioGroupItem value={ay.value} id={`ay-${ay.value}`} />
                                        <Label htmlFor={`ay-${ay.value}`} className="flex-1 cursor-pointer font-medium">
                                            {ay.label} {ay.isActive && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktif</span>}
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
                                    onClick={() => setSelectedStatusIds([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {filterOptions?.statuses?.map((status) => (
                                    <div key={status.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`status-${status.value}`}
                                            checked={selectedStatusIds.includes(status.value)}
                                            onCheckedChange={() => toggleStatus(status.value)}
                                        />
                                        <Label
                                            htmlFor={`status-${status.value}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {status.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedStatusIds.length === 0 && (
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDownloading}>
                        Batal
                    </Button>
                    <Button onClick={handleDownload} disabled={isDownloading || isLoading}>
                        {isDownloading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengunduh...
                            </>
                        ) : (
                            <>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
