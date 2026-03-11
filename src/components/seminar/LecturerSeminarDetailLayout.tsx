import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import { useLecturerSeminarDetail } from '@/hooks/seminar/useLecturerSeminar';
import { toTitleCaseName } from '@/lib/text';
import type { LecturerSeminarDetailResponse } from '@/types/seminar.types';

interface LecturerSeminarDetailLayoutProps {
  children: (detail: LecturerSeminarDetailResponse) => React.ReactNode;
}

export function LecturerSeminarDetailLayout({ children }: LecturerSeminarDetailLayoutProps) {
  const { seminarId } = useParams<{ seminarId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const { data: detail, isLoading } = useLecturerSeminarDetail(seminarId);

  const showExaminerAssessmentTab = !!detail?.canOpenExaminerAssessment;
  const showSupervisorFinalizationTab = !!detail?.canOpenSupervisorFinalization;
  // Show revision tab only for supervisor AND only when status is passed_with_revision
  const showRevisionTab = !!detail?.canOpenSupervisorFinalization && detail?.status === 'passed_with_revision';
  // Show attendance tab for supervisors
  const showAttendanceTab = !!detail?.canOpenSupervisorFinalization;

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar/lecturer/my-students' },
      { label: 'Detail' },
    ],
    [],
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const tabs = useMemo(() => {
    const base = `/tugas-akhir/seminar/lecturer/${seminarId}`;
    const items: TabItem[] = [{ label: 'Identitas', to: base, end: true }];
    if (showExaminerAssessmentTab) {
      items.push({ label: 'Penilaian', to: `${base}/assessment` });
    } else if (showSupervisorFinalizationTab) {
      items.push({ label: 'Berita Acara', to: `${base}/assessment` });
    }
    if (showRevisionTab) {
      items.push({ label: 'Revisi', to: `${base}/revision` });
    }
    if (showAttendanceTab) {
      items.push({ label: 'Daftar Hadir', to: `${base}/attendance` });
    }
    return items;
  }, [seminarId, showExaminerAssessmentTab, showSupervisorFinalizationTab, showRevisionTab, showAttendanceTab]);

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

  return (
    <div className="p-4 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tugas-akhir/seminar/lecturer/my-students')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{toTitleCaseName(detail.student.name)}</h1>
            <p className="text-gray-500">{detail.student.nim}</p>
          </div>
          <SeminarStatusBadge status={detail.status} />
        </div>
      </div>

      {/* Tabs - only show when multiple tabs are available */}
      {tabs.length > 1 && <TabsNav tabs={tabs} />}

      {/* Tab content */}
      {children(detail)}
    </div>
  );
}
