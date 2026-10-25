import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { StudentYudisiumOverviewPanel } from '@/components/yudisium/StudentYudisiumOverviewPanel';
import { StudentYudisiumCplTable } from '@/components/yudisium/StudentYudisiumCplTable';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useStudentYudisiumOverview } from '@/hooks/yudisium/useYudisiumStudent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const TABS = [
  { label: 'Ringkasan', value: 'ringkasan' },
  { label: 'Nilai CPL', value: 'nilai-cpl' },
];

export default function StudentYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'nilai-cpl' ? 'nilai-cpl' : 'ringkasan';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useStudentYudisiumOverview();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Yudisium', href: '/yudisium' },
      { label: activeTab === 'nilai-cpl' ? 'Nilai CPL' : 'Status & Pendaftaran' },
    ],
    [activeTab]
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

      <LocalTabsNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

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
      ) : overview && activeTab === 'nilai-cpl' ? (
        <StudentYudisiumCplTable cplScores={overview.cplScores ?? []} onRefetch={() => refetchOverview()} isFetching={isOverviewFetching} />
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
