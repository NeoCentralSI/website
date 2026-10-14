import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getEntryProblem } from '@/components/research-method/ScoreFormDialog';
import { describeAttempt } from '@/components/thesis-proposal/StudentResearchMethodScoreSection';
import * as service from '@/services/research-method/research-method.service';
import type { AssessmentQueue, AssessmentView, ClassMonitoring as Monitoring } from '@/types/research-method.types';
import { getFilesProblem } from './Attendance';
import ClassMonitoring from './ClassMonitoring';
import LecturerThesisProposal from '../thesis-proposal/LecturerThesisProposal';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/research-method/research-method.service');
vi.mock('@/services/admin.service', () => ({ getAcademicYearsAPI: vi.fn(async () => ({ academicYears: [] })) }));
const roles = vi.hoisted(() => ({ coordinator: false, kadep: false }));
vi.mock('@/hooks/shared/useRole', () => ({
  useRole: () => ({ isResearchMethodCoordinator: () => roles.coordinator, isKadep: () => roles.kadep, isAdmin: () => false }),
}));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useOutletContext: () => ({ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }),
}));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

const view = (overrides: Partial<AssessmentView> = {}): AssessmentView => ({
  id: 'a1',
  academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
  minimumScore: 60,
  thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [] },
  student: { id: 's1', fullName: 'Uji Proposal Siap Dinilai', identityNumber: '2211528013' },
  proposal: { fileName: 'p.pdf', url: '/uploads/thesis/t1/proposal/a1/p.pdf', submittedAt: '2026-10-10T00:00:00Z' },
  supervisorScore: null,
  coordinatorScore: null,
  finalScore: null,
  isFinalized: false,
  result: null,
  attendance: { attendancePercentage: 0.9375, isEligible: true, presentCount: 15, totalMeetings: 16 },
  attendanceAutoZeroed: false,
  canScore: true,
  scoreBlockReason: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  roles.coordinator = false;
  roles.kadep = false;
});

describe('form rules (R22)', () => {
  const criterion = { id: 'c1', name: 'Presentasi', maxScore: 20, cpmk: { id: 'k', code: 'CPMK-01', description: '' }, rubrics: [{ id: 'r1', minScore: 0, maxScore: 8, description: 'Kurang' }, { id: 'r2', minScore: 9, maxScore: 20, description: 'Baik' }] };
  it('explains what is missing before sending', () => {
    expect(getEntryProblem(criterion, undefined)).toMatch(/belum diisi/);
    expect(getEntryProblem(criterion, { rubricId: '', score: '15' })).toMatch(/Pilih tingkat rubrik/);
    expect(getEntryProblem(criterion, { rubricId: 'r1', score: '15' })).toMatch(/0–8/);
    expect(getEntryProblem(criterion, { rubricId: 'r2', score: '21' })).toMatch(/0–20/);
    expect(getEntryProblem(criterion, { rubricId: 'r2', score: '15' })).toBeNull();
    expect(getEntryProblem({ ...criterion, rubrics: [] }, { rubricId: '', score: '15' })).toBeNull();
  });

  it('attendance files: 1–2 Excel files', () => {
    expect(getFilesProblem([])).toMatch(/Pilih 1–2/);
    expect(getFilesProblem([new File(['x'], 'a.pdf')])).toMatch(/xlsx/);
    expect(getFilesProblem([new File(['x'], 'a.xlsx'), new File(['x'], 'b.xlsx'), new File(['x'], 'c.xlsx')])).toMatch(/Maksimal 2/);
    expect(getFilesProblem([new File(['x'], 'a.xlsx')])).toBeNull();
  });

  it('tells the student where the assessment stands', () => {
    expect(describeAttempt(null)).toMatch(/setelah proposal final/);
    const base = { id: 'a', academicYear: { id: 'ay', label: 'x' }, file: { fileName: 'p', fileSize: 1, url: 'u', submittedAt: null }, supervisorScored: true, coordinatorScored: false, isFinalized: false, finalScore: null, result: null, attendanceAutoZeroed: false };
    expect(describeAttempt(base)).toMatch(/Nilai pembimbing sudah masuk/);
    expect(describeAttempt({ ...base, isFinalized: true, result: 'passed', finalScore: 82 })).toMatch(/Lulus/);
    expect(describeAttempt({ ...base, isFinalized: true, result: 'failed', finalScore: 47 })).toMatch(/mengulang/);
    expect(describeAttempt({ ...base, attendanceAutoZeroed: true })).toMatch(/di bawah 75%/);
  });
});

