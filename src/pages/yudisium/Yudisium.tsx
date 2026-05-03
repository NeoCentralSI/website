import { useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';

import { YudisiumPanel } from '@/components/yudisium/YudisiumPanel';
import { YudisiumRequirementPanel } from '@/components/yudisium/YudisiumRequirementPanel';
import { ExitSurveyPanel } from '@/components/yudisium/ExitSurveyPanel';

export default function Yudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isKoordinatorYudisium, isAdmin, isDosen } = useRole();

  const activeTab = searchParams.get('tab') || 'acara';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const canViewEvent = isAdmin() || isDosen();
  const canManageGlobal = isKoordinatorYudisium();

  const tabs = useMemo(() => {
    const t = [];
    if (canViewEvent) t.push({ label: 'Kelola Yudisium', value: 'acara' });
    if (canManageGlobal) {
      t.push({ label: 'Kelola Persyaratan', value: 'persyaratan' });
      t.push({ label: 'Kelola Exit Survey', value: 'exit-survey' });
    }
    return t;
  }, [canViewEvent, canManageGlobal]);

  const breadcrumbs = useMemo(() => {
    const b = [{ label: 'Yudisium' }];
    
    if (isKoordinatorYudisium()) {
      if (activeTab === 'acara') b.push({ label: 'Kelola Acara' });
      else if (activeTab === 'persyaratan') b.push({ label: 'Kelola Persyaratan' });
      else if (activeTab === 'exit-survey') b.push({ label: 'Kelola Exit Survey' });
    }
    
    return b;
  }, [activeTab, isKoordinatorYudisium]);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Yudisium');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yudisium</h1>
        <p className="text-muted-foreground">
          {isKoordinatorYudisium() 
            ? "Kelola acara yudisium, persyaratan yudisium, dan exit survey" 
            : "Kelola data yudisium"}
        </p>
      </div>

      {tabs.length > 1 && (
        <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <div className="space-y-6">
        {activeTab === 'acara' && canViewEvent && <YudisiumPanel />}
        {activeTab === 'persyaratan' && canManageGlobal && <YudisiumRequirementPanel />}
        {activeTab === 'exit-survey' && canManageGlobal && <ExitSurveyPanel />}
      </div>
    </div>
  );
}
