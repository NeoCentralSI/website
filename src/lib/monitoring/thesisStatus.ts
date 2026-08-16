/**
 * Label status alur SIMPTA untuk permukaan monitoring (KaDep + Sekdep).
 *
 * Nilainya diturunkan di backend dari kolom yang benar-benar ditulis alur
 * proposal, bukan dari lookup `thesis_status` milik Modul TA yang tidak pernah
 * diperbarui (SIMPTA-FUN-023). Modul ini hanya memetakan label ke gaya badge,
 * supaya tidak ada rantai if-else status yang tersebar di komponen.
 */

export const THESIS_MONITORING_STATUS = {
  NO_ADVISOR: 'Belum Ada Pembimbing',
  ADVISOR_REQUEST: 'Pengajuan Pembimbing',
  AWAITING_TA04: 'Menunggu TA-04',
  PROPOSAL_GUIDANCE: 'Bimbingan Proposal',
  TA03_PUBLISHED: 'Nilai TA-03 Terbit',
  ACTIVE_THESIS: 'Aktif TA',
} as const;

export type ThesisMonitoringStatus =
  (typeof THESIS_MONITORING_STATUS)[keyof typeof THESIS_MONITORING_STATUS];

export type ThesisStatusStyle = {
  label: string;
  /** Kelas Badge (pastel, sesuai house style). */
  className: string;
  /** Kelas isian bar progres pada kartu distribusi. */
  barClassName: string;
  /** Warna solid untuk chart Recharts, yang tidak bisa membaca kelas Tailwind. */
  chartColor: string;
};

const UNKNOWN_STATUS: ThesisStatusStyle = {
  label: 'Tidak Diketahui',
  className: 'bg-muted text-muted-foreground border-border',
  barClassName: 'bg-muted-foreground',
  chartColor: '#94a3b8',
};

const STATUS_STYLES: Record<string, ThesisStatusStyle> = {
  [THESIS_MONITORING_STATUS.NO_ADVISOR]: {
    label: THESIS_MONITORING_STATUS.NO_ADVISOR,
    className: 'bg-muted text-muted-foreground border-border',
    barClassName: 'bg-muted-foreground',
    chartColor: '#94a3b8',
  },
  [THESIS_MONITORING_STATUS.ADVISOR_REQUEST]: {
    label: THESIS_MONITORING_STATUS.ADVISOR_REQUEST,
    className: 'bg-blue-500/15 text-blue-700 border-blue-200',
    barClassName: 'bg-blue-500',
    chartColor: '#3b82f6',
  },
  [THESIS_MONITORING_STATUS.AWAITING_TA04]: {
    label: THESIS_MONITORING_STATUS.AWAITING_TA04,
    className: 'bg-amber-500/15 text-amber-700 border-amber-200',
    barClassName: 'bg-amber-500',
    chartColor: '#f59e0b',
  },
  [THESIS_MONITORING_STATUS.PROPOSAL_GUIDANCE]: {
    label: THESIS_MONITORING_STATUS.PROPOSAL_GUIDANCE,
    className: 'bg-indigo-500/15 text-indigo-700 border-indigo-200',
    barClassName: 'bg-indigo-500',
    chartColor: '#6366f1',
  },
  [THESIS_MONITORING_STATUS.TA03_PUBLISHED]: {
    label: THESIS_MONITORING_STATUS.TA03_PUBLISHED,
    className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
    barClassName: 'bg-emerald-500',
    chartColor: '#10b981',
  },
  [THESIS_MONITORING_STATUS.ACTIVE_THESIS]: {
    label: THESIS_MONITORING_STATUS.ACTIVE_THESIS,
    className: 'bg-green-500/15 text-green-700 border-green-200',
    barClassName: 'bg-green-500',
    chartColor: '#22c55e',
  },
};

export function getThesisStatusStyle(status: string | null | undefined): ThesisStatusStyle {
  if (!status) return UNKNOWN_STATUS;
  return STATUS_STYLES[status] ?? { ...UNKNOWN_STATUS, label: status };
}
