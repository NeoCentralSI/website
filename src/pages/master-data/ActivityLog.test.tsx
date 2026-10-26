import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '@/services/admin.service';
import type { AdminAuditLog } from '@/services/admin.service';
import ActivityLogPage from './ActivityLog';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/services/admin.service', () => ({ getAdminAuditLogsAPI: vi.fn() }));
vi.mock('@/hooks/shared/useRole', () => ({ useRole: () => ({ isAdmin: () => false }) }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

const log = (overrides: Partial<AdminAuditLog> = {}): AdminAuditLog => ({
  id: 'log-1',
  action: 'STUDENT_STATUS_CHANGED',
  entity: 'STUDENT',
  entityId: 's1',
  objectLabel: 'Uji TA Cuti · 2211529004',
  changes: {
    oldValues: { status: 'active' },
    newValues: { status: 'bss' },
    metadata: { source: 'admin', thesisEffect: 'paused', thesisId: 't1' },
  },
  createdAt: '2026-10-24T03:00:00.000Z',
  actor: { id: 'a1', fullName: 'ADMIN SI', email: 'admin_si@fti.unand.ac.id', identityNumber: null },
  ...overrides,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ActivityLogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(admin.getAdminAuditLogsAPI).mockResolvedValue({
    success: true,
    logs: [log()],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
});

describe('Log Aktivitas', () => {
  it('lists Waktu, Pelaku, Tindakan and Objek with Indonesian labels, never the codes', async () => {
    renderPage();
    expect(await screen.findByText('Ubah status mahasiswa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Log Aktivitas' })).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Waktu', 'Pelaku', 'Tindakan', 'Objek', 'Aksi']);
    expect(screen.getByText('Uji TA Cuti · 2211529004')).toBeInTheDocument();
    expect(screen.getByText('Mahasiswa')).toBeInTheDocument();
    expect(screen.getByText('Admin Si')).toBeInTheDocument();
    expect(screen.queryByText('STUDENT_STATUS_CHANGED')).not.toBeInTheDocument();
    expect(screen.queryByText('STUDENT')).not.toBeInTheDocument();
    // Newest first and paginated on the server.
    expect(vi.mocked(admin.getAdminAuditLogsAPI).mock.calls[0][0]).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('shows the change as label, before and after, not as raw JSON', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat Detail' }));
    const dialog = await screen.findByRole('dialog');
    const rows = within(dialog).getAllByRole('row').map((row) => row.textContent);
    expect(rows).toEqual(['DataSebelumSesudah', 'StatusAktifCuti (BSS)']);
    expect(within(dialog).getByText('Akibat pada tugas akhir')).toBeInTheDocument();
    expect(within(dialog).getByText('Dijeda')).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/bss"|thesisId|\{/);
    expect(within(dialog).getByRole('button', { name: 'Tutup' })).toBeInTheDocument();
  });

  it('sends the search to the server', async () => {
    renderPage();
    await screen.findByText('Ubah status mahasiswa');
    fireEvent.change(screen.getByPlaceholderText('Cari pelaku atau objek...'), { target: { value: 'budi' } });
    await waitFor(() =>
      expect(vi.mocked(admin.getAdminAuditLogsAPI).mock.calls.at(-1)?.[0]).toMatchObject({ search: 'budi', page: 1 }),
    );
  });
});
