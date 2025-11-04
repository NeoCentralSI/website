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
import { Upload } from 'lucide-react';

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
}

export function ImportStudentDialog({
  open,
  onOpenChange,
  selectedFile,
  onFileChange,
  onImport,
}: ImportStudentDialogProps) {
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
            />
            <p className="text-sm text-muted-foreground">
              Format: NIM, Nama, Email, dll.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button onClick={onImport} disabled={!selectedFile}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
