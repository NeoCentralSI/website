import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { CalendarEventDialog, getEventKindLabel } from './CalendarEventDialog';
import type { CalendarEvent } from '@/types/calendar.types';

const seminar = {
  id: 'seminar-1',
  kind: 'seminar',
  kindLabel: 'Seminar Hasil',
  type: 'seminar_scheduled',
  title: 'Seminar Hasil – Mahasiswa Satu',
  description: 'Judul TA',
  status: 'scheduled',
  statusLabel: 'Terjadwal',
  startDate: '2031-03-12T02:00:00.000Z',
  endDate: '2031-03-12T04:00:00.000Z',
  location: 'Ruang Seminar SI',
  detailPath: '/tugas-akhir/seminar-hasil/1',
  outlookEventId: null,
  participants: [
    { userId: 'a', name: 'Mahasiswa Satu', role: 'student', roleLabel: 'Mahasiswa' },
    { userId: 'b', name: 'Dosen Satu', role: 'lecturer', roleLabel: 'Pembimbing 1' },
    { userId: 'c', name: 'Dosen Dua', role: 'lecturer', roleLabel: 'Penguji 1' },
  ],
} as unknown as CalendarEvent;

describe('CalendarEventDialog', () => {
  it('shows a seminar like the Bimbingan modal: status, location, people, Tutup · Lihat Detail', () => {
    render(<MemoryRouter><CalendarEventDialog event={seminar} onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('Seminar Hasil – Mahasiswa Satu')).toBeInTheDocument();
    expect(screen.getByText('Terjadwal')).toBeInTheDocument();
    expect(screen.getByText('Ruang Seminar SI')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing 1')).toBeInTheDocument();
    expect(screen.getByText('Penguji 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat Detail' })).toHaveAttribute('href', '/tugas-akhir/seminar-hasil/1');
    // Not synced to the viewer's Outlook: no Outlook button.
    expect(screen.queryByText('Lihat di Outlook')).not.toBeInTheDocument();
  });

  it('shows Lihat di Outlook only for a synced copy', () => {
    render(<MemoryRouter><CalendarEventDialog event={{ ...seminar, outlookEventId: 'AAMk' }} onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('Lihat di Outlook')).toBeInTheDocument();
  });

  it('uses full, uniform kind labels', () => {
    expect(getEventKindLabel({ type: 'student_guidance' } as CalendarEvent)).toBe('Bimbingan');
    expect(getEventKindLabel({ type: 'defense_as_examiner' } as CalendarEvent)).toBe('Sidang');
    expect(getEventKindLabel({ type: 'yudisium_event' } as CalendarEvent)).toBe('Yudisium');
  });
});
