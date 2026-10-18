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
const siaStatus = vi.hoisted(() => ({ configured: true }));
vi.mock('@/services/sia.service', () => ({ triggerSiaSync: vi.fn(), getSiaSyncStatus: vi.fn(async () => ({ configured: siaStatus.configured, lastRun: null, periodSnapshots: null })) }));
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
  periodFlags: {
    academicYearId: 'ay-1',
    eligibleResearchMethod: true, eligibilitySource: 'devtools', eligibilityCapturedAt: '2026-10-01T03:00:00.000Z',
    takingThesisCourse: false, thesisCourseSource: 'sia', thesisCourseCapturedAt: null,
  },
  latestThesis: { id: 't1', status: 'on_leave', title: 'Judul' },
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
    expect(screen.getByText('Mengambil Metode Penelitian (semester berjalan)')).toBeInTheDocument();
    expect(screen.getByText('1 Oktober 2026 10.00 WIB')).toBeInTheDocument();
    expect(screen.getByText('DevTools')).toBeInTheDocument();
  });

  it('Period panel offers the SIA sync and no period close (K2)', () => {
    siaStatus.configured = true;
    wrap(<DevToolsPeriodPanel />);
    expect(screen.getByRole('button', { name: 'Jalankan Sinkronisasi SIA' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dry-run' })).not.toBeInTheDocument();
  });

  it('Paket P9: without SIA_BASE_URL the sync button is disabled with the reason', async () => {
    siaStatus.configured = false;
    wrap(<DevToolsPeriodPanel />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Jalankan Sinkronisasi SIA' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Jalankan Sinkronisasi SIA' }).parentElement).toHaveAttribute('title', 'Sinkronisasi SIA belum tersedia.');
    siaStatus.configured = true;
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

  // Paket E2: a server-side search keeps the old rows, the focus and the typed text.
  it('Student panel keeps the rows and the focus while a search is on its way', async () => {
    wrap(<DevToolsStudentPanel />);
    expect(await screen.findByText('Ilham Nofaldi')).toBeInTheDocument();

    let resolveSearch: (rows: DevToolsStudent[]) => void = () => {};
    vi.mocked(devToolsService.getStudents).mockImplementation(
      () => new Promise<DevToolsStudent[]>((resolve) => { resolveSearch = resolve; }),
    );

    const input = screen.getByPlaceholderText('Cari nama, NIM, atau email...') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'nabil' } });
    // Nothing is asked of the server before the typing pause ends.
    expect(devToolsService.getStudents).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(devToolsService.getStudents).toHaveBeenLastCalledWith('nabil', undefined));
    // Old rows stay (dimmed), with a small indicator in the search box: no full spinner, no empty state.
    expect(screen.getByText('Ilham Nofaldi')).toBeInTheDocument();
    expect(screen.getByRole('table').className).toContain('opacity-60');
    expect(screen.getByRole('status', { name: 'Memuat hasil pencarian' })).toBeInTheDocument();
    expect(screen.queryByText('Tidak ada mahasiswa ditemukan.')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input.value).toBe('nabil');

    resolveSearch([{ ...student, id: 's2', fullName: 'Nabil Rizki', identityNumber: '2211523030' }]);
    expect(await screen.findByText('Nabil Rizki')).toBeInTheDocument();
    expect(screen.queryByText('Ilham Nofaldi')).not.toBeInTheDocument();
    expect(screen.getByRole('table').className).not.toContain('opacity-60');
    expect(screen.queryByRole('status', { name: 'Memuat hasil pencarian' })).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input.value).toBe('nabil');
  });

  it('User panel sends the trimmed keyword after the pause and keeps the rows meanwhile', async () => {
    wrap(<DevToolsUserPanel />);
    expect(await screen.findByText('Admin SI')).toBeInTheDocument();

    vi.mocked(devToolsService.getUsers).mockImplementation(() => new Promise(() => {}));
    fireEvent.change(screen.getByPlaceholderText(/Cari semua user/), { target: { value: ' admin ' } });

    await waitFor(() => expect(devToolsService.getUsers).toHaveBeenLastCalledWith('admin'));
    expect(screen.getByText('Admin SI')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Memuat hasil pencarian' })).toBeInTheDocument();
  });

  it('Guidance panel goes back to page 1 for a new keyword and never covers the table', async () => {
    vi.mocked(devToolsService.getGuidances).mockResolvedValue({
      data: [guidance],
      meta: { page: 1, pageSize: 10, total: 25, totalPages: 3 },
    });
    wrap(<DevToolsGuidancePanel />);
    expect(await screen.findByText('Husnil Kamil')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: '2' }));
    await waitFor(() => expect(devToolsService.getGuidances).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, search: undefined })));
    await waitFor(() => expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy'));

    vi.mocked(devToolsService.getGuidances).mockImplementation(() => new Promise(() => {}));
    const input = screen.getByPlaceholderText('Cari...') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'ilham' } });

    await waitFor(() => expect(devToolsService.getGuidances).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'ilham' })));
    // The new keyword is never asked for the old page.
    expect(vi.mocked(devToolsService.getGuidances).mock.calls.some(([params]) => params?.search === 'ilham' && params?.page !== 1)).toBe(false);
    // The row stays, the table is only dimmed, and the input is untouched.
    expect(screen.getByText('Husnil Kamil')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('table').className).toContain('opacity-60');
    expect(input).toHaveFocus();
    expect(input.value).toBe('ilham');
  });

  it('page shows the warning banner and the five tabs in order, routed by path', async () => {
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
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['User', 'Mahasiswa', 'Periode', 'Proposal', 'Bimbingan']);
    expect(screen.getByRole('link', { name: 'Proposal' })).toHaveAttribute('href', '/admin/dev-tools/proposal');
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
