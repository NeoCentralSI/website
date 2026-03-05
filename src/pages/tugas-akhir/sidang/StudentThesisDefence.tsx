import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import { useStudentDefenceOverview } from '@/hooks/defence';
import { DefenceStatusStepper } from '@/components/sidang/DefenceStatusStepper';
import { DefenceInfoCard } from '@/components/sidang/DefenceInfoCard';
import { ChecklistPersyaratanSidang } from '@/components/sidang/ChecklistPersyaratanSidang';
import { UploadDokumenSidang } from '@/components/sidang/UploadDokumenSidang';
import type { ThesisDefenceStatus } from '@/types/defence.types';

const PASSED_STATUSES: ThesisDefenceStatus[] = ['passed', 'passed_with_revision'];

export default function StudentThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading } = useStudentDefenceOverview();

  const defenceStatus = data?.defence?.status ?? null;
  const isPassed = defenceStatus ? PASSED_STATUSES.includes(defenceStatus) : false;
  const checklistIsRecap = isPassed;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sidang Tugas Akhir</h1>
        <p className="text-gray-500">Status dan progres sidang tugas akhir</p>
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data sidang..." />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status Sidang Stepper */}
          <DefenceStatusStepper
            status={data.defence?.status ?? null}
            allChecklistMet={data.allChecklistMet}
          />

          {/* Informasi Sidang Card */}
          {data.defence && <DefenceInfoCard defence={data.defence} />}

          {/* Checklist + Upload */}
          <div className="space-y-2">
            {checklistIsRecap && (
              <p className="text-sm text-muted-foreground">
                Rekap persyaratan dan dokumen sidang yang telah dikumpulkan.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChecklistPersyaratanSidang checklist={data.checklist} />
              <UploadDokumenSidang allChecklistMet={data.allChecklistMet} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data sidang tidak tersedia.
        </div>
      )}
    </div>
  );
}
