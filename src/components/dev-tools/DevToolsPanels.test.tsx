import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { devToolsService } from '@/services/devTools.service';
import type { DevToolsGuidance, DevToolsStudent } from '@/types/devTools.types';
import DevTools from '@/pages/dev-tools/DevTools';
import { DevToolsGuidancePanel } from './DevToolsGuidancePanel';
import { DevToolsPeriodPanel } from './DevToolsPeriodPanel';
import { DevToolsStudentPanel } from './DevToolsStudentPanel';
import { DevToolsUserPanel } from './DevToolsUserPanel';
import { buildGuidanceSchedulePatch, isoToWibInput, toGuidanceScheduleForm, wibInputToIso } from './devToolsDate';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/services/sia.service', () => ({ triggerSiaSync: vi.fn() }));
vi.mock('@/services/devTools.service', () => ({
  devToolsService: {
    getStudents: vi.fn(),
    getUsers: vi.fn(),
    getRoles: vi.fn(),
    getTheses: vi.fn(),
    getAcademicYears: vi.fn(),
    getGuidances: vi.fn(),
    updateGuidanceSchedule: vi.fn(),
  },
}));

const student: DevToolsStudent = {
  id: 's1',
  fullName: 'Ilham Nofaldi',
  identityNumber: '2211522028',
  email: 'ilham@example.test',
  isVerified: true,
  status: 'active',
  enrollmentYear: 2022,
  sksCompleted: 130,
  mandatoryCoursesCompleted: true,
  mkwuCompleted: true,
  internshipCompleted: true,
  kknCompleted: false,
  currentSemester: 9,
  metopenEligibility: {
    eligibleMetopen: true, hasExternalStatus: true, source: 'devtools', updatedAt: '2026-10-01T03:00:00.000Z',
    readOnly: false, canAccess: true, canSubmit: true, thesisId: 't1', thesisTitle: 'Judul', thesisStatus: 'research',
  },
  thesisCourseEligibility: {
    takingThesisCourse: true, hasExternalStatus: true, source: 'devtools', updatedAt: null, canAccess: true,
  },
  latestThesis: { id: 't1', status: 'on_leave', title: 'Judul', proposalStatus: null },
};

const guidance: DevToolsGuidance = {
  id: 'g1',
  status: 'accepted',
  phase: 'research',
  requestedDate: '2026-10-14T07:00:00.000Z',
  approvedDate: '2026-10-15T02:30:00.000Z',
  summarySubmittedAt: null,
  completedAt: null,
  thesisId: 't1',
  thesisTitle: 'Judul',
  studentName: 'Ilham Nofaldi',
  studentNim: '2211522028',
  supervisorName: 'Husnil Kamil',
};

