import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiaSyncSummary, siaSyncSummaryLines } from './SiaSyncSummary';

describe('SIA sync summary', () => {
  it('names the counts in plain Indonesian', () => {
    const lines = siaSyncSummaryLines({ fetched: '88', notFound: '3', statusChanged: '1', gpaChanged: '12', periodFlagsCreated: '2', periodFlagsUpdated: '70', period: '2026/2027 ganjil' });
    expect(lines).toEqual([
      '88 mahasiswa dibaca dari SIA (semester 2026/2027 ganjil)',
      '3 tidak ditemukan di NeoCentral',
      '1 status mahasiswa berubah',
      '12 IPK berubah',
      '72 penanda semester diperbarui',
    ]);
  });

  it('says when the semester flags were skipped because the period differs', () => {
    const lines = siaSyncSummaryLines({ fetched: 5, periodFlagsSkipped: 5, periodMismatch: 'data SIA 2025/2026 genap, NeoCentral 2026/2027 ganjil' });
    expect(lines).toContain('Penanda semester tidak diperbarui karena semester berbeda (data SIA 2025/2026 genap, NeoCentral 2026/2027 ganjil)');
  });

  it('shows nothing before the first sync', () => {
    const { container } = render(<SiaSyncSummary status={{ lastRun: null, periodSnapshots: null }} />);
    expect(container).toBeEmptyDOMElement();
    render(<SiaSyncSummary status={{ lastRun: '2026-10-26T02:00:00.000Z', fetched: 1, periodSnapshots: null }} />);
    expect(screen.getByText(/Sinkronisasi SIA terakhir/)).toBeInTheDocument();
  });
});
