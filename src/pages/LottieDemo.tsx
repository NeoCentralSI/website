import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import EmptyState from '@/components/ui/empty-state';
import NotFound from '@/components/ui/not-found';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LottieDemo() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setTitle('Lottie Animation Demo');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Lottie Demo' },
    ]);
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lottie Animation Demo</h1>
        <p className="text-muted-foreground mt-1">
          Demonstrasi komponen EmptyState dan NotFound dengan animasi Lottie
        </p>
      </div>

      <Separator />

      {/* EmptyState Demo */}
      <Card>
        <CardHeader>
          <CardTitle>EmptyState Component</CardTitle>
          <CardDescription>
            Digunakan untuk menampilkan kondisi ketika tidak ada data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Small Size */}
          <div>
            <h3 className="text-sm font-medium mb-4">Small Size (sm)</h3>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <EmptyState
                  title="Tidak Ada Data"
                  description="Ini adalah contoh empty state dengan ukuran kecil"
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Medium Size */}
          <div>
            <h3 className="text-sm font-medium mb-4">Medium Size (md) - Default</h3>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <EmptyState
                  title="Belum Ada Notifikasi"
                  description="Notifikasi akan muncul di sini ketika ada pembaruan"
                  size="md"
                />
              </CardContent>
            </Card>
          </div>

          {/* Large Size */}
          <div>
            <h3 className="text-sm font-medium mb-4">Large Size (lg)</h3>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <EmptyState
                  title="Belum Ada Bimbingan"
                  description="Mulai ajukan bimbingan untuk memulai proses tugas akhir Anda"
                  size="lg"
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* NotFound Demo */}
      <Card>
        <CardHeader>
          <CardTitle>NotFound Component</CardTitle>
          <CardDescription>
            Digunakan untuk menampilkan halaman 404 atau data tidak ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card className="border-dashed">
            <CardContent className="p-4">
              <NotFound
                title="Halaman Tidak Ditemukan"
                description="Halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan"
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Penggunaan</CardTitle>
          <CardDescription>
            Komponen sudah terintegrasi di berbagai tempat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span><strong>CustomTable:</strong> Otomatis menampilkan EmptyState ketika tabel kosong</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span><strong>NotificationsSheet:</strong> Menampilkan EmptyState ketika tidak ada notifikasi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span><strong>Supervisors Page:</strong> Menampilkan EmptyState ketika belum ada pembimbing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span><strong>404 Route:</strong> Menampilkan NotFound untuk route yang tidak valid</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
