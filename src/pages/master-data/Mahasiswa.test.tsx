import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import Mahasiswa from './Mahasiswa';
import type { Student } from '@/services/admin.service';
import { useRole } from '@/hooks/shared/useRole';
import {
  getAcademicYearsAPI,
  getStudentsAPI,
} from '@/services/admin.service';

const mockNavigate = vi.fn();
const mockSetBreadcrumbs = vi.fn();
const mockSetTitle = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
    setTitle: mockSetTitle,
  }),
}));

vi.mock('@/hooks/shared/useRole', () => ({
  useRole: vi.fn(),
}));

vi.mock('@/services/admin.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin.service')>('@/services/admin.service');
  return {
    ...actual,
    getAcademicYearsAPI: vi.fn(),
    getStudentsAPI: vi.fn(),
    triggerSiaSyncAPI: vi.fn(),
    adminUpdateStudentAPI: vi.fn(),
  };
});

const siaStatus = vi.hoisted(() => ({ configured: true }));
vi.mock('@/services/sia.service', () => ({ getSiaSyncStatus: vi.fn(async () => ({ configured: siaStatus.configured, lastRun: null, periodSnapshots: null })) }));

vi.mock('@/components/layout/CustomTable', () => ({
  default: ({
    columns,
    data,
  }: {
    columns: Array<{
      key: string;
      render?: (row: unknown, index: number) => ReactNode;
      accessor?: string | ((row: unknown, index: number) => ReactNode);
    }>;
    data: unknown[];
  }) => (
    <div data-testid="custom-table">
      {data.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`}>
          {columns.map((column) => {
            const content = column.render
              ? column.render(row, rowIndex)
              : typeof column.accessor === 'function'
                ? column.accessor(row, rowIndex)
                : typeof column.accessor === 'string'
                  ? String((row as Record<string, unknown>)[column.accessor] ?? '')
                  : null;

            return <div key={`${rowIndex}-${column.key}`}>{content}</div>;
          })}
        </div>
      ))}
    </div>
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Mahasiswa page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRole).mockReturnValue({
      isAdmin: () => true,
      isResearchMethodCoordinator: () => false,
      isLoading: false,
    } as ReturnType<typeof useRole>);
    vi.mocked(getAcademicYearsAPI).mockResolvedValue({
      academicYears: [
        {
          id: 'ay-active',
          year: 2025,
          semester: 'genap',
          isActive: true,
          startDate: '2026-01-13T00:00:00.000Z',
          endDate: '2026-07-31T23:59:59.999Z',
          createdAt: '',
          updatedAt: '',
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    });
  });

  it('renders visible academic year from the API response', async () => {
    const student: Student = {
      id: 'student-1',
      fullName: 'Ilham Nugraha',
      email: 'ilham@example.com',
      identityNumber: '2211522028',
      student: {
        enrollmentYear: 2022,
        sksCompleted: 120,
        status: 'active',
        activeTheses: [],
        semesterFlags: {
          academicYearId: 'ay-active',
          academicYearLabel: 'Genap 2025',
          takingResearchMethod: true,
          takingThesisCourse: false,
          source: 'sia',
          capturedAt: '2026-04-23T10:00:00.000Z',
        },
      },
    };

    vi.mocked(getStudentsAPI).mockResolvedValue({
      students: [student],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      academicYearContext: {
        id: 'ay-active',
        year: 2025,
        semester: 'genap',
        label: 'Genap 2025',
        isActive: true,
      },
    });

    render(<Mahasiswa />, { wrapper: createWrapper() });

    expect(await screen.findByText('Genap 2025')).toBeInTheDocument();
    expect(screen.getByText('Ilham Nugraha')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
    // Program column = SIA flags of the period (rencana 10.6), not the old menu access flag.
    expect(screen.getByText('Metode Penelitian')).toBeInTheDocument();
    expect(screen.queryByText('Tugas Akhir')).not.toBeInTheDocument();
  });

  it('Without SIA_BASE_URL the "Sinkronkan data SIA" button is disabled with the reason', async () => {
    siaStatus.configured = false;
    vi.mocked(getStudentsAPI).mockResolvedValue({
      students: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      academicYearContext: { id: 'ay-active', year: 2025, semester: 'genap', label: 'Genap 2025', isActive: true },
    } as never);
    render(<Mahasiswa />, { wrapper: createWrapper() });
    const button = await screen.findByRole('button', { name: 'Sinkronisasi data SIA' });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button.parentElement).toHaveAttribute('title', 'Sinkronisasi SIA belum tersedia.');
    siaStatus.configured = true;
  });
});

