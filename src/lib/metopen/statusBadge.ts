/**
 * Shared status badge maps for SIMPTA advisor-request surfaces
 * (Cari Pembimbing, Inbox Dosen, DSS KaDep).
 *
 * Keeps pastel Badge styling consistent with NeoCentral house style
 * (Yudisium-style bg-*-50 / text-*-700 / border-*-200).
 */

export type StatusBadgeConfig = {
  label: string;
  className: string;
};

/** Traffic-light kuota untuk katalog dosen (mahasiswa). */
export const TRAFFIC_LIGHT_CONFIG = {
  green: {
    label: 'Tersedia',
    color: 'bg-emerald-500',
    badgeVariant: 'default' as const,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  },
  yellow: {
    label: 'Hampir Penuh',
    color: 'bg-amber-500',
    badgeVariant: 'default' as const,
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-200',
  },
  red: {
    label: 'Penuh',
    color: 'bg-red-500 text-white',
    badgeVariant: 'default' as const,
    badgeClass: 'bg-red-500/15 text-red-700 border-red-200',
  },
} as const;

export type TrafficLightKey = keyof typeof TRAFFIC_LIGHT_CONFIG;

/**
 * Canonical user-facing labels for advisor request status.
 * Backend may expose ~15 states; UI consolidates to ≤6 labels for mahasiswa,
 * with slightly more detail for dosen/KaDep via the same map.
 */
export const ADVISOR_REQUEST_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  pending: { label: 'Menunggu Dosen', className: 'bg-blue-500/15 text-blue-700 border-blue-200' },
  under_review: { label: 'Sedang Ditinjau', className: 'bg-indigo-500/15 text-indigo-700 border-indigo-200' },
  pending_kadep: { label: 'Menunggu KaDep', className: 'bg-purple-500/15 text-purple-700 border-purple-200' },
  escalated: { label: 'Menunggu KaDep', className: 'bg-purple-500/15 text-purple-700 border-purple-200' },
  booking_approved: { label: 'Booking Disetujui', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' },
  active_official: { label: 'Aktif Resmi', className: 'bg-green-500/15 text-green-700 border-green-200' },
  approved: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  override_approved: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  assigned: { label: 'Ditetapkan', className: 'bg-green-500/15 text-green-700 border-green-200' },
  revision_requested: { label: 'Perlu Revisi', className: 'bg-amber-500/15 text-amber-700 border-amber-200' },
  rejected_by_dosen: { label: 'Ditolak Dosen', className: 'bg-red-500/15 text-red-700 border-red-200' },
  rejected_by_kadep: { label: 'Ditolak KaDep', className: 'bg-red-500/15 text-red-700 border-red-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-500/15 text-red-700 border-red-200' },
  redirected: { label: 'Dialihkan', className: 'bg-amber-500/15 text-amber-700 border-amber-200' },
  canceled: { label: 'Ditarik', className: 'bg-muted text-muted-foreground border-border' },
  withdrawn: { label: 'Ditarik', className: 'bg-muted text-muted-foreground border-border' },
};

/** Mahasiswa-facing consolidation (≤6 labels) — used on Cari Pembimbing. */
export const ADVISOR_REQUEST_STATUS_STUDENT_CONFIG: Record<string, StatusBadgeConfig> = {
  ...ADVISOR_REQUEST_STATUS_CONFIG,
  booking_approved: { label: 'Disetujui', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' },
  active_official: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  approved: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  override_approved: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  assigned: { label: 'Disetujui', className: 'bg-green-500/15 text-green-700 border-green-200' },
  rejected_by_dosen: { label: 'Ditolak', className: 'bg-red-500/15 text-red-700 border-red-200' },
  rejected_by_kadep: { label: 'Ditolak', className: 'bg-red-500/15 text-red-700 border-red-200' },
};

export function getAdvisorRequestStatus(
  status: string | null | undefined,
  audience: 'student' | 'staff' = 'staff',
): StatusBadgeConfig {
  const map =
    audience === 'student'
      ? ADVISOR_REQUEST_STATUS_STUDENT_CONFIG
      : ADVISOR_REQUEST_STATUS_CONFIG;
  if (!status) {
    return { label: '-', className: 'bg-muted text-muted-foreground border-border' };
  }
  return map[status] ?? { label: 'Status tidak dikenali', className: 'bg-muted text-muted-foreground border-border' };
}

export function getTrafficLightConfig(key: string | null | undefined) {
  if (key && key in TRAFFIC_LIGHT_CONFIG) {
    return TRAFFIC_LIGHT_CONFIG[key as TrafficLightKey];
  }
  return TRAFFIC_LIGHT_CONFIG.yellow;
}
