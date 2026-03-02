import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Loading } from '@/components/ui/spinner';
import { useStudentSeminarOverview } from '@/hooks/seminar';
import { SeminarStatusStepper } from '@/components/seminar/SeminarStatusStepper';
import { ChecklistPersyaratan } from '@/components/seminar/ChecklistPersyaratan';
import { UploadDokumenSeminar } from '@/components/seminar/UploadDokumenSeminar';

const TABS = [
  { label: 'Seminar Hasil', to: '/tugas-akhir/seminar/student', end: true },
  { label: 'Riwayat Kehadiran', to: '/tugas-akhir/seminar/student/attendance' },
];

export default function StudentThesisSeminar() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading } = useStudentSeminarOverview();

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Seminar Hasil</h1>
          <p className="text-gray-500">Status dan progres seminar hasil tugas akhir</p>
        </div>
      </div>

      <TabsNav tabs={TABS} />

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data seminar..." />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status Seminar Stepper */}
          <SeminarStatusStepper
            status={data.seminar?.status ?? null}
            allChecklistMet={data.allChecklistMet}
          />

          {/* Checklist + Upload side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChecklistPersyaratan checklist={data.checklist} />
            <UploadDokumenSeminar
              allChecklistMet={data.allChecklistMet}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data seminar tidak tersedia.
        </div>
      )}
    </div>
  );
}