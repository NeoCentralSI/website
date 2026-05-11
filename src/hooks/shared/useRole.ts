import type { Role } from '@/services/auth.service';
import { ROLES, SUPERVISOR_ROLES, LECTURER_ROLES, STAFF_ROLES } from '@/lib/roles';
import { useAuth } from './useAuth';

export function useRole() {
  const { user, isLoading } = useAuth();

  const getActiveRoles = (): Role[] => {
    if (!user?.roles) {
      return [];
    }

    return user.roles.filter((role) => role.status === 'active');
  };

  const getRoleNames = (): string[] => {
    return getActiveRoles().map((role) => role.name);
  };

  const hasRole = (roleName: string): boolean => {
    return getRoleNames().includes(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    const activeRoleNames = getRoleNames();
    return roleNames.some((roleName) => activeRoleNames.includes(roleName));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    const activeRoleNames = getRoleNames();
    return roleNames.every((roleName) => activeRoleNames.includes(roleName));
  };

  const isAdmin = (): boolean => hasRole(ROLES.ADMIN);
  const isStudent = (): boolean => hasRole(ROLES.MAHASISWA);
  const isKadep = (): boolean => hasRole(ROLES.KETUA_DEPARTEMEN);
  const isSekdep = (): boolean => hasRole(ROLES.SEKRETARIS_DEPARTEMEN);
  const isPembimbing1 = (): boolean => hasRole(ROLES.PEMBIMBING_1);
  const isPembimbing2 = (): boolean => hasRole(ROLES.PEMBIMBING_2);
  const isPenguji = (): boolean => hasRole(ROLES.PENGUJI);
  const isGkm = (): boolean => hasRole(ROLES.GKM);
  const isKoordinatorYudisium = (): boolean => hasRole(ROLES.KOORDINATOR_YUDISIUM);
  const isTimPengelolaCpl = (): boolean => hasRole(ROLES.TIM_PENGELOLA_CPL);
  const isKoordinatorMetopen = (): boolean => hasRole(ROLES.KOORDINATOR_METOPEN);
  const isDosenPengampuMetopel = (): boolean => isKoordinatorMetopen();
  const isDosenPengampuMetopen = (): boolean => isKoordinatorMetopen();
  const isPembimbing = (): boolean => hasAnyRole([...SUPERVISOR_ROLES]);
  const isStaffAkademik = (): boolean => hasAnyRole([...STAFF_ROLES]);
  const isDosen = (): boolean => hasAnyRole([...LECTURER_ROLES]);

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getActiveRoles,
    getRoleNames,
    isAdmin,
    isStudent,
    isKadep,
    isSekdep,
    isPembimbing1,
    isPembimbing2,
    isPenguji,
    isGkm,
    isKoordinatorYudisium,
    isTimPengelolaCpl,
    isKoordinatorMetopen,
    isDosenPengampuMetopel,
    isDosenPengampuMetopen,
    isPembimbing,
    isStaffAkademik,
    isDosen,
    user,
    roles: user?.roles ?? [],
    activeRoles: getActiveRoles(),
    roleNames: getRoleNames(),
    isLoading,
  };
}
