import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backdatedTime, DevToolsProposalPanel } from './DevToolsProposalPanel';

vi.mock('lottie-react', () => ({ default: () => null }));

const mutations = vi.hoisted(() => ({ isSubmitting: false, setPeriodFlags: vi.fn(), setSupervisorRequestTime: vi.fn() }));
const promotion = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));
const run = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));

vi.mock('@/hooks/dev-tools/useDevTools', () => ({
  useDevToolsMutations: () => mutations,
  useDevToolsStudents: () => ({ data: [], isFetching: false }),
  useDevToolsSemesterFlags: () => ({ data: [], isLoading: false }),
  useDevToolsSupervisorRequests: () => ({
    data: {
      data: [{
        id: 'r1', status: 'pending', route: 'direct', createdAt: '2026-10-14T01:00:00.000Z', withdrawAvailableAt: '2026-10-17T01:00:00.000Z',
        proposedTitle: 'Judul', academicYearLabel: '2026/2027 Ganjil', student: { fullName: 'Uji Menunggu Dosen', nim: '2211528002' }, lecturerName: 'Husnil Kamil',
      }],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    },
    isLoading: false,
    isFetching: false,
  }),
}));
vi.mock('@/hooks/research-method/useResearchMethod', () => ({
  usePromotionPreview: () => ({ data: { academicYear: null, rows: promotion.rows }, isLoading: false }),
  useRunPromotion: () => run,
}));

beforeEach(() => {
  vi.clearAllMocks();
  promotion.rows = [];
});

describe('DevTools tab Proposal (rencana 10.8)', () => {
  it('backdates a request just past the 72-hour withdraw lock', () => {
    const now = new Date('2026-10-14T10:00:00.000Z');
    const diff = now.getTime() - new Date(backdatedTime(now)).getTime();
    expect(diff).toBe((72 * 60 + 1) * 60 * 1000);
  });

  it('"Mundurkan 72 Jam" sends a time at least 72 hours ago for that request', () => {
    render(<MemoryRouter><DevToolsProposalPanel /></MemoryRouter>);
    expect(screen.getByText('Uji Menunggu Dosen')).toBeInTheDocument();
    const before = Date.now();
    fireEvent.click(screen.getByRole('button', { name: /Mundurkan 72 Jam/ }));
    const [id, iso] = mutations.setSupervisorRequestTime.mock.calls[0];
    expect(id).toBe('r1');
    expect(before - new Date(iso).getTime()).toBeGreaterThanOrEqual(72 * 60 * 60 * 1000);
  });

  it('runs the promotion only when someone may move up', () => {
    const { unmount } = render(<MemoryRouter><DevToolsProposalPanel /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Jalankan/ })).toBeDisabled();
    unmount();

    promotion.rows = [{ thesisId: 't1', student: { fullName: 'Uji Siap Naik', identityNumber: '2211528016' }, decision: 'promote', reason: 'Lulus dan KRS terkonfirmasi.' }];
    render(<MemoryRouter><DevToolsProposalPanel /></MemoryRouter>);
    expect(screen.getByText('Siap Naik')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    expect(run.mutate).toHaveBeenCalled();
  });
});
