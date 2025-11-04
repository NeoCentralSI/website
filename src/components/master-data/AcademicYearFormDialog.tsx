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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest } from '@/services/admin.service';

interface AcademicYearFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingYear: AcademicYear | null;
  formData: CreateAcademicYearRequest | UpdateAcademicYearRequest;
  setFormData: (data: CreateAcademicYearRequest | UpdateAcademicYearRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AcademicYearFormDialog({
  open,
  onOpenChange,
  editingYear,
  formData,
  setFormData,
  onSubmit,
}: AcademicYearFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? 'Ubah informasi tahun ajaran'
                : 'Tambahkan tahun ajaran baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Tahun</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value: 'ganjil' | 'genap') =>
                    setFormData({ ...formData, semester: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ganjil">Ganjil</SelectItem>
                    <SelectItem value="genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                  })
                }
              />
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
            <Button type="submit">
              {editingYear ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
