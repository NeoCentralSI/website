import { type Role } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';

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
    return hasRole('admin');
  };

  // Helper function untuk mengecek apakah user adalah student
  const isStudent = (): boolean => {
    return hasRole('student');
  };

  // Helper function untuk mengecek apakah user adalah kadep (Kepala Departemen)
  const isKadep = (): boolean => {
    return hasRole('kadep');
  };

  // Helper function untuk mengecek apakah user adalah sekdep (Sekretaris Departemen)
  const isSekdep = (): boolean => {
    return hasRole('sekdep');
  };

  // Helper function untuk mengecek apakah user adalah pembimbing1
  const isPembimbing1 = (): boolean => {
    return hasRole('pembimbing1');
  };

  // Helper function untuk mengecek apakah user adalah pembimbing2
  const isPembimbing2 = (): boolean => {
    return hasRole('pembimbing2');
  };

  // Helper function untuk mengecek apakah user adalah penguji
  const isPenguji = (): boolean => {
    return hasRole('penguji');
  };

  // Helper function untuk mengecek apakah user adalah gkm (GKM - mungkin Guru Khusus Mahasiswa)
  const isGkm = (): boolean => {
    return hasRole('gkm');
  };

  // Helper function untuk mengecek apakah user adalah pembimbing (pembimbing1 atau pembimbing2)
  const isPembimbing = (): boolean => {
    return hasAnyRole(['pembimbing1', 'pembimbing2']);
  };

  // Helper function untuk mengecek apakah user adalah staff akademik (kadep, sekdep, admin)
  const isStaffAkademik = (): boolean => {
    return hasAnyRole(['kadep', 'sekdep', 'admin']);
  };

  // Helper function untuk mengecek apakah user adalah dosen (pembimbing atau penguji)
  const isDosen = (): boolean => {
    return hasAnyRole(['pembimbing1', 'pembimbing2', 'penguji', 'kadep', 'sekdep']);
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
