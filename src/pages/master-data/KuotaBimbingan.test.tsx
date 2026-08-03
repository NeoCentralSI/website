import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import KuotaBimbingan from './KuotaBimbingan';
import type {
  LecturerQuota,
  LecturerQuotaDetail,
} from '@/services/supervisionQuota.service';

const {
  mockUseDefaultQuota,
  mockUseLecturerQuotas,
  mockUseLecturerQuotaDetail,
  mockUseSetDefaultQuota,
  mockUseUpdateLecturerQuota,
} = vi.hoisted(() => ({
  mockUseDefaultQuota: vi.fn(),
  mockUseLecturerQuotas: vi.fn(),
  mockUseLecturerQuotaDetail: vi.fn(),
  mockUseSetDefaultQuota: vi.fn(),
  mockUseUpdateLecturerQuota: vi.fn(),
}));

vi.mock('@/hooks/master-data/useSupervisionQuota', () => ({
  useDefaultQuota: mockUseDefaultQuota,
  useLecturerQuotas: mockUseLecturerQuotas,
  useLecturerQuotaDetail: mockUseLecturerQuotaDetail,
  useSetDefaultQuota: mockUseSetDefaultQuota,
  useUpdateLecturerQuota: mockUseUpdateLecturerQuota,
}));

vi.mock('@/services/admin.service', () => ({
  getAcademicYearsAPI: vi.fn().mockResolvedValue({
    academicYears: [
      {
        id: 'ay-1',
        year: '2025/2026',
        semester: 'genap',
        isActive: true,
      },
    ],
  }),
  getActiveAcademicYearAPI: vi.fn().mockResolvedValue({
    academicYear: {
      id: 'ay-1',
      year: '2025/2026',
      semester: 'genap',
      isActive: true,
    },
  }),
}));

vi.mock('@/components/ui/empty-state', () => ({
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

const lecturerQuota: LecturerQuota = {
  id: 'quota-1',
  lecturerId: 'lecturer-1',
  academicYearId: 'ay-1',
  fullName: 'DR. DOSEN UJI',
  identityNumber: '19800101',
  email: 'dosen@example.com',
  scienceGroup: 'Rekayasa Perangkat Lunak',
  quotaMax: 10,
  quotaSoftLimit: 8,
  currentCount: 2,
  activeCount: 1,
  bookingCount: 1,
  pendingKadepCount: 0,
  normalAvailable: 8,
  overquotaAmount: 0,
  overquotaSahCount: 1,
  notes: null,
  remaining: 8,
  isNearLimit: false,
  isFull: false,
};

const quotaDetail: LecturerQuotaDetail = {
  ...lecturerQuota,
  activeOfficialEntries: [
    {
      id: 'request-active',
      source: 'request',
      requestId: 'request-active',
      supervisorId: null,
      bucket: 'active',
      studentId: 'student-1',
      studentName: 'MAHASISWA AKTIF',
      studentIdentityNumber: '2210000001',
      thesisId: 'thesis-1',
      thesisTitle: 'Sistem Monitoring Akademik',
      roleName: 'Pembimbing 1',
      requestStatus: 'active_official',
      routeType: 'normal',
      acceptedOverNormal: false,
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  bookingEntries: [
    {
      id: 'request-booking',
      source: 'request',
      requestId: 'request-booking',
      supervisorId: null,
      bucket: 'booking',
      studentId: 'student-2',
      studentName: 'MAHASISWA BOOKING',
      studentIdentityNumber: '2210000002',
      thesisId: 'thesis-2',
      thesisTitle: 'Sistem Booking Akademik',
      roleName: 'Pembimbing 1',
      requestStatus: 'booking_approved',
      routeType: 'escalated',
      acceptedOverNormal: true,
      createdAt: '2026-07-02T00:00:00.000Z',
    },
  ],
  pendingKadepEntries: [],
  overquotaSahEntries: [
    {
      id: 'request-booking',
      source: 'request',
      requestId: 'request-booking',
      supervisorId: null,
      bucket: 'booking',
      studentId: 'student-2',
      studentName: 'MAHASISWA BOOKING',
      studentIdentityNumber: '2210000002',
      thesisId: 'thesis-2',
      thesisTitle: 'Sistem Booking Akademik',
      roleName: 'Pembimbing 1',
      requestStatus: 'booking_approved',
      routeType: 'escalated',
      acceptedOverNormal: true,
      createdAt: '2026-07-02T00:00:00.000Z',
    },
  ],
};

function renderWithRoute(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const layoutContext = {
    setBreadcrumbs: vi.fn(),
    setTitle: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/kelola/metopen/kuota-dosen']}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/kelola/metopen/kuota-dosen" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KuotaBimbingan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDefaultQuota.mockReturnValue({
      data: { quotaMax: 10, quotaSoftLimit: 8, academicYearId: 'ay-1' },
    });
    mockUseLecturerQuotas.mockReturnValue({
      data: [lecturerQuota],
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseLecturerQuotaDetail.mockReturnValue({
      data: quotaDetail,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseSetDefaultQuota.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseUpdateLecturerQuota.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders KaDep monitoring as read-only while keeping computed metrics traceable', async () => {
    renderWithRoute(<KuotaBimbingan readOnly />);

    expect(await screen.findByText('Mode monitoring read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Set Default Kuota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit kuota/i })).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Lihat Beban Aktif Dr\. Dosen Uji/i }),
    );

    expect(await screen.findByText('Mahasiswa Aktif')).toBeInTheDocument();
    expect(screen.getByText('Sistem Monitoring Akademik')).toBeInTheDocument();
    expect(screen.getByText(/snapshot computed yang sama dengan tabel/i)).toBeInTheDocument();
  });

  it('keeps zero metrics clickable and explains their empty snapshot', async () => {
    renderWithRoute(<KuotaBimbingan readOnly />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Lihat Pending KaDep Dr\. Dosen Uji/i,
      }),
    );

    expect(
      await screen.findByText('Tidak ada mahasiswa pada kategori ini'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nilai 0 tetap dapat dibuka/i)).toBeInTheDocument();
  });

  it('preserves Admin mutation controls on the original page mode', async () => {
    renderWithRoute(<KuotaBimbingan />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Set Default Kuota/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Edit kuota Dr\. Dosen Uji/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Mode monitoring read-only')).not.toBeInTheDocument();
  });
});
