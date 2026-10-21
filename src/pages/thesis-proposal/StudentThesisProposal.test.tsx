/**
 * The student Proposal page in the form of Seminar Hasil (Ringkasan and Riwayat
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

// cmdk (the lecturer dropdown) needs ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

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
  supervisorScored: false, coordinatorScored: false, isFinalized: false, finalScore: null, result: null,
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

describe('Proposal mahasiswa', () => {
  it.each([
    { name: 'tidak layak', data: mine({}, { canSubmit: false, eligibleResearchMethod: false, blockedReason: NOT_ELIGIBLE }), overview: noThesis() },
    { name: 'layak tanpa draf', data: mine(), overview: noThesis() },
    { name: 'draf', data: mine({ draft: { proposedTitle: 'Draf judul proposal', updatedAt: '2026-10-12', lecturerId: 'l1', lecturer: null } as StudentSupervisorRequests['draft'] }), overview: noThesis() },
    { name: 'menunggu', data: mine({ activeRequest: request(), requests: [request()] }, { canSubmit: false }), overview: noThesis() },
    { name: 'perlu revisi', data: mine({ requests: [request({ status: 'revision_requested', kadepNotes: 'Catatan revisi panjang. '.repeat(30) })] }, { revisionRequested: true }), overview: noThesis() },
    { name: 'diterima', data: mine({ activeRequest: request({ status: 'accepted' }) }, { canSubmit: false }), overview: noThesis() },
    { name: 'ditetapkan', data: mine({ activeRequest: request({ status: 'assigned' }) }, { canSubmit: false }), overview: proposal() },
    { name: 'proposal final terkirim', data: mine({ activeRequest: request({ status: 'assigned' }) }, { canSubmit: false }), overview: proposal({ finalProposal: { ...proposal().finalProposal, current: attempt() } }) },
    { name: 'lulus dan baca-saja', data: mine({ activeRequest: request({ status: 'assigned' }) }, { canSubmit: false }), overview: proposal({
      thesis: { ...proposal().thesis!, status: 'research' },
      finalProposal: { ...proposal().finalProposal, canSubmit: false, blockReason: 'Penilaian proposal periode ini sudah final. Proposal final tidak dapat diganti.', current: attempt({ isFinalized: true, result: 'passed', finalScore: 82 }) },
    }) },
    { name: 'mengulang proposal', data: mine({ activeRequest: request({ status: 'assigned' }) }, { canSubmit: false }), overview: proposal({ proposalRevision: {
      ...proposal().proposalRevision, applicable: true, canSubmit: true,
      current: { id: 'r1', status: 'revision_requested', file: { fileName: 'revisi.pdf', url: '/uploads/revisi.pdf', fileSize: 10, submittedAt: '2026-10-14' }, reviewNotes: 'Catatan pembimbing panjang. '.repeat(30), reviewedAt: '2026-10-15', reviewerName: 'Dosen Satu' },
    } }) },
  ])('keeps both columns stretched and actions in card footers: $name', async ({ data, overview }) => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(data);
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(overview);
    wrap(<StudentThesisProposal />);
    const requestCard = await screen.findByRole('region', { name: 'Kartu Pengajuan Pembimbing' });
    const fileCard = screen.getByRole('region', { name: overview.proposalRevision.applicable ? 'Kartu Proposal Revisi' : 'Kartu Proposal Final' });
    const right = requestCard.parentElement!;
    const row = right.parentElement!;
    expect(row).toHaveClass('grid', 'items-stretch', 'md:grid-cols-[260px_1fr]', 'gap-[14px]');
    expect(right).toHaveClass('flex', 'flex-col', 'h-full', 'gap-[14px]');
    expect(fileCard.parentElement).toBe(right);
    for (const card of [requestCard, fileCard]) {
      expect(card).toHaveClass('flex', 'flex-col', 'flex-1');
      const actions = within(card).queryAllByRole('button');
      if (actions.length) {
        const footer = card.querySelector(':scope > .mt-auto')!;
        expect(footer).toHaveClass('justify-end');
        actions.forEach((action) => expect(footer).toContainElement(action));
      }
      expect(card.className).not.toMatch(/overflow-hidden|h-\[/);
    }
    const stepper = screen.getByText('Status Proposal').parentElement!;
    expect(stepper).toHaveClass('self-stretch');
    expect(row.firstElementChild).toContainElement(stepper);
    expect(steps()).toHaveLength(5);
    if (overview.thesis?.status === 'research') {
      expect(within(fileCard).getByRole('button', { name: /Ganti Berkas/ })).toBeDisabled();
    }
  });

  it('without a request: no Informasi Proposal; a student who may not submit reads why in the Pengajuan card', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({}, { canSubmit: false, eligibleResearchMethod: false, blockedReason: NOT_ELIGIBLE }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText(NOT_ELIGIBLE)).toBeInTheDocument();
    expect(screen.queryByText('Informasi Proposal')).not.toBeInTheDocument();
    expect(screen.queryByText(/SIA/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(Ringkasan|Riwayat Pengajuan Pembimbing)$/ })).toHaveLength(2);
    expect(steps().map((s) => s.textContent)).toEqual([
      'Pengajuan PembimbingBelum diajukan', 'Penetapan PembimbingMenunggu', 'Proposal FinalMenunggu', 'Penilaian ProposalMenunggu', 'Mulai PenelitianMenunggu',
    ]);
    expect(screen.queryByRole('button', { name: 'Ajukan Pembimbing' })).not.toBeInTheDocument();
    // Before the supervisor assignment the Proposal Final card is one line.
    expect(screen.getByText('Terbuka setelah penetapan pembimbing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pilih Berkas/ })).not.toBeInTheDocument();
  });

  it('allowed, no draft: Semester and Metode Penelitian rows; a draft: when it was saved, its title and its lecturer', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine());
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    const view = wrap(<StudentThesisProposal />);
    const grid = await screen.findByLabelText('Isi pengajuan pembimbing');
    expect(grid).toHaveTextContent('Semester2026/2027 Ganjil');
    expect(grid).toHaveTextContent('Metode PenelitianTerdaftar');
    view.unmount();

    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({
      draft: {
        lecturerId: 'l1', topicId: 'topic-1', proposedTitle: 'Draf Judul Sistem Pemantauan', backgroundSummary: null, problemStatement: null,
        proposedSolution: null, researchObject: null, researchPermitStatus: null, studentJustification: null, topic: null,
        lecturer: { id: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng' }, lastSubmittedAt: null, updatedAt: '2026-10-12T03:00:00.000Z',
      } as never,
    }));
    wrap(<StudentThesisProposal />);
    const draft = await screen.findByLabelText('Isi pengajuan pembimbing');
    expect(draft).toHaveTextContent('Draf disimpan12 Oktober 2026 10.00 WIB');
    expect(draft).toHaveTextContent('Judul drafDraf Judul Sistem Pemantauan');
    expect(draft).toHaveTextContent('Dosen di drafAina Hubby Aziira, M.Eng');
    expect(screen.getByRole('button', { name: 'Lanjutkan Draf' })).toBeInTheDocument();
  });

  it('revision requested: route, status and the Ketua Departemen note in the yellow box; Revisi Pengajuan', async () => {
    const asked = request({ status: 'revision_requested', route: 'department', lecturer: null, supervisor: null, kadepNotes: 'Perjelas rumusan masalah.' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ requests: [asked] }, { revisionRequested: true }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<StudentThesisProposal />);
    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent('Catatan Ketua Departemen');
    expect(note).toHaveTextContent('Perjelas rumusan masalah.');
    expect(screen.getByLabelText('Isi pengajuan pembimbing')).toHaveTextContent('StatusPerlu Revisi');
    expect(screen.getByRole('button', { name: 'Revisi Pengajuan' })).toBeInTheDocument();
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
    const grid = screen.getByLabelText('Isi pengajuan pembimbing');
    expect(grid).toHaveTextContent('JalurPilih Dosen Sendiri');
    expect(grid).toHaveTextContent('Dosen tujuanAina Hubby Aziira, M.Eng');
    expect(grid).toHaveTextContent('Dikirim13 Oktober 2026 10.00 WIB');
    expect(grid).toHaveTextContent('Bisa ditarik mulai');
    const pull = screen.getByRole('button', { name: 'Tarik' });
    expect(pull).toBeDisabled();
    expect(pull.parentElement).toHaveAttribute('title', expect.stringMatching(/bisa ditarik mulai/));
    expect(screen.getByRole('button', { name: 'Lihat Detail' })).toBeInTheDocument();
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

    expect(await screen.findByText('Ditetapkan pada 14 Oktober 2026')).toBeInTheDocument();
    expect(screen.queryByText(/versi 2/)).not.toBeInTheDocument();
    expect(screen.getByText('1. Aina Hubby Aziira, M.Eng')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Ajukan Pembimbing 2/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Isi pengajuan pembimbing')).toHaveTextContent('Ditetapkan tanggal14 Oktober 2026 10.00 WIB');
    expect(screen.getByRole('button', { name: 'Lihat Detail' })).toBeInTheDocument();
    expect(steps().map((s) => s.getAttribute('data-state'))).toEqual(['done', 'done', 'waiting', 'waiting', 'waiting']);
    expect(screen.getByRole('button', { name: /Pilih Berkas/ })).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('in research: the page is a record; no Ajukan Pembimbing 2 here (it is asked from the Overview)', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    const base = proposal();
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({ thesis: { ...base.thesis!, status: 'research' } }));
    wrap(<StudentThesisProposal />);
    expect(await screen.findByText('1. Aina Hubby Aziira, M.Eng')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ajukan Pembimbing 2/ })).not.toBeInTheDocument();
    expect(steps()[4]).toHaveTextContent('Mulai Penelitian');
  });

  it('Proposal Final in two steps: a chosen file is reviewed first and only "Ajukan" sends it', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal());
    vi.mocked(assignments.submitFinalProposal).mockResolvedValue({ success: true, message: 'ok', data: null as never });
    wrap(<StudentThesisProposal />);

    await screen.findByRole('button', { name: /Pilih Berkas/ });
    const pdf = new File(['%PDF'], 'Proposal Budi.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Berkas proposal final'), { target: { files: [pdf] } });
    expect(await screen.findByText('Berkas yang akan diajukan')).toBeInTheDocument();
    expect(screen.getByText('Proposal Budi.pdf')).toHaveAttribute('title', 'Proposal Budi.pdf');
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    const fileCard = screen.getByRole('region', { name: 'Kartu Proposal Final' });
    expect(fileCard.querySelector(':scope > .mt-auto')).toContainElement(screen.getByRole('button', { name: 'Ajukan' }));
    expect(assignments.submitFinalProposal).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    await waitFor(() => expect(vi.mocked(assignments.submitFinalProposal).mock.calls[0]?.[0]).toBe(pdf));
  });

  it('Proposal Final shows the file sent and the assessment status; the file opens in the viewer', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({
      finalProposal: { academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, canSubmit: true, blockReason: null, history: [], current: attempt({ supervisorScored: true }) },
    }));
    wrap(<StudentThesisProposal />);
    expect(await screen.findByText('Menunggu nilai koordinator')).toBeInTheDocument();
    expect(screen.getByText('proposal.pdf')).toHaveAttribute('title', 'proposal.pdf');
    expect(screen.getByRole('button', { name: /Ganti Berkas/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Buka di tab baru');
  });

  it('passed: the score as supervisor + coordinator = final, and the thesis is in Penelitian at once (step 5 done)', async () => {
    const assigned = request({ status: 'assigned' });
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: assigned, requests: [assigned] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(proposal({
      thesis: { ...proposal().thesis!, status: 'research', startDate: '2026-10-15T03:00:00.000Z' },
      finalProposal: {
        academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, canSubmit: false, blockReason: 'Penilaian proposal periode ini sudah final. Proposal final tidak dapat diganti.', history: [],
        current: attempt({ supervisorScored: true, coordinatorScored: true, supervisorScore: 40, coordinatorScore: 42, isFinalized: true, finalScore: 82, result: 'passed' }),
      },
    }));
    wrap(<StudentThesisProposal />);

    expect(await screen.findByText('40 + 42 = 82')).toBeInTheDocument();
    expect(screen.getAllByText('Lulus').length).toBeGreaterThan(0);
    expect(steps()[4]).toHaveTextContent('Mulai Penelitian');
    expect(steps()[4]).not.toHaveTextContent(/KRS|Menunggu/);
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
    expect(await screen.findByRole('button', { name: /Pilih Berkas/ })).toBeInTheDocument();
    expect(screen.getAllByText('Proposal Revisi').length).toBeGreaterThan(0);
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
      requests: [
        request({ id: 'old', status: 'rejected_by_lecturer', proposedTitle: 'Judul Lama yang Ditolak', rejectionReason: 'Topik di luar keahlian.' }),
        request({ id: 'older', status: 'rejected_by_kadep', route: 'department', proposedTitle: 'Judul Lewat Departemen', kadepNotes: 'Topik belum sesuai kelompok keilmuan.' }),
      ],
    }));
    wrap(<StudentThesisProposal />, '/tugas-akhir/proposal?tab=riwayat-pengajuan');
    const row = (await screen.findByText('Judul Lama yang Ditolak')).closest('tr')!;
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(within(row).getByText('Ditolak Dosen')).toBeInTheDocument();
    // The Ketua Departemen's note is in the table, not only in a notification.
    const byKadep = screen.getByText('Judul Lewat Departemen').closest('tr')!;
    expect(within(byKadep).getByText('Topik belum sesuai kelompok keilmuan.')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Lihat Detail' }));
    const detail = await screen.findByRole('dialog', { name: 'Detail Pengajuan Pembimbing' });
    expect(within(detail).getByText('Topik di luar keahlian.')).toBeInTheDocument();
    expectFooter(detail, ['Tutup']);
  });
});

describe('Pengajuan Pembimbing page', () => {
  const lecturer = (id: string, fullName: string, group: string, supervisedTopics: string[], acceptingRequests = true): CatalogLecturer => ({
    lecturerId: id, fullName, identityNumber: id, avatarUrl: null, scienceGroup: { id: group, name: group }, acceptingRequests,
    activeCount: 3, softLimit: 8, hardLimit: 10, level: 'available', supervisedTopics,
  });

  it('the lecturer dropdown shows kelompok keilmuan, "Topik bimbingan" and load; it searches topics; a closed lecturer is disabled', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ draft: null }));
    vi.mocked(requests.getCatalog).mockResolvedValue([
      lecturer('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Sistem Enterprise', ['ERP', 'Data Warehouse', 'Business Intelligence']),
      lecturer('l2', 'DOSEN TUTUP, M.Kom', 'Jaringan', ['IoT'], false),
    ]);
    vi.mocked(requests.saveDraft).mockResolvedValue({ success: true, message: 'Draf pengajuan disimpan', data: null as never });
    wrap(<div />, '/tugas-akhir/proposal/pengajuan');

    expect(await screen.findByRole('link', { name: 'Kembali ke Proposal' })).toHaveAttribute('href', '/tugas-akhir/proposal');
    const trigger = await screen.findByRole('combobox', { name: 'Dosen pembimbing' });
    await waitFor(() => expect(trigger).not.toBeDisabled());
    fireEvent.click(trigger);
    const aina = await screen.findByRole('option', { name: /^Aina Hubby/ });
    expect(within(aina).getByText('Sistem Enterprise · Topik bimbingan: ERP, Data Warehouse +1')).toHaveAttribute('title', 'Sistem Enterprise · Topik bimbingan: ERP, Data Warehouse, Business Intelligence');
    expect(within(aina).getByText('3/10 · Tersedia')).toBeInTheDocument();
    const closed = screen.getByRole('option', { name: /^Dosen Tutup/ });
    expect(closed).toHaveAttribute('aria-disabled', 'true');
    expect(within(closed).getByText('Dosen sedang menutup penerimaan pengajuan.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Cari nama, kelompok keilmuan, atau topik...'), { target: { value: 'iot' } });
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    fireEvent.change(screen.getByPlaceholderText('Cari nama, kelompok keilmuan, atau topik...'), { target: { value: 'warehouse' } });
    fireEvent.click(await screen.findByRole('option', { name: /^Aina Hubby/ }));
    expect(screen.getByRole('combobox', { name: 'Dosen pembimbing' })).toHaveTextContent('Aina Hubby Aziira, M.Eng');
    // The chosen lecturer stays in view.
    expect(screen.getByText('Topik bimbingan: ERP, Data Warehouse +1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Draf' }));
    await waitFor(() => expect(requests.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ lecturerId: 'l1' })));
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
  });

  it('required fields: red asterisks; Ajukan is not disabled; a click marks what is missing and sends nothing', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ draft: null }));
    vi.mocked(requests.getCatalog).mockResolvedValue([lecturer('l1', 'AINA HUBBY AZIIRA, M.Eng', 'Sistem Enterprise', ['ERP'])]);
    wrap(<div />, '/tugas-akhir/proposal/pengajuan');

    expect(await screen.findByText('Judul rencana tugas akhir')).toBeInTheDocument();
    expect(screen.getByText('Judul rencana tugas akhir').parentElement?.querySelector('[aria-hidden="true"]')).toHaveTextContent('*');
    const send = screen.getByRole('button', { name: 'Ajukan' });
    expect(send).not.toBeDisabled();
    fireEvent.click(send);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual(expect.arrayContaining([
      'Pilih dosen pembimbing, atau gunakan jalur Ditetapkan Departemen.',
      'Pilih topik penelitian.',
      'Judul minimal 12 karakter.',
      'Isi rumusan masalah.',
    ]));
    expect(requests.submitRequest).not.toHaveBeenCalled();
  });

  it('a student with an active request goes back to the Proposal page', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue(mine({ activeRequest: request(), requests: [request()] }, { canSubmit: false }));
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(noThesis());
    wrap(<div data-testid="proposal-page" />, '/tugas-akhir/proposal/pengajuan');
    expect(await screen.findByTestId('proposal-page')).toBeInTheDocument();
  });
});
