import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { StudentThesisSeminarAttendanceHistoryPanel } from './StudentThesisSeminarAttendanceHistoryPanel';
import { generateAttendanceLogPdf } from '@/services/thesis-seminar/student.service';
import type { AttendanceHistoryResponse } from '@/types/seminar.types';
vi.mock('@/services/thesis-seminar/student.service', () => ({ generateAttendanceLogPdf: vi.fn() }));
vi.mock('lottie-react', () => ({ default: () => null }));
const attendance: AttendanceHistoryResponse = {
  summary: { attended: 11, total: 12, required: 10, met: true },
  records: Array.from({ length: 12 }, (_, i) => ({
    seminarId: `s${i}`, presenterName: `Presenter ${i}`, thesisTitle: `Judul ${i}`, date: '2026-10-20',
    isPresent: i !== 1, approvedAt: i !== 1 ? '2026-10-20' : null, approvedBy: 'Dosen',
  })),
};
beforeEach(() => { vi.clearAllMocks(); });
it('selects only verified attendance and preserves selections across pages when toggling the page checkbox', async () => {
  vi.mocked(generateAttendanceLogPdf).mockRejectedValue(new Error('Konverter tidak tersedia'));
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <StudentThesisSeminarAttendanceHistoryPanel attendance={attendance} isLoading={false} isFetching={false} />
  </MemoryRouter></QueryClientProvider>);
  expect(screen.queryByText('Syarat Terpenuhi')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cetak Daftar Kehadiran' })).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Pilih kehadiran seminar Presenter 1' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih kehadiran seminar Presenter 0' }));
  fireEvent.click(screen.getByRole('link', { name: /next page/i }));
  const all = screen.getByRole('checkbox', { name: 'Pilih semua kehadiran pada halaman ini' });
  fireEvent.click(all);
  expect(screen.getByText('3 Dipilih')).toBeInTheDocument();
  fireEvent.click(all);
  expect(screen.getByText('1 Dipilih')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cetak Daftar Kehadiran' }));
  await waitFor(() => expect(generateAttendanceLogPdf).toHaveBeenCalledWith(['s0']));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cetak Daftar Kehadiran' })).toBeEnabled());
});
