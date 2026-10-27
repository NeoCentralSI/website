import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThesisSeminarDetailIdentityPanel } from './ThesisSeminarDetailIdentityPanel';

vi.mock('lottie-react', () => ({ default: () => <div data-testid="lottie-mock" /> }));
vi.mock('@/components/thesis/useDocumentViewer', () => ({
  useDocumentViewer: () => ({ openDocument: vi.fn(), viewer: null }),
}));

const base = {
  id: 'sem-1',
  status: 'scheduled',
  student: { id: 'owner', name: 'Pemilik Seminar', nim: '2211520001' },
  thesis: { id: 't1', title: 'Judul TA', supervisors: [] },
  examiners: [],
};

describe('Seminar documents card', () => {
  it('shows the documents to a registered audience', () => {
    render(
      <ThesisSeminarDetailIdentityPanel
        detail={{
          ...base,
          canViewDocuments: true,
          documents: [{ requirementId: 'r1', requirementName: 'Laporan Tugas Akhir', fileName: 'laporan.pdf', filePath: 'uploads/thesis/t1/seminar/sem-1/laporan.pdf', status: 'approved' }],
        }}
      />,
    );
    expect(screen.getByText('Dokumen Seminar')).toBeInTheDocument();
    expect(screen.getByText('Laporan Tugas Akhir')).toBeInTheDocument();
    expect(screen.queryByText('Dokumen Hanya untuk Peserta Seminar')).not.toBeInTheDocument();
  });

  it('keeps the card with an empty state for a student who is not an audience', () => {
    render(<ThesisSeminarDetailIdentityPanel detail={{ ...base, canViewDocuments: false, documents: [] }} />);
    expect(screen.getByText('Dokumen Seminar')).toBeInTheDocument();
    expect(screen.getByText('Dokumen Hanya untuk Peserta Seminar')).toBeInTheDocument();
    expect(screen.getByText('Dokumen seminar dapat diakses setelah Anda terdaftar sebagai peserta seminar ini')).toBeInTheDocument();
    expect(screen.getByTestId('lottie-mock')).toBeInTheDocument();
  });
});
