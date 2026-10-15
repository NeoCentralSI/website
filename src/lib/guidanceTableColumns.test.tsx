import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import CustomTable from '@/components/layout/CustomTable';
import type { PhaseFilterValue } from '@/components/thesis/ThesisPhaseFilter';
import type { GuidanceItem } from '@/services/studentGuidance.service';
import { getGuidanceTableColumns } from './guidanceTableColumns';

vi.mock('lottie-react', () => ({ default: () => null }));

const item = (id: string, phase: 'proposal' | 'research', supervisorName = 'HUSNIL KAMIL'): GuidanceItem => ({
  id,
  status: 'completed',
  phase,
  supervisorId: 'l1',
  supervisorName,
  requestedDate: '2026-09-01T03:00:00.000Z',
  approvedDate: null,
} as GuidanceItem);

const ITEMS = [item('g1', 'proposal'), item('g2', 'research'), item('g3', 'research')];

/** The student Bimbingan table: the page filters the rows by the phase the header filter holds. */
function GuidanceTable({ onPage }: { onPage: (page: number) => void }) {
  const [phase, setPhase] = useState<PhaseFilterValue>('');
  const rows = phase ? ITEMS.filter((row) => row.phase === phase) : ITEMS;
  const columns = getGuidanceTableColumns({
    items: ITEMS,
    supervisorFilter: '',
    setSupervisorFilter: () => {},
    status: '',
    setStatus: () => {},
    setPage: onPage,
    onViewDocument: () => {},
    navigate: vi.fn(),
    phase,
    setPhase,
  });
  return (
    <CustomTable columns={columns} data={rows} total={rows.length} page={1} pageSize={10} onPageChange={onPage} enableColumnFilters />
  );
}

/** Radix menus open on pointer down in jsdom. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
}

describe('Bimbingan: phase filter in the "Jenis" column header (Paket E4, 2.2)', () => {
  it('defaults to Semua and narrows the rows to Proposal or Penelitian; the count is the pagination text', async () => {
    const onPage = vi.fn();
    render(<MemoryRouter><GuidanceTable onPage={onPage} /></MemoryRouter>);

    expect(screen.getByText('Menampilkan 1-3 dari 3')).toBeInTheDocument();
    const jenis = screen.getByRole('columnheader', { name: /Jenis/ });
    openMenu(within(jenis).getByRole('button'));
    const options = await screen.findAllByRole('menuitem');
    expect(options.map((option) => option.textContent)).toEqual(['Semua', 'Proposal', 'Penelitian']);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Proposal' }));
    expect(onPage).toHaveBeenCalledWith(1);
    expect(screen.getByText('Menampilkan 1-1 dari 1')).toBeInTheDocument();

    openMenu(within(screen.getByRole('columnheader', { name: /Jenis/ })).getByRole('button'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Penelitian' }));
    expect(screen.getByText('Menampilkan 1-2 dari 2')).toBeInTheDocument();
  });

  it('no filter on the Jenis column where the page does not ask for one', () => {
    const columns = getGuidanceTableColumns({
      items: ITEMS, supervisorFilter: '', setSupervisorFilter: () => {}, status: '', setStatus: () => {},
      setPage: () => {}, onViewDocument: () => {}, navigate: vi.fn(),
    });
    expect(columns.find((column) => column.key === 'phase')?.filter).toBeUndefined();
  });
});
