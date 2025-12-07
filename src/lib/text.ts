export function toTitleCaseName(input?: string | null): string {
  if (!input) return "-";
  const s = String(input).trim().toLowerCase();
  if (!s) return "-";
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function formatRoleName(input?: string | null): string {
  if (!input) return "-";
  const s = String(input).trim().toLowerCase();
  if (!s) return "-";
  
  // Map common role names to readable format
  const roleMap: Record<string, string> = {
    'pembimbing1': 'Pembimbing 1',
    'pembimbing 1': 'Pembimbing 1',
    'pembimbing2': 'Pembimbing 2',
    'pembimbing 2': 'Pembimbing 2',
    'penguji1': 'Penguji 1',
    'penguji 1': 'Penguji 1',
    'penguji2': 'Penguji 2',
    'penguji 2': 'Penguji 2',
    'koordinator': 'Koordinator',
    'admin': 'Admin',
    'mahasiswa': 'Mahasiswa',
    'dosen': 'Dosen',
  };
  
  return roleMap[s] || toTitleCaseName(s);
}

export function formatDateId(date?: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  try {
    const fmt = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return fmt.format(d);
  } catch {
    return d.toLocaleString();
  }
}

