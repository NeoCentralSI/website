import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { DefenceStatusBadge } from '@/components/sidang/DefenceStatusBadge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { useLecturerDefenceDetail } from '@/hooks/defence';
import { toTitleCaseName } from '@/lib/text';
import type { LecturerDefenceDetailResponse } from '@/types/defence.types';

interface LecturerDefenceDetailLayoutProps {
  children: (detail: LecturerDefenceDetailResponse) => React.ReactNode;
}

export function LecturerDefenceDetailLayout({ children }: LecturerDefenceDetailLayoutProps) {
  const { defenceId } = useParams<{ defenceId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const { data: detail, isLoading } = useLecturerDefenceDetail(defenceId);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang/lecturer/my-students' },
      { label: 'Detail' },
    ],
    [],
  );

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
        <div className="text-muted-foreground">Sidang tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tugas-akhir/sidang/lecturer/my-students')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{toTitleCaseName(detail.student.name)}</h1>
            <p className="text-gray-500">{detail.student.nim}</p>
          </div>
          <DefenceStatusBadge status={detail.status} />
        </div>
      </div>

      {/* Tab content */}
      {children(detail)}
    </div>
  );
}
