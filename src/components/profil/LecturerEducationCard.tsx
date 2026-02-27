import { BookOpen, Edit, Plus, Trash2 } from 'lucide-react';
import type { User } from '@/services/auth.service';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLecturerDataAPI } from '@/services/profile.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LecturerEducationCardProps {
  lecturer: User['lecturer'];
}

export function LecturerEducationCard({ lecturer }: LecturerEducationCardProps) {
  if (!lecturer) return null;

  const lecturerData = lecturer.data || {};
  const educationHistory = lecturerData?.riwayat_pendidikan || [];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState<any[]>([]);

  const updateMutation = useMutation({
    mutationFn: updateLecturerDataAPI,
    onSuccess: () => {
      toast.success('Riwayat Pendidikan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleOpenEdit = () => {
    // Clone existing array to avoid direct mutation
    setFormData(JSON.parse(JSON.stringify(educationHistory)));
    setIsEditOpen(true);
  };

  const handleAddEducation = () => {
    setFormData([...formData, { jenjang: '', program_studi: '', fakultas: '', universitas: '' }]);
  };

  const handleRemoveEducation = (index: number) => {
    const newForm = [...formData];
    newForm.splice(index, 1);
    setFormData(newForm);
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newForm = [...formData];
    newForm[index][field] = value;
    setFormData(newForm);
  };

  const handleSave = () => {
    // Reconstruct the JSON payload to preserve other fields
    const updatedData = {
      ...lecturerData,
      riwayat_pendidikan: formData,
    };
    updateMutation.mutate(updatedData);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-bold text-gray-900">Riwayat Pendidikan</h3>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleOpenEdit}>
          <Edit className="h-3.5 w-3.5" />
          Edit Data
        </Button>
      </div>

      <div className="space-y-3">
        {educationHistory.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Belum ada data riwayat pendidikan.</p>
        ) : (
          educationHistory.map((edu: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <span className="shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                {edu.jenjang}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-base font-semibold text-gray-900 leading-tight">{edu.program_studi}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {edu.universitas}
                </p>
                {edu.fakultas && (
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                    Fak. {edu.fakultas}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Riwayat Pendidikan</DialogTitle>
            <DialogDescription>Kelola data riwayat pendidikan Anda.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-6">
            {formData.map((edu, index) => (
              <div key={index} className="p-4 border rounded-md relative bg-gray-50 grid grid-cols-2 gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                  onClick={() => handleRemoveEducation(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Jenjang</Label>
                  <Input
                    value={edu.jenjang}
                    onChange={(e) => handleEducationChange(index, 'jenjang', e.target.value)}
                    placeholder="S1, S2, S3..."
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Program Studi</Label>
                  <Input
                    value={edu.program_studi}
                    onChange={(e) => handleEducationChange(index, 'program_studi', e.target.value)}
                    placeholder="Sistem Informasi..."
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Universitas</Label>
                  <Input
                    value={edu.universitas}
                    onChange={(e) => handleEducationChange(index, 'universitas', e.target.value)}
                    placeholder="Nama Universitas..."
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Fakultas (Opsional)</Label>
                  <Input
                    value={edu.fakultas || ''}
                    onChange={(e) => handleEducationChange(index, 'fakultas', e.target.value)}
                    placeholder="Nama Fakultas..."
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed" onClick={handleAddEducation}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Riwayat Pendidikan
            </Button>
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
