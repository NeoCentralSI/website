import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as requests from '@/services/thesis-proposal/supervisor-request.service';
import type { KadepQueue, LecturerInbox, StudentSupervisorRequests, SupervisorRequest } from '@/types/thesis-proposal.types';
import { KadepSupervisorRequestQueue } from './KadepSupervisorRequestQueue';
import { LecturerSupervisorRequestTable } from './LecturerSupervisorRequestTable';
import { getSubmitBlockReason } from './StudentSupervisorRequestForm';
import { getWithdrawBlockReason, StudentSupervisorRequestSection } from './StudentSupervisorRequestSection';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-request.service');
vi.mock('@/services/thesis-proposal/supervision-quota.service', () => ({ setAcceptingRequests: vi.fn() }));
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

  it('shows the SIA reason instead of the form when the student does not take Metode Penelitian', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue({
      submission: {
        academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
        eligibleResearchMethod: false,
        eligibilitySource: 'sia',
        eligibilityCapturedAt: null,
        canSubmit: false,
        blockedReason: 'Menurut data SIA, Anda tidak mengambil Metode Penelitian semester ini.',
        revisionRequested: false,
        activeRequestId: null,
      },
      requests: [],
      activeRequest: null,
      draft: null,
    } satisfies StudentSupervisorRequests);

    wrap(<StudentSupervisorRequestSection />);

    expect(await screen.findByText(/tidak mengambil Metode Penelitian semester ini/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajukan' })).not.toBeInTheDocument();
    expect(requests.getCatalog).not.toHaveBeenCalled();
  });

  it('shows the active request with its label (never the raw status) and a disabled pull-back button', async () => {
    vi.mocked(requests.getMySupervisorRequests).mockResolvedValue({
      submission: {
        academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
        eligibleResearchMethod: true,
        eligibilitySource: 'sia',
        eligibilityCapturedAt: null,
        canSubmit: false,
        blockedReason: 'Anda masih memiliki pengajuan pembimbing yang sedang diproses.',
        revisionRequested: false,
        activeRequestId: 'req-1',
      },
      requests: [request()],
      activeRequest: request({ withdrawAvailableAt: '2099-01-01T00:00:00.000Z' }),
      draft: null,
    });

    wrap(<StudentSupervisorRequestSection />);

    expect(await screen.findByText('Menunggu Dosen')).toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
    expect(screen.getByText('Pilih Dosen Sendiri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarik Pengajuan' })).toBeDisabled();
  });
});

describe('Permohonan Pembimbing (dosen)', () => {
  const inbox = (level: 'available' | 'full'): LecturerInbox => ({
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    load: { activeCount: level === 'full' ? 10 : 3, softLimit: 8, hardLimit: 10, level, acceptingRequests: true },
    waiting: [request()],
    history: [],
  });

  it('accepts directly under the hard limit', async () => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(inbox('available'));
    vi.mocked(requests.respondAsLecturer).mockResolvedValue({ success: true, message: 'Pengajuan diterima', data: request({ status: 'accepted' }) });
    wrap(<LecturerSupervisorRequestTable />);

    fireEvent.click(await screen.findByRole('button', { name: 'Terima' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Terima' }).at(-1)!);
    await waitFor(() => expect(requests.respondAsLecturer).toHaveBeenCalledWith('req-1', expect.objectContaining({ action: 'accept', lecturerOverquotaReason: null })));
  });

  it('at the hard limit, accepting needs the consideration and forwards to the Head of Department', async () => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(inbox('full'));
    vi.mocked(requests.respondAsLecturer).mockResolvedValue({ success: true, data: request({ status: 'pending_kadep' }) });
    wrap(<LecturerSupervisorRequestTable />);

    fireEvent.click(await screen.findByRole('button', { name: 'Terima dan Teruskan' }));
    const forward = screen.getByRole('button', { name: 'Teruskan ke Ketua Departemen' });
    expect(forward).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Pertimbangan menerima di atas batas/), { target: { value: 'Dua mahasiswa lulus bulan depan.' } });
    fireEvent.click(forward);
    await waitFor(() => expect(requests.respondAsLecturer).toHaveBeenCalledWith('req-1', expect.objectContaining({ lecturerOverquotaReason: 'Dua mahasiswa lulus bulan depan.' })));
  });
});

describe('Tugas Akhir > Permohonan (Paket E4, 4.1)', () => {
  const inbox: LecturerInbox = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    load: { activeCount: 3, softLimit: 8, hardLimit: 10, level: 'available', acceptingRequests: true },
    waiting: [request()],
    history: [request({ id: 'req-old', status: 'rejected_by_lecturer', proposedTitle: 'Judul Lama Yang Ditolak', rejectionReason: 'Topik tidak sesuai.' })],
  };

  it('lists waiting requests in a table with the route label and a Detail modal carrying the old card content', async () => {
    vi.mocked(requests.getLecturerInbox).mockResolvedValue(inbox);
    wrap(<LecturerSupervisorRequestTable />);

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Pilih Dosen Sendiri')).toBeInTheDocument();
    expect(screen.queryByText('Judul Lama Yang Ditolak')).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan 1-1 dari 1/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Detail' }));
    expect(await screen.findByText('Detail Permohonan Pembimbing')).toBeInTheDocument();
    expect(screen.getByText('Rumusan masalah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tandai Sedang Ditinjau' })).toBeInTheDocument();
  });
});

describe('Penetapan Pembimbing (Kadep)', () => {
  const queue: KadepQueue = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    department: [request({ id: 'dep-1', route: 'department', status: 'pending_kadep', lecturer: null, supervisor: null })],
    overQuota: [{
      ...request({ id: 'oq-1', route: 'over_quota', status: 'pending_kadep', studentJustification: 'Alasan mahasiswa yang cukup panjang.', lecturerOverquotaReason: 'Pertimbangan dosen.' }),
      lecturerLoad: { activeCount: 31, softLimit: 8, hardLimit: 10, level: 'full', projectedCount: 32, overBy: 22 },
    }],
    history: [],
  };

  it('over-quota requests can be approved or redirected, never rejected', async () => {
    vi.mocked(requests.getKadepQueue).mockResolvedValue(queue);
    wrap(<KadepSupervisorRequestQueue route="over_quota" />);

    expect(await screen.findByRole('button', { name: 'Setujui' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alihkan' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tolak' })).not.toBeInTheDocument();
    expect(screen.getByText(/bila disetujui 32\/10 \(lebih 22\)/)).toBeInTheDocument();
  });

  it('department requests can be assigned, sent back for revision, or rejected', async () => {
    vi.mocked(requests.getKadepQueue).mockResolvedValue(queue);
    wrap(<KadepSupervisorRequestQueue route="department" />);

    expect(await screen.findByRole('button', { name: 'Tetapkan Pembimbing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minta Revisi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tolak' })).toBeInTheDocument();
    expect(screen.getByText('Ditetapkan departemen')).toBeInTheDocument();
  });
});
