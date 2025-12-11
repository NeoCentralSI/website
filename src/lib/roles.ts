export const formatRoleName = (roleName: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'Admin',
    'gkm': 'GKM',
    'kadep': 'Kadep',
    'pembimbing1': 'Pembimbing 1',
    'pembimbing2': 'Pembimbing 2',
    'student': 'Mahasiswa',
    'sekdep': 'Sekdep',
    'penguji': 'Penguji',
  };
  return roleMap[roleName] || roleName;
};

export const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'gkm', label: 'GKM' },
  { value: 'kadep', label: 'Kadep' },
  { value: 'pembimbing1', label: 'Pembimbing 1' },
  { value: 'pembimbing2', label: 'Pembimbing 2' },
  { value: 'student', label: 'Mahasiswa' },
  { value: 'sekdep', label: 'Sekdep' },
  { value: 'penguji', label: 'Penguji' },
];
