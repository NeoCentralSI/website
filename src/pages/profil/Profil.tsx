import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useAuth } from '@/hooks/shared';
import { useProfileUpdate } from '@/hooks/profile';
import {
  ProfileIncompleteAlert,
  ProfileInfoCard,
  ChangePasswordCard,
  StudentInfoCard,
  LecturerInfoCard,
  LecturerEducationCard,
  AvatarUpload,
} from '@/components/profil';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { IdCard, ShieldCheck } from 'lucide-react';
import { formatRoleName } from '@/lib/text';

export default function Profil() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { user } = useAuth();
  const { isProfileIncomplete } = useProfileUpdate();

  const breadcrumbs = useMemo(() => [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profil' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Profil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // Calculate profile completeness
  const profileCompleteness = useMemo(() => {
    if (!user) return 0;
    const fields = [!!user.fullName, !!user.email, !!user.phoneNumber, !!user.avatarUrl];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  return (
    <div className="space-y-5 pt-2">
      {isProfileIncomplete && <ProfileIncompleteAlert />}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left sidebar card */}
        <aside className="lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
            <AvatarUpload />

            {/* Role badges */}
            {user?.roles && user.roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {user.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="outline"
                    className={
                      role.status === 'active'
                        ? 'capitalize text-[10px] py-0.5 px-2 border-gray-300 bg-gray-50 text-gray-700 font-semibold'
                        : 'capitalize text-[10px] py-0.5 px-2 border-gray-200 text-gray-400'
                    }
                  >
                    {formatRoleName(role.name)}
                  </Badge>
                ))}
              </div>
            )}

            {/* NIP / Identity */}
            {user?.identityNumber && (
              <>
                <Separator className="my-4" />
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-gray-400 mb-1">
                    <IdCard className="h-4 w-4" />
                    <span className="text-xs">{user.identityType} / Identitas</span>
                  </div>
                  <p className="text-base font-semibold text-gray-800">{user.identityNumber}</p>
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Verification Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status Verifikasi</span>
              <Badge
                className={
                  user?.isVerified
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs gap-1'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs gap-1'
                }
              >
                {user?.isVerified && <ShieldCheck className="h-3 w-3" />}
                {user?.isVerified ? 'TERVERIFIKASI' : 'Belum'}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Profile Completeness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Profil Kelengkapan</span>
                <span className="text-sm font-bold text-gray-800">{profileCompleteness}%</span>
              </div>
              <Progress
                value={profileCompleteness}
                className="h-2.5 bg-primary/15 **:data-[slot=progress-indicator]:bg-primary"
              />
            </div>
          </div>
        </aside>

        {/* Right content - separate cards */}
        <div className="flex-1 min-w-0 space-y-5">
          <ProfileInfoCard />
          <ChangePasswordCard />

          {/* Student info */}
          {user?.student && <StudentInfoCard student={user.student} />}

          {/* Lecturer info - two cards side by side */}
          {user?.lecturer && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <LecturerInfoCard lecturer={user.lecturer} />
              <LecturerEducationCard lecturer={user.lecturer} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
