import { useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExitSurveyForm() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Pengaturan Exit Survey' },
    ]);
    setTitle('Manajemen Exit Survey');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Kelola Formulir Exit Survey</h1>
            <p className="text-muted-foreground">Sesuaikan pertanyaan untuk survei kelulusan mahasiswa.</p>
          </div>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Simpan Perubahan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pertanyaan Survei</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Tambah Pertanyaan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-muted-foreground">
            Konfigurasi pertanyaan survei akan diimplementasikan di sini.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
