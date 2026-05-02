import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Repository() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Repositori' }]);
    setTitle('Repositori Karya Ilmiah');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookMarked className="h-7 w-7 text-primary" />
          Repositori
        </h1>
        <p className="text-muted-foreground">Pusat pencarian tugas akhir, skripsi, dan karya ilmiah mahasiswa.</p>
      </div>

      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari berdasarkan judul, penulis, atau kata kunci..." className="pl-10 h-11" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center justify-center py-20 bg-muted/20 border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>Data repositori akan ditampilkan di sini.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
