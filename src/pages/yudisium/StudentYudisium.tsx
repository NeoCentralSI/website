import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { StudentYudisiumOverviewPanel } from '@/components/yudisium/StudentYudisiumOverviewPanel';
import { useStudentYudisiumOverview } from '@/hooks/yudisium/useYudisiumStudent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function StudentYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useStudentYudisiumOverview();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Status & Pendaftaran' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Yudisium');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isOverviewLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yudisium</h1>
          <p className="text-muted-foreground">
            Pantau status yudisium, checklist persyaratan, unggah dokumen yudisium, dan validasi nilai CPL
          </p>
        </div>
      </div>

      {isOverviewError ? (
        <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {overviewError instanceof Error
              ? overviewError.message
              : 'Gagal memuat data yudisium.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchOverview()}>
            Coba lagi
          </Button>
        </div>
      ) : overview ? (
        <StudentYudisiumOverviewPanel
          overview={overview}
          history={overview.history || []}
          onDetailClick={(id, yudisiumId) =>
            navigate(`/yudisium/${yudisiumId}/peserta/${id}?from=student`, {
              state: { from: 'student-yudisium' },
            })
          }
          onRefetch={() => refetchOverview()}
        />
      ) : null}
    </div>
  );
}
