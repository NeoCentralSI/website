/**
 * The phase in "Buat dari Template". (Batas Bimbingan and the student Proposal page
 * moved to ThesisProposalP9Staff.test.tsx and StudentThesisProposal.test.tsx.)
 */
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MilestoneList } from '@/components/milestone/MilestoneList';
import { TemplateSelectorDialog } from '@/components/milestone/TemplateSelectorDialog';
import type { Milestone, MilestoneTemplate } from '@/types/milestone.types';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));


beforeEach(() => vi.clearAllMocks());

describe('Buat dari Template: the phase is written out', () => {
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
