import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { SupervisionQuotaPanel } from '@/components/thesis-proposal/SupervisionQuotaPanel';
import { useRole } from '@/hooks/shared/useRole';

/** Batas Bimbingan: Kadep dan Sekdep mengatur; Admin hanya membaca. */
export default function SupervisionQuotaPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep, isSekdep } = useRole();
  const canEdit = isKadep() || isSekdep();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Kelola' }, { label: 'Batas Bimbingan' }]);
    setTitle('Batas Bimbingan');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-4 md:p-6">
      <SupervisionQuotaPanel canEdit={canEdit} />
    </div>
  );
}
