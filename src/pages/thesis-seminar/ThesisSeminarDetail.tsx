import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { useRole } from '@/hooks/shared/useRole';
import { useThesisSeminarDetail } from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';

import { ThesisSeminarDetailIdentityPanel } from '@/components/thesis-seminar/ThesisSeminarDetailIdentityPanel';
import { ThesisSeminarDetailSchedulingPanel } from '@/components/thesis-seminar/ThesisSeminarDetailSchedulingPanel';
import { ThesisSeminarDetailAssessmentPanel } from '@/components/thesis-seminar/ThesisSeminarDetailAssessmentPanel';
import { ThesisSeminarAudiencePanel } from '@/components/thesis-seminar/ThesisSeminarDetailAudiencePanel';
import { ThesisSeminarDetailRevisionPanel } from '@/components/thesis-seminar/ThesisSeminarDetailRevisionPanel';

export default function ThesisSeminarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isStudent } = useRole();

  const _isStudent = isStudent();
  const isArchiveRoute = location.pathname.includes('/arsip/');

  const { data: detail, isLoading, isFetching, refetch } = useThesisSeminarDetail(id!);
  const [activeTab, setActiveTab] = useState('identitas');

  const breadcrumbs = useMemo(() => {
    // Shared breadcrumbs for all roles
    const base = [
      { label: 'Tugas Akhir', href: _isStudent ? '/tugas-akhir' : undefined },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
    ];

    return [
      ...base,
      { label: 'Detail' },
    ];
  }, [_isStudent]);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(isArchiveRoute ? 'Detail Arsip Seminar' : 'Detail Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs, isArchiveRoute]);

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
        <div className="text-muted-foreground text-center">
          <p>Seminar tidak ditemukan.</p>
          <Button variant="link" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </div>
    );
  }

  const d = detail as any;

  // Tab visibility based on lifecycle
  const showScheduling = true;
  const showAssessment = true;
  const showAudience = true;
  const showRevisions = true;

  const tabs = [{ label: 'Identitas', value: 'identitas' }];
  if (showScheduling) tabs.push({ label: 'Penjadwalan', value: 'penjadwalan' });
  if (showAssessment) tabs.push({ label: 'Penilaian', value: 'penilaian' });
  if (showAudience) tabs.push({ label: 'Peserta', value: 'peserta' });
  if (showRevisions) tabs.push({ label: 'Revisi', value: 'revisi' });

  // Guard active tab validity after detail loads
  const validTab = tabs.find((t) => t.value === activeTab) ? activeTab : 'identitas';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isStudent()
                ? (isArchiveRoute ? 'Detail Arsip Seminar' : 'Detail Seminar Hasil')
                : toTitleCaseName(d.student?.name || 'Seminar Detail')}
            </h1>
            <p className="text-muted-foreground">
              {isStudent() ? d.thesis?.title : d.student?.nim}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThesisEventStatusBadge
            status={d.status}
            scheduledDate={d.date}
            startTime={d.startTime}
          />
        </div>
      </div>

      {/* Tabs */}
      <LocalTabsNav tabs={tabs} activeTab={validTab} onTabChange={setActiveTab} />

      {/* Panel content */}
      <div className="space-y-6">
        {validTab === 'identitas' && (
          <ThesisSeminarDetailIdentityPanel detail={detail} />
        )}
        {validTab === 'penjadwalan' && showScheduling && id && (
          <ThesisSeminarDetailSchedulingPanel seminarId={id} detail={detail} />
        )}
        {validTab === 'penilaian' && showAssessment && id && (
          <ThesisSeminarDetailAssessmentPanel seminarId={id} detail={detail} />
        )}
        {validTab === 'peserta' && showAudience && id && (
          <ThesisSeminarAudiencePanel seminarId={id} detail={detail} />
        )}
        {validTab === 'revisi' && showRevisions && id && (
          <ThesisSeminarDetailRevisionPanel
            seminarId={id}
            detail={detail}
            onRefresh={refetch}
            isRefreshing={isFetching && !isLoading}
          />
        )}
      </div>
    </div>
  );
}
