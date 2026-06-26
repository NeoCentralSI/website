import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileSpreadsheet, RefreshCw, Upload, X, FileUp } from "lucide-react";

import type { AdminThesisSeminarAudienceImportResult } from "@/types/seminar.types";

import * as xlsx from "xlsx";

interface AdminThesisSeminarAudienceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<AdminThesisSeminarAudienceImportResult>;
  isImporting: boolean;
}

export function AdminThesisSeminarAudienceImportDialog({
  open,
  onOpenChange,
  onImport,
  isImporting,
}: AdminThesisSeminarAudienceImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AdminThesisSeminarAudienceImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = ["No", "Nama Mahasiswa", "NIM"];
    const sampleData = [
      { "No": 1, "Nama Mahasiswa": "John Doe", "NIM": "2111521001" },
      { "No": 2, "Nama Mahasiswa": "Jane Smith", "NIM": "2111522002" },
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Template_Audience");

    // Auto-width
    worksheet["!cols"] = [{ wch: 5 }, { wch: 35 }, { wch: 18 }];

    xlsx.writeFile(workbook, "Template_Audience_Seminar.xlsx");
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (error) {
      // Error handled by parent/toast
    }
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
          <DialogTitle>Import Peserta Seminar Hasil</DialogTitle>
          <DialogDescription>
            Unggah file Excel untuk mengimpor data peserta seminar hasil
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Gunakan template standar</p>
                  <p className="text-xs text-muted-foreground">
                    Kolom wajib: No, Nama Mahasiswa, NIM
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
                <Download className="h-4 w-4" /> Template
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isImporting}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground font-normal"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <FileUp className="mr-2 h-4 w-4" />
                {file ? file.name : 'Pilih file Excel (xlsx, xls)'}
              </Button>
              {file && !isImporting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isImporting && (
              <Alert>
                <Upload className="h-4 w-4 animate-bounce text-blue-600" />
                <AlertTitle>Sedang memproses...</AlertTitle>
                <AlertDescription>Mohon tunggu, sistem sedang memvalidasi dan menyimpan data import.</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border p-2">
                <p className="text-lg font-semibold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-lg font-semibold text-green-600">{result.successCount}</p>
                <p className="text-xs text-muted-foreground">Sukses</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-lg font-semibold text-red-600">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Gagal</p>
              </div>
            </div>
            {result.failedRows.length > 0 && (
              <ScrollArea className="h-44 rounded border p-3">
                <div className="space-y-1">
                  {result.failedRows.map((row, idx) => (
                    <p key={idx} className="text-xs text-red-600">
                      Baris {row.row}: {row.error}
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
                  "Import"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
