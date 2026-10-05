import type { ReactNode } from 'react';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as sopService from '@/services/sop.service';
import { SOPSection } from './SOPSection';

vi.mock('@/services/sop.service', () => ({
  getSopFilesPublic: vi.fn(),
}));

vi.mock('./FadeIn', () => {
  const Wrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  );
  return { FadeIn: Wrapper, StaggerContainer: Wrapper, StaggerItem: Wrapper };
});

const guides = [
  {
    title: 'Panduan Kerja Praktik',
    path: 'guides/panduan-kerja-praktik-2025.pdf',
    fileName: 'Panduan Kerja Praktik 2025.pdf',
    size: 3042062,
    pages: 47,
  },
  {
    title: 'Panduan Tugas Akhir',
    path: 'guides/panduan-tugas-akhir-2025.pdf',
    fileName: 'PANDUAN TUGAS AKHIR 2025_DAN LAMPIRAN.pdf',
    size: 12036396,
    pages: 87,
  },
];

describe('SOPSection', () => {
  it('shows exactly two public guides without requesting managed documents', () => {
    render(<SOPSection />);

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(sopService.getSopFilesPublic).not.toHaveBeenCalled();
  });

  it.each(guides)('provides preview and download links for $title', (guide) => {
    render(<SOPSection />);

    const href = `${import.meta.env.BASE_URL}${guide.path}`;
    const preview = screen.getByRole('link', { name: `Lihat preview ${guide.title}` });
    expect(preview).toHaveAttribute('href', href);
    expect(preview).toHaveAttribute('target', '_blank');
    expect(preview).toHaveAttribute('rel', 'noopener noreferrer');

    const download = screen.getByRole('link', { name: `Unduh ${guide.title}` });
    expect(download).toHaveAttribute('href', href);
    expect(download).toHaveAttribute('download', guide.fileName);
    expect(screen.getByText(`${guide.pages} halaman`)).toBeInTheDocument();

    const filePath = resolve('public', guide.path);
    expect(statSync(filePath).size).toBe(guide.size);
    expect(readFileSync(filePath).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
