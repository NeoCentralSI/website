import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThesisClosedAlert } from './ThesisClosedAlert';

describe('ThesisClosedAlert (stopped and finished theses)', () => {
  it('a stopped thesis: "dihentikan pada <tanggal>", system cancellations mentioned', () => {
    render(<ThesisClosedAlert status="failed" closedAt="2026-10-15T03:00:00.000Z" />);
    expect(screen.getByText('Tugas akhir ini dihentikan pada 15 Oktober 2026')).toBeInTheDocument();
    expect(screen.getByText(/termasuk sesi yang dibatalkan sistem beserta alasannya/)).toBeInTheDocument();
  });

  it('a finished thesis: "selesai pada <tanggal>", read-only', () => {
    render(<ThesisClosedAlert status="completed" closedAt="2026-10-05T03:00:00.000Z" />);
    expect(screen.getByText('Tugas akhir ini selesai pada 5 Oktober 2026')).toBeInTheDocument();
    expect(screen.getByText('Sesi bimbingan dan milestone di bawah ini hanya dapat dibaca.')).toBeInTheDocument();
  });
});
