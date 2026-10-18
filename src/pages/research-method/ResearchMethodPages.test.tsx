import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getEntryProblem } from '@/components/research-method/ScoreFormDialog';
import { buildProposalSteps } from '@/components/thesis-proposal/studentProposalState';
import * as service from '@/services/research-method/research-method.service';
import { expectColumnFits } from '@/test/columnFit';
import { expectFooter } from '@/test/dialogFooter';
import type { AssessmentQueue, AssessmentView, AttendanceOverview, ClassMonitoring as Monitoring } from '@/types/research-method.types';
import Attendance, { getFilesProblem } from './Attendance';
import ClassMonitoring from './ClassMonitoring';
import ProposalAssessment from './ProposalAssessment';
import LecturerThesisProposal from '../thesis-proposal/LecturerThesisProposal';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/research-method/research-method.service');
vi.mock('@/services/admin.service', () => ({ getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [] })) }));
vi.mock('@/hooks/shared/useActiveAcademicYear', () => ({ useActiveAcademicYear: () => ({ academicYear: { id: 'ay-1' } }) }));
const roles = vi.hoisted(() => ({ coordinator: false, kadep: false }));
vi.mock('@/hooks/shared/useRole', () => ({
  useRole: () => ({ isResearchMethodCoordinator: () => roles.coordinator, isKadep: () => roles.kadep, isAdmin: () => false }),
}));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const view = (overrides: Partial<AssessmentView> = {}): AssessmentView => ({
  id: 'a1',
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  minimumScore: 60,
  thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [] },
  student: { id: 's1', fullName: 'Uji Proposal Siap Dinilai', identityNumber: '2211528013' },
  proposal: { fileName: 'p.pdf', url: '/uploads/thesis/t1/proposal/a1/p.pdf', submittedAt: '2026-10-10T00:00:00Z' },
  supervisorScore: null,
  coordinatorScore: null,
  finalScore: null,
  isFinalized: false,
  result: null,
  attendance: { attendancePercentage: 0.9375, isEligible: true, presentCount: 15, totalMeetings: 16 },
  attendanceAutoZeroed: false,
  canScore: true,
  scoreBlockReason: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  roles.coordinator = false;
  roles.kadep = false;
});

describe('form rules (R22)', () => {
  const criterion = { id: 'c1', name: 'Presentasi', maxScore: 20, cpmk: { id: 'k', code: 'CPMK-01', description: '' }, rubrics: [{ id: 'r1', minScore: 0, maxScore: 8, description: 'Kurang' }, { id: 'r2', minScore: 9, maxScore: 20, description: 'Baik' }] };
  it('explains what is missing before sending', () => {
    expect(getEntryProblem(criterion, undefined)).toMatch(/belum diisi/);
    expect(getEntryProblem(criterion, { rubricId: '', score: '15' })).toMatch(/Pilih tingkat rubrik/);
    expect(getEntryProblem(criterion, { rubricId: 'r1', score: '15' })).toMatch(/0–8/);
    expect(getEntryProblem(criterion, { rubricId: 'r2', score: '21' })).toMatch(/0–20/);
    expect(getEntryProblem(criterion, { rubricId: 'r2', score: '15' })).toBeNull();
    expect(getEntryProblem({ ...criterion, rubrics: [] }, { rubricId: '', score: '15' })).toBeNull();
  });

  it('attendance files: 1–2 Excel files', () => {
    expect(getFilesProblem([])).toMatch(/Pilih 1–2/);
    expect(getFilesProblem([new File(['x'], 'a.pdf')])).toMatch(/xlsx/);
    expect(getFilesProblem([new File(['x'], 'a.xlsx'), new File(['x'], 'b.xlsx'), new File(['x'], 'c.xlsx')])).toMatch(/Maksimal 2/);
    expect(getFilesProblem([new File(['x'], 'a.xlsx')])).toBeNull();
  });

  it('Paket P9 (2): the stepper tells the student where the assessment stands', () => {
    const base = { id: 'a', academicYear: { id: 'ay', label: 'x' }, file: { fileName: 'p', fileSize: 1, url: 'u', submittedAt: null }, supervisorScored: true, coordinatorScored: false, isFinalized: false, finalScore: null, result: null, attendanceAutoZeroed: false };
    const stepOf = (current: typeof base | null) => buildProposalSteps({
      thesis: { id: 't', title: 'x', status: 'proposal', startDate: null, topic: null, academicYear: null, supervisors: [] },
      assignment: { assigned: true, assignedAt: null, semesterLabel: null, version: 1, waitingReason: null },
      finalProposal: { academicYear: null, current: current as never, canSubmit: true, blockReason: null, history: [] },
      proposalRevision: { applicable: false, evaluation: null, current: null, history: [], canSubmit: false, blockReason: null, replacesCurrent: false },
    }, undefined);
    expect(stepOf(null)[3]).toMatchObject({ state: 'waiting', note: 'Menunggu' });
    expect(stepOf(base)[3].note).toBe('Menunggu koordinator');
    const passed = stepOf({ ...base, isFinalized: true, result: 'passed' as never, finalScore: 82 as never });
    expect(passed[3]).toMatchObject({ state: 'done', note: 'Lulus' });
    expect(passed[4].note).toBe('Menunggu KRS Tugas Akhir semester berikutnya');
    expect(stepOf({ ...base, isFinalized: true, result: 'failed' as never, finalScore: 47 as never })[3]).toMatchObject({ state: 'failed', note: 'Tidak lulus, ulangi semester berikutnya' });
    expect(stepOf({ ...base, attendanceAutoZeroed: true })[3].state).toBe('failed');
  });
});

