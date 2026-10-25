import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StudentYudisiumCplTable } from './StudentYudisiumCplTable';
vi.mock('lottie-react', () => ({ default: () => null }));
it('keeps the read-only CPL table and refresh available when no scores exist', () => {
  const refetch = vi.fn();
  render(<StudentYudisiumCplTable cplScores={[]} onRefetch={refetch} />);
  // The table sits right under its tab: no section title.
  expect(screen.queryByText('Capaian Pembelajaran Lulusan')).not.toBeInTheDocument();
  expect(screen.getByText('Nilai CPL Anda belum tersedia')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Muat Ulang/i }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
it('shows scores and verification as read-only data and searches descriptions', () => {
  render(<StudentYudisiumCplTable cplScores={[
    { code: 'CPL01', description: 'Analisis sistem', score: 80, minimalScore: 60, passed: true, status: 'validated', validatedBy: 'Dosen Satu' },
    { code: 'CPL02', description: 'Manajemen', score: 40, minimalScore: 60, passed: false, status: 'calculated' },
  ]} />);
  expect(screen.getByText('Dosen Satu')).toBeInTheDocument();
  expect(screen.getByText(/^Divalidasi/)).toBeInTheDocument();
  expect(screen.getByText('Belum divalidasi')).toBeInTheDocument();
  expect(screen.getByText('Belum Tercapai')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Validasi|Ubah/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Cari...'), { target: { value: 'Analisis' } });
  expect(screen.getByText('CPL01')).toBeInTheDocument();
  expect(screen.queryByText('CPL02')).not.toBeInTheDocument();
});
