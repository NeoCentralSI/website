import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildClassCharts } from '@/components/research-method/ClassMonitoringCharts';
import { getScoreProblem, groupByCpmk, previewFinalScore, ProposalScoreForm } from '@/components/research-method/ProposalScoreForm';
import { buildProposalSteps } from '@/components/thesis-proposal/studentProposalState';
import * as service from '@/services/research-method/research-method.service';
import { expectColumnFits } from '@/test/columnFit';
import { expectFooter } from '@/test/dialogFooter';
import type { AssessmentCriterion, AssessmentQueue, AssessmentScoreForm, AssessmentView, ClassMonitoring as Monitoring, OtherPartyScore } from '@/types/research-method.types';
import ClassMonitoring from './ClassMonitoring';
import ProposalAssessment from './ProposalAssessment';
import ProposalScorePage from './ProposalScorePage';
import LecturerThesisProposal from '../thesis-proposal/LecturerThesisProposal';

// The charts measure their box; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/research-method/research-method.service');
vi.mock('@/services/admin.service', () => ({ getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [] })) }));
vi.mock('@/hooks/shared/useActiveAcademicYear', () => ({ useActiveAcademicYear: () => ({ academicYear: { id: 'ay-1' } }) }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

function wrap(ui: ReactNode, { path = '/', at = '/' }: { path?: string; at?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[at]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="/tugas-akhir/proposal/penilaian/:id" element={<p>Halaman nilai pembimbing</p>} />
          <Route path="/metode-penelitian/penilaian/:id" element={<p>Halaman nilai koordinator</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
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
  canScore: true,
  scoreBlockReason: null,
  ownDraftSaved: false,
  ...overrides,
});

const queueOf = (rows: AssessmentView[]): AssessmentQueue => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil', isOperational: true },
  minimumScore: 60,
  rows,
});

const criteria: (AssessmentCriterion & { score: number | null })[] = [
  { id: 'c1', name: 'Presentasi', maxScore: 20, cpmk: { id: 'k1', code: 'CPMK-01', description: 'Merumuskan masalah' }, rubrics: [{ id: 'r1', minScore: 0, maxScore: 8, description: 'Kurang' }, { id: 'r2', minScore: 9, maxScore: 20, description: 'Baik' }], score: 15 },
  { id: 'c2', name: 'Konten', maxScore: 40, cpmk: { id: 'k2', code: 'CPMK-02', description: '' }, rubrics: [], score: null },
];
const otherSent: OtherPartyScore = {
  party: 'coordinator', submitted: true, total: 20, weight: 25, name: 'HUSNIL KAMIL, MT', submittedAt: '2026-10-12T03:00:00Z',
  criteria: [{ id: 'k9', name: 'Struktur', cpmkCode: 'CPMK-02', maxScore: 25, score: 20 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('form rules', () => {
  it('whole numbers within the maximum; an empty entry only counts when sending', () => {
    expect(getScoreProblem({ maxScore: 20 }, '', false)).toBeNull();
    expect(getScoreProblem({ maxScore: 20 }, '', true)).toBe('Nilai belum diisi.');
    expect(getScoreProblem({ maxScore: 20 }, '21', true)).toBe('Nilai 0–20.');
    expect(getScoreProblem({ maxScore: 20 }, '1.5', true)).toBe('Nilai harus bilangan bulat.');
    expect(getScoreProblem({ maxScore: 20 }, '20', true)).toBeNull();
  });

  it('groups criteria per CPMK and previews the final score only once the other party sent', () => {
    expect(groupByCpmk(criteria).map((g) => [g.cpmk.code, g.criteria.length])).toEqual([['CPMK-01', 1], ['CPMK-02', 1]]);
    expect(previewFinalScore(45, otherSent, 60)).toEqual({ finalScore: 65, passes: true });
    expect(previewFinalScore(30, otherSent, 60)).toEqual({ finalScore: 50, passes: false });
    expect(previewFinalScore(45, { submitted: false, total: null }, 60)).toBeNull();
  });

  it('the stepper: a pass is in Penelitian at once; no waiting for KRS or a promotion', () => {
    const base = { id: 'a', academicYear: { id: 'ay', label: 'x' }, file: { fileName: 'p', fileSize: 1, url: 'u', submittedAt: null }, supervisorScored: true, coordinatorScored: false, isFinalized: false, finalScore: null, result: null };
    const stepOf = (current: typeof base | null, status: 'proposal' | 'research' = 'proposal') => buildProposalSteps({
      thesis: { id: 't', title: 'x', status, startDate: null, topic: null, academicYear: null, supervisors: [{ lecturerId: 'l1', fullName: 'P1', role: 'Pembimbing 1', identityNumber: '1' }] },
      assignment: { assigned: true, assignedAt: null, semesterLabel: null, version: 1, waitingReason: null },
      finalProposal: { academicYear: null, current: current as never, canSubmit: true, blockReason: null, history: [] },
      proposalRevision: { applicable: false, evaluation: null, current: null, history: [], canSubmit: false, blockReason: null, replacesCurrent: false },
    }, undefined);
    expect(stepOf(null)[3]).toMatchObject({ state: 'waiting', note: 'Menunggu' });
    expect(stepOf(base)[3].note).toBe('Menunggu koordinator');
    const passed = stepOf({ ...base, isFinalized: true, result: 'passed' as never, finalScore: 82 as never }, 'research');
    expect(passed.map((s) => s.state)).toEqual(['done', 'done', 'done', 'done', 'done']);
    expect(passed[4]).toMatchObject({ label: 'Mulai Penelitian' });
    expect(stepOf({ ...base, isFinalized: true, result: 'failed' as never, finalScore: 47 as never })[3]).toMatchObject({ state: 'failed', note: 'Tidak lulus, ulangi semester berikutnya' });
    expect(JSON.stringify(stepOf(base))).not.toMatch(/KRS/);
  });
});

describe('Score form (in the form of the Sidang TA assessment)', () => {
  const renderForm = (props: Partial<Parameters<typeof ProposalScoreForm>[0]> = {}) => {
    const onSaveDraft = vi.fn();
    const onSubmit = vi.fn();
    render(
      <ProposalScoreForm
        party="supervisor"
        criteria={criteria}
        weight={60}
        minimumScore={60}
        mode="edit"
        assessorName="AINA HUBBY AZIIRA, M.Eng"
        ownStatus="draft"
        other={otherSent}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        {...props}
      />,
    );
    return { onSaveDraft, onSubmit };
  };

  it('each criterion shows its rubric as a reference and one score field; the draft is filled in', () => {
    renderForm();
    expect(screen.getByText('A · CPMK-01')).toBeInTheDocument();
    const rubric = screen.getByRole('table', { name: 'Rubrik Presentasi' });
    expect(within(rubric).getAllByRole('row').map((r) => r.textContent)).toEqual(['Rentang SkorDeskripsi', '0 – 8Kurang', '9 – 20Baik']);
    expect(screen.getByLabelText('(a) Presentasi')).toHaveValue('15');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Draf')).toBeInTheDocument();
    expect(screen.getByLabelText('Total skor')).toHaveTextContent('15');
  });

  it('Simpan Draf saves what is filled in, as often as needed', () => {
    const { onSaveDraft } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Draf' }));
    expect(onSaveDraft).toHaveBeenLastCalledWith([{ criteriaId: 'c1', score: 15 }]);
    fireEvent.change(screen.getByLabelText('(a) Konten'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Draf' }));
    expect(onSaveDraft).toHaveBeenLastCalledWith([{ criteriaId: 'c1', score: 15 }, { criteriaId: 'c2', score: 30 }]);
  });

  it('Kirim Nilai is never disabled for an empty field: the click marks it; the confirmation sums up', async () => {
    const { onSubmit } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Nilai' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Nilai belum diisi.');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('(a) Konten'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Nilai' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(within(confirm).getByText('Kirim Nilai Pembimbing?')).toBeInTheDocument();
    const summary = within(confirm).getByLabelText('Ringkasan nilai');
    expect(summary).toHaveTextContent('Total Pembimbing45 / 60');
    expect(summary).toHaveTextContent('Nilai akhir 65 (minimum 60): lulus, dan tugas akhir langsung masuk fase Penelitian.');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Kirim Nilai' }));
    expect(onSubmit).toHaveBeenCalledWith([{ criteriaId: 'c1', score: 15 }, { criteriaId: 'c2', score: 30 }]);
  });

  it("the other party's sent score is a read-only reference, with the final score it makes", () => {
    renderForm();
    const card = screen.getByLabelText('Nilai Koordinator');
    expect(card).toHaveTextContent('20 / 25');
    expect(card).toHaveTextContent('Husnil Kamil, MT');
    expect(within(card).getByText('Struktur')).toBeInTheDocument();
    expect(card).toHaveTextContent('Pratinjau nilai akhir15 + 20 = 35');
    expect(within(card).getByText('Di bawah nilai minimum')).toBeInTheDocument();
    expect(within(card).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it("before the other party sends, nothing of it is shown (a draft of theirs never is)", () => {
    renderForm({ other: { ...otherSent, submitted: false, total: null, name: null, submittedAt: null, criteria: [] } });
    expect(screen.getByLabelText('Nilai Koordinator')).toHaveTextContent('Koordinator belum mengirim nilai.');
  });

  it('a sent score is locked: no field to edit and no buttons', () => {
    renderForm({ ownStatus: 'submitted', ownSubmittedAt: '2026-10-12T04:00:00Z' });
    expect(screen.getByText('Terkirim (Terkunci)')).toBeInTheDocument();
    expect(screen.getByLabelText('(a) Presentasi')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Kirim Nilai' })).not.toBeInTheDocument();
  });
});

describe('Score page', () => {
  const form: AssessmentScoreForm = {
    party: 'supervisor',
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    weight: 60,
    minimumScore: 60,
    criteria,
    assessment: view(),
    own: { status: 'draft', total: null, submittedAt: null, name: 'AINA HUBBY AZIIRA, M.Eng' },
    other: otherSent,
    canEdit: true,
    blockReason: null,
  };

  it('loads the attempt and saves a draft through the API', async () => {
    vi.mocked(service.getAssessmentScoreForm).mockResolvedValue(form);
    vi.mocked(service.submitScore).mockResolvedValue({ success: true, message: 'Draf penilaian disimpan', data: view() } as never);
    wrap(<ProposalScorePage party="supervisor" />, { path: '/nilai/:assessmentId', at: '/nilai/a1' });
    const save = await screen.findByRole('button', { name: 'Simpan Draf' });
    expect(screen.getByText('Nilai Proposal (Pembimbing)')).toBeInTheDocument();
    expect(service.getAssessmentScoreForm).toHaveBeenCalledWith('a1', 'supervisor');
    expect(screen.getByRole('link', { name: 'Kembali ke Proposal' })).toHaveAttribute('href', '/tugas-akhir/proposal');
    fireEvent.click(save);
    await waitFor(() => expect(service.submitScore).toHaveBeenCalledWith('a1', 'supervisor', [{ criteriaId: 'c1', score: 15 }], true));
  });
});

describe('Tugas Akhir > Proposal (pembimbing)', () => {
  const rows = [
    view({ id: 'a2', student: { id: 's2', fullName: 'Uji Lulus', identityNumber: '2211528015' }, supervisorScore: 64, coordinatorScore: 20, finalScore: 84, isFinalized: true, result: 'passed', canScore: false, scoreBlockReason: 'Penilaian proposal sudah final.' }),
    view({ id: null, proposal: null, student: { id: 's3', fullName: 'Uji Ditetapkan', identityNumber: '2211528010' }, canScore: false, scoreBlockReason: 'Mahasiswa belum mengajukan proposal final.' }),
    view(),
    view({ id: 'a5', student: { id: 's5', fullName: 'Uji Draf', identityNumber: '2211528016' }, ownDraftSaved: true }),
    view({ id: 'a4', student: { id: 's4', fullName: 'Uji Menunggu Koordinator', identityNumber: '2211528014' }, supervisorScore: 60, canScore: false, scoreBlockReason: 'Nilai pembimbing sudah dikirim.' }),
  ];

  it('"Semua" puts what the supervisor has to score first, then the drafts; Nilai Proposal opens the score page', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    wrap(<LecturerThesisProposal />);
    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(bodyRows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      expect.stringContaining('Uji Proposal Siap Dinilai'),
      expect.stringContaining('Uji Draf'),
      expect.stringContaining('Uji Menunggu Koordinator'),
      expect.stringContaining('Uji Ditetapkan'),
      expect.stringContaining('Uji Lulus'),
    ]);
    expect(within(bodyRows[1]).getByText('Draf Tersimpan')).toBeInTheDocument();
    expect(within(bodyRows[4]).getByText('64 + 20 = 84')).toBeInTheDocument();
    expect(screen.queryByText(/Presensi/)).not.toBeInTheDocument();

    const score = bodyRows.map((row) => within(row).getByRole('button', { name: 'Nilai Proposal' }) as HTMLButtonElement);
    expect(score.map((b) => b.disabled)).toEqual([false, false, true, true, true]);
    expect(score[3].parentElement).toHaveAttribute('title', 'Nilai Proposal: Mahasiswa belum mengajukan proposal final.');
    fireEvent.click(score[0]);
    expect(await screen.findByText('Halaman nilai pembimbing')).toBeInTheDocument();
  });

  it('the longest status stays inside its cell; Status is filtered in its header', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    wrap(<LecturerThesisProposal />);
    await screen.findByText('Uji Menunggu Koordinator');
    const table = screen.getByRole('table');
    const header = within(table).getByRole('columnheader', { name: /Status/ });
    const cells = within(within(table).getAllByRole('row')[3]).getAllByRole('cell');
    expectColumnFits(header, cells[4], 'Menunggu Koordinator');
    expect(within(header).getByRole('button')).toBeInTheDocument();
  });

  it('the detail modal: Batal and Nilai Proposal when scoring is open, only Tutup otherwise; the file is a chip', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue(queueOf(rows));
    wrap(<LecturerThesisProposal />);
    const ready = (await screen.findByText('Uji Proposal Siap Dinilai')).closest('tr')!;
    fireEvent.click(within(ready).getByRole('button', { name: 'Lihat Detail' }));
    let detail = await screen.findByRole('dialog', { name: 'Detail Penilaian Proposal' });
    expectFooter(detail, ['Batal', 'Nilai Proposal']);
    expect(within(detail).getByRole('button', { name: 'Lihat p.pdf' })).toHaveAttribute('title', 'p.pdf');
    expect(within(detail).queryByText(/Presensi/)).not.toBeInTheDocument();
    fireEvent.click(within(detail).getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(within(screen.getByText('Uji Lulus').closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    detail = await screen.findByRole('dialog', { name: 'Detail Penilaian Proposal' });
    expectFooter(detail, ['Tutup']);
  });
});

describe('Metode Penelitian > Penilaian Proposal (koordinator only)', () => {
  it('toolbar: search, minimum score, semester, Muat Ulang; no supervisors under the title; neutral icons', async () => {
    vi.mocked(service.getCoordinatorQueue).mockResolvedValue(queueOf([
      view({ supervisorScore: 60, thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: null, supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1' }] } }),
    ]));
    wrap(<ProposalAssessment />);
    const row = (await screen.findByText('Uji Proposal Siap Dinilai')).closest('tr')!;
    expect(within(row).getByText('Perlu Dinilai')).toBeInTheDocument();
    expect(within(row).queryByText(/Aina Hubby Aziira/)).not.toBeInTheDocument();
    const action = within(row).getByRole('button', { name: 'Nilai Proposal' });
    expect(action).toBeEnabled();
    expect(action.className).not.toMatch(/emerald|green/);
    expect(screen.queryByRole('button', { name: /Rekap Nilai/ })).not.toBeInTheDocument();
    const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const search = screen.getByPlaceholderText('Cari nama, NIM, atau judul...');
    const badge = screen.getByText('Nilai minimum: 60');
    const semester = screen.getByRole('combobox', { name: 'Periode akademik' });
    const refresh = screen.getByRole('button', { name: 'Muat Ulang' });
    expect([follows(search, badge), follows(badge, semester), follows(semester, refresh)]).toEqual([true, true, true]);
    fireEvent.click(action);
    expect(await screen.findByText('Halaman nilai koordinator')).toBeInTheDocument();
  });

  it('the coordinator waiting for the supervisor sees "Menunggu Pembimbing", which fits its cell', async () => {
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
    summary: { total: 16, withSupervisor: 10, assigned: 8, finalProposal: 6, finalized: 3, passed: 2, failed: 1, notFinalized: 13 },
    rows: [
      {
        studentId: 's1', fullName: 'Uji Proposal Siap Dinilai', identityNumber: '2211528013',
        thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [], proposalGuidances: 2 },
        request: { status: 'assigned', route: 'direct' },
        assessment: null,
      },
      {
        studentId: 's2', fullName: 'Uji Proposal Lulus', identityNumber: '2211528015',
        thesis: { id: 't2', title: 'Sistem B', status: 'research', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [], proposalGuidances: 3 },
        request: { status: 'assigned', route: 'direct' },
        assessment: { id: 'a2', finalProposalAt: '2026-10-01T00:00:00Z', supervisorScore: 64, coordinatorScore: 20, finalScore: 84, isFinalized: true, result: 'passed', supervisorName: 'ULLYA MEGA WAHYUNI, M.Kom', coordinatorName: 'HUSNIL KAMIL, MT' },
      },
    ],
  };

  it('the two charts in order: the stages and the results, with their numbers', () => {
    const { funnel, results } = buildClassCharts(monitoring.summary);
    expect(funnel.map((f) => [f.label, f.count])).toEqual([
      ['Peserta', 16], ['Punya Pembimbing', 10], ['Ditetapkan', 8], ['Proposal Final', 6], ['Dinilai', 3], ['Mulai Penelitian', 2],
    ]);
    expect(results.map((r) => [r.label, r.count])).toEqual([['Mulai Penelitian', 2], ['Tidak Lulus', 1], ['Belum Dinilai', 13]]);
  });

  it('one panel: the charts with numbers in view, one table with Mulai Penelitian, and the toolbar', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    wrap(<ClassMonitoring />);
    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    expect(screen.getByText('Tahapan Kelas')).toBeInTheDocument();
    expect(screen.getByText('Hasil Penilaian Proposal')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Hasil penilaian proposal' })).toHaveTextContent('Mulai Penelitian2Tidak Lulus1Belum Dinilai13');
    expect(screen.queryByRole('button', { name: /Proses Kelulusan/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Presensi/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    const lulus = screen.getByText('Uji Proposal Lulus').closest('tr')!;
    expect(within(lulus).getByText('Mulai Penelitian')).toBeInTheDocument();
    expect(screen.queryByText('Naik ke Penelitian')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rekap Nilai/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Judul TA Lulus/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeInTheDocument();
  });

  it('the detail of a row has both scores', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    wrap(<ClassMonitoring />);
    fireEvent.click(within((await screen.findByText('Uji Proposal Lulus')).closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    const detail = await screen.findByRole('dialog', { name: 'Detail Peserta Kelas' });
    expect(detail).toHaveTextContent('Nilai pembimbing64 · Ullya Mega Wahyuni, M.Kom');
    expect(detail).toHaveTextContent('Nilai koordinator20 · Husnil Kamil, MT');
    expect(detail).toHaveTextContent('Nilai akhir84Lulus');
    expectFooter(detail, ['Tutup']);
  });

  it('"Semua" puts the stages that need attention first; the longest stage fits its cell', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue({
      ...monitoring,
      rows: [
        monitoring.rows[0],
        { studentId: 's5', fullName: 'Uji Tanpa Pembimbing', identityNumber: '2211528001', thesis: null, request: null, assessment: null },
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
});
