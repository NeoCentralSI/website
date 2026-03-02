import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PengumumanOverviewPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Pengumuman' }]);
    setTitle('Pengumuman');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman</CardTitle>
          <CardDescription>Pilih kategori pengumuman dari menu di sebelah kiri.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
