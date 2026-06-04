/**
 * Label terpusat untuk jalur pengajuan pembimbing (advisor request).
 *
 * Canon §5.2: escalated TA-01 (Path C — mahasiswa kokoh ke dosen kuota merah)
 * adalah jalur INDEPENDEN dan BUKAN TA-02 (Path A — jalur departemen). Helper ini
 * mencegah mislabel escalated → "TA-02" yang sempat muncul di UI (audit F-1.1 / F-6.1).
 *
 * Pemetaan `AdvisorRequestRoute` (schema Prisma):
 *  - `normal`    → Path B: TA-01 normal (kuota dosen hijau/kuning)
 *  - `escalated` → Path C: TA-01 escalated (kuota dosen merah, mahasiswa kokoh)
 *  - `dept`      → Path A: TA-02 (jalur departemen, mahasiswa belum punya calon)
 */
export type AdvisorRouteType = "normal" | "escalated" | "dept";

/** Label ringkas untuk badge/kode (mis. stepCard, riwayat). */
export function formatAdvisorRouteCode(routeType?: string | null): string {
  switch (routeType) {
    case "escalated":
      return "TA-01 (Escalated)";
    case "dept":
      return "TA-02";
    case "normal":
      return "TA-01";
    default:
      return "TA-01 / TA-02";
  }
}

/** Status proses ringkas per jalur untuk ringkasan tahap mahasiswa. */
export function formatAdvisorRouteProcessing(routeType?: string | null): string {
  switch (routeType) {
    case "escalated":
      return "Jalur escalated TA-01 sedang diproses";
    case "dept":
      return "Jalur TA-02 (departemen) sedang diproses";
    case "normal":
      return "Jalur TA-01 sedang diproses";
    default:
      return "Pilih jalur yang sesuai";
  }
}
