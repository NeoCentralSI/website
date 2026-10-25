import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { devToolsService } from '@/services/devTools.service';
import type { DevToolsFinalStages, DevToolsStudent, DevToolsStudentYudisium, DevToolsYudisiumPeriod } from '@/types/devTools.types';
import DevTools from '@/pages/dev-tools/DevTools';
import { DevToolsFinalStagesPanel } from './DevToolsFinalStagesPanel';
import { DevToolsYudisiumParticipantPanel } from './DevToolsYudisiumParticipantPanel';
import { DevToolsYudisiumPeriodPanel } from './DevToolsYudisiumPeriodPanel';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('@/services/devTools.service', () => ({
  devToolsService: {
    getStudents: vi.fn(),
    getFinalStages: vi.fn(),
    previewEvent: vi.fn(),
    setEventStatus: vi.fn(async () => 'Status diubah'),
    approveRevisions: vi.fn(async () => 'Semua revisi disetujui'),
    deleteEvent: vi.fn(async () => 'Seminar dihapus'),
    setEventSchedule: vi.fn(async () => 'Jadwal diubah'),
    getYudisiumPeriods: vi.fn(),
    setYudisiumPeriodDates: vi.fn(async () => 'Tanggal periode diubah'),
    getStudentYudisium: vi.fn(),
    previewRegisterYudisium: vi.fn(),
    registerYudisium: vi.fn(async () => 'OK'),
    previewParticipantStatus: vi.fn(),
    setParticipantStatus: vi.fn(async () => 'OK'),
    previewRemoveParticipant: vi.fn(),
    removeParticipant: vi.fn(async () => 'OK'),
    setRequirementItems: vi.fn(async () => 'OK'),
    setExitSurvey: vi.fn(async () => 'OK'),
    setCplScore: vi.fn(async () => ({ cpl: [] })),
    setCplPreset: vi.fn(async () => 'OK'),
    setCplRecommendation: vi.fn(async () => 'OK'),
  },
}));

const student: DevToolsStudent = {
  id: 's1', fullName: 'Uji Demo Seminar Berlangsung', identityNumber: '2211529202', email: null, isVerified: true, status: 'active',
  enrollmentYear: 2022, sksCompleted: 142, mandatoryCoursesCompleted: false, mkwuCompleted: false, internshipCompleted: false, kknCompleted: false, currentSemester: 9,
  periodFlags: { academicYearId: null, eligibleResearchMethod: null, eligibilitySource: null, eligibilityCapturedAt: null, takingThesisCourse: null, thesisCourseSource: null, thesisCourseCapturedAt: null },
  latestThesis: null,
};

const stages: DevToolsFinalStages = {
  student: { id: 's1', fullName: student.fullName, nim: student.identityNumber, sksCompleted: 142, researchMethodCompleted: true },
  thesis: { id: 't1', title: 'Aplikasi Penjadwalan Ruang Kuliah', status: 'research' },
  seminar: {
    id: 'sem1', status: 'passed_with_revision', displayStatus: 'passed_with_revision', registeredAt: null, date: '2026-10-25', startTime: '09:55', endTime: '12:00', room: 'Ruang Seminar SI',
    examiners: [{ id: 'e1', name: 'Aina Hubby Aziira', order: 1, availabilityStatus: 'available', score: 82, submitted: true }],
    finalScore: 82, resultFinalizedAt: '2026-10-25T03:00:00.000Z', revision: { total: 2, approved: 0, finalizedAt: null }, officialDocuments: 1,
  },
  defence: null,
  history: { seminar: 0, defence: 0 },
  guards: { seminar: null, defence: null },
};

const period: DevToolsYudisiumPeriod = {
  id: 'y1', name: 'Yudisium Ganjil 2026/2027', registrationOpenDate: '2026-10-24T00:00:00.000Z', registrationCloseDate: '2026-11-08T00:00:00.000Z', eventDate: '2026-11-15T00:00:00.000Z',
  exitSurveyOpenDate: '2026-10-24T00:00:00.000Z', exitSurveyCloseDate: '2026-11-08T00:00:00.000Z', appointedAt: null, decreeUploadedAt: null, hasExitSurvey: true, participantCount: 1, requirementCount: 4, status: 'open',
};

