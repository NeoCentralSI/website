import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';

import { StudentThesisDefenceOverviewPanel } from '@/components/thesis-defence/StudentThesisDefenceOverviewPanel';
import {
  useStudentDefenceOverview,
  useStudentDefenceHistory,
} from '@/hooks/thesis-defence';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function StudentThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useStudentDefenceOverview();
  const { data: history, isLoading: isHistoryLoading } = useStudentDefenceHistory();

  const isLoading = isOverviewLoading || isHistoryLoading;

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang' },
      { label: 'Status & Pendaftaran' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sidang Tugas Akhir</h1>
          <p className="text-muted-foreground">
            Pantau status sidang, checklist persyaratan, dan unggah dokumen sidang
          </p>
        </div>
      </div>

      {isOverviewError ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {overviewError instanceof Error
              ? overviewError.message
              : 'Gagal memuat data sidang tugas akhir.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchOverview()}>
            Coba lagi
          </Button>
        </div>
      ) : overview ? (
        <StudentThesisDefenceOverviewPanel
          overview={overview}
          history={history || []}
          onDetailClick={(id) => navigate(`/tugas-akhir/sidang/${id}`)}
        />
      ) : null}
    </div>
  );
}
