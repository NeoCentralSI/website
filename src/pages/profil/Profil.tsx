import { useEffect } from 'react';
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
} from '@/components/profil';

export default function Profil() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { user } = useAuth();
  const { isProfileIncomplete } = useProfileUpdate();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profil' },
    ]);
    setTitle('Profil Saya');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 max-w-7xl">
      {isProfileIncomplete && <ProfileIncompleteAlert />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProfileInfoCard />
        <ChangePasswordCard />
      </div>

      <StudentInfoCard student={user?.student} />
      <LecturerInfoCard lecturer={user?.lecturer} />
    </div>
  );
}
