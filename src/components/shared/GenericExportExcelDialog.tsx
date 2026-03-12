import { useState } from "react";
import * as xlsx from "xlsx";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GenericExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any[];
    filename: string;
    sheetName: string;
    headers: string[];
    columnMapping: (row: any) => any;
    title?: string;
}

export function GenericExportExcelDialog({
    open,
    onOpenChange,
    data,
    filename,
    sheetName,
    headers,
    columnMapping,
    title = "Export Data ke Excel"
}: GenericExportExcelDialogProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!data || data.length === 0) {
            toast.info("Tidak ada data untuk diexport");
            return;
        }

        setIsExporting(true);
        try {
            const exportData = data.map((row, index) => ({
                "No": index + 1,
                ...columnMapping(row)
            }));

            const worksheet = xlsx.utils.json_to_sheet(exportData, { header: ["No", ...headers] });
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Auto-width
            const colWidths = ["No", ...headers].map(() => ({ wch: 20 }));
            worksheet["!cols"] = colWidths;

            xlsx.writeFile(workbook, `${filename}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
            toast.success(`Berhasil mengeksport ${data.length} data`);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengeksport data");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Anda akan mendownload {data.length} baris data dalam format Excel (.xlsx).
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet className="h-16 w-16 text-green-600 mb-2" />
                        <span className="text-sm font-medium">{filename}.xlsx</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                        Batal
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
                        {isExporting ? "Memproses..." : "Download Excel"}
                        <Download className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
