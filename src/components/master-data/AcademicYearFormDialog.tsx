import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Spinner } from '@/components/ui/spinner';
import type { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest } from '@/services/admin.service';

interface AcademicYearFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingYear: AcademicYear | null;
  formData: CreateAcademicYearRequest | UpdateAcademicYearRequest;
  setFormData: (data: CreateAcademicYearRequest | UpdateAcademicYearRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export function AcademicYearFormDialog({
  open,
  onOpenChange,
  editingYear,
  formData,
  setFormData,
  onSubmit,
  isSubmitting = false,
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
                <Label htmlFor="year">Tahun Ajaran</Label>
                <Input
                  id="year"
                  type="text"
                  placeholder="Contoh: 2025/2026"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
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
              <DatePicker
                value={formData.startDate ? new Date(formData.startDate) : undefined}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    startDate: date ? date.toISOString() : '',
                  })
                }
                showPastDates={true}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <DatePicker
                value={formData.endDate ? new Date(formData.endDate) : undefined}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    endDate: date ? date.toISOString() : '',
                  })
                }
                showPastDates={true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Menyimpan...
                </>
              ) : editingYear ? (
                'Simpan Perubahan'
              ) : (
                'Tambah'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
