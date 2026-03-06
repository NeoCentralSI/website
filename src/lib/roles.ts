/**
 * Role constants - sesuai dengan database
 * Gunakan nilai ini untuk pengecekan role di frontend
 */
export const ROLES = {
  KETUA_DEPARTEMEN: "Ketua Departemen",
  SEKRETARIS_DEPARTEMEN: "Sekretaris Departemen",
  PEMBIMBING_1: "Pembimbing 1",
  PEMBIMBING_2: "Pembimbing 2",
  ADMIN: "Admin",
  PENGUJI: "Penguji",
  MAHASISWA: "Mahasiswa",
  GKM: "GKM",
  KOORDINATOR_YUDISIUM: "Koordinator Yudisium",
  TIM_PENGELOLA_CPL: "Tim Pengelola CPL",
  DOSEN_METOPEN: "Dosen Pengampu Metopel",
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

// Supervisor roles (Pembimbing)
export const SUPERVISOR_ROLES = [
  ROLES.PEMBIMBING_1,
  ROLES.PEMBIMBING_2,
] as const;

// All lecturer roles
export const LECTURER_ROLES = [
  ROLES.KETUA_DEPARTEMEN,
  ROLES.SEKRETARIS_DEPARTEMEN,
  ROLES.PEMBIMBING_1,
  ROLES.PEMBIMBING_2,
  ROLES.PENGUJI,
  ROLES.GKM,
  ROLES.KOORDINATOR_YUDISIUM,
  ROLES.TIM_PENGELOLA_CPL,
  ROLES.DOSEN_METOPEN,
] as const;

// Staff roles (admin + management)
export const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.KETUA_DEPARTEMEN,
  ROLES.SEKRETARIS_DEPARTEMEN,
  ROLES.KOORDINATOR_YUDISIUM,
  ROLES.TIM_PENGELOLA_CPL,
] as const;

// Display name mapping (untuk tampilan UI yang lebih singkat jika diperlukan)
export const formatRoleName = (roleName: string): string => {
  const roleMap: Record<string, string> = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.GKM]: 'GKM',
    [ROLES.KETUA_DEPARTEMEN]: 'Kadep',
    [ROLES.SEKRETARIS_DEPARTEMEN]: 'Sekdep',
    [ROLES.PEMBIMBING_1]: 'Pembimbing 1',
    [ROLES.PEMBIMBING_2]: 'Pembimbing 2',
    [ROLES.MAHASISWA]: 'Mahasiswa',
    [ROLES.PENGUJI]: 'Penguji',
    [ROLES.KOORDINATOR_YUDISIUM]: 'Koordinator Yudisium',
    [ROLES.TIM_PENGELOLA_CPL]: 'Tim Pengelola CPL',
    [ROLES.DOSEN_METOPEN]: 'Dosen Pengampu Metopel',
  };
  return roleMap[roleName] || roleName;
};

// Role options for dropdowns/selects
export const roleOptions = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.GKM, label: 'GKM' },
  { value: ROLES.KETUA_DEPARTEMEN, label: 'Ketua Departemen' },
  { value: ROLES.SEKRETARIS_DEPARTEMEN, label: 'Sekretaris Departemen' },
  { value: ROLES.PEMBIMBING_1, label: 'Pembimbing 1' },
  { value: ROLES.PEMBIMBING_2, label: 'Pembimbing 2' },
  { value: ROLES.MAHASISWA, label: 'Mahasiswa' },
  { value: ROLES.PENGUJI, label: 'Penguji' },
  { value: ROLES.KOORDINATOR_YUDISIUM, label: 'Koordinator Yudisium' },
  { value: ROLES.TIM_PENGELOLA_CPL, label: 'Tim Pengelola CPL' },
  { value: ROLES.DOSEN_METOPEN, label: 'Dosen Pengampu Metopel' },
];

// Helper functions
export const isStudentRole = (roleName: string): boolean => 
  roleName === ROLES.MAHASISWA;

export const isLecturerRole = (roleName: string): boolean => 
  (LECTURER_ROLES as readonly string[]).includes(roleName);

export const isSupervisorRole = (roleName: string): boolean => 
  (SUPERVISOR_ROLES as readonly string[]).includes(roleName);
