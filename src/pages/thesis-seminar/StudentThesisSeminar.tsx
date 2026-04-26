import { useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentThesisSeminarOverviewPanel } from '@/components/thesis-seminar/StudentThesisSeminarOverviewPanel';
import { useStudentThesisSeminar } from '@/hooks/thesis-seminar/useStudentThesisSeminar';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentThesisSeminar() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { overview, history, isLoading } = useStudentThesisSeminar();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Status & Pendaftaran</TabsTrigger>
          <TabsTrigger value="attendance">Riwayat Kehadiran</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {overview && (
            <StudentThesisSeminarOverviewPanel 
              data={overview}
              history={history}
              onDetailClick={(id) => navigate(`/tugas-akhir/seminar-hasil/detail/${id}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <div className="p-8 text-center border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground italic">Komponen Riwayat Kehadiran sedang dikembangkan...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