function wrap(ui: React.ReactNode, route = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DevTools panels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(devToolsService.getStudents).mockResolvedValue([student]);
    vi.mocked(devToolsService.getUsers).mockResolvedValue([{
      id: 'u1', fullName: 'Admin SI', identityNumber: '0001', identityType: 'NIP', email: 'admin@example.test',
      isVerified: true, roles: [{ name: 'Admin', status: 'active' }],
    }]);
    vi.mocked(devToolsService.getRoles).mockResolvedValue([{ id: 'r1', name: 'Admin' }]);
    vi.mocked(devToolsService.getTheses).mockResolvedValue([]);
    vi.mocked(devToolsService.getAcademicYears).mockResolvedValue([
      { id: 'y1', year: '2026/2027', semester: 'ganjil', isActive: true, label: 'Ganjil 2026/2027' },
    ]);
    vi.mocked(devToolsService.getGuidances).mockResolvedValue({
      data: [guidance],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(devToolsService.updateGuidanceSchedule).mockResolvedValue('Jadwal sesi bimbingan berhasil diubah');
  });

  it('User panel lists users and offers Buat User Baru', async () => {
    wrap(<DevToolsUserPanel />);
    expect(await screen.findByText('Admin SI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buat User Baru/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Roles' })).toBeInTheDocument();
  });

  it('Student panel shows labelled statuses and keeps the flags in the expandable row', async () => {
    wrap(<DevToolsStudentPanel />);
    expect(await screen.findByText('Ilham Nofaldi')).toBeInTheDocument();
    // Enum values are never shown raw.
    expect(screen.getByText('Aktif')).toBeInTheDocument();
    expect(screen.getByText('Berhenti Studi Sementara (BSS)')).toBeInTheDocument();
    expect(screen.queryByText('on_leave')).not.toBeInTheDocument();
    expect(screen.queryByText('active')).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(9);
    expect(screen.queryByText('KKN')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Ilham Nofaldi'));
    expect(await screen.findByText('KKN')).toBeInTheDocument();
    expect(screen.getByText('Eligibility Metopen')).toBeInTheDocument();
    expect(screen.getByText('1 Oktober 2026 10.00 WIB')).toBeInTheDocument();
  });

  it('Period panel renders the close-period scenario', async () => {
    wrap(<DevToolsPeriodPanel />);
    expect(screen.getByText('Skenario tutup periode Metopel')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Dry-run' })).toBeInTheDocument();
  });

  it('Guidance panel shows the status badge and WIB dates, and saves only changed dates', async () => {
    wrap(<DevToolsGuidancePanel />);
    expect(await screen.findByText('Husnil Kamil')).toBeInTheDocument();
    expect(screen.getByText('Terjadwal')).toBeInTheDocument();
    expect(screen.queryByText('accepted')).not.toBeInTheDocument();
    expect(screen.getByText('14 Oktober 2026 14.00 WIB')).toBeInTheDocument();
    expect(screen.getByText('15 Oktober 2026 09.30 WIB')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ubah Jadwal/ }));
    expect(await screen.findByText(/Jadwal efektif sesi adalah waktu disetujui/)).toBeInTheDocument();
    const approved = screen.getByLabelText('Waktu disetujui (WIB)') as HTMLInputElement;
    expect(approved.value).toBe('2026-10-15T09:30');
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();

    fireEvent.change(approved, { target: { value: '2020-01-05T09:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    await waitFor(() =>
      expect(devToolsService.updateGuidanceSchedule).toHaveBeenCalledWith('g1', {
        approvedDate: '2020-01-05T02:00:00.000Z',
      }),
    );
  });

  it('page shows the warning banner and the four tabs in order, routed by path', async () => {
    const setBreadcrumbs = vi.fn();
    const setTitle = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Outlet = (await import('react-router-dom')).Outlet;
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/admin/dev-tools/bimbingan']}>
          <Routes>
            <Route element={<Outlet context={{ setBreadcrumbs, setTitle }} />}>
              <Route path="/admin/dev-tools/:tab" element={<DevTools />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Hanya untuk Pengembangan/)).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['User', 'Mahasiswa', 'Periode', 'Bimbingan']);
    expect(screen.getByRole('link', { name: 'User' })).toHaveAttribute('href', '/admin/dev-tools/users');
    expect(await screen.findByText('Husnil Kamil')).toBeInTheDocument();
    expect(devToolsService.getUsers).not.toHaveBeenCalled();
  });
});

describe('devToolsDate', () => {
  it('converts between ISO and a WIB datetime-local value', () => {
    expect(isoToWibInput('2026-10-14T07:00:00.000Z')).toBe('2026-10-14T14:00');
    expect(isoToWibInput('2026-10-14T18:30:00.000Z')).toBe('2026-10-15T01:30');
    expect(isoToWibInput(null)).toBe('');
    expect(isoToWibInput('bogus')).toBe('');
    expect(wibInputToIso('2026-10-14T14:00')).toBe('2026-10-14T07:00:00.000Z');
    expect(wibInputToIso('')).toBeNull();
    expect(wibInputToIso('bogus')).toBeUndefined();
  });

  it('builds a patch with changed fields only, clears nullable dates, and requires requestedDate', () => {
    const original = toGuidanceScheduleForm(guidance);
    expect(buildGuidanceSchedulePatch(original, original)).toEqual({});
    expect(buildGuidanceSchedulePatch(original, { ...original, approvedDate: '', completedAt: '2026-10-16T08:00' })).toEqual({
      approvedDate: null,
      completedAt: '2026-10-16T01:00:00.000Z',
    });
    expect(buildGuidanceSchedulePatch(original, { ...original, requestedDate: '' })).toBeNull();
  });
});