const yudisium: DevToolsStudentYudisium = {
  student: { id: 's1', fullName: student.fullName, nim: student.identityNumber, sksCompleted: 146 },
  thesis: { id: 't1', title: 'Judul', status: 'completed' },
  academic: { defencePassed: true, sksMet: true, coursesMet: true },
  participants: [{
    id: 'p1', period, status: 'registered', registeredAt: '2026-10-24T00:00:00.000Z', exitSurveySubmittedAt: '2026-10-24T00:00:00.000Z', exitSurveyAnswers: 6,
    requirementVerifiedAt: null, cplValidatedAt: null,
    requirements: [{ itemId: 'i1', name: 'Surat Keterangan Bebas Pustaka', status: 'submitted', verifiedAt: null }],
  }],
  cpl: [{ cplId: 'c1', code: 'CPL-01', description: 'Mengidentifikasi masalah', minimalScore: 55, score: 45, oldScore: null, status: 'calculated', passed: false, hasRecommendation: false, hasSettlement: false, validatedAt: null }],
};

function wrap(ui: React.ReactNode, route = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

async function pickStudent() {
  fireEvent.click(screen.getByRole('combobox', { name: '' }));
  fireEvent.click(await screen.findByText('Uji Demo Seminar Berlangsung'));
}

describe('DevTools Seminar & Sidang', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(devToolsService.getStudents).mockResolvedValue([student]);
    vi.mocked(devToolsService.getFinalStages).mockResolvedValue(stages);
    vi.mocked(devToolsService.previewEvent).mockResolvedValue({ prerequisites: [], effects: ['Revisi difinalkan', 'TA akan menjadi Selesai'] });
  });

  it('shows the seminar card of the picked student and the empty defence', async () => {
    wrap(<DevToolsFinalStagesPanel />);
    expect(screen.getByText('Pilih Mahasiswa')).toBeInTheDocument();
    await pickStudent();
    expect(await screen.findByText('Aplikasi Penjadwalan Ruang Kuliah')).toBeInTheDocument();
    expect(screen.getByText('Lulus dengan Revisi')).toBeInTheDocument();
    expect(screen.getByText(/Aina Hubby Aziira/)).toBeInTheDocument();
    expect(screen.getByText('0/2 disetujui')).toBeInTheDocument();
    expect(screen.getByText('Belum mendaftar sidang')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buat Sidang/ })).toBeInTheDocument();
  });

  it('moves the schedule with the quick buttons, without changing the status', async () => {
    wrap(<DevToolsFinalStagesPanel />);
    await pickStudent();
    fireEvent.click(await screen.findByRole('button', { name: /Mulai Sekarang/ }));
    await waitFor(() => expect(devToolsService.setEventSchedule).toHaveBeenCalledWith('seminar', 'sem1', { preset: 'now' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Sudah Lewat/ })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Sudah Lewat/ }));
    await waitFor(() => expect(devToolsService.setEventSchedule).toHaveBeenCalledWith('seminar', 'sem1', { preset: 'past' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Besok/ })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Besok/ }));
    await waitFor(() => expect(devToolsService.setEventSchedule).toHaveBeenCalledWith('seminar', 'sem1', { preset: 'tomorrow' }));
    expect(devToolsService.setEventStatus).not.toHaveBeenCalled();
  });

  it('previews the effects before approving every revision', async () => {
    wrap(<DevToolsFinalStagesPanel />);
    await pickStudent();
    fireEvent.click(await screen.findByRole('button', { name: /Setujui Semua Revisi/ }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('TA akan menjadi Selesai')).toBeInTheDocument();
    expect(within(dialog).getByText(/Tidak ada notifikasi atau email/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui Semua' }));
    await waitFor(() => expect(devToolsService.approveRevisions).toHaveBeenCalledWith('s1', 'seminar'));
  });

  it('disables the seminar actions when a defence exists, with the reason', async () => {
    vi.mocked(devToolsService.getFinalStages).mockResolvedValue({ ...stages, guards: { seminar: 'Mahasiswa ini sudah punya sidang. Hapus sidang mahasiswa ini terlebih dahulu.', defence: null } });
    wrap(<DevToolsFinalStagesPanel />);
    await pickStudent();
    expect(await screen.findByRole('button', { name: /Hapus Seminar/ })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Ubah status Seminar Hasil' })).toBeDisabled();
  });

  it('deletes after the preview, with a destructive confirmation', async () => {
    vi.mocked(devToolsService.previewEvent).mockResolvedValue({ prerequisites: [], effects: ['Mahasiswa kembali ke keadaan belum mendaftar seminar'] });
    wrap(<DevToolsFinalStagesPanel />);
    await pickStudent();
    fireEvent.click(await screen.findByRole('button', { name: /Hapus Seminar/ }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Mahasiswa kembali ke keadaan belum mendaftar seminar');
    expect(devToolsService.previewEvent).toHaveBeenCalledWith('s1', 'seminar', 'delete');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hapus seminar' }));
    await waitFor(() => expect(devToolsService.deleteEvent).toHaveBeenCalledWith('s1', 'seminar'));
  });
});

describe('DevTools Yudisium', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(devToolsService.getStudents).mockResolvedValue([student]);
    vi.mocked(devToolsService.getYudisiumPeriods).mockResolvedValue([period]);
    vi.mocked(devToolsService.getStudentYudisium).mockResolvedValue(yudisium);
  });

  it('periods: the status comes from the dates and the quick buttons set them', async () => {
    wrap(<DevToolsYudisiumPeriodPanel />);
    expect(await screen.findByText('Pendaftaran Dibuka')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup pendaftaran sekarang' }));
    await waitFor(() => expect(devToolsService.setYudisiumPeriodDates).toHaveBeenCalledWith('y1', { preset: 'close' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Acara hari ini' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Acara hari ini' }));
    await waitFor(() => expect(devToolsService.setYudisiumPeriodDates).toHaveBeenCalledWith('y1', { preset: 'event' }));
  });

  it('participant: requirement items, exit survey, and CPL actions', async () => {
    wrap(<DevToolsYudisiumParticipantPanel />);
    await pickStudent();
    expect(await screen.findByText('Surat Keterangan Bebas Pustaka')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tandai terverifikasi' }));
    await waitFor(() => expect(devToolsService.setRequirementItems).toHaveBeenCalledWith('p1', 'approve', 'i1'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Kosongkan Exit Survey/ })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Kosongkan Exit Survey/ }));
    await waitFor(() => expect(devToolsService.setExitSurvey).toHaveBeenCalledWith('p1', 'clear'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buat rekomendasi' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Buat rekomendasi' }));
    await waitFor(() => expect(devToolsService.setCplRecommendation).toHaveBeenCalledWith('s1', 'c1', 'create'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Semua Memenuhi' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Semua Memenuhi' }));
    await waitFor(() => expect(devToolsService.setCplPreset).toHaveBeenCalledWith('s1', 'all-pass'));
    await waitFor(() => expect(screen.getByLabelText('Nilai CPL-01')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Nilai CPL-01'), { target: { value: '70' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nilai' }));
    await waitFor(() => expect(devToolsService.setCplScore).toHaveBeenCalledWith('s1', 'c1', 70));
  });

  it('the DevTools page lists the new tabs', async () => {
    wrap(
      <Routes>
        <Route element={<Outlet context={{ setBreadcrumbs: () => {}, setTitle: () => {} }} />}>
          <Route path="/admin/dev-tools/:tab" element={<DevTools />} />
        </Route>
      </Routes>,
      '/admin/dev-tools/periode-yudisium',
    );
    for (const label of ['Seminar & Sidang', 'Periode Yudisium', 'Peserta Yudisium']) {
      expect(await screen.findByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});

