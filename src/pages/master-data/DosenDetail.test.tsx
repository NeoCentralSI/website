import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as admin from '@/services/admin.service';
import type { LecturerDetail } from '@/services/admin.service';
import DosenDetail from './DosenDetail';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/services/admin.service', () => ({ getLecturerDetailAPI: vi.fn() }));
vi.mock('@/hooks/shared/useRole', () => ({ useRole: () => ({ isAdmin: () => true }) }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

const examiner = (id: string, kind: 'seminar' | 'defence', status: string, date: string, title: string, name: string) => ({
  id, kind, eventId: `e-${id}`, status, date, thesisId: `t-${id}`, title, student: { id: `s-${id}`, fullName: name, nim: `22115280${id}` },
});

const detail = (examining: LecturerDetail['examining']): LecturerDetail => ({
  id: 'l1', fullName: 'DR. ANDI, M.KOM', email: 'andi@unand.ac.id', isVerified: true, createdAt: '2026-01-01T00:00:00Z',
  lecturer: { scienceGroup: 'Sistem Enterprise' }, roles: [],
  statistics: { activeSupervising: 0, completedSupervising: 0, totalSupervising: 0, examining: examining.length },
  supervising: [], completedSupervising: [], examining, recentGuidances: [],
} as unknown as LecturerDetail);

function open(data: LecturerDetail) {
  vi.mocked(admin.getLecturerDetailAPI).mockResolvedValue({ data });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/master-data/dosen/l1']}>
        <Routes><Route path="/master-data/dosen/:id" element={<DosenDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Detail dosen: Penguji Seminar dan Sidang', () => {
  it('lists the seminar and defence examiner assignments, newest first, with the count in the title', async () => {
    open(detail([
      examiner('02', 'defence', 'scheduled', '2026-10-20', 'Sistem Antrean Klinik', 'BUDI SANTOSO'),
      examiner('01', 'seminar', 'passed', '2026-09-10', 'Sistem Inventaris Gudang', 'SITI AMINAH'),
    ]));

    expect(await screen.findByText('Penguji Seminar dan Sidang (2)')).toBeInTheDocument();
    expect(screen.queryByText(/Penguji Skripsi/)).not.toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Penguji seminar dan sidang' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Sidang TA');
    expect(items[0]).toHaveTextContent('20 Oktober 2026');
    expect(items[0]).toHaveTextContent('Sistem Antrean Klinik');
    expect(items[0]).toHaveTextContent('Budi Santoso (2211528002)');
    expect(items[1]).toHaveTextContent('Seminar Hasil');
    expect(items[1]).toHaveTextContent('Sistem Inventaris Gudang');
  });

  it('says so when the lecturer has never examined, without a large empty illustration', async () => {
    open(detail([]));
    expect(await screen.findByText('Penguji Seminar dan Sidang (0)')).toBeInTheDocument();
    expect(screen.getByText('Belum pernah menjadi penguji seminar atau sidang.')).toBeInTheDocument();
  });
});
