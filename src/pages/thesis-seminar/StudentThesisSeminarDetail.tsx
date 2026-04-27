import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { StudentThesisSeminarIdentitasTab } from '@/components/thesis-seminar/student-detail/StudentThesisSeminarIdentitasTab';
import { StudentThesisSeminarPenilaianTab } from '@/components/thesis-seminar/student-detail/StudentThesisSeminarPenilaianTab';
import { StudentThesisSeminarRevisiTab } from '@/components/thesis-seminar/student-detail/StudentThesisSeminarRevisiTab';
import { useStudentSeminarDetail } from '@/hooks/thesis-seminar';
import { ArrowLeft } from 'lucide-react';

export default function StudentThesisSeminarDetail() {
  const { seminarId } = useParams<{ seminarId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data: detail, isLoading, refetch, isFetching } = useStudentSeminarDetail(seminarId);
  const [activeTab, setActiveTab] = useState('identitas');

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
      { label: 'Detail' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail seminar..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Seminar tidak ditemukan.</div>
      </div>
    );
  }

  const showBeritaAcara = !!detail.resultFinalizedAt;
  const showRevisi = detail.status === 'passed_with_revision';

  const tabs = [
    { label: 'Identitas', value: 'identitas' },
    ...(showBeritaAcara ? [{ label: 'Berita Acara', value: 'penilaian' }] : []),
    ...(showRevisi ? [{ label: 'Revisi', value: 'revisi' }] : []),
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/tugas-akhir/seminar-hasil')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Detail Seminar Hasil</h1>
            <p className="text-gray-500">{detail.thesis.title}</p>
          </div>
          <ThesisEventStatusBadge status={detail.status} />
        </div>
      </div>

      {/* Tabs */}
      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'identitas' && <StudentThesisSeminarIdentitasTab detail={detail} />}
      {activeTab === 'penilaian' && showBeritaAcara && (
        <StudentThesisSeminarPenilaianTab seminarId={detail.id} seminarStatus={detail.status} />
      )}
      {activeTab === 'revisi' && showRevisi && (
        <StudentThesisSeminarRevisiTab
          detail={detail}
          onRefresh={refetch}
          isRefreshing={isFetching && !isLoading}
        />
      )}
    </div>
  );
}
