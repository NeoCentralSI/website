import { type Role } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';
import { ROLES, SUPERVISOR_ROLES, LECTURER_ROLES, STAFF_ROLES } from '@/lib/roles';

export const useRole = () => {
  const { user } = useAuth();

  // Helper function untuk mengecek apakah user memiliki role tertentu
  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => 
      role.name === roleName && role.status === 'active'
    );
  };

  // Helper function untuk mengecek apakah user memiliki salah satu dari roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => 
      roleNames.includes(role.name) && role.status === 'active'
    );
  };

  // Helper function untuk mengecek apakah user memiliki semua roles
  const hasAllRoles = (roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roleNames.every(roleName => 
      user.roles.some(role => 
        role.name === roleName && role.status === 'active'
      )
    );
  };

  // Helper function untuk mendapatkan semua active roles
  const getActiveRoles = (): Role[] => {
    if (!user || !user.roles) return [];
    return user.roles.filter(role => role.status === 'active');
  };

  // Helper function untuk mendapatkan role names saja
  const getRoleNames = (): string[] => {
    return getActiveRoles().map(role => role.name);
  };

  // Helper function untuk mengecek apakah user adalah admin
  const isAdmin = (): boolean => {
    return hasRole(ROLES.ADMIN);
  };

  // Helper function untuk mengecek apakah user adalah student (Mahasiswa)
  const isStudent = (): boolean => {
    return hasRole(ROLES.MAHASISWA);
  };

  // Helper function untuk mengecek apakah user adalah kadep (Ketua Departemen)
  const isKadep = (): boolean => {
    return hasRole(ROLES.KETUA_DEPARTEMEN);
  };

  // Helper function untuk mengecek apakah user adalah sekdep (Sekretaris Departemen)
  const isSekdep = (): boolean => {
    return hasRole(ROLES.SEKRETARIS_DEPARTEMEN);
  };

  // Helper function untuk mengecek apakah user adalah pembimbing1
  const isPembimbing1 = (): boolean => {
    return hasRole(ROLES.PEMBIMBING_1);
  };

  // Helper function untuk mengecek apakah user adalah pembimbing2
  const isPembimbing2 = (): boolean => {
    return hasRole(ROLES.PEMBIMBING_2);
  };

  // Helper function untuk mengecek apakah user adalah penguji
  const isPenguji = (): boolean => {
    return hasRole(ROLES.PENGUJI);
  };

  // Helper function untuk mengecek apakah user adalah gkm
  const isGkm = (): boolean => {
    return hasRole(ROLES.GKM);
  };

  // Helper function untuk mengecek apakah user adalah pembimbing (pembimbing1 atau pembimbing2)
  const isPembimbing = (): boolean => {
    return hasAnyRole([...SUPERVISOR_ROLES]);
  };

  // Helper function untuk mengecek apakah user adalah staff akademik (kadep, sekdep, admin)
  const isStaffAkademik = (): boolean => {
    return hasAnyRole([...STAFF_ROLES]);
  };

  // Helper function untuk mengecek apakah user adalah dosen
  const isDosen = (): boolean => {
    return hasAnyRole([...LECTURER_ROLES]);
  };

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
    
    // Combined role checking functions
    isPembimbing,
    isStaffAkademik,
    isDosen,
    
    // Role data
    roles: user?.roles || [],
    activeRoles: getActiveRoles(),
    roleNames: getRoleNames()
  };
};