const queueOf = (rows: AssessmentView[]): AssessmentQueue => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil', isOperational: true },
  minimumScore: 60,
  rows,
});

describe('Tugas Akhir > Proposal (pembimbing), Paket P8', () => {
  const rows = [
    view({ id: 'a2', student: { id: 's2', fullName: 'Uji Lulus', identityNumber: '2211528015' }, supervisorScore: 64, coordinatorScore: 20, finalScore: 84, isFinalized: true, result: 'passed', canScore: false, scoreBlockReason: 'Penilaian proposal sudah final.' }),
    view({ id: null, proposal: null, student: { id: 's3', fullName: 'Uji Ditetapkan', identityNumber: '2211528010' }, canScore: false, scoreBlockReason: 'Mahasiswa belum mengajukan proposal final.' }),
    view(),
    view({ id: 'a4', student: { id: 's4', fullName: 'Uji Menunggu Koordinator', identityNumber: '2211528014' }, supervisorScore: 60, canScore: false, scoreBlockReason: 'Nilai pembimbing sudah dikirim.' }),
  ];

  it('the page title is outside the table; "Semua" puts what the supervisor has to score first', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    vi.mocked(service.getAssessmentForm).mockResolvedValue({ party: 'supervisor', academicYear: { id: 'ay-1', label: 'x' }, weight: 75, minimumScore: 60, criteria: [] });
    wrap(<LecturerThesisProposal />);

    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Proposal' }).closest('.rounded-xl, [class*="card"]')).toBeNull();
    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(bodyRows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      expect.stringContaining('Uji Proposal Siap Dinilai'),
      expect.stringContaining('Uji Menunggu Koordinator'),
      expect.stringContaining('Uji Ditetapkan'),
      expect.stringContaining('Uji Lulus'),
    ]);
    expect(within(bodyRows[0]).getByText('Perlu Dinilai')).toBeInTheDocument();
    expect(within(bodyRows[3]).getByText('Lulus')).toBeInTheDocument();
    expect(within(bodyRows[3]).getByText('64 + 20 = 84')).toBeInTheDocument();
    expect(screen.queryByText('passed')).not.toBeInTheDocument();

    const score = bodyRows.map((row) => within(row).getByRole('button', { name: 'Nilai Proposal' }) as HTMLButtonElement);
    expect(score.map((b) => b.disabled)).toEqual([false, true, true, true]);
    expect(score[2].parentElement).toHaveAttribute('title', 'Nilai Proposal: Mahasiswa belum mengajukan proposal final.');
    fireEvent.click(score[0]);
    await waitFor(() => expect(service.getAssessmentForm).toHaveBeenCalledWith('supervisor', 'ay-1'));
  });

  it('the longest status stays inside its cell; Status is filtered in its header', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    wrap(<LecturerThesisProposal />);
    await screen.findByText('Uji Menunggu Koordinator');
    const table = screen.getByRole('table');
    const header = within(table).getByRole('columnheader', { name: /Status/ });
    const cells = within(within(table).getAllByRole('row')[2]).getAllByRole('cell');
    expectColumnFits(header, cells[4], 'Menunggu Koordinator');
    expect(within(header).getByRole('button')).toBeInTheDocument();
  });

  it('the detail modal: Batal and Nilai Proposal when scoring is open, only Tutup otherwise', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    wrap(<LecturerThesisProposal />);
    const ready = (await screen.findByText('Uji Proposal Siap Dinilai')).closest('tr')!;
    fireEvent.click(within(ready).getByRole('button', { name: 'Lihat Detail' }));
    let detail = await screen.findByRole('dialog', { name: 'Detail Penilaian Proposal' });
    expectFooter(detail, ['Batal', 'Nilai Proposal']);
    expect(within(detail).getByText('Buka detail mahasiswa')).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(within(screen.getByText('Uji Lulus').closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    detail = await screen.findByRole('dialog', { name: 'Detail Penilaian Proposal' });
    expectFooter(detail, ['Tutup']);
  });
});

