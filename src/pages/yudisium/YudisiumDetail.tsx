import { useEffect, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared';
import { useYudisiumEvent } from '@/hooks/yudisium/useYudisium';
import { Badge } from '@/components/ui/badge';

import { YudisiumDetailIdentityPanel } from '@/components/yudisium/YudisiumDetailIdentityPanel';
import { YudisiumDetailParticipantsPanel } from '@/components/yudisium/YudisiumDetailParticipantsPanel';
import { YudisiumDetailSkPanel } from '@/components/yudisium/YudisiumDetailSkPanel';
import { YudisiumDetailExitSurveySummaryPanel } from '@/components/yudisium/YudisiumDetailExitSurveySummaryPanel';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'Dalam Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  finalized: { label: 'Selesai', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export default function YudisiumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isAdmin, isKadep, isSekdep, isKoordinatorYudisium } = useRole();

  const { data: detail, isLoading, refetch } = useYudisiumEvent(id!);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'identitas';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Detail' },
    ]);
    setTitle('Detail Periode Yudisium');
  }, [setBreadcrumbs, setTitle]);

  const tabs = useMemo(() => {
    const t = [
      { label: 'Identitas', value: 'identitas' },
      { label: 'Peserta', value: 'peserta' },
    ];
    
    if (isAdmin() || isKadep() || isSekdep() || isKoordinatorYudisium()) {
      t.push({ label: 'SK Yudisium', value: 'sk' });
      t.push({ label: 'Laporan Exit Survey', value: 'exit-survey' });
    }

    return t;
  }, [isAdmin, isKadep, isSekdep, isKoordinatorYudisium]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail yudisium..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p>Periode yudisium tidak ditemukan.</p>
          <Button variant="link" onClick={() => navigate('/yudisium')}>Kembali</Button>
        </div>
      </div>
    );
  }

  const s = STATUS_MAP[detail.status] || STATUS_MAP.draft;
  const validTab = tabs.find((t) => t.value === activeTab) ? activeTab : 'identitas';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/yudisium')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{detail.name}</h1>
            <p className="text-muted-foreground">Detail Periode Yudisium</p>
          </div>
        </div>

        <Badge variant="outline" className={s.className}>
          {s.label}
        </Badge>
      </div>

      {tabs.length > 1 && (
        <LocalTabsNav tabs={tabs} activeTab={validTab} onTabChange={setActiveTab} />
      )}

      <div className="space-y-6">
        {validTab === 'identitas' && (
          <YudisiumDetailIdentityPanel detail={detail} onUpdate={refetch} />
        )}
        {validTab === 'peserta' && (
          <YudisiumDetailParticipantsPanel yudisiumId={id!} />
        )}
        {validTab === 'sk' && (
          <YudisiumDetailSkPanel detail={detail} />
        )}
        {validTab === 'exit-survey' && (
          <YudisiumDetailExitSurveySummaryPanel yudisiumId={id!} />
        )}
      </div>
    </div>
  );
}
