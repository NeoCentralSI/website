import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '@/services/admin.service';
import type { PeriodFlagsImportPlan } from '@/services/admin.service';
import { StudentPeriodFlagsImportDialog } from './StudentPeriodFlagsImportDialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/admin.service', () => ({
  PERIOD_FLAGS_TEMPLATE_URL: '/adminfeatures/student-period-flags/template',
  applyPeriodFlagsImportAPI: vi.fn(),
  getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [{ id: 'ay-1', semester: 'ganjil', year: '2026/2027', isActive: true }] })),
}));
vi.mock('@/hooks/shared/useActiveAcademicYear', () => ({ useActiveAcademicYear: () => ({ academicYear: { id: 'ay-1' } }) }));
vi.mock('@/lib/authenticatedFile', () => ({ downloadAuthenticatedFileOrToast: vi.fn() }));

const plan = (changed: number): PeriodFlagsImportPlan => ({
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  totals: { rows: 5, changed, unchanged: 1, unknownNim: 1, invalid: 1, nameMismatch: 1 },
  changes: changed ? [{ row: 2, nim: '2211528002', studentId: 's1', fullName: 'Uji Proposal Tidak Layak', before: { eligibleResearchMethod: false, takingThesisCourse: false }, after: { eligibleResearchMethod: true, takingThesisCourse: false } }] : [],
  unknown: [{ row: 4, nim: '2211599999' }],
  invalid: [{ row: 5, nim: '2211528001', reason: 'Mengambil Metode Penelitian: isi Ya atau Tidak.' }],
  nameMismatch: [{ row: 6, nim: '2211528003', name: 'Nama Salah', expected: 'UJI PROPOSAL DRAF' }],
  applied: changed,
});

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><StudentPeriodFlagsImportDialog open onOpenChange={vi.fn()} /></QueryClientProvider>);
  return screen.getByRole('dialog', { name: 'Impor Keikutsertaan' });
}

/** Impor Keikutsertaan in Data Master → Mahasiswa, in the form of the Data TA import. */
describe('Impor Keikutsertaan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('template and file like the Data TA import; no separate preview; "Mulai Import" imports and shows the summary', async () => {
    vi.mocked(admin.applyPeriodFlagsImportAPI).mockResolvedValue({ data: plan(1), message: 'Keikutsertaan diimpor: 1 mahasiswa berubah.' });
    const dialog = open();
    expect(within(dialog).getByText('Gunakan templat standar')).toBeInTheDocument();
    expect(within(dialog).getByText(/Kolom: NIM, Nama, Mengambil Metode Penelitian/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Template/ })).toBeEnabled();
    expect(within(dialog).queryByRole('button', { name: 'Pratinjau' })).not.toBeInTheDocument();

    // Not disabled for a missing file: the click says what is missing.
    const start = within(dialog).getByRole('button', { name: 'Mulai Import' });
    expect(start).toBeEnabled();
    fireEvent.click(start);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Pilih berkas .xlsx atau .csv terlebih dahulu.');
    expect(admin.applyPeriodFlagsImportAPI).not.toHaveBeenCalled();

    const file = new File(['NIM'], 'keikutsertaan.xlsx');
    fireEvent.change(within(dialog).getByLabelText('Berkas keikutsertaan'), { target: { files: [file] } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mulai Import' }));
    await waitFor(() => expect(admin.applyPeriodFlagsImportAPI).toHaveBeenCalledWith('ay-1', file));

    const summary = await within(dialog).findByLabelText('Hasil impor');
    for (const [label, count] of [['Berubah', '1'], ['Sama', '1'], ['NIM Tidak Dikenal', '1'], ['Baris Tidak Valid', '1'], ['Nama Tidak Cocok', '1']]) {
      expect(within(summary).getByText(label).previousSibling).toHaveTextContent(count);
    }
    const skipped = within(summary).getByRole('list', { name: 'Baris yang dilewati' });
    expect(skipped).toHaveTextContent('Baris 4: NIM 2211599999 tidak dikenal.');
    expect(skipped).toHaveTextContent('Baris 5 (2211528001): Mengambil Metode Penelitian: isi Ya atau Tidak.');
    expect(skipped).toHaveTextContent('Baris 6: nama "Nama Salah" tidak cocok dengan NIM 2211528003 (Uji Proposal Draf).');
    expect(within(dialog).getByRole('button', { name: 'Selesai' })).toBeInTheDocument();
  });

  it('a file of another type is refused before sending', () => {
    const dialog = open();
    fireEvent.change(within(dialog).getByLabelText('Berkas keikutsertaan'), { target: { files: [new File(['x'], 'a.pdf')] } });
    expect(within(dialog).getByText('Berkas harus berupa .xlsx atau .csv.')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mulai Import' }));
    expect(admin.applyPeriodFlagsImportAPI).not.toHaveBeenCalled();
  });
});
