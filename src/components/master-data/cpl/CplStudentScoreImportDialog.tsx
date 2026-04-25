import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileSpreadsheet, Download, Upload } from 'lucide-react';
import * as xlsx from 'xlsx';
import type { CplStudentImportResult } from '@/services/master-data/cpl.service';

interface CplStudentScoreImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (file: File) => Promise<CplStudentImportResult>;
    isImporting: boolean;
}

export function CplStudentScoreImportDialog({
    open,
    onOpenChange,
    onImport,
    isImporting,
}: CplStudentScoreImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<CplStudentImportResult | null>(null);

    const reset = () => {
        setFile(null);
        setResult(null);
    };

    const handleSubmit = async () => {
        if (!file) return;
        const importResult = await onImport(file);
        setResult(importResult);
    };

    const handleDownloadTemplate = () => {
        const ws = xlsx.utils.json_to_sheet([{ No: 1, 'Nama Mahasiswa': 'Contoh Mahasiswa', NIM: '1111', 'Skor CPL': 85 }]);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Template');
        xlsx.writeFile(wb, 'template_import_nilai_cpl.xlsx');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Nilai CPL Mahasiswa</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel dengan kolom NIM dan Skor CPL sesuai template internal.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium">Format kolom: No, Nama Mahasiswa, NIM, Skor CPL</p>
                                    <p className="text-xs text-muted-foreground">Catatan: Kolom yang wajib adalah NIM dan Skor CPL</p>
                                </div>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
                                <Download className="h-4 w-4" />
                                Template
                            </Button>
                        </div>
                        <Input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            disabled={isImporting}
                        />
                        {file && <p className="text-xs text-muted-foreground">File: {file.name}</p>}
                        {isImporting && (
                            <Alert>
                                <Upload className="h-4 w-4 animate-bounce" />
                                <AlertTitle>Sedang memproses...</AlertTitle>
                                <AlertDescription>Sistem sedang memvalidasi baris import.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded border p-2">
                                <p className="text-lg font-semibold">{result.totalRows}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="rounded border p-2">
                                <p className="text-lg font-semibold text-green-600">{result.successCount}</p>
                                <p className="text-xs text-muted-foreground">Sukses</p>
                            </div>
                            <div className="rounded border p-2">
                                <p className="text-lg font-semibold text-red-600">{result.failedCount}</p>
                                <p className="text-xs text-muted-foreground">Gagal</p>
                            </div>
                        </div>
                        {result.failedRows.length > 0 && (
                            <ScrollArea className="h-44 rounded border p-3">
                                <div className="space-y-1">
                                    {result.failedRows.map((row) => (
                                        <p key={`${row.row}-${row.message}`} className="text-xs text-red-600">
                                            Baris {row.row}: {row.message}
                                        </p>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                                Batal
                            </Button>
                            <Button onClick={handleSubmit} disabled={!file || isImporting}>
                                {isImporting ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Memproses...
                                    </>
                                ) : (
                                    'Import'
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Tutup
                            </Button>
                            <Button onClick={reset}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
