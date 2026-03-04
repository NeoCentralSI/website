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

/**
 * Format a date to "Senin, 2 Maret 2026" (date only, no time, long month name).
 * Safe for both full ISO timestamps and @db.Date fields (UTC midnight).
 */
export function formatDateOnlyId(date?: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format a timestamp to "Senin, 2 Maret 2026, 21.35" (long month, with time).
 */
export function formatDateTimeId(date?: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Format a date to "2 Maret 2026" (day + long month + year, no weekday).
 */
export function formatDateShortId(date?: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function getInitials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


