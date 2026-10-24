import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { copyrightYears, Footer } from './Footer'

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => <div>{props.children as never}</div> }),
  useInView: () => true,
}))

describe('landing footer', () => {
  it('copyright years follow the current year', () => {
    expect(copyrightYears(new Date('2025-06-01'))).toBe('2025')
    expect(copyrightYears(new Date('2026-10-24'))).toBe('2025–2026')
  })

  it('social links open the department pages in a new tab, and Cek Dokumen is listed', () => {
    render(<MemoryRouter><Footer showLocation={false} /></MemoryRouter>)
    const expected = [
      ['Website Departemen Sistem Informasi', 'https://si.fti.unand.ac.id/'],
      ['Instagram Sistem Informasi Unand', 'https://www.instagram.com/official.siunand/'],
      ['LinkedIn Universitas Andalas', 'https://www.linkedin.com/school/unand/home/'],
    ]
    for (const [label, href] of expected) {
      const link = screen.getByRole('link', { name: label })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(screen.getByRole('link', { name: 'Cek Dokumen' })).toHaveAttribute('href', '/cek-dokumen')
    expect(screen.getByText(/© 2025/)).toBeInTheDocument()
    expect(screen.queryByText('Lokasi')).not.toBeInTheDocument()
  })
})
