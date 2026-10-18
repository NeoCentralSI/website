/**
 * Paket P8: Batas Bimbingan as a table (full lecturers first), the phase in "Buat dari Template"
 * (5), and the student Proposal page title outside the cards (1.1).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MilestoneList } from '@/components/milestone/MilestoneList';
import { TemplateSelectorDialog } from '@/components/milestone/TemplateSelectorDialog';
import StudentThesisProposal from '@/pages/thesis-proposal/StudentThesisProposal';
import * as quota from '@/services/thesis-proposal/supervision-quota.service';
import { expectColumnFits } from '@/test/columnFit';
import type { Milestone, MilestoneTemplate } from '@/types/milestone.types';
import type { LecturerLoadRow, SupervisionLoadOverview } from '@/types/thesis-proposal.types';
import { SupervisionQuotaPanel } from './SupervisionQuotaPanel';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/thesis-proposal/supervision-quota.service');
vi.mock('@/hooks/master-data/useAcademicYears', () => ({ useAcademicYears: () => ({ academicYears: [] }) }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));
vi.mock('@/components/thesis-proposal/StudentSupervisorRequestSection', () => ({ StudentSupervisorRequestSection: () => <div data-testid="StudentSupervisorRequestSection" /> }));
vi.mock('@/components/thesis-proposal/StudentSupervisorAssignmentSection', () => ({ StudentSupervisorAssignmentSection: () => <div data-testid="StudentSupervisorAssignmentSection" /> }));
vi.mock('@/components/thesis-proposal/StudentProposalRevisionSection', () => ({ StudentProposalRevisionSection: () => <div data-testid="StudentProposalRevisionSection" /> }));
vi.mock('@/components/thesis-proposal/StudentFinalProposalSection', () => ({ StudentFinalProposalSection: () => <div data-testid="StudentFinalProposalSection" /> }));
vi.mock('@/components/thesis-proposal/StudentResearchMethodScoreSection', () => ({ StudentResearchMethodScoreSection: () => <div data-testid="StudentResearchMethodScoreSection" /> }));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const lecturer = (id: string, fullName: string, activeCount: number, level: LecturerLoadRow['level'], acceptingRequests = true): LecturerLoadRow => ({
  lecturerId: id, fullName, identityNumber: null, scienceGroup: null, acceptingRequests, activeCount, level,
  breakdown: { total: activeCount, waitingAssignment: 1, proposal: 2, research: activeCount - 3, onLeave: 0, asSupervisor2: 4 },
});

beforeEach(() => vi.clearAllMocks());

describe('Batas Bimbingan (Paket P8)', () => {
  const overview: SupervisionLoadOverview = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    general: { softLimit: 8, hardLimit: 99 },
    period: null,
    applicable: { softLimit: 8, hardLimit: 99, source: 'general' },
    lecturers: [
      lecturer('l1', 'ULLYA MEGA WAHYUNI, M.Kom', 7, 'available'),
      lecturer('l2', 'HUSNIL KAMIL, MT', 99, 'near_limit', false),
      lecturer('l3', 'AFRIYANTI DWI KARTIKA, MT', 100, 'full'),
    ],
  };

  it('the limits are two cards; the load is one table with the full lecturers first', async () => {
    vi.mocked(quota.getLoadOverview).mockResolvedValue(overview);
    wrap(<SupervisionQuotaPanel canEdit />);
    expect(await screen.findByRole('heading', { name: 'Beban Dosen' })).toBeInTheDocument();
    expect(screen.getByText('Batas Umum')).toBeInTheDocument();
    expect(screen.getByText('Batas Periode')).toBeInTheDocument();
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      expect.stringContaining('Afriyanti'), expect.stringContaining('Husnil'), expect.stringContaining('Ullya'),
    ]);
    expectColumnFits(within(table).getByRole('columnheader', { name: /Beban/ }), within(rows[1]).getAllByRole('cell')[1], '99/99 · Mendekati Batas');
    expectColumnFits(within(table).getByRole('columnheader', { name: /Pengajuan Baru/ }), within(rows[1]).getAllByRole('cell')[3], 'Ditutup Dosen');
    expect(within(rows[0]).getByText(/Sebagai Pembimbing 2: 4/)).toBeInTheDocument();
  });

  it('in Penetapan Pembimbing > Beban Dosen only the table shows', async () => {
    vi.mocked(quota.getLoadOverview).mockResolvedValue(overview);
    wrap(<SupervisionQuotaPanel canEdit={false} showLimits={false} />);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByText('Batas Umum')).not.toBeInTheDocument();
  });
});

describe('Buat dari Template: the phase is written out (Paket P8, 5)', () => {
  const template = (id: string, topicId: string | null): MilestoneTemplate => ({
    id, name: `Template ${id}`, description: null, topicId, topic: null, orderIndex: 0, isActive: true, createdAt: '', updatedAt: '',
  });

  it('proposal phase: "Template fase Proposal", general templates only', () => {
    render(
      <TemplateSelectorDialog open onOpenChange={vi.fn()} templates={[template('umum', null), template('ta', 'topic-1')]} thesisTopicId={null} onSubmit={vi.fn()} generalOnly />,
    );
    expect(screen.getByTestId('template-phase')).toHaveTextContent('Template fase Proposal');
    expect(screen.getByText('Template umum')).toBeInTheDocument();
    expect(screen.queryByText('Template ta')).not.toBeInTheDocument();
  });

  it('research phase: "Template fase Penelitian · topik <nama>"', () => {
    render(
      <TemplateSelectorDialog open onOpenChange={vi.fn()} templates={[template('ta', 'topic-1')]} thesisTopicId="topic-1" thesisTopicName="Enterprise System" onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId('template-phase')).toHaveTextContent('Template fase Penelitian · topik Enterprise System');
    expect(screen.getByText(/Milestone fase proposal yang sudah ada tidak menghalangi/)).toBeInTheDocument();
  });

  it('after moving up, the proposal milestones stay read-only with their badge and the research template can be applied', () => {
    const proposalMilestone = {
      id: 'm1', thesisId: 't1', title: 'Bab I Pendahuluan', description: null, targetDate: null, startedAt: null, completedAt: null, status: 'completed', phase: 'proposal',
      progressPercentage: 100, orderIndex: 0, validatedBy: null, validatedAt: null, supervisorNotes: null, feedback: null, studentNotes: null, evidenceUrl: null, evidenceDescription: null,
      createdAt: '', updatedAt: '',
    } as unknown as Milestone;
    render(
      <MilestoneList milestones={[]} progress={null} isOwner currentPhase="research" readOnlyMilestones={[proposalMilestone]} readOnlyPhase="proposal" onCreateNew={vi.fn()} onCreateFromTemplates={vi.fn()} />,
    );
    for (const button of screen.getAllByRole('button', { name: /Buat dari Template/ })) expect(button).toBeEnabled();
    const readOnly = screen.getByRole('list', { name: 'Milestone fase lain (baca saja)' });
    expect(within(readOnly).getByText('Bab I Pendahuluan')).toBeInTheDocument();
    expect(within(readOnly).getByText('Proposal')).toBeInTheDocument();
  });
});

describe('Tugas Akhir > Proposal (mahasiswa), Paket P8 (1.1)', () => {
  it('has its title and subtitle outside the cards, above the sections in order', () => {
    render(<MemoryRouter><StudentThesisProposal /></MemoryRouter>);
    const heading = screen.getByRole('heading', { level: 1, name: 'Proposal' });
    expect(heading.parentElement?.textContent).toContain('Pengajuan pembimbing, Penetapan Pembimbing, proposal final, dan Nilai Metode Penelitian Anda');
    expect(heading.closest('[class*="card"]')).toBeNull();
    expect(screen.getAllByTestId(/^Student/).map((el) => el.dataset.testid)).toEqual([
      'StudentSupervisorRequestSection', 'StudentSupervisorAssignmentSection', 'StudentProposalRevisionSection', 'StudentFinalProposalSection', 'StudentResearchMethodScoreSection',
    ]);
  });
});
