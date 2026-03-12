import { useState } from "react";
import * as xlsx from "xlsx";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { importMasterDataTheses } from "@/services/masterDataTa.service";

interface ImportMasterDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ImportResult {
    success: number;
    updated: number;
    failed: number;
    errors: string[];
}

export function ImportMasterDataDialog({ open, onOpenChange }: ImportMasterDataDialogProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const importMutation = useMutation({
        mutationFn: (rows: any[]) => importMasterDataTheses(rows),
        onSuccess: (data: ImportResult) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ["master-data-ta"] });
            if (data.failed === 0) {
                toast.success("Semua data berhasil diimport");
            } else {
                toast.warning(`Selesai dengan ${data.failed} kesalahan`);
            }
        },
        onError: (err: any) => {
            toast.error(err.message || "Gagal mengimport data");
        }
    });

    const handleDownloadTemplate = () => {
        const headers = [
            "No",
            "NIM",
            "Nama Mahasiswa",
            "Judul Tugas Akhir",
            "Topik",
            "Tahun Ajaran",
            "Rating",
            "Status",
            "Pembimbing 1",
            "Pembimbing 2",
            "Tanggal Mulai"
        ];

        const sampleData = [
            {
                "No": 1,
                "NIM": "2111521001",
                "Nama Mahasiswa": "Budi Santoso",
                "Judul Tugas Akhir": "Pengembangan Sistem Informasi Geografis...",
                "Topik": "Sistem Informasi",
                "Tahun Ajaran": "2024 - Ganjil",
                "Rating": "ONGOING",
                "Status": "Bimbingan",
                "Pembimbing 1": "Ricky Akbar M.Kom",
                "Pembimbing 2": "Husnil Kamil, M.T.",
                "Tanggal Mulai": format(new Date(), "yyyy-MM-dd")
            }
        ];

        const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Template Import TA");

        // Auto-width
        const colWidths = headers.map(() => ({ wch: 20 }));
        worksheet["!cols"] = colWidths;

        xlsx.writeFile(workbook, "Template_Import_Tugas_Akhir.xlsx");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = xlsx.utils.sheet_to_json(worksheet);

                if (rows.length === 0) {
                    toast.error("File excel kosong atau tidak valid");
                    setIsParsing(false);
                    return;
                }

                importMutation.mutate(rows);
            } catch (err) {
                toast.error("Gagal membaca file excel");
                console.error(err);
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        importMutation.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!importMutation.isPending) {
                onOpenChange(val);
                if (!val) reset();
            }
        }}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Import Data Master Tugas Akhir</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel untuk menambah atau memperbarui data secara massal.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!result ? (
                        <>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm">Gunakan template standar</p>
                                        <p className="text-xs text-muted-foreground text-wrap">Format harus sesuai dengan hasil export</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" /> Template
                                </Button>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="excel-file">Pilih File Excel</Label>
                                <Input
                                    id="excel-file"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    disabled={importMutation.isPending || isParsing}
                                />
                                {file && (
                                    <p className="text-xs text-muted-foreground">
                                        File terpilih: <span className="font-medium text-foreground">{file.name}</span>
                                    </p>
                                )}
                            </div>

                            {importMutation.isPending && (
                                <Alert>
                                    <Upload className="h-4 w-4 animate-bounce" />
                                    <AlertTitle>Sedang memproses...</AlertTitle>
                                    <AlertDescription>Mohon tunggu, sistem sedang memvalidasi dan menyimpan data.</AlertDescription>
                                </Alert>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{result.success}</p>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Baru</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Diperbarui</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Gagal</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <ScrollArea className="h-[200px] w-full border rounded-md p-4 bg-red-50/50">
                                    <h4 className="flex items-center gap-2 font-semibold text-red-700 text-sm mb-2">
                                        <AlertCircle className="h-4 w-4" /> Daftar Kesalahan:
                                    </h4>
                                    <ul className="text-xs space-y-1 text-red-600 list-disc pl-4">
                                        {result.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}

                            {result.failed === 0 && (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                                    <p className="font-semibold text-green-700 text-sm">Import Berhasil!</p>
                                    <p className="text-xs text-muted-foreground">Seluruh baris data berhasil diproses tanpa kendala.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {result ? (
                        <Button onClick={() => onOpenChange(false)} className="w-full">Selesai</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importMutation.isPending || isParsing}>Batal</Button>
                            <Button onClick={handleUpload} disabled={!file || importMutation.isPending || isParsing}>
                                {importMutation.isPending || isParsing ? "Memproses..." : "Mulai Import"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Inline components to avoid missing imports in snippet
function Label({ children, ...props }: any) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>{children}</label>;
}

function Input({ ...props }: any) {
    return <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" {...props} />;
}
