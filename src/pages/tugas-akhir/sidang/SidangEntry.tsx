import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/shared';

export default function SidangEntry() {
  const navigate = useNavigate();
  const { isStudent, isAdmin, isDosen } = useRole();

  useEffect(() => {
    if (isStudent()) {
      navigate('/tugas-akhir/sidang/student', { replace: true });
    } else if (isAdmin()) {
      navigate('/tugas-akhir/sidang/admin', { replace: true });
    } else if (isDosen()) {
      navigate('/tugas-akhir/sidang/lecturer', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [isStudent, isAdmin, isDosen, navigate]);

  return null;
}
