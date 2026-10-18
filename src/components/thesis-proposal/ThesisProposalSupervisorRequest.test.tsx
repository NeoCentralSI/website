import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as changeService from '@/services/thesis-change-request/thesis-change-request.service';
import * as lecturerGuidance from '@/services/lecturerGuidance.service';
import * as requests from '@/services/thesis-proposal/supervisor-request.service';
import type { ThesisChangeRequestRow } from '@/types/thesis-change-request.types';
import type {
  LecturerApprovalInbox,
  LecturerApprovalRow,
  LecturerInbox,
  SupervisorRequest,
} from '@/types/thesis-proposal.types';
import { expectColumnFits } from '@/test/columnFit';
import { expectFooter } from '@/test/dialogFooter';
import { LecturerApprovalInboxTable } from './LecturerApprovalInboxTable';
import { getSubmitBlockReason } from './StudentSupervisorRequestForm';
import { getWithdrawBlockReason } from './studentProposalState';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-request.service');
vi.mock('@/services/thesis-change-request/thesis-change-request.service');
vi.mock('@/services/thesis-proposal/supervision-quota.service', () => ({ setAcceptingRequests: vi.fn() }));
vi.mock('@/services/lecturerGuidance.service', () => ({ approveSupervisor2Request: vi.fn(), rejectSupervisor2Request: vi.fn() }));
vi.mock('@/hooks/milestone/useMilestone', () => ({
  useTopics: () => ({ data: [{ id: 'topic-1', name: 'Enterprise System' }] }),
}));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const request = (overrides: Partial<SupervisorRequest> = {}): SupervisorRequest => ({
  id: 'req-1',
  status: 'pending',
  route: 'direct',
  createdAt: '2026-10-13T03:00:00.000Z',
  updatedAt: '2026-10-13T03:00:00.000Z',
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  isCurrentPeriod: true,
  student: { id: 's1', fullName: 'BUDI SANTOSO', identityNumber: '2211528001' },
  topic: { id: 'topic-1', name: 'Enterprise System', scienceGroup: { id: 'k', name: 'Sistem Enterprise' } },
  proposedTitle: 'Sistem Informasi Pemantauan Proposal',
  backgroundSummary: 'Latar',
  problemStatement: 'Masalah',
  proposedSolution: 'Solusi',
  researchObject: 'Departemen',
  researchPermitStatus: 'in_process',
  studentJustification: null,
  lecturer: { id: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng' },
  redirectTarget: null,
  supervisor: { id: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng' },
  lecturerApprovalNote: null,
  lecturerOverquotaReason: null,
  lecturerRespondedAt: null,
  rejectionReason: null,
  forwardedToKadepAt: null,
  forwardedBy: null,
  kadepNotes: null,
  reviewedAt: null,
  reviewer: null,
  withdrawnAt: null,
  withdrawCount: 0,
  acceptedOverNormal: false,
  thesis: null,
  withdrawAvailableAt: '2026-10-16T03:00:00.000Z',
  ...overrides,
});

const form = {
  route: 'direct' as const,
  lecturerId: 'l1',
  topicId: 'topic-1',
  proposedTitle: 'Sistem Informasi Pemantauan Proposal',
  backgroundSummary: 'a',
  problemStatement: 'b',
  proposedSolution: 'c',
  researchObject: 'd',
  researchPermitStatus: 'in_process' as const,
  studentJustification: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Pengajuan Pembimbing (mahasiswa)', () => {
  it('explains why the request cannot be sent yet', () => {
    expect(getSubmitBlockReason({ ...form, lecturerId: '' }, false)).toMatch(/Pilih dosen/);
    expect(getSubmitBlockReason({ ...form, route: 'department', lecturerId: '' }, false)).toBeNull();
    expect(getSubmitBlockReason({ ...form, proposedTitle: 'Pendek' }, false)).toMatch(/minimal 12/);
    expect(getSubmitBlockReason(form, true)).toMatch(/minimal 20 karakter/);
    expect(getSubmitBlockReason({ ...form, studentJustification: 'Topik saya melanjutkan riset dosen ini.' }, true)).toBeNull();
    expect(getSubmitBlockReason(form, false)).toBeNull();
  });

  it('pull back opens 72 hours after sending; cancelling closes after Penetapan Pembimbing', () => {
    const now = new Date('2026-10-14T03:00:00.000Z');
    expect(getWithdrawBlockReason(request(), now)).toMatch(/bisa ditarik mulai/);
    expect(getWithdrawBlockReason(request(), new Date('2026-10-17T00:00:00.000Z'))).toBeNull();
    expect(getWithdrawBlockReason(request({ status: 'accepted', thesis: { id: 't', title: 'x', status: 'proposal', supervisorAssignedAt: null } }), now)).toBeNull();
    expect(getWithdrawBlockReason(request({ status: 'accepted', thesis: { id: 't', title: 'x', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z' } }), now)).toMatch(/sudah ditetapkan/);
  });
});

/** Radix menus open on pointer down in jsdom. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
}

describe('Tugas Akhir > Permohonan (Paket E5, 3.1: the lecturer approval inbox)', () => {
  const lecturerInbox = (level: 'available' | 'full'): LecturerInbox => ({
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    load: { activeCount: level === 'full' ? 10 : 3, softLimit: 8, hardLimit: 10, level, acceptingRequests: true },
    waiting: [request()],
    history: [],
  });
  const meta = (total: number, page = 1, pageSize = 10) => ({ page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
  const supervisorRow = (item: SupervisorRequest): LecturerApprovalRow => ({
    kind: 'supervisor_request', id: item.id, viewStatus: item.status, createdAt: item.createdAt, supervisorRequest: item,
  });
  const changeRow = (overrides: Partial<ThesisChangeRequestRow> = {}): LecturerApprovalRow => {
    const changeRequest: ThesisChangeRequestRow = {
      id: 'chg-1',
      thesisId: 't9',
      batchId: null,
      requestType: 'supervisor',
      status: 'pending',
      reason: 'Pembimbing lama studi lanjut.',
      student: { id: 'stu-9', name: 'NABIL RIZKI', identityNumber: '2211522018' },
      thesisTitle: 'Judul Penelitian',
      title: null,
      supervisor: { position: 'pembimbing_1', replaced: { id: 'l0', name: 'HUSNIL KAMIL', identityNumber: null }, next: { id: 'l1', name: 'AINA HUBBY', identityNumber: null } },
      requestedBy: { id: 'stu-9', name: 'NABIL RIZKI', identityNumber: '2211522018' },
      requestedByStudent: true,
      steps: [
        { key: 'new_supervisor', lecturer: { id: 'l1', name: 'AINA HUBBY', identityNumber: null }, status: 'pending', skipped: false, notes: null, decidedAt: null },
        { key: 'kadep', lecturer: null, status: 'pending', skipped: false, notes: null, decidedAt: null },
      ],
      currentStep: 'new_supervisor',
      decision: null,
      appliedAt: null,
      createdAt: '2026-10-14T03:00:00.000Z',
      viewer: { canDecideAsLecturer: true, canCancel: false },
      viewStatus: 'awaiting_me',
      ...overrides,
    };
    return { kind: 'change_request', id: changeRequest.id, viewStatus: changeRequest.viewStatus, createdAt: changeRequest.createdAt, changeRequest };
  };
  const approvalInbox = (data: LecturerApprovalRow[], total = data.length): LecturerApprovalInbox => ({
    data,
    meta: meta(total),
    counts: { waiting: 2, waitingRequests: 1, waitingChanges: 1 },
  });

  beforeEach(() => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(lecturerInbox('available'));
  });

  it('accepts a supervisor request directly under the hard limit', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([supervisorRow(request())]));
    vi.mocked(requests.respondAsLecturer).mockResolvedValue({ success: true, message: 'Pengajuan diterima', data: request({ status: 'accepted' }) });
    wrap(<LecturerApprovalInboxTable />);

    const accept = await screen.findByRole('button', { name: 'Terima' });
    // Accept is a green icon, as on the reference table (1.1).
    expect(accept.className).toContain('text-emerald-600');
    fireEvent.click(accept);
    fireEvent.click(screen.getAllByRole('button', { name: 'Terima' }).at(-1)!);
    await waitFor(() => expect(requests.respondAsLecturer).toHaveBeenCalledWith('req-1', expect.objectContaining({ action: 'accept', lecturerOverquotaReason: null })));
  });

  it('at the hard limit, accepting is the forward arrow, needs the consideration and forwards to the Head of Department', async () => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(lecturerInbox('full'));
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([supervisorRow(request())]));
    vi.mocked(requests.respondAsLecturer).mockResolvedValue({ success: true, data: request({ status: 'pending_kadep' }) });
    wrap(<LecturerApprovalInboxTable />);

    fireEvent.click(await screen.findByRole('button', { name: 'Terima dan Teruskan ke Ketua Departemen' }));
    const forward = screen.getByRole('button', { name: 'Teruskan ke Ketua Departemen' });
    expect(forward).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Pertimbangan menerima di atas batas/), { target: { value: 'Dua mahasiswa lulus bulan depan.' } });
    fireEvent.click(forward);
    await waitFor(() => expect(requests.respondAsLecturer).toHaveBeenCalledWith('req-1', expect.objectContaining({ lecturerOverquotaReason: 'Dua mahasiswa lulus bulan depan.' })));
  });

  it('one table of both kinds in the server order, Jenis and Status filtered in the column header', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([
      supervisorRow(request()),
      changeRow(),
      supervisorRow(request({ id: 'req-acc', status: 'redirected', proposedTitle: 'Judul Dialihkan' })),
    ]));
    wrap(<LecturerApprovalInboxTable />);

    expect(await screen.findAllByText('Budi Santoso')).toHaveLength(2);
    expect(requests.getLecturerApprovalInbox).toHaveBeenCalledWith({ kind: undefined, status: undefined, search: undefined, page: 1, pageSize: 10 });
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual([
      'Mahasiswa', 'Jenis', 'Usulan', 'Tanggal Masuk', 'Status', 'Aksi',
    ]);
    const rows = within(table).getAllByRole('row').slice(1);
    // Paket E6 (3): Jenis is one badge; the details stay in Usulan.
    expect(within(rows[0]).getAllByRole('cell')[1]).toHaveTextContent(/^Pengajuan Pembimbing$/);
    expect(within(rows[0]).getByText('Menunggu Dosen')).toBeInTheDocument();
    expect(within(rows[1]).getAllByRole('cell')[1]).toHaveTextContent(/^Perubahan Pembimbing$/);
    expect(within(rows[1]).getByText('Pembimbing 1: Husnil Kamil → Aina Hubby')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Menunggu Persetujuan Anda')).toBeInTheDocument();
    // A long status is short in the cell, the full label in its tooltip (1.2).
    expect(within(rows[2]).getByText('Dialihkan')).toHaveAttribute('title', 'Dialihkan Ketua Departemen, Menunggu Penetapan Pembimbing');
    expect(within(rows[2]).queryByRole('button', { name: 'Terima' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Filter/ })).not.toBeInTheDocument();

    openMenu(within(screen.getByRole('columnheader', { name: /Jenis/ })).getByRole('button'));
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'Semua', 'Pengajuan Pembimbing', 'Perubahan Judul', 'Perubahan Pembimbing', 'Perubahan Judul & Pembimbing', 'Pembimbing 2',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Perubahan Pembimbing' }));
    await waitFor(() => expect(requests.getLecturerApprovalInbox).toHaveBeenLastCalledWith({ kind: 'change_supervisor', status: undefined, search: undefined, page: 1, pageSize: 10 }));

    openMenu(within(screen.getByRole('columnheader', { name: /Status/ })).getByRole('button'));
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'Semua', 'Menunggu Persetujuan Anda', 'Sedang Berjalan', 'Disetujui', 'Ditolak', 'Dibatalkan',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Menunggu Persetujuan Anda' }));
    await waitFor(() => expect(requests.getLecturerApprovalInbox).toHaveBeenLastCalledWith({ kind: 'change_supervisor', status: 'awaiting_me', search: undefined, page: 1, pageSize: 10 }));
  });

  it('Paket E6 (1): the longest jenis, status and date stay inside their cells', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([
      changeRow({ requestType: 'both', title: { previous: 'Lama', next: 'Baru', newTopic: null }, createdAt: '2026-09-30T03:00:00.000Z' }),
    ]));
    wrap(<LecturerApprovalInboxTable />);
    await screen.findByText('Nabil Rizki');
    const table = screen.getByRole('table');
    const header = (name: string) => within(table).getByRole('columnheader', { name: new RegExp(`^${name}`) });
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    expectColumnFits(header('Jenis'), cells[1], 'Perubahan Judul & Pembimbing');
    expectColumnFits(header('Tanggal Masuk'), cells[3], '30 September 2026');
    expectColumnFits(header('Status'), cells[4], 'Menunggu Persetujuan Anda');
  });

  it('Paket E6 (6): a change step the rules block now is marked, and Setujui waits with the reason', async () => {
    const reason = 'Pengajuan ini tidak dapat disetujui saat ini. Perubahan judul tidak dapat diajukan selama seminar hasil sedang berproses. Pengajuan tetap menunggu dan dapat ditolak.';
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([changeRow({ applyBlockReason: reason })]));
    wrap(<LecturerApprovalInboxTable />);
    const tableRow = (await screen.findByText('Nabil Rizki')).closest('tr')!;
    expect(within(tableRow).getByText('Terblokir')).toHaveAttribute('title', reason);
    expect(within(tableRow).getByRole('button', { name: 'Setujui' })).toBeDisabled();
    expect(within(tableRow).getByRole('button', { name: 'Tolak' })).toBeEnabled();
  });

  it('approves the lecturer\'s own Perubahan TA step from the row', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([changeRow()]));
    vi.mocked(changeService.decideAsLecturer).mockResolvedValue({ success: true, message: 'ok', data: {} as never });
    wrap(<LecturerApprovalInboxTable />);

    const tableRow = (await screen.findByText('Nabil Rizki')).closest('tr')!;
    fireEvent.click(within(tableRow).getByRole('button', { name: 'Setujui' }));
    const dialog = await screen.findByRole('dialog', { name: 'Setujui pengajuan?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(changeService.decideAsLecturer).toHaveBeenCalledWith('chg-1', { approve: true, notes: null }));
  });

  it('Paket P9 (4): the Pembimbing 2 requests are the Jenis "Pembimbing 2" of the same table (Lihat, Bersedia, Tolak)', async () => {
    const p2: LecturerApprovalRow = {
      kind: 'supervisor2_request', id: 'n-1', viewStatus: 'awaiting_me', createdAt: '2026-10-15T03:00:00.000Z',
      supervisor2Request: { requestId: 'n-1', thesisId: 't3', studentId: 's3', studentName: 'PUTRI AYU', studentEmail: 'putri@student.unand.ac.id', studentNim: '2211528003', thesisTitle: 'Judul Putri', requestedAt: '2026-10-15T03:00:00.000Z' },
    };
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([p2, supervisorRow(request())]));
    vi.mocked(lecturerGuidance.approveSupervisor2Request).mockResolvedValue({ success: true, message: 'ok' });
    wrap(<LecturerApprovalInboxTable />);

    const row = (await screen.findByText('Putri Ayu')).closest('tr')!;
    expect(within(row).getByText('Pembimbing 2')).toBeInTheDocument();
    expect(within(row).getByText('Menunggu Persetujuan Anda')).toBeInTheDocument();
    expect(within(row).getByText('Judul Putri')).toBeInTheDocument();
    expect(within(row).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Lihat Detail', 'Bersedia', 'Tolak']);
    // One table on the page.
    expect(screen.getAllByRole('table')).toHaveLength(1);

    fireEvent.click(within(row).getByRole('button', { name: 'Lihat Detail' }));
    const detail = await screen.findByRole('dialog', { name: 'Detail Permintaan Pembimbing 2' });
    expectFooter(detail, ['Batal', 'Tolak', 'Bersedia']);
    fireEvent.click(within(detail).getByRole('button', { name: 'Bersedia' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ya, Bersedia' }));
    await waitFor(() => expect(lecturerGuidance.approveSupervisor2Request).toHaveBeenCalledWith('n-1'));
  });

  it('opens the supervisor request detail with the old card content', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([supervisorRow(request())]));
    wrap(<LecturerApprovalInboxTable />);

    fireEvent.click(await screen.findByRole('button', { name: 'Lihat Detail' }));
    expect(await screen.findByText('Detail Pengajuan Pembimbing')).toBeInTheDocument();
    expect(screen.getByText('Rumusan masalah')).toBeInTheDocument();
    // Lanjutan Paket E6: Batal, then the actions, Tolak destructive, Terima last.
    expectFooter(screen.getByRole('dialog'), ['Batal', 'Tandai Sedang Ditinjau', 'Tolak', 'Terima']);
    // Paket P9 (1.3): Tandai Sedang Ditinjau is an outline button.
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tandai Sedang Ditinjau' }).className).toContain('border-primary/30');
  });

  it('Lanjutan Paket E6: when the lecturer is full the note is one line above the buttons; a closed request has only Tutup', async () => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(lecturerInbox('full'));
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([
      supervisorRow(request({ status: 'under_review' })),
      supervisorRow(request({ id: 'req-done', status: 'assigned', student: { id: 's2', fullName: 'CITRA LESTARI', identityNumber: '2211528002' } })),
    ]));
    wrap(<LecturerApprovalInboxTable />);

    fireEvent.click(within((await screen.findByText('Budi Santoso')).closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    let dialog = await screen.findByRole('dialog');
    expectFooter(dialog, ['Batal', 'Tolak', 'Terima dan Teruskan'], 'Anda sudah mencapai batas bimbingan');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(within(screen.getByText('Citra Lestari').closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    dialog = await screen.findByRole('dialog');
    expectFooter(dialog, ['Tutup']);
  });

  it('Lanjutan Paket E6: the Perubahan TA detail says the lecturer\'s step on one line above Batal, Tolak, Setujui', async () => {
    vi.mocked(requests.getLecturerApprovalInbox).mockResolvedValue(approvalInbox([changeRow()]));
    wrap(<LecturerApprovalInboxTable />);
    fireEvent.click(within((await screen.findByText('Nabil Rizki')).closest('tr')!).getByRole('button', { name: 'Lihat Detail' }));
    const dialog = await screen.findByRole('dialog', { name: 'Detail Pengajuan Perubahan' });
    expectFooter(dialog, ['Batal', 'Tolak', 'Setujui'], 'Anda menyetujui sebagai Pembimbing Baru.');
  });

  it('pages past the first hundred rows: page 11 of 150 shows rows 101-110', async () => {
    const rows = Array.from({ length: 150 }, (_, i) => supervisorRow(request({ id: `req-${i + 1}`, status: 'closed', student: { id: `s${i + 1}`, fullName: `MAHASISWA ${i + 1}`, identityNumber: `${i + 1}` } })));
    vi.mocked(requests.getLecturerApprovalInbox).mockImplementation(async ({ page, pageSize }) => ({
      data: rows.slice((page - 1) * pageSize, page * pageSize),
      meta: meta(150, page, pageSize),
      counts: { waiting: 0, waitingRequests: 0, waitingChanges: 0 },
    }));
    wrap(<LecturerApprovalInboxTable />);

    expect(await screen.findByText('Menampilkan 1-10 dari 150')).toBeInTheDocument();
    for (let next = 2; next <= 11; next += 1) {
      fireEvent.click(screen.getByRole('link', { name: 'Go to next page' }));
      await screen.findByText(`Menampilkan ${(next - 1) * 10 + 1}-${next * 10} dari 150`);
    }
    expect(screen.getByText('Mahasiswa 101')).toBeInTheDocument();
    expect(screen.queryByText('Mahasiswa 100')).not.toBeInTheDocument();
  });
});
