import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSpreadsheet, RefreshCw, Upload, Download } from "lucide-react";

import type { AdminThesisSeminarAudienceImportResult } from "@/services/thesis-seminar/core.service";

interface AdminThesisSeminarAudienceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<AdminThesisSeminarAudienceImportResult>;
  onDownloadTemplate?: () => void;
  isImporting: boolean;
}

export function AdminThesisSeminarAudienceImportDialog({
  open,
  onOpenChange,
  onImport,
  onDownloadTemplate,
  isImporting,
}: AdminThesisSeminarAudienceImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AdminThesisSeminarAudienceImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (_) {
      // Error handled by parent toast
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
          <DialogTitle>Import Audience Seminar</DialogTitle>
          <DialogDescription>
            Unggah file Excel untuk mengarsipkan data mahasiswa audience seminar hasil
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Gunakan template standar </p>
                  <p className="text-xs text-muted-foreground">Kolom wajib: No, Nama Mahasiswa, NIM</p>
                </div>
              </div>
              {onDownloadTemplate && (
                <Button type="button" variant="outline" size="sm" onClick={onDownloadTemplate} disabled={isImporting}>
                  <Download className="mr-2 h-4 w-4" /> Template
                </Button>
              )}
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
                <Upload className="h-4 w-4 animate-bounce text-blue-600" />
                <AlertTitle>Sedang memproses...</AlertTitle>
                <AlertDescription>Mohon tunggu, sistem sedang memvalidasi dan menyimpan data audience.</AlertDescription>
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
                <RefreshCw className="mr-2 h-4 w-4" /> Import Lagi
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
