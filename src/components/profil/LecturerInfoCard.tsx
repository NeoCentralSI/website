import { Briefcase, Edit } from 'lucide-react';
import type { User } from '@/services/auth.service';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLecturerDataAPI } from '@/services/profile.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LecturerInfoCardProps {
  lecturer: User['lecturer'];
}

export function LecturerInfoCard({ lecturer }: LecturerInfoCardProps) {
  if (!lecturer) return null;

  const lecturerData = lecturer.data || {};
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState({
    nidn: '',
    nuptk: '',
    pangkat_golongan: '',
    jabatan_fungsional: '',
  });

  const updateMutation = useMutation({
    mutationFn: updateLecturerDataAPI,
    onSuccess: () => {
      toast.success('Informasi data tambahan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleOpenEdit = () => {
    // Initialize form with existing data
    setFormData({
      nidn: lecturerData.nidn || '',
      nuptk: lecturerData.nuptk || '',
      pangkat_golongan: lecturerData.pangkat_golongan || '',
      jabatan_fungsional: lecturerData.jabatan_fungsional || '',
    });
    setIsEditOpen(true);
  };

  const handleSave = () => {
    // Reconstruct the JSON payload to preserve 'riwayat_pendidikan' and other fields
    const updatedData = {
      ...lecturerData,
      nidn: formData.nidn,
      nuptk: formData.nuptk,
      pangkat_golongan: formData.pangkat_golongan,
      jabatan_fungsional: formData.jabatan_fungsional,
    };
    updateMutation.mutate(updatedData);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-bold text-gray-900">Informasi Dosen</h3>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleOpenEdit}>
          <Edit className="h-3.5 w-3.5" />
          Edit Data
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Kelompok Keilmuan
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">
            {lecturer.scienceGroup || <span className="text-gray-400 italic">-</span>}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            NIDN
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.nidn || '-'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            NUPTK
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.nuptk || '-'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Pangkat / Golongan
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.pangkat_golongan || '-'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Jabatan Fungsional
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.jabatan_fungsional || '-'}</p>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Tambahan Dosen</DialogTitle>
            <DialogDescription>Data terkait profil dan karir dosen.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label>NIDN</Label>
              <Input
                value={formData.nidn}
                onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                placeholder="Masukkan NIDN"
              />
            </div>
            <div className="space-y-2">
              <Label>NUPTK</Label>
              <Input
                value={formData.nuptk}
                onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                placeholder="Masukkan NUPTK"
              />
            </div>
            <div className="space-y-2">
              <Label>Pangkat / Golongan</Label>
              <Input
                value={formData.pangkat_golongan}
                onChange={(e) => setFormData({ ...formData, pangkat_golongan: e.target.value })}
                placeholder="Contoh: Penata / IIIc"
              />
            </div>
            <div className="space-y-2">
              <Label>Jabatan Fungsional</Label>
              <Input
                value={formData.jabatan_fungsional}
                onChange={(e) => setFormData({ ...formData, jabatan_fungsional: e.target.value })}
                placeholder="Contoh: Lektor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
