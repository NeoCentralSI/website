import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as assignments from '@/services/thesis-proposal/supervisor-assignment.service';
import * as revisions from '@/services/thesis-proposal/proposal-revision.service';
import type { LecturerProposalRevisionState, ProposalRevision, StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getRevisionNotesProblem, LecturerProposalRevisionCard } from './LecturerProposalRevisionCard';
import { getProposalFileProblem, StudentProposalFileCard } from './StudentProposalFileCard';
import { buildProposalSteps } from './studentProposalState';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervisor-assignment.service');
vi.mock('@/services/thesis-proposal/proposal-revision.service');

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const revision = (overrides: Partial<ProposalRevision> = {}): ProposalRevision => ({
  id: 'r1',
  status: 'submitted',
  file: { fileName: 'revisi-1.pdf', fileSize: 10, url: '/uploads/thesis/t1/proposal/revisions/r1/1-revisi-1.pdf', submittedAt: '2026-10-14T03:00:00Z' },
  reviewNotes: null,
  reviewedAt: null,
  reviewerName: null,
  ...overrides,
});

const overview = (proposalRevision: Partial<StudentProposalOverview['proposalRevision']>): StudentProposalOverview => ({
  thesis: { id: 't1', title: 'Sistem A', status: 'proposal', startDate: null, topic: null, academicYear: null, supervisors: [] },
  assignment: { assigned: true, assignedAt: '2025-09-01T00:00:00Z', semesterLabel: 'Ganjil 2025/2026', version: 1, waitingReason: null },
  finalProposal: { academicYear: null, current: null, canSubmit: false, blockReason: 'Mengulang proposal…', history: [] },
  proposalRevision: { applicable: true, evaluation: { id: 'ev1', approvedAt: '2026-10-10T00:00:00Z' }, current: null, history: [], canSubmit: true, blockReason: null, replacesCurrent: false, ...proposalRevision },
});

const lecturerState = (overrides: Partial<LecturerProposalRevisionState> = {}): LecturerProposalRevisionState => ({
  applicable: true,
  evaluation: { id: 'ev1', approvedAt: '2026-10-10T00:00:00Z' },
  current: revision(),
  history: [],
  canReview: true,
  reviewBlockReason: null,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('Proposal revisi (mengulang proposal)', () => {
  it('checks the file and the revision notes before sending', () => {
    expect(getProposalFileProblem(null, 'revision')).toMatch(/Pilih berkas/);
    expect(getProposalFileProblem(new File(['x'], 'p.docx', { type: 'application/msword' }), 'revision')).toMatch(/Proposal Revisi harus berupa berkas PDF/);
    expect(getProposalFileProblem(new File(['%PDF'], 'p.pdf', { type: 'application/pdf' }), 'revision')).toBeNull();
    expect(getRevisionNotesProblem('  pendek  ')).toMatch(/minimal 10 karakter/);
    expect(getRevisionNotesProblem('Perjelas metodologi.')).toBeNull();
  });

  it('Steps 3 to 5 are the repeat steps only for a thesis repeating its proposal', () => {
    const labels = (o: StudentProposalOverview) => buildProposalSteps(o, undefined).map((step) => step.label);
    expect(labels(overview({ applicable: false, evaluation: null, canSubmit: false }))).toEqual([
      'Pengajuan Pembimbing', 'Penetapan Pembimbing', 'Proposal Final', 'Penilaian Proposal', 'Mulai Penelitian',
    ]);
    const repeat = buildProposalSteps(overview({ current: revision({ status: 'revision_requested' }) }), undefined);
    expect(repeat.map((step) => step.label)).toEqual([
      'Pengajuan Pembimbing', 'Penetapan Pembimbing', 'Proposal Revisi', 'Persetujuan Pembimbing 1', 'Kembali ke Penelitian',
    ]);
    expect(repeat[3]).toMatchObject({ state: 'attention', note: 'Revisi diminta' });
  });

  it('student: after "Minta Revisi" sees the notes and uploads a new revision', async () => {
    vi.mocked(assignments.getMyProposalOverview).mockResolvedValue(overview({
      current: revision({ status: 'revision_requested', reviewNotes: 'Perjelas metodologi penelitian.', reviewerName: 'Husnil Kamil, MT', reviewedAt: '2026-10-14T05:00:00Z' }),
    }));
    vi.mocked(revisions.submitProposalRevision).mockResolvedValue({ success: true, message: 'Proposal revisi diajukan', data: { revision: revision({ id: 'r2' }), replaced: false } });
    wrap(<StudentProposalFileCard kind="revision" overview={overview({
      current: revision({ status: 'revision_requested', reviewNotes: 'Perjelas metodologi penelitian.', reviewerName: 'Husnil Kamil, MT', reviewedAt: '2026-10-14T05:00:00Z' }),
    })} />);

    expect(await screen.findByText('Proposal Revisi')).toBeInTheDocument();
    expect(screen.getByText('Perlu revisi')).toBeInTheDocument();
    // Pembimbing 1's notes are in the soft yellow box.
    expect(screen.getByRole('note')).toHaveTextContent('Perjelas metodologi penelitian.');
    expect(screen.queryByRole('button', { name: 'Ajukan' })).not.toBeInTheDocument();
    const file = new File(['%PDF-1.7'], 'revisi-2.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Berkas proposal revisi'), { target: { files: [file] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Ajukan' }));
    await waitFor(() => expect(revisions.submitProposalRevision).toHaveBeenCalledWith(file, expect.anything()));
  });

  it('student: an upload waiting for review can be replaced', async () => {
    wrap(<StudentProposalFileCard kind="revision" overview={overview({ current: revision(), replacesCurrent: true })} />);
    expect(await screen.findByRole('button', { name: /Ganti Berkas/ })).toBeInTheDocument();
    expect(screen.getByText('Menunggu Pembimbing 1')).toBeInTheDocument();
  });

  it('Pembimbing 1: "Minta Revisi" needs notes; "Setujui" approves', async () => {
    vi.mocked(revisions.getProposalRevision).mockResolvedValue(lecturerState());
    vi.mocked(revisions.reviewProposalRevision).mockResolvedValue({ success: true, message: 'ok', data: { revision: revision(), thesis: null } });
    wrap(<LecturerProposalRevisionCard thesisId="t1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Minta Revisi' }));
    const send = screen.getByRole('button', { name: 'Kirim Permintaan Revisi' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan revisi'), { target: { value: 'pendek' } });
    expect(screen.getByText(/minimal 10 karakter/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Catatan revisi'), { target: { value: '  Perjelas metodologi penelitian.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Permintaan Revisi' }));
    await waitFor(() => expect(revisions.reviewProposalRevision).toHaveBeenCalledWith('r1', { action: 'request_revision', notes: 'Perjelas metodologi penelitian.' }));

    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    expect(await screen.findByText('Setujui Proposal Revisi?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Setujui' }).at(-1)!);
    await waitFor(() => expect(revisions.reviewProposalRevision).toHaveBeenCalledWith('r1', { action: 'approve', notes: null }));
  });

  it('Pembimbing 2 only reads: both buttons disabled with the reason', async () => {
    vi.mocked(revisions.getProposalRevision).mockResolvedValue(lecturerState({ canReview: false, reviewBlockReason: 'Hanya Pembimbing 1 yang meninjau proposal revisi.' }));
    wrap(<LecturerProposalRevisionCard thesisId="t1" />);
    expect(await screen.findByText('Hanya Pembimbing 1 yang meninjau proposal revisi.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minta Revisi' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Setujui' })).toBeDisabled();
  });
});
