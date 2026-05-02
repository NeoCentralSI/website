import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { useRole, useAuth } from '@/hooks/shared';
import { useThesisSeminarDetail } from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';

import { ThesisSeminarDetailIdentityPanel } from '@/components/thesis-seminar/ThesisSeminarDetailIdentityPanel';
import { ThesisSeminarDetailSchedulingPanel } from '@/components/thesis-seminar/ThesisSeminarDetailSchedulingPanel';
import { ThesisSeminarDetailAssessmentPanel } from '@/components/thesis-seminar/ThesisSeminarDetailAssessmentPanel';
import { ThesisSeminarAudiencePanel } from '@/components/thesis-seminar/ThesisSeminarDetailAudiencePanel';
import { ThesisSeminarDetailRevisionPanel } from '@/components/thesis-seminar/ThesisSeminarDetailRevisionPanel';
import { AdminThesisSeminarCancelModal } from '@/components/thesis-seminar/AdminThesisSeminarCancelDialog';

export default function ThesisSeminarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isStudent, isAdmin, isKadep } = useRole();
  const { user } = useAuth();

  const _isStudent = isStudent();
  const _isKadep = isKadep();
  const isArchiveRoute = location.pathname.includes('/arsip/');
  const isFromSeminarAnnouncement =
    (location.state as { fromAnnouncement?: string } | null)?.fromAnnouncement === 'seminar-hasil';

  const { data: detail, isLoading, isFetching, refetch } = useThesisSeminarDetail(id!);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'identitas';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    if (isFromSeminarAnnouncement) {
      return [
        { label: 'Pengumuman', href: '/pengumuman/seminar-hasil' },
        { label: 'Seminar Hasil', href: '/pengumuman/seminar-hasil' },
        { label: 'Detail' },
      ];
    }

    const base = [
      { label: 'Tugas Akhir', href: _isStudent ? '/tugas-akhir' : undefined },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
    ];

    return [
      ...base,
      { label: 'Detail' },
    ];
  }, [_isStudent, isFromSeminarAnnouncement]);

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

  // Map detail to AdminSeminarListItem format for the cancel modal
  const adminSeminarItem = {
    id: d.id,
    studentName: d.student?.name || '',
    studentNim: d.student?.nim || '',
    thesisTitle: d.thesis?.title || '',
    status: d.status,
  } as any;

  const isUserAdmin = isAdmin();
  const isUserStudent = isStudent() && !!user?.student?.id && (d.student?.id === user?.student?.id || d.student?.nim === user?.identityNumber);
  const isUserExaminer = !!user?.lecturer?.id && d.examiners?.some((e: any) => e.lecturerId === user?.lecturer?.id);
  const isUserSupervisor = !!user?.lecturer?.id && d.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);

  const showScheduling = isUserAdmin && !['registered', 'verified'].includes(d.status);

  const allowedAssessmentStatuses = ['passed', 'passed_with_revision', 'failed'];
  const isAssessmentFinalized = allowedAssessmentStatuses.includes(d?.status);

  let isAssessmentOngoing = false;
  if (d?.status === 'ongoing') {
    isAssessmentOngoing = true;
  } else if (d?.status === 'scheduled' && d.date && d.startTime) {
    const dateObj = new Date(d.date);
    const timeObj = new Date(d.startTime);
    const seminarStart = new Date(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      timeObj.getUTCHours(),
      timeObj.getUTCMinutes()
    );
    isAssessmentOngoing = new Date() >= seminarStart;
  }

  let showAssessment = false;
  if (isAssessmentOngoing) {
    if (isUserExaminer || isUserSupervisor || isUserAdmin || _isKadep) {
      showAssessment = true;
    }
  } else if (isAssessmentFinalized) {
    if (isUserAdmin || isUserStudent || isUserExaminer || isUserSupervisor || _isKadep) {
      showAssessment = true;
    }
  }

  const allowedAudienceStatuses = ['passed', 'passed_with_revision', 'failed'];
  const isAudienceFinalized = allowedAudienceStatuses.includes(d?.status);

  let isAudienceOngoing = false;
  if (d?.status === 'ongoing') {
    isAudienceOngoing = true;
  } else if (d?.status === 'scheduled' && d.date && d.startTime) {
    const dateObj = new Date(d.date);
    const timeObj = new Date(d.startTime);
    const seminarStart = new Date(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      timeObj.getUTCHours(),
      timeObj.getUTCMinutes()
    );
    isAudienceOngoing = new Date() >= seminarStart;
  }

  let showAudience = false;
  if (isAudienceFinalized) {
    showAudience = true;
  } else if (isAudienceOngoing) {
    if (isUserSupervisor) {
      showAudience = true;
    }
  }

  const showRevisions = (isUserStudent || isUserSupervisor) && d.status === 'passed_with_revision';

  const tabs = [{ label: 'Identitas', value: 'identitas' }];
  if (showScheduling) tabs.push({ label: 'Penjadwalan', value: 'penjadwalan' });
  if (showAssessment) tabs.push({ label: 'Penilaian', value: 'penilaian' });
  if (showAudience) tabs.push({ label: 'Peserta', value: 'peserta' });
  if (showRevisions) tabs.push({ label: 'Revisi', value: 'revisi' });

  const validTab = tabs.find((t) => t.value === activeTab) ? activeTab : 'identitas';

  return (
    <div className="p-6 space-y-6">
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
          {isUserAdmin && ['registered', 'verified', 'examiner_assigned', 'scheduled'].includes(d.status) && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsCancelModalOpen(true)}
            >
              Batalkan Seminar
            </Button>
          )}
          <ThesisEventStatusBadge
            status={d.status}
            scheduledDate={d.date}
            startTime={d.startTime}
          />
        </div>
      </div>

      {tabs.length > 1 && (
        <LocalTabsNav tabs={tabs} activeTab={validTab} onTabChange={setActiveTab} />
      )}

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

      <AdminThesisSeminarCancelModal
        seminarId={id!}
        studentName={d.student?.name}
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
