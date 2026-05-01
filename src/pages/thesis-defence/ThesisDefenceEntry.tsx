import { lazy, Suspense } from 'react';
import { useRole } from '@/hooks/shared';
import { Loading } from '@/components/ui/spinner';

const StudentThesisDefencePage = lazy(() => import('./StudentThesisDefence'));
const LecturerThesisDefencePage = lazy(() => import('./LecturerThesisDefence'));
const AdminThesisDefencePage = lazy(() => import('./AdminThesisDefence'));

export default function ThesisDefenceEntry() {
  const { isStudent, isAdmin, isDosen } = useRole();

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loading size="lg" text="Memuat..." />
        </div>
      }
    >
      {isAdmin() ? (
        <AdminThesisDefencePage />
      ) : isStudent() ? (
        <StudentThesisDefencePage />
      ) : isDosen() ? (
        <LecturerThesisDefencePage />
      ) : (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-muted-foreground text-sm">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      )}
    </Suspense>
  );
}
