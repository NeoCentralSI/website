/**
 * Paket P9 (5, 6): Tugas Akhir → Penetapan (one table per panel, a semester for the page) and
 * Kelola → Batas Bimbingan (three charts, the Beban Dosen table, the limit toolbar).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import KadepThesisSupervisorAssignment from '@/pages/thesis-proposal/KadepThesisSupervisorAssignment';
import SupervisionQuotaPage from '@/pages/thesis-proposal/SupervisionQuota';
import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import * as quota from '@/services/thesis-proposal/supervision-quota.service';
import { expectFooter } from '@/test/dialogFooter';
import { expectColumnFits } from '@/test/columnFit';
import type {
  AssignmentBatch,
  AssignmentBoard,
  AssignmentBoardRow,
  LecturerLoadRow,
  SupervisionLoadOverview,
  SupervisorRequest,
} from '@/types/thesis-proposal.types';

const roles = vi.hoisted(() => ({ kadep: true, sekdep: false }));

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-assignment.service');
vi.mock('@/services/thesis-proposal/supervision-quota.service');
vi.mock('@/services/lecturerGuidance.service', () => ({ approveSupervisor2KadepRequest: vi.fn(), rejectSupervisor2KadepRequest: vi.fn() }));
vi.mock('@/services/admin.service', () => ({
  getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [{ id: 'ay-1', semester: 'ganjil', year: '2026/2027', isActive: true }, { id: 'ay-0', semester: 'genap', year: '2025/2026', isActive: false }] })),
}));
vi.mock('@/hooks/shared/useRole', () => ({
  useRole: () => ({ isKadep: () => roles.kadep, isSekdep: () => roles.sekdep, isAdmin: () => false }),
}));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));
vi.mock('@/components/monitoring/ActivityDistributionChart', () => ({
  ActivityDistributionChart: (props: { title: string; activityDistribution: { value: string; count: number }[]; labelOf: (v: string) => string }) => (
    <div data-testid="chart">{props.title}: {props.activityDistribution.map((r) => `${props.labelOf(r.value)} ${r.count}`).join(', ')}</div>
  ),
}));
vi.mock('@/components/monitoring/TopicDistributionChart', () => ({
  TopicDistributionChart: (props: { title: string; topicDistribution: { name: string; count: number }[] }) => (
    <div data-testid="chart">{props.title}: {props.topicDistribution.map((r) => `${r.name} ${r.count}`).join(', ')}</div>
  ),
}));

function wrap(ui: ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></QueryClientProvider>);
}

const person = (lecturerId: string, fullName: string, role: string, activeCount = 3, acceptingRequests = true) => ({
  lecturerId, fullName, role, acceptingRequests,
  load: { activeCount, softLimit: 8, hardLimit: 10, level: activeCount >= 10 ? 'full' as const : 'available' as const },
});
const request = (overrides: Partial<SupervisorRequest> = {}): SupervisorRequest => ({
  id: 'r', status: 'pending_kadep', route: 'department', createdAt: '2026-10-10T03:00:00.000Z', updatedAt: '2026-10-10T03:00:00.000Z',
  academicYear: null, isCurrentPeriod: true, student: { id: 's', fullName: 'BUDI', identityNumber: '2211528001' }, topic: null,
  proposedTitle: 'Judul', backgroundSummary: 'Latar', problemStatement: 'Rumusan', proposedSolution: 'Solusi', researchObject: 'Objek',
  researchPermitStatus: 'not_required', studentJustification: null, lecturer: null, redirectTarget: null, supervisor: null,
  ...overrides,
} as SupervisorRequest);

function row(studentId: string, name: string, overrides: Partial<AssignmentBoardRow>): AssignmentBoardRow {
  return {
    studentId, thesisId: `t-${studentId}`, student: { fullName: name, identityNumber: `22115280${studentId}` }, title: `Judul ${name}`,
    supervisors: [], candidate: null, submission: 'approved', waiting: false, requestStatus: 'assigned',
    assignment: { inCohort: true, assigned: true, version: 2 }, request: request({ id: `r-${studentId}`, status: 'assigned', route: 'direct' }),
    supervisor2Request: null, history: [], proposal: null, requestedAt: null,
    ...overrides,
  };
}

const batch = (overrides: Partial<AssignmentBatch> = {}): AssignmentBatch => ({
  id: 'b2', version: 2, status: 'current', generatedAt: '2026-10-01T03:00:00.000Z', generatedBy: { id: 'k', fullName: 'DR. KADEP, M.T' },
  fileName: 'Penetapan-v2.pdf', fileSize: 1, memberCount: 2, fileUrl: '/thesis-proposals/supervisor-assignments/batches/b2/file', ...overrides,
});

const board = (overrides: Partial<AssignmentBoard> = {}): AssignmentBoard => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil', isOperational: true },
  rows: [
    row('01', 'DEPA DEPARTEMEN', { submission: 'department_waiting', waiting: true, requestStatus: 'pending_kadep', assignment: { inCohort: false, assigned: false, version: null }, supervisors: [], request: request({ id: 'dep-1' }) }),
    row('02', 'OKTA KUOTA', {
      submission: 'over_quota_waiting', waiting: true, requestStatus: 'pending_kadep', assignment: { inCohort: false, assigned: false, version: null },
      candidate: person('l9', 'DOSEN PENUH, M.T', 'Pembimbing 1', 10),
      request: { ...request({ id: 'oq-1', route: 'over_quota' }), lecturerLoad: { activeCount: 10, softLimit: 8, hardLimit: 10, level: 'full', projectedCount: 11, overBy: 1 } },
    }),
    row('03', 'PUTRI PEMBIMBING', {
      submission: 'supervisor2_waiting', waiting: true, supervisors: [person('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Pembimbing 1')],
      candidate: person('l2', 'DOSEN TUTUP, M.Kom', 'Pembimbing 2', 4, false),
      supervisor2Request: { requestId: 'n-1', thesisId: 't-03', studentId: '03', lecturerId: 'l2', studentName: 'Putri', lecturerName: 'Dosen Tutup', thesisTitle: 'Judul', requestedAt: '2026-10-12T03:00:00.000Z', lecturerLoad: null },
    }),
    row('04', 'BARU DISETUJUI', { assignment: { inCohort: true, assigned: false, version: null }, requestStatus: 'accepted', supervisors: [person('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Pembimbing 1')] }),
    row('05', 'LAMA DITETAPKAN', { assignment: { inCohort: true, assigned: true, version: 12 }, supervisors: [person('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Pembimbing 1'), person('l3', 'HUSNIL KAMIL, MT', 'Pembimbing 2')] }),
    row('06', 'TINA DITOLAK', { submission: 'rejected', requestStatus: 'rejected_by_kadep', assignment: { inCohort: false, assigned: false, version: null } }),
  ],
  counts: { waiting: 3, cohort: 3 },
  currentBatch: batch(),
  batches: [batch(), batch({ id: 'b1', version: 1, status: 'superseded', memberCount: 1 })],
  upToDate: false,
  needsIssue: true,
  newCount: 1,
  ...overrides,
});

const lecturer = (id: string, fullName: string, activeCount: number, level: LecturerLoadRow['level'], acceptingRequests = true, group = 'Sistem Informasi'): LecturerLoadRow => ({
  lecturerId: id, fullName, identityNumber: null, scienceGroup: { id: group, name: group }, acceptingRequests, activeCount, level,
  breakdown: { total: activeCount, waitingAssignment: 1, proposal: 2, research: activeCount - 3, onLeave: 0, asSupervisor2: 4 },
});
const loads = (overrides: Partial<SupervisionLoadOverview> = {}): SupervisionLoadOverview => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  general: { softLimit: 8, hardLimit: 10 },
  period: null,
  applicable: { softLimit: 8, hardLimit: 10, source: 'general' },
  lecturers: [
    lecturer('l1', 'ULLYA MEGA WAHYUNI, M.Kom', 7, 'available', true, 'Jaringan'),
    lecturer('l2', 'HUSNIL KAMIL, MT', 99, 'near_limit', false),
    lecturer('l3', 'AFRIYANTI DWI KARTIKA, MT', 100, 'full'),
  ],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  roles.kadep = true;
  roles.sekdep = false;
  vi.mocked(assignments.getAssignmentBoard).mockResolvedValue(board());
  vi.mocked(quota.getLoadOverview).mockResolvedValue(loads());
});

const tableRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('Penetapan Pembimbing (Paket P9, 5)', () => {
  it('three panels; one table, one row per student, waiting decisions first', async () => {
    wrap(<KadepThesisSupervisorAssignment />);
    expect(await screen.findByText('Depa Departemen')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(Penetapan|Riwayat Versi|Beban Dosen)/ }).map((b) => b.textContent)).toEqual(['Penetapan3', 'Riwayat Versi', 'Beban Dosen']);
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.queryByText(/Penetapan Pembimbing 2026\/2027 Ganjil/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Periode akademik')).toBeInTheDocument();

    const rows = tableRows();
    expect(rows.map((r) => within(r).getAllByRole('cell')[3].textContent)).toEqual([
      'Jalur Departemen · Menunggu Keputusan',
      'Di Atas Kuota · Menunggu Keputusan',
      'Pembimbing 2 · Menunggu Keputusan',
      'Disetujui',
      'Disetujui',
      'Ditolak',
    ]);
    expect(within(rows[3]).getByText('Belum Ditetapkan')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expectColumnFits(within(table).getByRole('columnheader', { name: /Pengajuan/ }), within(rows[0]).getAllByRole('cell')[3], 'Jalur Departemen · Menunggu Keputusan');
    expectColumnFits(within(table).getByRole('columnheader', { name: /Penetapan/ }), within(rows[4]).getAllByRole('cell')[4], 'Ditetapkan (versi 12)');
    // P1 and P2 stacked; the candidate of a waiting decision under them.
    expect(within(rows[4]).getAllByRole('cell')[2]).toHaveTextContent('1. Aina Hubby Aziira, M.Eng2. Husnil Kamil, MT');
    expect(within(rows[2]).getByText(/Calon Pembimbing 2: Dosen Tutup/)).toBeInTheDocument();

    // Row actions by kind: department, over quota (never Tolak), Pembimbing 2 (closed intake), decided.
    expect(within(rows[0]).getByRole('button', { name: 'Tetapkan Pembimbing' })).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: 'Tolak' })).toBeInTheDocument();
    expect(within(rows[1]).getByRole('button', { name: 'Alihkan ke Dosen Lain' })).toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button', { name: 'Tolak' })).not.toBeInTheDocument();
    expect(within(rows[2]).getByRole('button', { name: 'Setujui' })).toBeDisabled();
    expect(within(rows[3]).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Lihat Detail']);
  });

  it('filters Pengajuan and Penetapan in their headers', async () => {
    wrap(<KadepThesisSupervisorAssignment />);
    await screen.findByText('Depa Departemen');
    const table = screen.getByRole('table');
    expect(within(within(table).getByRole('columnheader', { name: /Pengajuan/ })).getByRole('button')).toBeInTheDocument();
    expect(within(within(table).getByRole('columnheader', { name: /Penetapan/ })).getByRole('button')).toBeInTheDocument();
  });

  it('the toolbar: search, Muat Ulang, Pratinjau PDF and the issue button with the count', async () => {
    vi.mocked(assignments.issueAssignment).mockResolvedValue({ success: true, data: { alreadyIssued: false } as never });
    wrap(<KadepThesisSupervisorAssignment />);
    await screen.findByText('Depa Departemen');
    expect(screen.getByPlaceholderText('Cari nama, NIM, judul, atau dosen...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toHaveClass('border');
    expect(screen.getByRole('button', { name: 'Pratinjau PDF' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Terbitkan Penetapan (1 baru)' }));
    expect(screen.getByText(/Versi 2 digantikan oleh versi 3 yang memuat 3 mahasiswa/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terbitkan' }));
    await waitFor(() => expect(assignments.issueAssignment).toHaveBeenCalledWith('ay-1', expect.anything()));
  });

  it('the detail modal has the standard footer of each kind', async () => {
    wrap(<KadepThesisSupervisorAssignment />);
    await screen.findByText('Depa Departemen');
    let rows = tableRows();
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Lihat Detail' }));
    let detail = await screen.findByRole('dialog', { name: 'Detail Penetapan' });
    expectFooter(detail, ['Batal', 'Tolak', 'Minta Revisi', 'Tetapkan Pembimbing']);
    fireEvent.click(within(detail).getByRole('button', { name: 'Batal' }));

    rows = tableRows();
    fireEvent.click(within(rows[1]).getByRole('button', { name: 'Lihat Detail' }));
    detail = await screen.findByRole('dialog', { name: 'Detail Penetapan' });
    expectFooter(detail, ['Batal', 'Alihkan', 'Setujui'], 'bila disetujui 11/10 (lebih 1)');
    fireEvent.click(within(detail).getByRole('button', { name: 'Batal' }));

    rows = tableRows();
    fireEvent.click(within(rows[2]).getByRole('button', { name: 'Lihat Detail' }));
    detail = await screen.findByRole('dialog', { name: 'Detail Penetapan' });
    expectFooter(detail, ['Batal', 'Tolak', 'Setujui'], 'menutup penerimaan');
    fireEvent.click(within(detail).getByRole('button', { name: 'Batal' }));

    rows = tableRows();
    fireEvent.click(within(rows[4]).getByRole('button', { name: 'Lihat Detail' }));
    detail = await screen.findByRole('dialog', { name: 'Detail Penetapan' });
    expectFooter(detail, ['Tutup']);
  });

  it('a past semester is read only', async () => {
    vi.mocked(assignments.getAssignmentBoard).mockResolvedValue(board({ academicYear: { id: 'ay-0', label: '2025/2026 Genap', isOperational: false } }));
    wrap(<KadepThesisSupervisorAssignment />, '/?semester=ay-0');
    await screen.findByText('Depa Departemen');
    expect(assignments.getAssignmentBoard).toHaveBeenCalledWith('ay-0');
    expect(within(tableRows()[0]).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Lihat Detail']);
    const issue = screen.getByRole('button', { name: 'Terbitkan Penetapan (1 baru)' });
    expect(issue).toBeDisabled();
    expect(issue.parentElement).toHaveAttribute('title', 'Semester lampau hanya bisa dilihat.');
  });

  it('Sekretaris Departemen reads: no decisions, no preview, issue disabled with the reason', async () => {
    roles.kadep = false;
    roles.sekdep = true;
    wrap(<KadepThesisSupervisorAssignment />);
    await screen.findByText('Depa Departemen');
    expect(screen.queryByRole('button', { name: 'Tetapkan Pembimbing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pratinjau PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Terbitkan Penetapan/ }).parentElement).toHaveAttribute('title', expect.stringMatching(/Hanya Ketua Departemen/));
  });

  it('Riwayat Versi is one table; Sekdep downloads only the current, complete version', async () => {
    roles.kadep = false;
    roles.sekdep = true;
    wrap(<KadepThesisSupervisorAssignment />, '/?tab=riwayat-versi');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Versi', 'Diterbitkan', 'Oleh', 'Mahasiswa', 'Status', 'Unduh']);
    const [current, old] = tableRows();
    // Not up to date: the current version waits for the new issue; the old one was replaced.
    expect(within(current).getByRole('button', { name: 'Unduh PDF' })).toBeDisabled();
    expect(within(old).getByRole('button', { name: 'Unduh PDF' })).toBeDisabled();
  });

  it('Beban Dosen: the toolbar follows the semester; the dialog is prefilled and can return to the general limit', async () => {
    vi.mocked(quota.getLoadOverview).mockResolvedValue(loads({ period: { softLimit: 6, hardLimit: 12 }, applicable: { softLimit: 6, hardLimit: 12, source: 'period' } }));
    vi.mocked(quota.clearPeriodLimits).mockResolvedValue({ success: true, data: loads(), message: 'ok' } as never);
    wrap(<KadepThesisSupervisorAssignment />, '/?tab=beban-dosen');
    expect(await screen.findByText('Batas lunak: 6')).toBeInTheDocument();
    expect(screen.getByText('Batas keras: 12')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Batas Semester Ini' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ubah Batas Semester Ini' });
    expect(within(dialog).getByLabelText('Batas lunak')).toHaveValue(6);
    expect(within(dialog).getByLabelText('Batas keras')).toHaveValue(12);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kembalikan ke Batas Umum' }));
    await waitFor(() => expect(quota.clearPeriodLimits).toHaveBeenCalledWith('ay-1'));
  });

  it('Beban Dosen of a past semester: the limits cannot be changed', async () => {
    vi.mocked(assignments.getAssignmentBoard).mockResolvedValue(board({ academicYear: { id: 'ay-0', label: '2025/2026 Genap', isOperational: false } }));
    wrap(<KadepThesisSupervisorAssignment />, '/?tab=beban-dosen&semester=ay-0');
    await screen.findByText('Batas lunak: 8');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ubah Batas Semester Ini' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Ubah Batas Semester Ini' }).parentElement).toHaveAttribute('title', 'Batas hanya bisa diubah untuk semester aktif.');
  });
});

describe('Batas Bimbingan (Paket P9, 6)', () => {
  it('three charts, then the Beban Dosen table with the general limit in its toolbar', async () => {
    vi.mocked(quota.getLoadOverview).mockResolvedValue(loads({ general: { softLimit: 8, hardLimit: 99 }, applicable: { softLimit: 8, hardLimit: 99, source: 'general' } }));
    wrap(<SupervisionQuotaPage />);
    expect(await screen.findByText('Batas lunak: 8')).toBeInTheDocument();
    expect(screen.getByText('Batas keras: 99')).toBeInTheDocument();
    expect(screen.getAllByTestId('chart').map((c) => c.textContent)).toEqual([
      'Tingkat Beban Dosen: Penuh 1, Mendekati Batas 1, Tersedia 1',
      'Beban per Kelompok Keilmuan: Sistem Informasi 199, Jaringan 7',
      'Bimbingan per Tahap: Menunggu Penetapan 3, Proposal 6, Penelitian 197',
    ]);
    expect(screen.queryByText('Batas Umum')).not.toBeInTheDocument();
    expect(screen.queryByText('Batas Periode')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Beban Dosen' })).not.toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Dosen', 'Beban', 'Menunggu Penetapan', 'Proposal', 'Penelitian', 'BSS', 'Pembimbing 2']);
    const rows = tableRows();
    expect(rows.map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual([
      expect.stringContaining('Afriyanti'), expect.stringContaining('Husnil'), expect.stringContaining('Ullya'),
    ]);
    expect(within(rows[1]).getAllByRole('cell')[0]).toHaveTextContent('Ditutup Dosen');
    expectColumnFits(within(table).getByRole('columnheader', { name: /Beban/ }), within(rows[1]).getAllByRole('cell')[1], '99/99 · Mendekati Batas');
    const asSupervisor2 = within(rows[0]).getAllByRole('cell')[6];
    expect(asSupervisor2).toHaveTextContent('4');
    expect(asSupervisor2.className).toContain('text-right');
  });

  it('Ubah Batas Umum: soft must not exceed hard', async () => {
    vi.mocked(quota.setGeneralLimits).mockResolvedValue({ success: true, data: loads(), message: 'ok' } as never);
    wrap(<SupervisionQuotaPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ubah Batas Umum' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ubah Batas Umum' });
    expect(within(dialog).queryByRole('button', { name: 'Kembalikan ke Batas Umum' })).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Batas lunak'), { target: { value: '11' } });
    expect(within(dialog).getByText('Batas lunak tidak boleh lebih besar dari batas keras.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Simpan' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Batas lunak'), { target: { value: '9' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    await waitFor(() => expect(quota.setGeneralLimits).toHaveBeenCalledWith({ softLimit: 9, hardLimit: 10 }));
  });
});
