const ROLE_LABEL_RE =
  /^(pembimbing [12]|pembimbing (utama|pendamping)|dosen pembimbing( [12])?)$/;

export function looksLikeSupervisorRoleLabel(value?: string | null): boolean {
  if (!value) return false;
  const key = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  return ROLE_LABEL_RE.test(key);
}

type LecturerLike = {
  id?: string | null;
  user?: { fullName?: string | null } | null;
} | null | undefined;

type AccessLike = {
  blockingRequest?: {
    lecturer?: LecturerLike;
    redirectTarget?: LecturerLike;
  } | null;
  latestRequest?: {
    lecturer?: LecturerLike;
    redirectTarget?: LecturerLike;
  } | null;
} | null;

/**
 * Snapshot TA-04 lama kadang menyimpan label peran ("Pembimbing 1") sebagai nama.
 * Prefer nama relasi hidup dari access-state bila label terdeteksi (FUN-013).
 */
export function resolveSupervisorDisplayName(
  name: string | null | undefined,
  lecturerId?: string | null,
  access?: AccessLike,
): string {
  const trimmed = String(name ?? "").trim();
  if (!looksLikeSupervisorRoleLabel(trimmed)) {
    return trimmed;
  }

  const lecturers = [
    access?.blockingRequest?.redirectTarget,
    access?.blockingRequest?.lecturer,
    access?.latestRequest?.redirectTarget,
    access?.latestRequest?.lecturer,
  ];

  for (const lecturer of lecturers) {
    if (!lecturer) continue;
    if (lecturerId && lecturer.id && lecturer.id !== lecturerId) continue;
    const liveName = lecturer.user?.fullName?.trim();
    if (liveName && !looksLikeSupervisorRoleLabel(liveName)) {
      return liveName;
    }
  }

  return "";
}
