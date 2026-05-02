import { useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';

import { YudisiumPanel } from '@/components/yudisium/YudisiumPanel';
import { YudisiumRequirementPanel } from '@/components/yudisium/YudisiumRequirementPanel';
import { YudisiumExitSurveyPanel } from '@/components/yudisium/YudisiumExitSurveyPanel';

export default function Yudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isKoordinatorYudisium, isAdmin, isSekdep } = useRole();

  const activeTab = searchParams.get('tab') || 'event';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const isManagementAllowed = isAdmin() || isSekdep() || isKoordinatorYudisium();

  const tabs = useMemo(() => {
    const t = [{ label: 'Event Yudisium', value: 'event' }];
    
    if (isManagementAllowed) {
      t.push({ label: 'Persyaratan Global', value: 'persyaratan' });
      t.push({ label: 'Exit Survey', value: 'exit-survey' });
    }
    
    return t;
  }, [isManagementAllowed]);

  const breadcrumbs = useMemo(() => {
    const b = [{ label: 'Yudisium' }];
    const currentTab = tabs.find(t => t.value === activeTab);
    if (currentTab && activeTab !== 'event') {
      b.push({ label: currentTab.label });
    }
    return b;
  }, [activeTab, tabs]);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Yudisium');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yudisium</h1>
        <p className="text-muted-foreground">Kelola data yudisium</p>
      </div>

      {tabs.length > 1 && (
        <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <div className="space-y-6">
        {activeTab === 'event' && <YudisiumPanel />}
        {activeTab === 'persyaratan' && isManagementAllowed && <YudisiumRequirementPanel />}
        {activeTab === 'exit-survey' && isManagementAllowed && <YudisiumExitSurveyPanel />}
      </div>
    </div>
  );
}
