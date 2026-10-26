import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SupervisionClock } from '@/lib/thesisLabels';
import { SupervisionClockCell } from './SupervisionClockCell';
import { ThesisActivityBadge } from './ThesisActivityBadge';

const clock = (overrides: Partial<SupervisionClock> = {}): SupervisionClock => ({
  startedAt: '2026-03-11T05:00:00.000Z',
  elapsedDays: 214,
  elapsedMonths: 7,
  elapsedLabel: '7 bulan 12 hari',
  sixMonthAt: '2026-09-11T05:00:00.000Z',
  oneYearAt: '2027-03-11T05:00:00.000Z',
  extensionUntil: null,
  evaluationDue: null,
  isPaused: false,
  ...overrides,
});

// Radix measures the open tooltip; jsdom has no ResizeObserver.
if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

describe('ThesisActivityBadge', () => {
  it.each([
    ['active', 'Lancar'],
    ['slow', 'Lambat'],
    ['at_risk', 'Berisiko'],
  ])('shows the label of %s, never the raw value', (level, label) => {
    render(<ThesisActivityBadge level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(level)).not.toBeInTheDocument();
  });

  it('explains the rule in a tooltip', async () => {
    render(<ThesisActivityBadge level="slow" />);
    fireEvent.focus(screen.getByText('Lambat').parentElement!);
    expect((await screen.findAllByText(/Tanpa aktivitas selama 60 sampai 120 hari\./)).length).toBeGreaterThan(0);
  });

  it('shows a dash when the thesis has no activity level (not in research)', () => {
    render(<ThesisActivityBadge level={null} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('SupervisionClockCell', () => {
  it('shows the elapsed supervision time', () => {
    render(<SupervisionClockCell clock={clock()} />);
    expect(screen.getByText('7 bulan 12 hari')).toBeInTheDocument();
    expect(screen.queryByText(/jatuh tempo/)).not.toBeInTheDocument();
  });

  it.each([
    ['six_month', 'Evaluasi 6 bulan jatuh tempo'],
    ['one_year', 'Evaluasi 1 tahun jatuh tempo'],
    ['extension_follow_up', 'Tindak lanjut perpanjangan jatuh tempo'],
  ] as const)('shows the due badge for %s', (evaluationDue, label) => {
    render(<SupervisionClockCell clock={clock({ evaluationDue })} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('says the clock is stopped while on leave', () => {
    render(<SupervisionClockCell clock={clock({ isPaused: true, elapsedLabel: '6 bulan' })} />);
    expect(screen.getByText('6 bulan')).toBeInTheDocument();
    expect(screen.getByText(/berhenti selama cuti/)).toBeInTheDocument();
  });

  it('shows a dash without a start date', () => {
    render(<SupervisionClockCell clock={clock({ startedAt: null, elapsedLabel: '-' })} />);
    expect(screen.getByText('-')).toBeInTheDocument();
    render(<SupervisionClockCell clock={null} />);
    expect(screen.getAllByText('-')).toHaveLength(2);
  });
});
