import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Upload, Download } from 'lucide-react';

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  isImporting?: boolean;
}

export function ImportStudentDialog({
  open,
  onOpenChange,
  selectedFile,
  onFileChange,
  onImport,
  isImporting = false,
}: ImportStudentDialogProps) {
  const handleDownloadTemplate = () => {
    const csvContent = 'nim,nama,email,sks_completed\n1301211000,Contoh Mahasiswa,contoh@student.telkomuniversity.ac.id,144';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_import_mahasiswa.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Mahasiswa dari CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV untuk import data mahasiswa secara massal
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-file">File CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              disabled={isImporting}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-muted-foreground">
                Format: nim, nama, email, sks_completed
              </p>
              <Button type="button" variant="link" size="sm" onClick={handleDownloadTemplate} className="h-auto p-0 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Template CSV
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Batal
          </Button>
          <Button onClick={onImport} disabled={!selectedFile || isImporting}>
            {isImporting ? (
              <>
                <Spinner className="mr-2" />
                Mengimport...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
