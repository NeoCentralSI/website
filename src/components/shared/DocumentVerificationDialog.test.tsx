import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authenticatedFile', () => ({
  fetchAuthenticatedBlob: vi.fn(async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
}));

import { DocumentVerificationDialog, type VerificationItem } from './DocumentVerificationDialog';

const items: VerificationItem[] = [
  { id: 'r1', name: 'Transkrip Nilai', status: 'submitted', fileName: 'transkrip.pdf', fileUrl: '/uploads/transkrip.pdf', submittedAt: '2026-10-20T03:00:00Z' },
  { id: 'r2', name: 'Bukti Bebas Pustaka', status: 'submitted', fileName: 'pustaka.pdf', fileUrl: '/uploads/pustaka.pdf', submittedAt: '2026-10-21T03:00:00Z' },
];

function renderDialog(onDecide = vi.fn(async () => ({}))) {
  const onOpenChange = vi.fn();
  render(
    <DocumentVerificationDialog open onOpenChange={onOpenChange} title="Verifikasi Dokumen Seminar Hasil" subtitle="Mahasiswa — 2211520001" items={items} onDecide={onDecide} />,
  );
  return { onDecide, onOpenChange };
}

describe('DocumentVerificationDialog', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('shows the requirement, its status, the file and the n/m navigation', async () => {
    renderDialog();
    expect(screen.getByText('Transkrip Nilai')).toBeInTheDocument();
    expect(screen.getByText('Menunggu')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/transkrip\.pdf · 8 B · Diunggah/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
  });

  it('Setujui decides at once, without a note, then moves to the next waiting requirement', async () => {
    const { onDecide } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith(items[0], 'approve', undefined));
    await waitFor(() => expect(screen.getByText('2/2')).toBeInTheDocument());
  });

  it('Tolak asks for the rejection note and refuses an empty one', async () => {
    const { onDecide } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Tolak' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tolak Dokumen' });
    expect(within(dialog).getByText('Catatan penolakan')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    expect(await within(dialog).findByText('Catatan penolakan wajib diisi.')).toBeInTheDocument();
    expect(onDecide).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Catatan penolakan/), { target: { value: 'Berkas buram' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith(items[0], 'decline', 'Berkas buram'));
  });

  it('closes when the whole registration is verified', async () => {
    const { onOpenChange } = renderDialog(vi.fn(async () => ({ done: true })));
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
