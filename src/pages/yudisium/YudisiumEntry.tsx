import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/shared';

export default function YudisiumEntry() {
  const navigate = useNavigate();
  const { isStudent, isAdmin, isDosen } = useRole();

  useEffect(() => {
    if (isStudent()) {
      navigate('/yudisium/student', { replace: true });
    } else if (isAdmin()) {
      navigate('/yudisium/admin', { replace: true });
    } else if (isDosen()) {
      navigate('/yudisium/lecturer', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [isStudent, isAdmin, isDosen, navigate]);

  return null;
}
