import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OtherPhaseMilestones } from '@/components/milestone/OtherPhaseMilestones';
import { ThesisPhaseFilter, formatPhaseSessionSummary } from '@/components/thesis/ThesisPhaseFilter';
import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import type { StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getFileProblem, StudentFinalProposalSection } from './StudentFinalProposalSection';

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

  it('offers Semua · Proposal · Penelitian and marks the chosen one', () => {
    const onChange = vi.fn();
    render(<ThesisPhaseFilter value="proposal" onChange={onChange} summary="Proposal: 3 sesi" />);
    expect(screen.getByRole('button', { name: 'Proposal' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Semua' }));
    expect(onChange).toHaveBeenCalledWith('');
    fireEvent.click(screen.getByRole('button', { name: 'Penelitian' }));
    expect(onChange).toHaveBeenCalledWith('research');
  });

  it('the other phase is read-only and unfinished milestones read "Tidak dilanjutkan" (K27)', () => {
    render(
      <OtherPhaseMilestones
        phase="proposal"
        defaultOpen
        reason="Fase proposal sudah selesai"
        milestones={[
          { id: 'm1', title: 'Bab 1 Pendahuluan', status: 'completed', completedAt: '2026-09-01T00:00:00Z' },
          { id: 'm2', title: 'Bab 2 Tinjauan Pustaka', status: 'in_progress' },
        ]}
      />,
    );
    expect(screen.getByText('Milestone Fase Proposal')).toBeInTheDocument();
    expect(screen.getByText(/1 dari 2 selesai · baca saja · Fase proposal sudah selesai/)).toBeInTheDocument();
    expect(screen.getByText('Tidak dilanjutkan')).toBeInTheDocument();
    expect(screen.queryByText('in_progress')).not.toBeInTheDocument();
  });

  it('renders nothing when the other phase has no milestones', () => {
    const { container } = render(<OtherPhaseMilestones phase="research" milestones={[]} />);
    expect(container).toBeEmptyDOMElement();
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
  });

  it('checks the file before sending', () => {
    expect(getFileProblem(null)).toMatch(/Pilih berkas/);
    expect(getFileProblem(new File(['x'], 'p.docx', { type: 'application/msword' }))).toMatch(/PDF/);
    expect(getFileProblem(new File(['%PDF'], 'p.pdf', { type: 'application/pdf' }))).toBeNull();
  });

  it('sends the chosen PDF', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(overview());
    vi.mocked(assignments.submitFinalProposal).mockResolvedValue({ success: true, message: 'Proposal final diajukan', data: { attempt: {} as never, replaced: false } });
    wrap(<StudentFinalProposalSection />);

    const button = await screen.findByRole('button', { name: 'Ajukan Proposal Final' });
    expect(button).toBeDisabled();
    const file = new File(['%PDF-1.7'], 'proposal.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Berkas proposal final'), { target: { files: [file] } });
    fireEvent.click(button);
    await waitFor(() => expect(assignments.submitFinalProposal).toHaveBeenCalledWith(file, expect.anything()));
  });

  it('keeps the button with its reason when the attempt is locked, and lists earlier attempts', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(overview({
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
    }));
    wrap(<StudentFinalProposalSection />);

    expect(await screen.findByRole('button', { name: 'Ganti Proposal Final' })).toBeDisabled();
    expect(screen.getByText(/sudah dimulai/)).toBeInTheDocument();
    expect(screen.getByText('Tidak Lulus · 47')).toBeInTheDocument();
    expect(screen.queryByText('failed')).not.toBeInTheDocument();
  });
});
