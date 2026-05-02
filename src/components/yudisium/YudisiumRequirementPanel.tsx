import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUp, ArrowDown, Power } from 'lucide-react';
import {
  useYudisiumRequirements,
  useToggleYudisiumRequirement,
  useDeleteYudisiumRequirement,
  useMoveRequirementToTop,
  useMoveRequirementToBottom,
} from '@/hooks/yudisium/useYudisiumRequirements';
import { Loading } from '@/components/ui/spinner';

export function YudisiumRequirementPanel() {
  const { data: requirements = [], isLoading } = useYudisiumRequirements();
  const toggleMutation = useToggleYudisiumRequirement();
  const deleteMutation = useDeleteYudisiumRequirement();
  const moveTopMutation = useMoveRequirementToTop();
  const moveBottomMutation = useMoveRequirementToBottom();

  if (isLoading) return <Loading text="Memuat persyaratan..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Persyaratan Yudisium</h2>
          <p className="text-sm text-muted-foreground">Kelola checklist dokumen yang harus diunggah mahasiswa.</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Persyaratan
        </Button>
      </div>

      <div className="grid gap-4">
        {requirements.map((req: any) => (
          <Card key={req.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={req.isActive ? 'default' : 'secondary'}>
                  {req.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <div>
                  <p className="font-medium">{req.name}</p>
                  <p className="text-xs text-muted-foreground">{req.description || 'Tidak ada deskripsi'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => moveTopMutation.mutate(req.id)} title="Pindah ke atas">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => moveBottomMutation.mutate(req.id)} title="Pindah ke bawah">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={req.isActive ? 'text-amber-600' : 'text-emerald-600'} 
                  onClick={() => toggleMutation.mutate(req.id)}
                  title={req.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-600" 
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus persyaratan ini?')) {
                      deleteMutation.mutate(req.id);
                    }
                  }}
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {requirements.length === 0 && (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Belum ada persyaratan yang dibuat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
