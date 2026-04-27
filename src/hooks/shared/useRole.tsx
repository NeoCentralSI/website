import { useCallback, useMemo } from 'react';
import { type Role } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';
import { ROLES, SUPERVISOR_ROLES, LECTURER_ROLES, STAFF_ROLES } from '@/lib/roles';

export const useRole = () => {
  const { user } = useAuth();

  // Helper function untuk mengecek apakah user memiliki role tertentu
  const hasRole = useCallback((roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role =>
      role.name === roleName && role.status === 'active'
    );
  }, [user]);

  // Helper function untuk mengecek apakah user memiliki salah satu dari roles
  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role =>
      roleNames.includes(role.name) && role.status === 'active'
    );
  }, [user]);

  // Helper function untuk mengecek apakah user memiliki semua roles
  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roleNames.every(roleName =>
      user.roles.some(role =>
        role.name === roleName && role.status === 'active'
      )
    );
  }, [user]);

  // Helper function untuk mendapatkan semua active roles
  const getActiveRoles = useCallback((): Role[] => {
    if (!user || !user.roles) return [];
    return user.roles.filter(role => role.status === 'active');
  }, [user]);

  // Helper function untuk mendapatkan role names saja
  const getRoleNames = useCallback((): string[] => {
    return getActiveRoles().map(role => role.name);
  }, [getActiveRoles]);

  // Helper function untuk mengecek apakah user adalah admin
  const isAdmin = useCallback((): boolean => {
    return hasRole(ROLES.ADMIN);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah student (Mahasiswa)
  const isStudent = useCallback((): boolean => {
    return hasRole(ROLES.MAHASISWA);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah kadep (Ketua Departemen)
  const isKadep = useCallback((): boolean => {
    return hasRole(ROLES.KETUA_DEPARTEMEN);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah sekdep (Sekretaris Departemen)
  const isSekdep = useCallback((): boolean => {
    return hasRole(ROLES.SEKRETARIS_DEPARTEMEN);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah pembimbing1
  const isPembimbing1 = useCallback((): boolean => {
    return hasRole(ROLES.PEMBIMBING_1);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah pembimbing2
  const isPembimbing2 = useCallback((): boolean => {
    return hasRole(ROLES.PEMBIMBING_2);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah penguji
  const isPenguji = useCallback((): boolean => {
    return hasRole(ROLES.PENGUJI);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah gkm
  const isGkm = useCallback((): boolean => {
    return hasRole(ROLES.GKM);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah dosen pengampu metopel
  const isDosenPengampuMetopel = useCallback((): boolean => {
    return hasRole(ROLES.DOSEN_METOPEN);
  }, [hasRole]);

  // Helper function untuk mengecek apakah user adalah pembimbing (pembimbing1 atau pembimbing2)
  const isPembimbing = useCallback((): boolean => {
    return hasAnyRole([...SUPERVISOR_ROLES]);
  }, [hasAnyRole]);

  // Helper function untuk mengecek apakah user adalah staff akademik (kadep, sekdep, admin)
  const isStaffAkademik = useCallback((): boolean => {
    return hasAnyRole([...STAFF_ROLES]);
  }, [hasAnyRole]);

  // Helper function untuk mengecek apakah user adalah dosen
  const isDosen = useCallback((): boolean => {
    return hasAnyRole([...LECTURER_ROLES]);
  }, [hasAnyRole]);

  const activeRoles = useMemo(() => getActiveRoles(), [getActiveRoles]);
  const roleNames = useMemo(() => getRoleNames(), [getRoleNames]);

  return {
    // Basic role checking functions
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getActiveRoles,
    getRoleNames,

    // Specific role checking functions
    isAdmin,
    isStudent,
    isKadep,
    isSekdep,
    isPembimbing1,
    isPembimbing2,
    isPenguji,
    isGkm,
    isDosenPengampuMetopel,

    // Combined role checking functions
    isPembimbing,
    isStaffAkademik,
    isDosen,

    // Role data
    roles: user?.roles || [],
    activeRoles,
    roleNames
  };
};
