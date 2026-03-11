import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { GraduationCap } from 'lucide-react';

export default function YudisiumAnnouncement() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Pengumuman' },
      { label: 'Yudisium' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4 text-muted-foreground p-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
        <GraduationCap className="h-8 w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Pengumuman Yudisium</h2>
        <p className="text-sm mt-1">Fitur ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
