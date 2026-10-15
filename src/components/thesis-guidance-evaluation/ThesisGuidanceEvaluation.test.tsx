import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as service from '@/services/thesis-guidance-evaluation/thesis-guidance-evaluation.service';
import type { SupervisorEvaluationDue, ThesisGuidanceEvaluation, ThesisGuidanceEvaluationContext } from '@/types/thesis-guidance-evaluation.types';
import { EvaluationDueCard } from '@/components/monitoring/EvaluationDueCard';
import { LecturerThesisGuidanceEvaluationCard } from './LecturerThesisGuidanceEvaluationCard';
import { ThesisGuidanceEvaluationTable, splitEvaluationRows } from './ThesisGuidanceEvaluationTable';
import { AcademicWarningAlert, ThesisGuidanceEvaluationHistoryLink, evaluationsOf } from './ThesisGuidanceEvaluationViews';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-guidance-evaluation/thesis-guidance-evaluation.service', () => ({
  getEvaluationContext: vi.fn(),
  submitEvaluation: vi.fn(),
  getDepartmentEvaluations: vi.fn(),
  getSupervisorEvaluations: vi.fn(),
  decideEvaluation: vi.fn(),
}));

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const person = (id: string, name: string) => ({ id, name, identityNumber: `ID-${id}` });

function evaluation(overrides: Partial<ThesisGuidanceEvaluation> = {}): ThesisGuidanceEvaluation {
  return {
    id: 'eval-1',
    thesisId: 't1',
    student: person('stu-1', 'ILHAM NOFALDI'),
    thesisTitle: 'Judul TA',
    supervisor: person('l1', 'HUSNIL KAMIL'),
    evaluationType: 'six_month',
    stage: 'six_month',
    recommendation: 'extend_1_month',
    status: 'pending',
    requiresKadep: true,
    observations: { noGuidance: true, noProgress: true, noResponse: false, noRevision: false },
    notes: 'Jarang bimbingan.',
    basis: { guidanceCount: 2, supervisionStartedAt: '2026-03-01T00:00:00.000Z', elapsedDays: 214 },
    extensionUntil: null,
    decision: null,
    createdAt: '2026-10-09T03:00:00.000Z',
    ...overrides,
  };
}

