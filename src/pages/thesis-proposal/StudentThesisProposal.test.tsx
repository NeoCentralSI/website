/**
 * Paket P9 (2): the student Proposal page in the form of Seminar Hasil (Ringkasan and Riwayat
 * Pengajuan Pembimbing), and the request form on its own page with the lecturer catalog.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import * as requests from '@/services/thesis-proposal/supervisor-request.service';
import { expectFooter } from '@/test/dialogFooter';
import type {
  CatalogLecturer,
  FinalProposalAttempt,
  StudentProposalOverview,
  StudentSupervisorRequests,
  SupervisorRequest,
} from '@/types/thesis-proposal.types';
import StudentSupervisorRequestPage from './StudentSupervisorRequestPage';
import StudentThesisProposal from './StudentThesisProposal';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-request.service');
vi.mock('@/services/thesis-proposal/supervisor-assignment.service');
vi.mock('@/services/thesis-proposal/proposal-revision.service');
vi.mock('@/services/studentGuidance.service', () => ({
  getPendingSupervisor2Request: vi.fn(async () => null),
  getAvailableSupervisors2: vi.fn(async () => []),
  requestSupervisor2: vi.fn(),
  cancelSupervisor2Request: vi.fn(),
}));
vi.mock('@/hooks/milestone/useMilestone', () => ({ useTopics: () => ({ data: [{ id: 'topic-1', name: 'Enterprise System' }] }) }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

function wrap(ui: ReactNode, path = '/tugas-akhir/proposal') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tugas-akhir/proposal" element={ui} />
          <Route path="/tugas-akhir/proposal/pengajuan" element={<StudentSupervisorRequestPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const NOT_ELIGIBLE = 'Anda belum terdaftar mengambil mata kuliah Metode Penelitian semester ini. Hubungi Admin Departemen bila ini keliru.';

const request = (overrides: Partial<SupervisorRequest> = {}): SupervisorRequest => ({
  id: 'req-1', status: 'pending', route: 'direct', createdAt: '2026-10-13T03:00:00.000Z', updatedAt: '2026-10-13T03:00:00.000Z',
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, isCurrentPeriod: true,
  student: { id: 's1', fullName: 'BUDI SANTOSO', identityNumber: '2211528001' },
  topic: { id: 'topic-1', name: 'Enterprise System', scienceGroup: { id: 'k', name: 'Sistem Enterprise' } },
  proposedTitle: 'Sistem Informasi Pemantauan Proposal', backgroundSummary: 'Latar belakang uji', problemStatement: 'Masalah', proposedSolution: 'Solusi',
  researchObject: 'Departemen', researchPermitStatus: 'in_process', studentJustification: null,
  lecturer: { id: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng' }, redirectTarget: null, supervisor: { id: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng' },
  lecturerApprovalNote: null, lecturerOverquotaReason: null, lecturerRespondedAt: null, rejectionReason: null, forwardedToKadepAt: null,
  forwardedBy: null, kadepNotes: null, reviewedAt: null, reviewer: null, withdrawnAt: null, withdrawCount: 0, acceptedOverNormal: false,
  thesis: null, withdrawAvailableAt: '2099-01-01T00:00:00.000Z',
  ...overrides,
} as SupervisorRequest);

const mine = (overrides: Partial<StudentSupervisorRequests> = {}, submission: Partial<StudentSupervisorRequests['submission']> = {}): StudentSupervisorRequests => ({
  submission: {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, eligibleResearchMethod: true, eligibilitySource: 'sia', eligibilityCapturedAt: null,
    canSubmit: true, blockedReason: null, revisionRequested: false, activeRequestId: null, ...submission,
  },
  requests: [],
  activeRequest: null,
  draft: null,
  ...overrides,
});

const attempt = (overrides: Partial<FinalProposalAttempt> = {}): FinalProposalAttempt => ({
  id: 'a1', academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  file: { fileName: 'proposal.pdf', fileSize: 10, url: '/uploads/thesis/t1/proposal/a1/proposal.pdf', submittedAt: '2026-10-01T03:00:00Z' },
  supervisorScored: false, coordinatorScored: false, isFinalized: false, finalScore: null, result: null, attendanceAutoZeroed: false,
  ...overrides,
});

const proposal = (overrides: Partial<StudentProposalOverview> = {}): StudentProposalOverview => ({
  thesis: {
    id: 't1', title: 'Sistem Informasi Pemantauan Proposal', status: 'proposal', startDate: null, topic: { id: 'topic-1', name: 'Enterprise System' }, academicYear: null,
    supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1', identityNumber: '1' }],
  },
  assignment: { assigned: true, assignedAt: '2026-10-14T03:00:00.000Z', semesterLabel: 'Ganjil 2026/2027', version: 2, waitingReason: null },
  finalProposal: { academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, current: null, canSubmit: true, blockReason: null, history: [] },
  proposalRevision: { applicable: false, evaluation: null, current: null, history: [], canSubmit: false, blockReason: null, replacesCurrent: false },
  ...overrides,
});
const noThesis = (): StudentProposalOverview => proposal({
  thesis: null,
  assignment: null,
  finalProposal: { academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, current: null, canSubmit: false, blockReason: 'Anda belum memiliki tugas akhir. Ajukan pembimbing terlebih dahulu.', history: [] },
});

const steps = () => within(screen.getByRole('list', { name: 'Tahap proposal' })).getAllByRole('listitem');

beforeEach(() => vi.clearAllMocks());

describe('Proposal mahasiswa (Paket P9, 2)', () => {
  it('without a request: no Informasi Proposal; a student who may not submit reads why in the Pengajuan card', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({}, { canSubmit: false, eligibleResearchMethod: false, blockedReason: NOT_ELIGIBLE }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText(NOT_ELIGIBLE)).toBeInTheDocument();
    expect(screen.queryByText('Informasi Proposal')).not.toBeInTheDocument();
    expect(screen.queryByText(/SIA/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(Ringkasan|Riwayat Pengajuan Pembimbing)$/ })).toHaveLength(2);
    expect(steps().map((s) => s.textContent)).toEqual([
      'Pengajuan PembimbingBelum diajukan', 'Penetapan PembimbingMenunggu', 'Proposal FinalMenunggu', 'Penilaian ProposalMenunggu', 'Naik ke PenelitianMenunggu',
    ]);
    expect(screen.queryByRole('button', { name: 'Ajukan Pembimbing' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajukan Proposal Final' }).parentElement).toHaveAttribute('title', expect.stringMatching(/belum memiliki tugas akhir/));
  });

  it('without a request but allowed: Ajukan Pembimbing opens the request page', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine());
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    vi.mocked(requests.getCatalog).mockResolvedValue([]);
    wrap(<StudentThesisProposal />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ajukan Pembimbing' }));
    expect(await screen.findByRole('heading', { name: 'Pengajuan Pembimbing' })).toBeInTheDocument();
  });

  it('waiting: the card shows the request; pull back is disabled with the reason in its tooltip', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: request(), requests: [request()] }, { canSubmit: false, activeRequestId: 'req-1' }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText('Informasi Proposal')).toBeInTheDocument();
    expect(screen.getByText('Pilih Dosen Sendiri')).toBeInTheDocument();
    const pull = screen.getByRole('button', { name: 'Tarik Pengajuan' });
    expect(pull).toBeDisabled();
    expect(pull.parentElement).toHaveAttribute('title', expect.stringMatching(/bisa ditarik mulai/));
    expect(steps()[0]).toHaveTextContent('Menunggu Dosen');

    fireEvent.click(screen.getByText('Informasi Proposal'));
    const detail = await screen.findByRole('dialog', { name: 'Detail Proposal' });
    expect(within(detail).getByText('Latar belakang uji')).toBeInTheDocument();
    expectFooter(detail, ['Tutup']);
  });

  it('assigned: supervisors, penetapan and Ajukan Pembimbing 2; the final proposal card', async () => {
    const assigned = request({ status: 'assigned', thesis: { id: 't1', title: 'x', status: 'proposal', supervisorAssignedAt: '2026-10-14T03:00:00.000Z' } });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal());
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText('Ditetapkan (versi 2)')).toBeInTheDocument();
    expect(screen.getByText('Aina Hubby Aziira, M.Eng')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Ajukan Pembimbing 2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat Detail' })).toBeInTheDocument();
    expect(steps().map((s) => s.getAttribute('data-state'))).toEqual(['done', 'done', 'waiting', 'waiting', 'waiting']);
    // The stepper label and the card title.
    expect(screen.getAllByText('Proposal Final')).toHaveLength(2);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('passed: the score as supervisor + coordinator = final, and the next step waits for the thesis course', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({
      finalProposal: {
        academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, canSubmit: false, blockReason: 'Penilaian proposal periode ini sudah final. Proposal final tidak dapat diganti.', history: [],
        current: attempt({ supervisorScored: true, coordinatorScored: true, supervisorScore: 40, coordinatorScore: 42, isFinalized: true, finalScore: 82, result: 'passed' }),
      },
    }));
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText('40 + 42 = 82')).toBeInTheDocument();
    expect(screen.getAllByText('Lulus').length).toBeGreaterThan(0);
    expect(steps()[4]).toHaveTextContent('Menunggu KRS Tugas Akhir semester berikutnya');
  });

  it('failed: the assessment step is red with "Tidak lulus, ulangi semester berikutnya"', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({
      finalProposal: {
        academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, canSubmit: false, blockReason: 'x', history: [],
        current: attempt({ supervisorScored: true, coordinatorScored: true, supervisorScore: 20, coordinatorScore: 27, isFinalized: true, finalScore: 47, result: 'failed' }),
      },
    }));
    wrap(<StudentThesisProposal />);
    await screen.findByText('20 + 27 = 47');
    expect(steps()[3]).toHaveAttribute('data-state', 'failed');
    expect(steps()[3]).toHaveTextContent('Tidak lulus, ulangi semester berikutnya');
  });

  it('repeating the proposal: Proposal Revisi replaces Proposal Final, with the repeat steps', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({
      proposalRevision: { applicable: true, evaluation: { id: 'ev', approvedAt: null }, current: null, history: [], canSubmit: true, blockReason: null, replacesCurrent: false },
    }));
    wrap(<StudentThesisProposal />);
    expect(await screen.findByRole('button', { name: 'Ajukan Proposal Revisi' })).toBeInTheDocument();
    expect(screen.queryByText('Proposal Final')).not.toBeInTheDocument();
    expect(steps().map((s) => s.textContent)).toEqual(['Pengajuan Pembimbing', 'Penetapan Pembimbing', 'Proposal Revisi', 'Persetujuan Pembimbing 1', 'Kembali ke Penelitian']
      .map((label) => expect.stringMatching(new RegExp(`^${label}`))));
  });

  it('Riwayat Pengajuan Pembimbing: one table; empty is "Tidak Ada Data"; the eye opens a modal with only Tutup', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine());
    const view = wrap(<StudentThesisProposal />, '/tugas-akhir/proposal?tab=riwayat-pengajuan');
    expect(await screen.findByText('Tidak Ada Data')).toBeInTheDocument();
    view.unmount();

    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({
      requests: [request({ id: 'old', status: 'rejected_by_lecturer', proposedTitle: 'Judul Lama yang Ditolak', rejectionReason: 'Topik di luar keahlian.' })],
    }));
    wrap(<StudentThesisProposal />, '/tugas-akhir/proposal?tab=riwayat-pengajuan');
    const row = (await screen.findByText('Judul Lama yang Ditolak')).closest('tr')!;
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(within(row).getByText('Ditolak Dosen')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Lihat Detail' }));
    const detail = await screen.findByRole('dialog', { name: 'Detail Pengajuan Pembimbing' });
    expect(within(detail).getByText('Topik di luar keahlian.')).toBeInTheDocument();
    expectFooter(detail, ['Tutup']);
  });
});

describe('Pengajuan Pembimbing page (Paket P9, 2)', () => {
  const lecturer = (id: string, fullName: string, group: string, offeredTopics: string[], acceptingRequests = true): CatalogLecturer => ({
    lecturerId: id, fullName, identityNumber: id, avatarUrl: null, scienceGroup: { id: group, name: group }, acceptingRequests,
    activeCount: 3, softLimit: 8, hardLimit: 10, level: 'available', supervisedTopics: [], offeredTopics,
  });

  it('the catalog shows kelompok keilmuan, offered topics and load; searching a topic finds the lecturer', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ draft: null }));
    vi.mocked(requests.getCatalog).mockResolvedValue([
      lecturer('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Sistem Enterprise', ['ERP', 'Data Warehouse', 'Business Intelligence']),
      lecturer('l2', 'DOSEN TUTUP, M.Kom', 'Jaringan', ['IoT'], false),
    ]);
    vi.mocked(requests.saveDraft).mockResolvedValue({ success: true, message: 'Draf pengajuan disimpan', data: null as never });
    wrap(<div />, '/tugas-akhir/proposal/pengajuan');

    const row = (await screen.findByText('Aina Hubby Aziira, M.Eng')).closest('tr')!;
    expect(within(row).getByText('Sistem Enterprise')).toBeInTheDocument();
    const topics = within(row).getByText('ERP, Data Warehouse +1');
    expect(topics).toHaveAttribute('title', 'ERP, Data Warehouse, Business Intelligence');
    expect(within(row).getByText('3/10 · Tersedia')).toBeInTheDocument();
    const closed = screen.getByText('Dosen Tutup, M.Kom').closest('tr')!;
    expect(within(closed).getByRole('button', { name: /Pilih Dosen Tutup/ })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Cari nama, kelompok keilmuan, atau topik...'), { target: { value: 'iot' } });
    await waitFor(() => expect(screen.queryByText('Aina Hubby Aziira, M.Eng')).not.toBeInTheDocument());
    expect(screen.getByText('Dosen Tutup, M.Kom')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Cari nama, kelompok keilmuan, atau topik...'), { target: { value: 'enterprise' } });
    fireEvent.click(await screen.findByRole('button', { name: /Pilih Aina/ }));
    expect(screen.getByRole('button', { name: /Pilih Aina/ })).toHaveTextContent('Dipilih');

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Draf' }));
    await waitFor(() => expect(requests.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ lecturerId: 'l1' })));
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
  });

  it('a student with an active request goes back to the Proposal page', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: request(), requests: [request()] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<div data-testid="proposal-page" />, '/tugas-akhir/proposal/pengajuan');
    expect(await screen.findByTestId('proposal-page')).toBeInTheDocument();
  });
});
