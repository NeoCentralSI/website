import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '@/services/admin.service';
import type { StudentSemesterFlags } from '@/services/admin.service';
import { StudentSemesterFlagsCard } from './StudentSemesterFlagsCard';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/admin.service', () => ({ setStudentPeriodFlagsAPI: vi.fn(), followSiaPeriodFlagsAPI: vi.fn() }));
const siaStatus = vi.hoisted(() => ({ configured: true }));
vi.mock('@/services/sia.service', () => ({ getSiaSyncStatus: vi.fn(async () => ({ configured: siaStatus.configured, lastRun: null, periodSnapshots: null })) }));

const flags = (overrides: Partial<StudentSemesterFlags>): StudentSemesterFlags => ({
  academicYearId: 'ay-1', academicYearLabel: '2026/2027 Ganjil', takingResearchMethod: true, takingThesisCourse: null,
  source: 'sia', researchMethodSource: 'sia', thesisCourseSource: null, capturedAt: null, ...overrides,
});

function wrap(rows: StudentSemesterFlags[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><StudentSemesterFlagsCard studentId="s1" semesterFlags={rows} canEdit /></QueryClientProvider>);
}

/** The Admin's semester flags in Data Master → Mahasiswa. */
describe('Keikutsertaan per Semester', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siaStatus.configured = true;
  });

  it('shows each flag with its source; the Admin changes them; Ikuti Data SIA only when a flag is the Admin\'s', async () => {
    vi.mocked(admin.setStudentPeriodFlagsAPI).mockResolvedValue({ data: {}, message: 'Keikutsertaan semester disimpan.' });
    vi.mocked(admin.followSiaPeriodFlagsAPI).mockResolvedValue({ data: { fromSia: true }, message: 'ok' });
    wrap([
      flags({}),
      flags({ academicYearId: 'ay-0', academicYearLabel: '2025/2026 Genap', takingResearchMethod: false, researchMethodSource: 'admin' }),
    ]);

    const [sia, byAdmin] = within(screen.getByRole('list', { name: 'Keikutsertaan per semester' })).getAllByRole('listitem');
    expect(within(sia).getByText('Metode Penelitian: Ya · SIA')).toBeInTheDocument();
    expect(within(sia).getByText('Tugas Akhir: Belum diketahui · -')).toBeInTheDocument();
    expect(within(sia).getByRole('button', { name: 'Ikuti Data SIA' })).toBeDisabled();
    expect(within(byAdmin).getByText('Metode Penelitian: Tidak · Admin')).toBeInTheDocument();

    fireEvent.click(within(byAdmin).getByRole('button', { name: 'Ikuti Data SIA' }));
    await waitFor(() => expect(admin.followSiaPeriodFlagsAPI).toHaveBeenCalledWith('s1', 'ay-0'));

    fireEvent.click(within(sia).getByRole('button', { name: 'Ubah' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ubah Keikutsertaan Semester' });
    expect(within(dialog).getByText(/Isian Admin tidak ditimpa sinkronisasi SIA/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    await waitFor(() => expect(admin.setStudentPeriodFlagsAPI).toHaveBeenCalledWith('s1', 'ay-1', { eligibleResearchMethod: true, takingThesisCourse: null }));
  });

  it('Without SIA_BASE_URL, Ikuti Data SIA is disabled with "Sinkronisasi SIA belum tersedia."; Ubah still works', async () => {
    siaStatus.configured = false;
    wrap([flags({ researchMethodSource: 'admin' })]);
    const button = screen.getByRole('button', { name: 'Ikuti Data SIA' });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button.parentElement).toHaveAttribute('title', 'Sinkronisasi SIA belum tersedia.');
    expect(screen.getByRole('button', { name: 'Ubah' })).toBeEnabled();
  });
});
