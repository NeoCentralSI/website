import { useState } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminThesisDefenceArchiveImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onImport: (file: File) => void;
}

export function AdminThesisDefenceArchiveImportDialog({
  open,
  onOpenChange,
  isPending,
  onImport,
}: AdminThesisDefenceArchiveImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onImport(file);
    }
  };

  const handleDownloadTemplate = () => {
    // In a real app, this would be a static file or an API endpoint
    window.open('/templates/template_import_arsip_sidang.xlsx', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Impor Arsip Sidang TA</DialogTitle>
          <DialogDescription>
            Unggah file Excel berisi data arsip sidang tugas akhir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Informasi</AlertTitle>
            <AlertDescription>
              Pastikan format file sesuai dengan template yang disediakan agar data dapat diproses dengan benar.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="template">Template File</Label>
            <Button
              id="template"
              variant="outline"
              className="w-full justify-start"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh Template Excel
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Pilih File Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {isPending ? 'Mengimpor...' : 'Impor Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
