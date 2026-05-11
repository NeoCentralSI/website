import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
      isKoordinatorMetopen: () => false,
      isLoading: false,
    } as ReturnType<typeof useRole>);
    vi.mocked(getAcademicYearsAPI).mockResolvedValue({
      academicYears: [
        {
          id: 'ay-active',
          year: 2025,
          semester: 'genap',
          isActive: true,
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
        metopenEligibility: {
          eligibleMetopen: true,
          hasExternalStatus: true,
          source: 'sia',
          updatedAt: '2026-04-23T10:00:00.000Z',
          readOnly: false,
          canAccess: true,
          canSubmit: true,
          thesisId: null,
          thesisTitle: null,
          thesisStatus: null,
        },
        visibleAcademicYear: {
          id: 'ay-active',
          year: 2025,
          semester: 'genap',
          label: 'Genap 2025',
          isActive: true,
          sources: ['metopen', 'ta'],
        },
        isInMetopen: true,
        hasActiveThesis: true,
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
  });
});
