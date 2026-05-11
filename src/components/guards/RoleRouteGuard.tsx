import { useEffect } from 'react';
import { useNavigate, useOutlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserProfileAPI } from '@/services/auth.service';
import { hasAnyRole } from '@/lib/roles';

const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

export interface RoleRouteGuardProps {
  /** Role names allowed to access (e.g. ['Admin', 'Koordinator Matkul Metopen']). Must match backend ROLES. */
  allowedRoles: string[];
  /** Where to redirect when not allowed. Default /dashboard */
  redirectTo?: string;
}

/**
 * Route guard: only renders children (Outlet) if the current user has one of allowedRoles.
 * Otherwise redirects to redirectTo and does not render the page.
 */
export function RoleRouteGuard({ allowedRoles, redirectTo = '/dashboard' }: RoleRouteGuardProps) {
  const outlet = useOutlet();
  const navigate = useNavigate();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getUserProfileAPI,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const roles = user?.roles ?? [];
  const allowed = hasAnyRole(roles as Array<{ name: string }>, allowedRoles);

  useEffect(() => {
    if (isLoading) return;
    if (isError || !allowed) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isError, allowed, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Memeriksa akses...</p>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return outlet;
}
