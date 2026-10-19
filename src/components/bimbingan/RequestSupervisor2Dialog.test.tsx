import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as studentGuidance from '@/services/studentGuidance.service';
import { RequestSupervisor2Dialog } from './RequestSupervisor2Dialog';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/studentGuidance.service', () => ({ getAvailableSupervisors2: vi.fn(), requestSupervisor2: vi.fn() }));

const lecturer = (id: string, fullName: string, trafficLight: 'green' | 'yellow' | 'red', acceptingRequests = true) => ({
  id, fullName, identityNumber: id, email: null, scienceGroup: 'Sistem Informasi', trafficLight, acceptingRequests, normalAvailable: null, activeCount: null,
});

/** A full lecturer stays selectable with a warning; a closed intake stays locked. */
describe('Ajukan Pembimbing 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studentGuidance.getAvailableSupervisors2).mockResolvedValue([
      lecturer('l1', 'DOSEN PENUH, M.T', 'red'),
      lecturer('l2', 'DOSEN TUTUP, M.Kom', 'green', false),
    ] as never);
    vi.mocked(studentGuidance.requestSupervisor2).mockResolvedValue({ message: 'ok' } as never);
  });

  it('a full lecturer can be chosen and the request sent', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><RequestSupervisor2Dialog hasPembimbing2={false} hasPendingRequest={false} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Ajukan Pembimbing 2/ }));

    const full = await screen.findByRole('option', { name: 'Dosen Penuh, M.T' });
    expect(within(full).getByText('Penuh')).toBeInTheDocument();
    expect(within(full).getByText('Beban dosen ini sudah penuh; permintaan tetap bisa dikirim dan dapat ditolak.')).toBeInTheDocument();
    expect(full).toHaveAttribute('aria-disabled', 'false');

    const closed = screen.getByRole('option', { name: 'Dosen Tutup, M.Kom' });
    expect(closed).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(closed);
    expect(screen.getByRole('button', { name: 'Kirim Permintaan' })).toBeDisabled();

    fireEvent.click(full);
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Permintaan' }));
    await waitFor(() => expect(studentGuidance.requestSupervisor2).toHaveBeenCalledWith('l1'));
  });
});
