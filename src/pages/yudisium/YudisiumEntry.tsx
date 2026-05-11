import { lazy, Suspense } from 'react';
import { useRole } from '@/hooks/shared/useRole';
import { Loading } from '@/components/ui/spinner';

const StudentYudisiumPage = lazy(() => import('./StudentYudisium'));
const YudisiumPage = lazy(() => import('./Yudisium'));

export default function YudisiumEntry() {
  const { isStudent, isAdmin, isDosen } = useRole();

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loading size="lg" text="Memuat..." />
        </div>
      }
    >
      {isStudent() ? (
        <StudentYudisiumPage />
      ) : (isAdmin() || isDosen()) ? (
        <YudisiumPage />
      ) : (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      )}
    </Suspense>
  );
}
