import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThesisGuidanceEvaluationsPage from './evaluasi/ThesisGuidanceEvaluations';
import ThesisChangeRequestsPage from './perubahan/ThesisChangeRequests';

const role = vi.hoisted(() => ({ kadep: false }));

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/hooks/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/shared')>()),
  useRole: () => ({ isKadep: () => role.kadep }),
}));
// The tables have their own tests.
vi.mock('@/components/thesis-change-request/ThesisChangeRequestTable', () => ({ ThesisChangeRequestTable: () => <p>Tabel Perubahan</p> }));
vi.mock('@/components/thesis-guidance-evaluation/ThesisGuidanceEvaluationTable', () => ({ ThesisGuidanceEvaluationTable: () => <p>Tabel Evaluasi</p> }));

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/tugas-akhir/perubahan" element={<ThesisChangeRequestsPage />} />
            <Route path="/tugas-akhir/evaluasi" element={<ThesisGuidanceEvaluationsPage />} />
            <Route path="/tugas-akhir/permohonan" element={<p>Halaman Permohonan</p>} />
            <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<p>Halaman Mahasiswa Bimbingan</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Tugas Akhir > Perubahan and Evaluasi are the Ketua Departemen\'s', () => {
  beforeEach(() => { role.kadep = false; });

  it('sends a supervisor from Perubahan to Permohonan and from Evaluasi to Mahasiswa Bimbingan', () => {
    renderAt('/tugas-akhir/perubahan');
    expect(screen.getByText('Halaman Permohonan')).toBeInTheDocument();
    renderAt('/tugas-akhir/evaluasi');
    expect(screen.getByText('Halaman Mahasiswa Bimbingan')).toBeInTheDocument();
  });

  it('shows the Ketua Departemen the decision tables, subtitles without a final period', () => {
    role.kadep = true;
    renderAt('/tugas-akhir/perubahan');
    expect(screen.getByRole('heading', { name: 'Perubahan Tugas Akhir' })).toBeInTheDocument();
    expect(screen.getByText('Tabel Perubahan')).toBeInTheDocument();
    expect(screen.getByText('Keputusan Ketua Departemen atas pengajuan perubahan judul dan pembimbing')).toBeInTheDocument();
    // "Alihkan Mahasiswa" left the page header for Mahasiswa Bimbingan (3.3).
    expect(screen.queryByRole('button', { name: /Alihkan/ })).not.toBeInTheDocument();

    renderAt('/tugas-akhir/evaluasi');
    expect(screen.getByRole('heading', { name: 'Evaluasi Bimbingan' })).toBeInTheDocument();
    expect(screen.getByText('Tabel Evaluasi')).toBeInTheDocument();
  });
});