describe('Metode Penelitian > Penilaian Proposal (koordinator), Paket P8', () => {
  it('a reader sees the queue; the score action is disabled with the reason', async () => {
    vi.mocked(service.getCoordinatorQueue).mockResolvedValue(queueOf([
      view({ supervisorScore: 60, thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: null, supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1' }] } }),
    ]));
    wrap(<ProposalAssessment />);
    const row = (await screen.findByText('Uji Proposal Siap Dinilai')).closest('tr')!;
    expect(within(row).getByText('Perlu Dinilai')).toBeInTheDocument();
    expect(within(row).getByText(/Aina Hubby Aziira, M.Eng \(Pembimbing 1\)/)).toBeInTheDocument();
    const score = within(row).getByRole('button', { name: 'Nilai Proposal' });
    expect(score).toBeDisabled();
    expect(score.parentElement).toHaveAttribute('title', 'Nilai Proposal: Hanya Koordinator Metode Penelitian yang mengisi nilai koordinator.');
    expect(screen.getByRole('button', { name: /Rekap Nilai/ })).toBeEnabled();
  });

  it('the coordinator waiting for the supervisor sees "Menunggu Pembimbing", which fits its cell', async () => {
    roles.coordinator = true;
    vi.mocked(service.getCoordinatorQueue).mockResolvedValue(queueOf([view({ coordinatorScore: 22, canScore: false, scoreBlockReason: 'x' })]));
    wrap(<ProposalAssessment />);
    await screen.findByText('Uji Proposal Siap Dinilai');
    const table = screen.getByRole('table');
    expectColumnFits(within(table).getByRole('columnheader', { name: /Status/ }), within(within(table).getAllByRole('row')[1]).getAllByRole('cell')[4], 'Menunggu Pembimbing');
  });
});

describe('Monitoring Kelas', () => {
  const monitoring: Monitoring = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    minimumScore: 60,
    summary: { total: 1, withSupervisor: 1, assigned: 1, finalProposal: 1, finalized: 0, passed: 0, failed: 0, promoted: 0 },
    rows: [{
      studentId: 's1', fullName: 'Uji Proposal Siap Dinilai', identityNumber: '2211528013',
      thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [], proposalGuidances: 2 },
      request: { status: 'assigned', route: 'direct' },
      attendance: { attendancePercentage: 0.9375, isEligible: true },
      assessment: null,
    }],
  };

  it('shows labels, not raw values; readers do not get the Proses Kelulusan panel (Paket P9: a panel of its own)', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    wrap(<ClassMonitoring />);
    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    // Paket P8: the stage of the row instead of raw values.
    expect(screen.getByText('Bimbingan Proposal')).toBeInTheDocument();
    expect(screen.getByText(/^Ditetapkan 1 Sep/)).toBeInTheDocument();
    expect(screen.queryByText('assigned')).not.toBeInTheDocument();
    expect(screen.queryByText('guidance')).not.toBeInTheDocument();
    expect(screen.getByText('2 sesi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Proses Kelulusan' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(service.getPromotionPreview).not.toHaveBeenCalled();
  });

  it('Paket P8: "Semua" puts the stages that need attention first; the longest stage fits its cell', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue({
      ...monitoring,
      rows: [
        monitoring.rows[0],
        { studentId: 's5', fullName: 'Uji Tanpa Pembimbing', identityNumber: '2211528001', thesis: null, request: null, attendance: null, assessment: null },
      ],
    });
    wrap(<ClassMonitoring />);
    await screen.findByText('Uji Tanpa Pembimbing');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Belum Ada Pembimbing')).toBeInTheDocument();
    expectColumnFits(within(table).getByRole('columnheader', { name: /Tahap/ }), within(rows[0]).getAllByRole('cell')[2], 'Belum Ada Pembimbing');
    expect(screen.getByRole('heading', { level: 1, name: 'Monitoring Kelas' })).toBeInTheDocument();
  });

  it('lets the coordinator run the promotion when someone may move up', async () => {
    roles.coordinator = true;
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    vi.mocked(service.getPromotionPreview).mockResolvedValue({
      academicYear: { id: 'ay-1', label: 'x' },
      rows: [{ thesisId: 't9', title: 'T', student: { id: 's9', fullName: 'Uji Siap Naik', identityNumber: '2211528016' }, finalScore: 76, passedIn: '2025/2026 Genap', assignedIn: '2025/2026 Genap', decision: 'promote', reason: 'Lulus dan KRS terkonfirmasi.' }],
    });
    vi.mocked(service.runPromotion).mockResolvedValue({ success: true, data: { academicYear: null, promoted: [], deferred: [], failed: [] } });
    wrap(<ClassMonitoring />);
    fireEvent.click(await screen.findByRole('button', { name: /^Proses Kelulusan/ }));
    expect(await screen.findByText('Siap Naik')).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Jalankan Proses Kelulusan/ }));
    await waitFor(() => expect(service.runPromotion).toHaveBeenCalled());
  });
});

