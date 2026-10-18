import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '@/services/admin.service';
import type { PeriodFlagsImportPlan } from '@/services/admin.service';
import { StudentPeriodFlagsImportDialog } from './StudentPeriodFlagsImportDialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/admin.service', () => ({
  PERIOD_FLAGS_TEMPLATE_URL: '/adminfeatures/student-period-flags/template',
  previewPeriodFlagsImportAPI: vi.fn(),
  applyPeriodFlagsImportAPI: vi.fn(),
  getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [{ id: 'ay-1', semester: 'ganjil', year: '2026/2027', isActive: true }] })),
}));
vi.mock('@/hooks/shared/useActiveAcademicYear', () => ({ useActiveAcademicYear: () => ({ academicYear: { id: 'ay-1' } }) }));
vi.mock('@/lib/authenticatedFile', () => ({ downloadAuthenticatedFileOrToast: vi.fn() }));

const plan = (changed: number): PeriodFlagsImportPlan => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  totals: { rows: 4, changed, unchanged: 2 - changed + 1, unknownNim: 1, invalid: 1 },
  changes: changed ? [{ row: 2, nim: '2211528002', studentId: 's1', fullName: 'Uji Proposal Tidak Layak', before: { eligibleResearchMethod: false, takingThesisCourse: false }, after: { eligibleResearchMethod: true, takingThesisCourse: false } }] : [],
  unknown: [{ row: 4, nim: '2211599999' }],
  invalid: [{ row: 5, nim: '2211528001', reason: 'Mengambil Metode Penelitian: isi Ya atau Tidak.' }],
});

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><StudentPeriodFlagsImportDialog open onOpenChange={vi.fn()} /></QueryClientProvider>);
  return screen.getByRole('dialog', { name: 'Impor Keikutsertaan' });
}

/** Paket P9 (K36): Impor Keikutsertaan in Data Master → Mahasiswa. */
describe('Impor Keikutsertaan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Pratinjau needs a file; the preview shows the counts and the problem rows; Terapkan applies', async () => {
    vi.mocked(admin.previewPeriodFlagsImportAPI).mockResolvedValue({ data: plan(1) });
    vi.mocked(admin.applyPeriodFlagsImportAPI).mockResolvedValue({ data: { ...plan(1), applied: 1 }, message: 'Keikutsertaan diimpor: 1 mahasiswa berubah.' });
    const dialog = open();
    expect(within(dialog).getByRole('button', { name: 'Unduh Templat' })).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: 'Pratinjau' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Terapkan' }).parentElement).toHaveAttribute('title', 'Pilih berkas .xlsx atau .csv terlebih dahulu.');

    const file = new File(['NIM'], 'keikutsertaan.xlsx');
    fireEvent.change(within(dialog).getByLabelText('Berkas keikutsertaan'), { target: { files: [file] } });
    expect(within(dialog).getByRole('button', { name: 'Terapkan' }).parentElement).toHaveAttribute('title', 'Pratinjau berkas terlebih dahulu.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Pratinjau' }));
    await waitFor(() => expect(admin.previewPeriodFlagsImportAPI).toHaveBeenCalledWith('ay-1', file));
    const preview = await within(dialog).findByLabelText('Pratinjau impor');
    for (const text of ['Berubah: 1', 'Sama: 2', 'NIM tidak dikenal: 1', 'Baris tidak valid: 1']) expect(within(preview).getByText(text)).toBeInTheDocument();
    expect(within(preview).getByText(/2211599999 \(baris 4\)/)).toBeInTheDocument();
    expect(within(preview).getByText(/Baris 5 \(2211528001\): Mengambil Metode Penelitian: isi Ya atau Tidak\./)).toBeInTheDocument();
    expect(admin.applyPeriodFlagsImportAPI).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Terapkan' }));
    await waitFor(() => expect(admin.applyPeriodFlagsImportAPI).toHaveBeenCalledWith('ay-1', file));
  });

  it('nothing to change: Terapkan stays disabled with "Tidak ada perubahan."', async () => {
    vi.mocked(admin.previewPeriodFlagsImportAPI).mockResolvedValue({ data: plan(0) });
    const dialog = open();
    fireEvent.change(within(dialog).getByLabelText('Berkas keikutsertaan'), { target: { files: [new File(['x'], 'a.csv')] } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Pratinjau' }));
    await within(dialog).findByText('Berubah: 0');
    const applyButton = within(dialog).getByRole('button', { name: 'Terapkan' });
    expect(applyButton).toBeDisabled();
    expect(applyButton.parentElement).toHaveAttribute('title', 'Tidak ada perubahan.');
  });

  it('a file of another type is refused before sending', () => {
    const dialog = open();
    fireEvent.change(within(dialog).getByLabelText('Berkas keikutsertaan'), { target: { files: [new File(['x'], 'a.pdf')] } });
    expect(within(dialog).getByText('Berkas harus berupa .xlsx atau .csv.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Pratinjau' })).toBeDisabled();
  });
});