function context(overrides: Partial<ThesisGuidanceEvaluationContext> = {}): ThesisGuidanceEvaluationContext {
  return {
    thesis: { id: 't1', title: 'Judul TA', status: 'research', student: person('stu-1', 'ILHAM NOFALDI') },
    viewerRole: 'pembimbing_1',
    basis: {
      guidanceCount: 2,
      supervisionStartedAt: '2026-03-01T00:00:00.000Z',
      elapsedDays: 214,
      elapsedLabel: '7 bulan 12 hari',
      startSemester: '2026/2027 Ganjil',
      activityLevel: 'slow',
    },
    stage: 'six_month',
    allowedRecommendations: ['continue', 'extend_1_month'],
    canSubmit: true,
    blockReason: null,
    openEvaluation: null,
    history: [],
    academicWarning: null,
    ...overrides,
  };
}

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('LecturerThesisGuidanceEvaluationCard', () => {
  it('shows supervision time, activity, sessions and what is due; Pembimbing 1 fills the form', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context());
    vi.mocked(service.submitEvaluation).mockResolvedValue({ success: true, message: 'ok', data: evaluation() });
    wrap(<LecturerThesisGuidanceEvaluationCard thesisId="t1" />);

    expect(await screen.findByText('Evaluasi Bimbingan')).toBeInTheDocument();
    expect(screen.getByText('7 bulan 12 hari')).toBeInTheDocument();
    expect(screen.getByText('Lambat')).toBeInTheDocument();
    expect(screen.getByText('Evaluasi 6 bulan jatuh tempo')).toBeInTheDocument();
    expect(screen.getByText('Belum ada evaluasi.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Isi Evaluasi/ }));
    const dialog = await screen.findByRole('dialog');
    // Basis: filled by the system, read-only (plain text, no inputs).
    expect(within(dialog).getByText('2026/2027 Ganjil')).toBeInTheDocument();
    expect(within(dialog).getByText('2 sesi selesai')).toBeInTheDocument();
    expect(within(dialog).getByText('Diisi otomatis oleh sistem dan tidak dapat diubah.')).toBeInTheDocument();
    // Only the decisions of this stage are offered.
    expect(within(dialog).getAllByRole('radio')).toHaveLength(2);
    expect(within(dialog).getByText('Lanjut Bimbingan')).toBeInTheDocument();
    expect(within(dialog).getByText('Peringatan dan Perpanjangan 1 Bulan')).toBeInTheDocument();
    expect(within(dialog).queryByText('Dihentikan')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Belum dapat dikirim: Pilih keputusan pembimbing.')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByLabelText('Tidak melakukan bimbingan selama periode evaluasi'));
    fireEvent.click(within(dialog).getByLabelText('Tidak merespons komunikasi pembimbing'));
    fireEvent.change(within(dialog).getByLabelText('Keterangan (opsional)'), { target: { value: 'Jarang bimbingan.' } });
    fireEvent.click(within(dialog).getByRole('radio', { name: /Peringatan dan Perpanjangan 1 Bulan/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kirim Evaluasi' }));

    await waitFor(() =>
      expect(service.submitEvaluation).toHaveBeenCalledWith({
        thesisId: 't1',
        stage: 'six_month',
        recommendation: 'extend_1_month',
        observations: { noGuidance: true, noProgress: false, noResponse: true, noRevision: false },
        notes: 'Jarang bimbingan.',
      }),
    );
  });

  it('disables Isi Evaluasi with its reason when it is not time yet', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({
      stage: null,
      allowedRecommendations: [],
      canSubmit: false,
      blockReason: 'Belum waktunya: evaluasi 6 bulan dapat diisi mulai 14 Januari 2027 12.00 WIB.',
    }));
    wrap(<LecturerThesisGuidanceEvaluationCard thesisId="t1" />);

    expect(await screen.findByRole('button', { name: /Isi Evaluasi/ })).toBeDisabled();
    expect(screen.getByText(/Isi Evaluasi belum tersedia: Belum waktunya: evaluasi 6 bulan dapat diisi mulai/)).toBeInTheDocument();
    expect(screen.getByText('Tidak ada')).toBeInTheDocument();
  });

  it('one-year evaluation: continuing needs a justification', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({ stage: 'one_year', allowedRecommendations: ['continue', 'terminate_supervision'] }));
    wrap(<LecturerThesisGuidanceEvaluationCard thesisId="t1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Isi Evaluasi/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /Lanjut Bimbingan/ }));
    expect(within(dialog).getByText('Belum dapat dikirim: Keterangan wajib diisi untuk melanjutkan bimbingan pada evaluasi 1 tahun.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Kirim Evaluasi' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('radio', { name: /Dihentikan/ }));
    expect(within(dialog).getByRole('button', { name: 'Kirim Evaluasi' })).toBeEnabled();
  });

  it('Pembimbing 2 only reads: no Isi Evaluasi button; the waiting evaluation is one line with its detail', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({
      viewerRole: 'pembimbing_2',
      canSubmit: false,
      blockReason: 'Evaluasi bimbingan diisi oleh Pembimbing 1.',
      openEvaluation: evaluation(),
    }));
    wrap(<LecturerThesisGuidanceEvaluationCard thesisId="t1" />);

    expect(await screen.findByText(/Evaluasi 6 Bulan menunggu keputusan Ketua Departemen/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Isi Evaluasi/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat detail' }));
    const dialog = await screen.findByRole('dialog', { name: 'Detail Evaluasi Bimbingan' });
    expect(within(dialog).getByText('Menunggu Keputusan Ketua Departemen')).toBeInTheDocument();
    expect(within(dialog).queryByText('extend_1_month')).not.toBeInTheDocument();
  });
});

describe('Student Overview: warning ribbon and "Riwayat evaluasi (N)" (Paket E4, 6)', () => {
  it('shows the running warning as a ribbon and the evaluation history in a modal', async () => {
    const studentContext = context({
      viewerRole: 'student',
      canSubmit: false,
      stage: null,
      academicWarning: { extensionUntil: '2026-11-09T03:00:00.000Z', followUpDue: false },
      history: [
        evaluation({
          status: 'approved',
          extensionUntil: '2026-11-09T03:00:00.000Z',
          decision: { by: person('k', 'RICKY AKBAR'), notes: 'Setuju', at: '2026-10-09T03:00:00.000Z' },
        }),
        evaluation({ id: 'eval-0', recommendation: 'continue', status: 'approved', requiresKadep: false, observations: { noGuidance: false, noProgress: false, noResponse: false, noRevision: false } }),
      ],
    });
    wrap(
      <>
        <AcademicWarningAlert warning={studentContext.academicWarning} />
        <ThesisGuidanceEvaluationHistoryLink evaluations={evaluationsOf(studentContext)} />
      </>,
    );

    expect(screen.getByText('Peringatan akademik')).toBeInTheDocument();
    expect(screen.getByText(/Perpanjangan masa bimbingan 1 bulan berlaku sampai 9 November 2026 10\.00 WIB\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat evaluasi (2)' }));
    const modal = await screen.findByRole('dialog', { name: 'Riwayat Evaluasi Bimbingan' });
    expect(within(modal).getByText('Disetujui')).toBeInTheDocument();
    // "Lanjut Bimbingan" is recorded without a decision.
    expect(within(modal).getByText('Tercatat')).toBeInTheDocument();
    fireEvent.click(within(modal).getAllByRole('button', { name: 'Detail' })[0]);
    const detail = await screen.findByRole('dialog', { name: 'Detail Evaluasi Bimbingan' });
    expect(within(detail).getByText('Batas perpanjangan:')).toBeInTheDocument();
    expect(within(detail).getByText(/Keputusan Ketua Departemen: Ricky Akbar/)).toBeInTheDocument();
  });

  it('hides the link when there is no evaluation, and the ribbon when nothing runs', () => {
    const { container } = wrap(
      <>
        <AcademicWarningAlert warning={null} />
        <ThesisGuidanceEvaluationHistoryLink evaluations={[]} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Tugas Akhir > Evaluasi (Paket E4, 4.3)', () => {
  const meta = { page: 1, pageSize: 100, total: 1, totalPages: 1 };
  const due = (overrides: Partial<SupervisorEvaluationDue> = {}): SupervisorEvaluationDue => ({
    thesis: { id: 't2', title: 'Judul Jatuh Tempo', status: 'research', student: person('stu-2', 'NABIL RIZKI') },
    viewerRole: 'pembimbing_1',
    stage: 'six_month',
    supervision: { startedAt: '2026-03-01T00:00:00.000Z', elapsedDays: 190, elapsedLabel: '6 bulan 8 hari' },
    canSubmit: true,
    blockReason: null,
    ...overrides,
  });

  it('splits Perlu Tindakan, Menunggu Kadep and Riwayat', () => {
    const lists = splitEvaluationRows({
      supervisor: { due: [due()], evaluations: [evaluation({ id: 'p' }), evaluation({ id: 'h', status: 'approved' })] },
      departmentPending: [evaluation({ id: 'k' })],
      departmentHistory: [],
    });
    expect(lists.action.map((row) => row.id)).toEqual(['due-t2', 'k']);
    expect(lists.kadep.map((row) => row.id)).toEqual(['k', 'p']);
    expect(lists.history.map((row) => row.id)).toEqual(['h']);
  });

  it('a supervisor sees the due theses with "Isi Evaluasi" (Pembimbing 1), which opens the existing form', async () => {
    vi.mocked(service.getSupervisorEvaluations).mockResolvedValue({
      due: [due(), due({ thesis: { id: 't3', title: 'TA P2', status: 'research', student: person('stu-3', 'MAHASISWA DUA') }, viewerRole: 'pembimbing_2', canSubmit: false, blockReason: 'Evaluasi bimbingan diisi oleh Pembimbing 1.' })],
      evaluations: [],
    });
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({ thesis: { id: 't2', title: 'Judul Jatuh Tempo', status: 'research', student: person('stu-2', 'NABIL RIZKI') } }));
    wrap(<ThesisGuidanceEvaluationTable isSupervisor isKadep={false} />);

    expect(await screen.findByText('Nabil Rizki')).toBeInTheDocument();
    expect(screen.getByText('Mahasiswa Dua')).toBeInTheDocument();
    expect(screen.getAllByText('Jatuh Tempo')).toHaveLength(2);
    expect(screen.getAllByText('Belum diisi')).toHaveLength(2);
    expect(service.getDepartmentEvaluations).not.toHaveBeenCalled();
    // Only Pembimbing 1 fills the evaluation.
    expect(screen.getAllByRole('button', { name: /Isi Evaluasi/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /Isi Evaluasi/ }));
    await waitFor(() => expect(service.getEvaluationContext).toHaveBeenCalledWith('t2'));
    expect(await screen.findByRole('button', { name: 'Kirim Evaluasi' })).toBeDisabled();
  });

  it('the Kadep rejects with notes and approves without', async () => {
    vi.mocked(service.getDepartmentEvaluations).mockImplementation(async ({ scope }) =>
      scope === 'pending'
        ? { data: [evaluation({ recommendation: 'terminate_supervision', evaluationType: 'one_year', stage: 'one_year' })], meta }
        : { data: [], meta: { ...meta, total: 0 } },
    );
    vi.mocked(service.decideEvaluation).mockResolvedValue({ success: true, message: 'ok', data: evaluation({ status: 'rejected' }) });
    wrap(<ThesisGuidanceEvaluationTable isSupervisor={false} isKadep />);

    expect(await screen.findByText('Ilham Nofaldi')).toBeInTheDocument();
    expect(screen.getByText('Evaluasi 1 Tahun')).toBeInTheDocument();
    expect(screen.getByText('Dihentikan')).toBeInTheDocument();
    expect(service.getSupervisorEvaluations).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Tolak' }));
    let dialog = await screen.findByRole('dialog', { name: 'Tolak evaluasi?' });
    expect(within(dialog).getByRole('button', { name: 'Tolak' })).toBeDisabled();
    expect(within(dialog).getByText('Catatan penolakan wajib diisi.')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Catatan penolakan'), { target: { value: 'Dasar belum cukup.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(service.decideEvaluation).toHaveBeenCalledWith('eval-1', { approve: false, notes: 'Dasar belum cukup.' }));

    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    dialog = await screen.findByRole('dialog', { name: 'Setujui evaluasi?' });
    expect(within(dialog).getByText(/tugas akhir berstatus Gagal, pembimbing dilepas, dan sesi terbuka dibatalkan/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideEvaluation).toHaveBeenLastCalledWith('eval-1', { approve: true, notes: null }));
  });

  it('searches by name or NIM in the browser', async () => {
    vi.mocked(service.getDepartmentEvaluations).mockImplementation(async ({ scope }) =>
      scope === 'pending'
        ? { data: [evaluation(), evaluation({ id: 'eval-2', student: person('stu-9', 'SITI AMINAH') })], meta: { ...meta, total: 2 } }
        : { data: [], meta: { ...meta, total: 0 } },
    );
    wrap(<ThesisGuidanceEvaluationTable isSupervisor={false} isKadep />);
    expect(await screen.findByText('Siti Aminah')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Cari nama atau NIM...'), { target: { value: 'ID-stu-9' } });
    expect(screen.queryByText('Ilham Nofaldi')).not.toBeInTheDocument();
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
  });
});

describe('EvaluationDueCard', () => {
  it('lists theses whose evaluation is due, with labels', () => {
    wrap(
      <EvaluationDueCard
        isLoading={false}
        students={[{
          thesisId: 't1',
          title: 'Judul TA',
          student: { name: 'ILHAM NOFALDI', nim: '2211522028', email: 'i@x.test' },
          activityLevel: 'at_risk',
          evaluationDue: 'one_year',
          supervisionClock: {
            startedAt: '2025-09-01T00:00:00.000Z', elapsedDays: 400, elapsedMonths: 13, elapsedLabel: '13 bulan 4 hari',
            sixMonthAt: null, oneYearAt: null, extensionUntil: null, evaluationDue: 'one_year', isPaused: false,
          },
          supervisors: [{ name: 'HUSNIL KAMIL', role: 'Pembimbing 1' }],
        }]}
      />,
    );
    expect(screen.getByText('Perlu Evaluasi')).toBeInTheDocument();
    expect(screen.getByText('Evaluasi 1 tahun jatuh tempo')).toBeInTheDocument();
    expect(screen.getByText('Berisiko')).toBeInTheDocument();
    expect(screen.getByText(/Masa bimbingan 13 bulan 4 hari · Husnil Kamil/)).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    wrap(<EvaluationDueCard isLoading={false} students={[]} />);
    expect(screen.getByText('Tidak ada evaluasi bimbingan yang jatuh tempo.')).toBeInTheDocument();
  });
});
