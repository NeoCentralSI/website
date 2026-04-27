import { lazy, Suspense } from 'react'
import { useRole } from '@/hooks/shared/useRole'
import { Loading } from '@/components/ui/spinner'

const StudentThesisSeminarPage = lazy(() => import('./StudentThesisSeminar'))
const LecturerThesisSeminarPage = lazy(() => import('./LecturerThesisSeminar'))
const AdminThesisSeminarPage = lazy(() => import('./AdminThesisSeminar'))

export default function SeminarHasilEntry() {
  const { isStudent, isAdmin, isDosen } = useRole()

  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loading size="lg" text="Memuat Seminar..." />
      </div>
    }>
      {isAdmin() ? (
        <AdminThesisSeminarPage />
      ) : isStudent() ? (
        <StudentThesisSeminarPage />
      ) : isDosen() ? (
        <LecturerThesisSeminarPage />
      ) : (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-muted-foreground text-sm">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      )}
    </Suspense>
  )
}