describe('Metode Penelitian > Presensi, Paket P8', () => {
  const overview: AttendanceOverview = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    thresholdPercent: 75,
    current: {
      id: 'imp-1', academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, classCode: 'A', courseName: 'Metode Penelitian', semesterLabel: null, lecturerNames: [],
      sourceFiles: [{ index: 0, originalName: 'kelas-a.xlsx', classCode: 'A', rowCount: 3, fileSize: 10, url: '/x' }],
      thresholdPercent: 75,
      totals: { totalRows: 3, matchedRows: 2, unmatchedRows: 1, eligibleRows: 2, ineligibleRows: 1 },
      uploadedAt: '2026-10-01T03:00:00.000Z',
      uploadedBy: { id: 'u', fullName: 'HUSNIL KAMIL, MT' },
      records: [
        { id: 'r1', identityNumber: '2211528013', studentName: 'UJI PROPOSAL SIAP DINILAI', matched: true, presentCount: 15, totalMeetings: 16, attendancePercentage: 0.9375, isEligible: true },
        { id: 'r2', identityNumber: '2211528099', studentName: 'NIM ASING', matched: false, presentCount: 16, totalMeetings: 16, attendancePercentage: 1, isEligible: true },
        { id: 'r3', identityNumber: '2211528017', studentName: 'UJI PRESENSI KURANG', matched: true, presentCount: 10, totalMeetings: 16, attendancePercentage: 0.625, isEligible: false },
      ],
    },
    history: [],
  };

  it('lists the attendance below 75% first, with labels; uploading is the coordinator\'s', async () => {
    vi.mocked(service.getAttendance).mockResolvedValue(overview);
    wrap(<Attendance />);
    await screen.findByText('Uji Presensi Kurang');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['2211528017', '2211528099', '2211528013']);
    expect(within(rows[0]).getByText('Di Bawah 75%')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Tidak Dikenal')).toBeInTheDocument();
    expectColumnFits(within(table).getByRole('columnheader', { name: /Status/ }), within(rows[0]).getAllByRole('cell')[4], 'Di Bawah 75%');
    // Paket P9 (9): Pilih Berkas is a Button; the reason is in the tooltip; two panels.
    const choose = screen.getByRole('button', { name: /Pilih Berkas/ });
    expect(choose).toBeDisabled();
    expect(choose.parentElement).toHaveAttribute('title', 'Hanya Koordinator Metode Penelitian yang mengunggah presensi.');
    expect(screen.getByLabelText('Berkas presensi')).toHaveClass('hidden');
    expect(screen.getByRole('button', { name: /Unggah dan Terapkan/ })).toBeDisabled();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Riwayat Unggahan' }));
    expect(await screen.findByText('Belum ada unggahan sebelumnya pada periode ini.')).toBeInTheDocument();
  });
});
