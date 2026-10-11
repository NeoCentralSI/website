import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as service from '@/services/thesis-guidance-evaluation/thesis-guidance-evaluation.service';
import * as changeService from '@/services/thesis-change-request/thesis-change-request.service';
import type { ThesisGuidanceEvaluation, ThesisGuidanceEvaluationContext } from '@/types/thesis-guidance-evaluation.types';
import { EvaluationDueCard } from '@/components/monitoring/EvaluationDueCard';
import KelolaTugasAkhirKadep from '@/pages/kelola/kadep/KelolaTugasAkhir';
import { KadepThesisGuidanceEvaluationPanel } from './KadepThesisGuidanceEvaluationPanel';
import { LecturerThesisGuidanceEvaluationCard } from './LecturerThesisGuidanceEvaluationCard';
import { StudentThesisGuidanceEvaluationCard } from './StudentThesisGuidanceEvaluationCard';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-guidance-evaluation/thesis-guidance-evaluation.service', () => ({
  getEvaluationContext: vi.fn(),
  submitEvaluation: vi.fn(),
  getDepartmentEvaluations: vi.fn(),
  decideEvaluation: vi.fn(),
}));
vi.mock('@/services/thesis-change-request/thesis-change-request.service', () => ({
  getDepartmentChangeRequests: vi.fn(),
  decideAsKadep: vi.fn(),
  decideBatchAsKadep: vi.fn(),
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
    expect(screen.getByText('2 sesi')).toBeInTheDocument();
    expect(screen.getByText('Evaluasi 6 bulan jatuh tempo')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Evaluasi')).toBeInTheDocument();

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

  it('Pembimbing 2 only reads: no Isi Evaluasi button', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({
      viewerRole: 'pembimbing_2',
      canSubmit: false,
      blockReason: 'Evaluasi bimbingan diisi oleh Pembimbing 1.',
      openEvaluation: evaluation(),
    }));
    wrap(<LecturerThesisGuidanceEvaluationCard thesisId="t1" />);

    expect(await screen.findByText('Menunggu keputusan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Isi Evaluasi/ })).not.toBeInTheDocument();
    expect(screen.getByText('Menunggu Keputusan Ketua Departemen')).toBeInTheDocument();
    expect(screen.queryByText('extend_1_month')).not.toBeInTheDocument();
  });
});

describe('StudentThesisGuidanceEvaluationCard', () => {
  it('shows the academic warning, the extension deadline and the results', async () => {
    vi.mocked(service.getEvaluationContext).mockResolvedValue(context({
      viewerRole: 'student',
      canSubmit: false,
      blockReason: 'Evaluasi bimbingan diisi oleh Pembimbing 1.',
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
    }));
    wrap(<StudentThesisGuidanceEvaluationCard />);

    expect(await screen.findByText('Peringatan akademik')).toBeInTheDocument();
    expect(screen.getByText(/Perpanjangan masa bimbingan 1 bulan berlaku sampai 9 November 2026 10\.00 WIB\./)).toBeInTheDocument();
    expect(screen.getByText('Batas perpanjangan:')).toBeInTheDocument();
    expect(screen.getByText('Disetujui')).toBeInTheDocument();
    // "Lanjut Bimbingan" is recorded without a decision.
    expect(screen.getByText('Tercatat')).toBeInTheDocument();
    expect(screen.getByText(/Keputusan Ketua Departemen: Ricky Akbar/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Isi Evaluasi/ })).not.toBeInTheDocument();
  });
});

describe('KadepThesisGuidanceEvaluationPanel', () => {
  const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };

  it('lists evaluations waiting for a decision and needs notes to reject', async () => {
    vi.mocked(service.getDepartmentEvaluations).mockResolvedValue({ data: [evaluation({ recommendation: 'terminate_supervision', evaluationType: 'one_year', stage: 'one_year' })], meta });
    vi.mocked(service.decideEvaluation).mockResolvedValue({ success: true, message: 'Evaluasi ditolak', data: evaluation({ status: 'rejected' }) });
    wrap(<KadepThesisGuidanceEvaluationPanel />);

    expect(await screen.findByText('Ilham Nofaldi')).toBeInTheDocument();
    expect(screen.getByText('Evaluasi 1 Tahun')).toBeInTheDocument();
    expect(screen.getByText('Dihentikan')).toBeInTheDocument();
    expect(screen.getByText(/tugas akhir berstatus Gagal, pembimbing dilepas, dan sesi terbuka dibatalkan/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tolak' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Tolak' })).toBeDisabled();
    expect(within(dialog).getByText('Catatan penolakan wajib diisi.')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Catatan penolakan'), { target: { value: 'Dasar belum cukup.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(service.decideEvaluation).toHaveBeenCalledWith('eval-1', { approve: false, notes: 'Dasar belum cukup.' }));
  });

  it('approves without notes', async () => {
    vi.mocked(service.getDepartmentEvaluations).mockResolvedValue({ data: [evaluation()], meta });
    vi.mocked(service.decideEvaluation).mockResolvedValue({ success: true, message: 'Evaluasi disetujui', data: evaluation({ status: 'approved' }) });
    wrap(<KadepThesisGuidanceEvaluationPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Setujui' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideEvaluation).toHaveBeenCalledWith('eval-1', { approve: true, notes: null }));
  });
});

describe('Persetujuan Tugas Akhir page', () => {
  it('has the tabs Perubahan Tugas Akhir and Evaluasi Bimbingan, routed by path', async () => {
    vi.mocked(service.getDepartmentEvaluations).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    vi.mocked(changeService.getDepartmentChangeRequests).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/kelola/tugas-akhir/kadep/evaluasi']}>
          <Routes>
            <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
              <Route path="/kelola/tugas-akhir/kadep/:tab" element={<KelolaTugasAkhirKadep />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Persetujuan Tugas Akhir' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Perubahan Tugas Akhir', 'Evaluasi Bimbingan']);
    expect(await screen.findByText('Tidak ada evaluasi bimbingan yang menunggu keputusan.')).toBeInTheDocument();
    expect(changeService.getDepartmentChangeRequests).not.toHaveBeenCalled();
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
