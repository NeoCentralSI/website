import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { useRole, useAuth } from '@/hooks/shared';
import { useThesisDefenceDetail } from '@/hooks/thesis-defence';
import { toTitleCaseName } from '@/lib/text';

import { ThesisDefenceDetailIdentityPanel } from '@/components/thesis-defence/ThesisDefenceDetailIdentityPanel';
import { ThesisDefenceDetailSchedulingPanel } from '@/components/thesis-defence/ThesisDefenceDetailSchedulingPanel';
import { ThesisDefenceDetailAssessmentPanel } from '@/components/thesis-defence/ThesisDefenceDetailAssessmentPanel';
import { ThesisDefenceDetailRevisionPanel } from '@/components/thesis-defence/ThesisDefenceDetailRevisionPanel';

export default function ThesisDefenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isStudent, isAdmin, isKadep, isDosen } = useRole();
  const { user } = useAuth();

  const _isStudent = isStudent();
  const _isKadep = isKadep();

  const { data: detail, isLoading, isFetching, refetch } = useThesisDefenceDetail(id!);
  const [activeTab, setActiveTab] = useState('identitas');

  const breadcrumbs = useMemo(() => {
    const base = [
      { label: 'Tugas Akhir', href: _isStudent ? '/tugas-akhir' : undefined },
      { label: 'Sidang', href: '/tugas-akhir/sidang' },
    ];

    return [
      ...base,
      { label: 'Detail' },
    ];
  }, [_isStudent]);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Sidang');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail sidang..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p>Sidang tidak ditemukan.</p>
          <Button variant="link" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </div>
    );
  }

  const d = detail as any;

  // Tab visibility logic
  const isUserAdmin = isAdmin();
  const isUserStudent = isStudent() && !!user?.student?.id && (d.student?.id === user?.student?.id);
  const isUserExaminer = !!user?.lecturer?.id && d.examiners?.some((e: any) => e.lecturerId === user?.lecturer?.id);
  const isUserSupervisor = !!user?.lecturer?.id && d.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);

  // Show scheduling for admin if not already finalized/cancelled
  const showScheduling = isUserAdmin && !['passed', 'passed_with_revision', 'failed', 'cancelled'].includes(d.status);

  // Show assessment if it's ongoing or finalized
  const finalizedStatuses = ['passed', 'passed_with_revision', 'failed'];
  const showAssessment = finalizedStatuses.includes(d.status) || (d.status === 'ongoing' && (isUserExaminer || isUserSupervisor || isUserAdmin || _isKadep));

  // Show revisions for student or supervisor if passed with revision
  const showRevisions = (isUserStudent || isUserSupervisor) && d.status === 'passed_with_revision';

  const tabs = [{ label: 'Identitas', value: 'identitas' }];
  if (showScheduling) tabs.push({ label: 'Penjadwalan', value: 'penjadwalan' });
  if (showAssessment) tabs.push({ label: 'Penilaian', value: 'penilaian' });
  if (showRevisions) tabs.push({ label: 'Revisi', value: 'revisi' });

  // Guard active tab validity
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
              {_isStudent ? 'Detail Sidang' : toTitleCaseName(d.student?.name || 'Detail Sidang')}
            </h1>
            <p className="text-muted-foreground">
              {_isStudent ? d.thesis?.title : d.student?.nim}
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
      {tabs.length > 1 && (
        <LocalTabsNav tabs={tabs} activeTab={validTab} onTabChange={setActiveTab} />
      )}

      {/* Panel content */}
      <div className="space-y-6">
        {validTab === 'identitas' && (
          <ThesisDefenceDetailIdentityPanel detail={detail} />
        )}
        {validTab === 'penjadwalan' && showScheduling && (
          <ThesisDefenceDetailSchedulingPanel defenceId={id!} isEditable={isUserAdmin} />
        )}
        {validTab === 'penilaian' && showAssessment && (
          <ThesisDefenceDetailAssessmentPanel defenceId={id!} detail={detail} />
        )}
        {validTab === 'revisi' && showRevisions && (
          <ThesisDefenceDetailRevisionPanel
            defenceId={id!}
            examiners={d.examiners}
            revisions={d.revisions || []}
            isLoading={false}
            onRefresh={refetch}
            isRefreshing={isFetching && !isLoading}
          />
        )}
      </div>
    </div>
  );
}
