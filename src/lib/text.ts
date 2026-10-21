export function toTitleCaseName(input?: string | null): string {
  if (!input) return "-";
  const s = String(input).trim().toLowerCase();
  if (!s) return "-";
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * A lecturer's name with academic degrees: the name is title-cased like `toTitleCaseName`,
 * and whatever follows the first comma (the degrees) is kept exactly as written, so
 * "HUSNIL KAMIL, M.T" becomes "Husnil Kamil, M.T" and "…, M.Sc" does not turn into "M.sc".
 * A name without a comma is title-cased as a whole. Empty input gives "-".
 */
export function formatLecturerName(input?: string | null): string {
  if (!input) return "-";
  const text = String(input).trim();
  const comma = text.indexOf(",");
  if (comma === -1) return toTitleCaseName(text);

  const name = text.slice(0, comma).trim();
  const degrees = text.slice(comma + 1).trim();
  if (!name) return degrees || "-";
  return degrees ? `${toTitleCaseName(name)}, ${degrees}` : toTitleCaseName(name);
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

/**
 * Tanggal + jam bahasa Indonesia, selalu zona Asia/Jakarta, jam 24 jam dengan titik:
 * `14 Oktober 2026 14.00 WIB`, atau `Rabu, 14 Oktober 2026 14.00 WIB` bila `withWeekday`.
 * Nilai kosong/tidak valid → `-`. Tanggal tanpa jam: pakai `formatDateShortId`.
 */
export function formatDateTimeWib(date?: string | Date | null, options: { withWeekday?: boolean } = {}): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const text = `${get("day")} ${get("month")} ${get("year")} ${get("hour")}.${get("minute")} WIB`;
  return options.withWeekday ? `${get("weekday")}, ${text}` : text;
}

export function getInitials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format thesis document display name: NIM_Nama_LaporanTA
 * e.g. "2011521001_John Doe_LaporanTA"
 */
export function formatThesisDocName(nim?: string | null, fullName?: string | null): string {
  if (!nim && !fullName) return "Dokumen TA";
  const nimPart = nim || "unknown";
  const namePart = fullName
    ? toTitleCaseName(fullName).replace(/\s+/g, '_')
    : "unknown";
  return `${nimPart}_${namePart}_LaporanTA`;
}

/**
 * Safely truncate long file names while preserving extension if possible.
 * e.g. "Daftar Hadir Peserta Seminar Hasil - 2026-08-02.pdf" -> "Daftar Hadir Peser...pdf"
 */
export function truncateFileName(name?: string | null, maxLength = 26): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot > 0 && trimmed.length - lastDot <= 7) {
    const ext = trimmed.slice(lastDot);
    const base = trimmed.slice(0, lastDot);
    const available = maxLength - ext.length - 3;
    if (available > 3) {
      return `${base.slice(0, available)}...${ext}`;
    }
  }
  return `${trimmed.slice(0, maxLength - 3)}...`;
}


