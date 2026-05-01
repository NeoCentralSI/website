import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { StudentThesisDefenceOverviewPanel } from '@/components/thesis-defence/StudentThesisDefenceOverviewPanel';
import {
  useStudentDefenceOverview,
  useStudentDefenceHistory,
} from '@/hooks/thesis-defence';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ringkasan';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const { data: overview, isLoading: isOverviewLoading } = useStudentDefenceOverview();
  const { data: history, isLoading: isHistoryLoading } = useStudentDefenceHistory();

  const isLoading = isOverviewLoading || isHistoryLoading;

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang TA', href: '/tugas-akhir/sidang' },
      { label: activeTab === 'riwayat' ? 'Riwayat Sidang' : 'Status & Pendaftaran' },
    ],
    [activeTab]
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

  const tabs = [
    { label: 'Ringkasan', value: 'ringkasan' },
    { label: 'Riwayat', value: 'riwayat' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sidang Tugas Akhir</h1>
          <p className="text-muted-foreground">
            Pantau status sidang, unggah dokumen, dan lihat riwayat sidang tugas akhir
          </p>
        </div>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {overview ? (
        <StudentThesisDefenceOverviewPanel
          overview={overview}
          history={history || []}
          onDetailClick={(id) => navigate(`/tugas-akhir/sidang/${id}`)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Data sidang tugas akhir belum tersedia.
        </div>
      )}
    </div>
  );
}
