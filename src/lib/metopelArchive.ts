/**
 * Archive mode for Metopel: mahasiswa sudah sah naik TA di NeoCentral
 * (`active_official` / thesis keluar fase proposal). KRS TA SIA saja,
 * apalagi booking released, tidak mengunci modul.
 */

export function isPromotedToActiveOfficial(input: {
  requestStatus?: string | null;
  latestRequestStatus?: string | null;
  activePromotionState?: string | null;
  activePromotedAt?: string | null;
  isProposal?: boolean | null;
}): boolean {
  return (
    input.requestStatus === "active_official" ||
    input.latestRequestStatus === "active_official" ||
    input.activePromotionState === "active_promoted" ||
    Boolean(input.activePromotedAt) ||
    input.isProposal === false
  );
}

export function isMetopenArchiveMode(input: {
  isMetopenArchive?: boolean | null;
  hasTakenMetopen?: boolean | null;
  takingThesisCourse?: boolean | null;
  metopenReadOnly?: boolean | null;
  requestStatus?: string | null;
  latestRequestStatus?: string | null;
  activePromotionState?: string | null;
  activePromotedAt?: string | null;
  isProposal?: boolean | null;
}): boolean {
  if (typeof input.isMetopenArchive === "boolean") return input.isMetopenArchive;
  if (typeof input.metopenReadOnly === "boolean") return input.metopenReadOnly;
  return isPromotedToActiveOfficial(input);
}