describe('Tugas Akhir > Proposal (pembimbing)', () => {
  it('lists students with labels, opens "Nilai Proposal", keeps blocked rows disabled with their reason', async () => {
    vi.mocked(service.getSupervisorQueue).mockResolvedValue({
      academicYear: { id: 'ay-1', label: '2026/2027 Ganjil', isOperational: true },
      minimumScore: 60,
      rows: [
        view(),
        view({ id: 'a2', student: { id: 's2', fullName: 'Uji Lulus', identityNumber: '2211528015' }, supervisorScore: 64, coordinatorScore: 20, finalScore: 84, isFinalized: true, result: 'passed', canScore: false, scoreBlockReason: 'Penilaian proposal sudah final.' }),
        view({ id: null, proposal: null, student: { id: 's3', fullName: 'Uji Ditetapkan', identityNumber: '2211528010' }, canScore: false, scoreBlockReason: 'Mahasiswa belum mengajukan proposal final.' }),
      ],
    } satisfies AssessmentQueue);
    vi.mocked(service.getAssessmentForm).mockResolvedValue({ party: 'supervisor', academicYear: { id: 'ay-1', label: 'x' }, weight: 75, minimumScore: 60, criteria: [] });
    wrap(<LecturerThesisProposal />);

    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    expect(screen.getByText('Lulus')).toBeInTheDocument();
    expect(screen.queryByText('passed')).not.toBeInTheDocument();
    expect(screen.getByText('Mahasiswa belum mengajukan proposal final.')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Nilai Proposal' });
    expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, true, true]);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(service.getAssessmentForm).toHaveBeenCalledWith('supervisor', 'ay-1'));
  });
});

describe('Monitoring Kelas', () => {
  const monitoring: Monitoring = {
    academicYear: { id: 'ay-1', label: '2026/2027 Ganjil' },
    minimumScore: 60,
    summary: { total: 1, withSupervisor: 1, assigned: 1, finalProposal: 1, finalized: 0, passed: 0, failed: 0, promoted: 0 },
    rows: [{
      studentId: 's1', fullName: 'Uji Proposal Siap Dinilai', identityNumber: '2211528013',
      thesis: { id: 't1', title: 'Sistem A', status: 'proposal', supervisorAssignedAt: '2026-09-01T00:00:00Z', supervisors: [], proposalGuidances: 2 },
      request: { status: 'assigned', route: 'direct' },
      attendance: { attendancePercentage: 0.9375, isEligible: true },
      assessment: null,
    }],
  };

  it('shows labels, not raw values; the promotion run is disabled with a reason for readers', async () => {
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    wrap(<ClassMonitoring />);
    expect(await screen.findByText('Uji Proposal Siap Dinilai')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing Ditetapkan')).toBeInTheDocument();
    expect(screen.queryByText('assigned')).not.toBeInTheDocument();
    expect(screen.getByText('2 sesi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jalankan Proses Kelulusan/ })).toBeDisabled();
    expect(service.getPromotionPreview).not.toHaveBeenCalled();
  });

  it('lets the coordinator run the promotion when someone may move up', async () => {
    roles.coordinator = true;
    vi.mocked(service.getMonitoring).mockResolvedValue(monitoring);
    vi.mocked(service.getPromotionPreview).mockResolvedValue({
      academicYear: { id: 'ay-1', label: 'x' },
      rows: [{ thesisId: 't9', title: 'T', student: { id: 's9', fullName: 'Uji Siap Naik', identityNumber: '2211528016' }, finalScore: 76, passedIn: '2025/2026 Genap', assignedIn: '2025/2026 Genap', decision: 'promote', reason: 'Lulus dan KRS terkonfirmasi.' }],
    });
    vi.mocked(service.runPromotion).mockResolvedValue({ success: true, data: { academicYear: null, promoted: [], deferred: [], failed: [] } });
    wrap(<ClassMonitoring />);
    expect(await screen.findByText('Siap Naik')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Jalankan Proses Kelulusan/ }));
    await waitFor(() => expect(service.runPromotion).toHaveBeenCalled());
  });
});
