import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import type { AssignmentBatch, AssignmentOverview, StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getDownloadBlockReason, getIssueBlockReason, KadepSupervisorAssignmentPanel } from './KadepSupervisorAssignmentPanel';
import { StudentSupervisorAssignmentSection } from './StudentSupervisorAssignmentSection';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-assignment.service');
vi.mock('@/services/studentGuidance.service', () => ({
  getPendingSupervisor2Request: vi.fn(async () => null),
  getAvailableSupervisors2: vi.fn(async () => []),
  requestSupervisor2: vi.fn(),
  cancelSupervisor2Request: vi.fn(),
}));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const batch = (overrides: Partial<AssignmentBatch> = {}): AssignmentBatch => ({
  id: 'b1',
  version: 1,
  status: 'current',
  generatedAt: '2026-08-30T03:00:00.000Z',
  generatedBy: { id: 'k', fullName: 'DR. KADEP, M.T' },
  fileName: 'Penetapan-Pembimbing-2026-2027-Ganjil-v1.pdf',
  fileSize: 1000,
  memberCount: 1,
  fileUrl: '/thesis-proposals/supervisor-assignments/batches/b1/file',
  ...overrides,
});

const overview = (overrides: Partial<AssignmentOverview> = {}): AssignmentOverview => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  entries: [
    {
      thesisId: 't1', studentName: 'Uji Proposal Ditetapkan', studentNim: '2211528010', title: 'Sistem A', supervisorNames: 'AINA, M.Eng',
      supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1' }], supervisorAssignedAt: '2026-08-30T03:00:00.000Z', inCurrentBatch: true,
    },
    {
      thesisId: 't2', studentName: 'Uji Proposal Diterima', studentNim: '2211528008', title: 'Sistem B', supervisorNames: 'AINA, M.Eng',
      supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1' }], supervisorAssignedAt: null, inCurrentBatch: false,
    },
  ],
  currentBatch: batch(),
  batches: [batch()],
  upToDate: false,
  needsIssue: true,
  newCount: 1,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Penetapan Pembimbing (Kadep)', () => {
  it('explains why issuing is not possible', () => {
    expect(getIssueBlockReason(overview(), false)).toMatch(/Hanya Ketua Departemen/);
    expect(getIssueBlockReason(overview({ entries: [] }), true)).toMatch(/Belum ada mahasiswa/);
    expect(getIssueBlockReason(overview({ upToDate: true, needsIssue: false }), true)).toMatch(/sudah memuat/);
    expect(getIssueBlockReason(overview(), true)).toBeNull();
  });

  it('Sekdep downloads only the current, complete batch', () => {
    expect(getDownloadBlockReason(batch(), overview(), true)).toBeNull();
    expect(getDownloadBlockReason(batch(), overview(), false)).toMatch(/Menunggu Ketua Departemen/);
    expect(getDownloadBlockReason(batch({ status: 'superseded' }), overview({ upToDate: true }), false)).toMatch(/digantikan/);
    expect(getDownloadBlockReason(batch(), overview({ upToDate: true }), false)).toBeNull();
  });

  it('lists the cohort with labels and issues the next version after confirming', async () => {
    vi.mocked(assignments.getAssignmentOverview).mockResolvedValue(overview());
    vi.mocked(assignments.issueAssignment).mockResolvedValue({ success: true, data: { ...overview({ upToDate: true }), alreadyIssued: false } });
    wrap(<KadepSupervisorAssignmentPanel canIssue isKadepOrAdmin />);

    expect(await screen.findByText('Perlu Diterbitkan Ulang (1 baru)')).toBeInTheDocument();
    expect(screen.getByText('Belum Ditetapkan')).toBeInTheDocument();
    expect(screen.getByText('Berlaku')).toBeInTheDocument();
    expect(screen.queryByText('current')).not.toBeInTheDocument();
    expect(screen.getAllByText('Aina Hubby Aziira, M.Eng')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Terbitkan Penetapan' }));
    expect(screen.getByText(/Versi 1 digantikan oleh versi 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terbitkan' }));
    await waitFor(() => expect(assignments.issueAssignment).toHaveBeenCalledWith('ay-1', expect.anything()));
  });

  it('Sekdep reads only: issuing and preview are not offered as actions', async () => {
    vi.mocked(assignments.getAssignmentOverview).mockResolvedValue(overview());
    wrap(<KadepSupervisorAssignmentPanel canIssue={false} isKadepOrAdmin={false} />);

    expect(await screen.findByRole('button', { name: 'Terbitkan Penetapan' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Pratinjau PDF/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh/ })).toBeDisabled();
  });
});

describe('Penetapan Pembimbing (mahasiswa)', () => {
  const mine = (assigned: boolean): StudentProposalOverview => ({
    thesis: {
      id: 't2', title: 'Sistem B', status: 'proposal', startDate: null, topic: null, academicYear: null,
      supervisors: [{ lecturerId: 'l1', fullName: 'AINA HUBBY AZIIRA, M.Eng', role: 'Pembimbing 1', identityNumber: '1' }],
    },
    assignment: {
      assigned,
      assignedAt: assigned ? '2026-10-14T03:00:00.000Z' : null,
      semesterLabel: assigned ? 'Ganjil 2026/2027' : null,
      version: assigned ? 2 : null,
      waitingReason: assigned ? null : 'Pengajuan Anda sudah disetujui. Bimbingan proposal dan proposal final terbuka setelah Ketua Departemen menerbitkan Penetapan Pembimbing.',
    },
    finalProposal: { academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' }, current: null, canSubmit: assigned, blockReason: assigned ? null : 'Proposal final dapat diajukan setelah Ketua Departemen menerbitkan Penetapan Pembimbing.', history: [] },
    proposalRevision: { applicable: false, evaluation: null, current: null, history: [], canSubmit: false, blockReason: null, replacesCurrent: false },
  });

  it('shows the waiting reason and never a PDF download', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(mine(false));
    wrap(<StudentSupervisorAssignmentSection />);

    expect(await screen.findByText('Menunggu Penetapan')).toBeInTheDocument();
    expect(screen.getByText(/terbuka setelah Ketua Departemen menerbitkan/)).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unduh/ })).not.toBeInTheDocument();
  });

  it('shows the assignment date once assigned and offers Pembimbing 2', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(mine(true));
    wrap(<StudentSupervisorAssignmentSection />);

    expect(await screen.findByText('Sudah Ditetapkan')).toBeInTheDocument();
    expect(screen.getByText(/untuk semester Ganjil 2026\/2027/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Ajukan Pembimbing 2/ })).toBeInTheDocument();
  });
});
