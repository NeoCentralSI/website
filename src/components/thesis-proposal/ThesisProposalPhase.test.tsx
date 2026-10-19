import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MilestoneList } from '@/components/milestone/MilestoneList';
import { formatPhaseSessionSummary } from '@/components/thesis/ThesisPhaseFilter';
import type { Milestone } from '@/types/milestone.types';
import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import type { StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getProposalFileProblem, StudentProposalFileCard } from './StudentProposalFileCard';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-assignment.service');

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const phases = {
  proposal: { guidances: { total: 4, completed: 3 }, milestones: { total: 4, completed: 2 } },
  research: { guidances: { total: 6, completed: 5 }, milestones: { total: 3, completed: 1 } },
};

beforeEach(() => vi.clearAllMocks());

describe('Bimbingan dua fase (10.7)', () => {
  it('counts proposal sessions without a minimum and research sessions against 8', () => {
    expect(formatPhaseSessionSummary(phases)).toBe('Proposal: 3 sesi · Penelitian: 5 dari 8 sesi');
    expect(formatPhaseSessionSummary(undefined)).toBeNull();
  });

  it('milestones of the other phase continue the same list, read-only, each with its phase badge', () => {
    const milestone = (id: string, title: string, status: Milestone['status'], phase: Milestone['phase']): Milestone => ({
      id, thesisId: 't1', title, description: null, targetDate: null, startedAt: null, completedAt: null, status, phase,
      progressPercentage: status === 'completed' ? 100 : 40, orderIndex: 0, validatedBy: null, validatedAt: null,
      supervisorNotes: null, feedback: null, studentNotes: null, evidenceUrl: null, evidenceDescription: null,
      createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
    } as Milestone);
    render(
      <MilestoneList
        milestones={[milestone('r1', 'Bab 4 Implementasi', 'in_progress', 'research')]}
        progress={null}
        isOwner
        readOnlyMilestones={[milestone('p1', 'Bab 1 Pendahuluan', 'completed', 'proposal')]}
        readOnlyPhase="proposal"
      />,
    );
    expect(screen.queryByText('Milestone Fase Proposal')).not.toBeInTheDocument();
    const readOnly = screen.getByRole('list', { name: 'Milestone fase lain (baca saja)' });
    expect(within(readOnly).getByText('Bab 1 Pendahuluan')).toBeInTheDocument();
    expect(within(readOnly).getByText('Proposal')).toBeInTheDocument();
    // No action buttons on the read-only part.
    expect(within(readOnly).queryByRole('button', { name: /Edit|Hapus|Mulai|Validasi/ })).not.toBeInTheDocument();
  });
});

describe('Proposal final (10.3)', () => {
  const overview = (finalProposal: Partial<StudentProposalOverview['finalProposal']> = {}): StudentProposalOverview => ({
    thesis: { id: 't1', title: 'Sistem A', status: 'proposal', startDate: null, topic: null, academicYear: null, supervisors: [] },
    assignment: { assigned: true, assignedAt: '2026-09-01T00:00:00Z', semesterLabel: 'Ganjil 2026/2027', version: 1, waitingReason: null },
    finalProposal: {
      academicYear: { id: 'ay-2', label: '2026/2027 Ganjil' },
      current: null,
      canSubmit: true,
      blockReason: null,
      history: [],
      ...finalProposal,
    },
    proposalRevision: { applicable: false, evaluation: null, current: null, history: [], canSubmit: false, blockReason: null, replacesCurrent: false },
  });

  it('checks the file before sending', () => {
    expect(getProposalFileProblem(null)).toMatch(/Pilih berkas/);
    expect(getProposalFileProblem(new File(['x'], 'p.docx', { type: 'application/msword' }))).toMatch(/PDF/);
    expect(getProposalFileProblem(new File(['%PDF'], 'p.pdf', { type: 'application/pdf' }))).toBeNull();
  });

  it('sends the chosen PDF', async () => {
    vi.mocked(assignments.submitFinalProposal).mockResolvedValue({ success: true, message: 'Proposal final diajukan', data: { attempt: {} as never, replaced: false } });
    wrap(<StudentProposalFileCard kind="final" overview={overview()} />);

    const button = await screen.findByRole('button', { name: 'Ajukan Proposal Final' });
    expect(button).toBeDisabled();
    const file = new File(['%PDF-1.7'], 'proposal.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Berkas proposal final'), { target: { files: [file] } });
    fireEvent.click(button);
    await waitFor(() => expect(assignments.submitFinalProposal).toHaveBeenCalledWith(file, expect.anything()));
  });

  it('keeps the button with its reason in the tooltip when the attempt is locked (Button, no raw file input)', async () => {
    const locked = overview({
      canSubmit: false,
      blockReason: 'Penilaian proposal periode ini sudah dimulai. Proposal final tidak dapat diganti.',
      current: {
        id: 'a2', academicYear: { id: 'ay-2', label: '2026/2027 Ganjil' },
        file: { fileName: 'proposal.pdf', fileSize: 10, url: '/uploads/thesis/t1/proposal/a2/1-proposal.pdf', submittedAt: '2026-10-01T03:00:00Z' },
        supervisorScored: true, coordinatorScored: false, isFinalized: false, finalScore: null, result: null, attendanceAutoZeroed: false,
      },
      history: [{
        id: 'a1', academicYear: { id: 'ay-1', label: '2025/2026 Genap' },
        file: { fileName: 'lama.pdf', fileSize: 10, url: '/uploads/thesis/t1/proposal/a1/lama.pdf', submittedAt: null },
        supervisorScored: true, coordinatorScored: true, isFinalized: true, finalScore: 47, result: 'failed', attendanceAutoZeroed: false,
      }],
    });
    wrap(<StudentProposalFileCard kind="final" overview={locked} />);

    const replace = await screen.findByRole('button', { name: 'Ganti Proposal Final' });
    expect(replace).toBeDisabled();
    expect(replace.parentElement).toHaveAttribute('title', expect.stringMatching(/sudah dimulai/));
    expect(screen.getByRole('button', { name: 'Pilih Berkas' }).className).toContain('border-primary/30');
    expect(screen.getByLabelText('Berkas proposal final')).toHaveClass('hidden');
    expect(screen.getByText('proposal.pdf')).toBeInTheDocument();
  });
});
