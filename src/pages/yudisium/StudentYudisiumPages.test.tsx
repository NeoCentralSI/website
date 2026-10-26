import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const survey = vi.hoisted(() => ({
  data: {
    isSubmitted: false,
    form: {
      name: 'Exit Survey Lulusan',
      sessions: [{ id: 's1', name: 'Sesi 1', order: 1, questions: [{ id: 'q1', question: 'Saran', questionType: 'short_answer', isRequired: false, orderNumber: 1, options: [] }] }],
    },
    answers: [],
  },
  isLoading: false,
  isError: false,
  error: null,
}));
const hooks = vi.hoisted(() => ({
  overview: { cplScores: [], history: [], checklist: null, requirements: [], allChecklistMet: false, participantStatus: null, yudisium: null },
  submit: vi.fn(async () => undefined),
  overviewQuery: null as unknown,
}));
hooks.overviewQuery = { data: hooks.overview, isLoading: false, isFetching: false, isError: false, error: null, refetch: () => undefined };

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/hooks/yudisium/useYudisiumStudent', () => ({
  useStudentYudisiumOverview: () => hooks.overviewQuery,
}));
// The panels have their own content; here only which one a tab shows.
vi.mock('@/components/yudisium/StudentYudisiumOverviewPanel', () => ({ StudentYudisiumOverviewPanel: () => <p>Panel Ringkasan</p> }));
vi.mock('@/components/yudisium/StudentYudisiumCplTable', () => ({ StudentYudisiumCplTable: () => <p>Tabel Nilai CPL</p> }));
vi.mock('@/hooks/yudisium/useYudisiumExitSurvey', () => ({
  // One object for every render: the page derives its answers from it in an effect.
  useStudentExitSurvey: () => survey,
  useSubmitStudentExitSurvey: () => ({ mutateAsync: hooks.submit, isPending: false }),
}));

import StudentYudisium from './StudentYudisium';
import StudentExitSurvey from './StudentExitSurvey';

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/yudisium" element={<StudentYudisium />} />
            <Route path="/yudisium/exit-survey" element={<StudentExitSurvey />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Yudisium overview of the student', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has the Ringkasan and Nilai CPL tabs; the CPL table lives in its own tab', async () => {
    renderAt('/yudisium');
    expect(screen.getByText('Panel Ringkasan')).toBeInTheDocument();
    expect(screen.queryByText('Tabel Nilai CPL')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nilai CPL' }));
    expect(await screen.findByText('Tabel Nilai CPL')).toBeInTheDocument();
    expect(screen.queryByText('Panel Ringkasan')).not.toBeInTheDocument();
  });

  it('opens the Nilai CPL tab from the link', () => {
    renderAt('/yudisium?tab=nilai-cpl');
    expect(screen.getByText('Tabel Nilai CPL')).toBeInTheDocument();
  });
});

describe('After the exit survey is sent', () => {
  it('goes back to the Yudisium overview', async () => {
    renderAt('/yudisium/exit-survey');
    fireEvent.click(screen.getByRole('button', { name: /Kirim Exit Survey/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Ya, Kirim/ }));
    await waitFor(() => expect(hooks.submit).toHaveBeenCalled());
    expect(await screen.findByText('Panel Ringkasan')).toBeInTheDocument();
  });
});
