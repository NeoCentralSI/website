import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { devToolsService } from '@/services/devTools.service';
import { DevToolsEventTablePanel, DevToolsYudisiumParticipantTablePanel, DevToolsYudisiumPeriodTablePanel } from './DevToolsFinalStagesTables';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/services/devTools.service', () => ({
  devToolsService: { listTable: vi.fn(), patchTable: vi.fn(async () => 'OK') },
}));

const page = <T,>(data: T[]) => ({ data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } });

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DevTools tables', () => {
  beforeEach(() => vi.clearAllMocks());

  it('seminar: Indonesian status label, schedule, and a dialog that writes the columns', async () => {
    vi.mocked(devToolsService.listTable).mockResolvedValue(page([
      { id: 's1', status: 'passed_with_revision', date: '2026-10-25', startTime: '09:55', endTime: '12:00', studentName: 'Uji Demo Seminar', studentNim: '2211529202' },
    ]));
    wrap(<DevToolsEventTablePanel kind="seminars" />);
    expect(await screen.findByText('Lulus dengan Revisi')).toBeInTheDocument();
    expect(screen.getByText('09.55–12.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ubah seminar' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Tanggal'), { target: { value: '2020-01-06' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    await waitFor(() => expect(devToolsService.patchTable).toHaveBeenCalledWith('seminars', 's1', { date: '2020-01-06' }));
  });

  it('defence: Mulai Sekarang and Sudah Lewat send the presets', async () => {
    vi.mocked(devToolsService.listTable).mockResolvedValue(page([
      { id: 'd1', status: 'scheduled', date: '2026-11-02', startTime: '13:30', endTime: '15:30', studentName: 'Uji Demo Sidang', studentNim: '2211529205' },
    ]));
    wrap(<DevToolsEventTablePanel kind="defences" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ubah sidang' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Mulai Sekarang/ }));
    await waitFor(() => expect(devToolsService.patchTable).toHaveBeenCalledWith('defences', 'd1', { preset: 'now' }));
    expect(vi.mocked(devToolsService.listTable).mock.calls[0][0]).toBe('defences');
  });

  it('periods and participants list with their actions', async () => {
    vi.mocked(devToolsService.listTable).mockImplementation(async (path: string) =>
      path === 'yudisium-periods'
        ? page([{ id: 'y1', name: 'Yudisium Ganjil 2026/2027', registrationOpenDate: '2026-10-24T00:00:00.000Z', registrationCloseDate: null, eventDate: null }])
        : page([{ id: 'p1', status: 'registered', periodId: 'y1', periodName: 'Yudisium Ganjil 2026/2027', studentName: 'Uji Demo CPL', studentNim: '2211529208' }]),
    );
    wrap(<><DevToolsYudisiumPeriodTablePanel /><DevToolsYudisiumParticipantTablePanel /></>);
    expect(await screen.findByText('Uji Demo CPL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ubah tanggal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ubah status' })).toBeInTheDocument();
    expect(screen.getAllByText('Terdaftar').length).toBeGreaterThan(0);
  });
});
