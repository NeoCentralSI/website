import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as service from '@/services/thesis-change-request/thesis-change-request.service';
import type { ThesisChangeContext, ThesisChangeRequest } from '@/types/thesis-change-request.types';
import * as lecturerGuidance from '@/services/lecturerGuidance.service';
import { LecturerTransferStudentsDialog } from './LecturerTransferStudentsDialog';
import { ThesisChangeRequestCard } from './ThesisChangeRequestCard';
import { ThesisChangeRequestTable } from './ThesisChangeRequestTable';
import { groupByBatch, splitChangeRequests, summarizeChange } from './thesisChangeRequestGroups';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/topic.service', () => ({ getTopics: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/lecturerGuidance.service', () => ({ getMyStudents: vi.fn() }));
vi.mock('@/services/thesis-change-request/thesis-change-request.service', () => ({
  getThesisChangeContext: vi.fn(),
  getSupervisorOptions: vi.fn(),
  submitChangeRequest: vi.fn(),
  submitTransfer: vi.fn(),
  getLecturerChangeRequests: vi.fn(),
  decideAsLecturer: vi.fn(),
  cancelChangeRequest: vi.fn(),
  getDepartmentChangeRequests: vi.fn(),
  decideAsKadep: vi.fn(),
  decideBatchAsKadep: vi.fn(),
}));

const person = (id: string, name: string) => ({ id, name, identityNumber: `ID-${id}` });

function request(overrides: Partial<ThesisChangeRequest> = {}): ThesisChangeRequest {
  return {
    id: 'req-1',
    thesisId: 't1',
    batchId: null,
    requestType: 'supervisor',
    status: 'pending',
    reason: 'Pembimbing 1 akan studi lanjut.',
    student: person('stu-1', 'ILHAM NOFALDI'),
    thesisTitle: 'Judul Lama',
    title: null,
    supervisor: { position: 'pembimbing_1', replaced: person('l1', 'HUSNIL KAMIL'), next: person('l3', 'AINA HUBBY') },
    requestedBy: person('stu-1', 'ILHAM NOFALDI'),
    requestedByStudent: true,
    steps: [
      { key: 'previous_supervisor', lecturer: person('l1', 'HUSNIL KAMIL'), status: 'approved', skipped: false, notes: 'Setuju', decidedAt: '2026-10-10T03:00:00.000Z' },
      { key: 'new_supervisor', lecturer: person('l3', 'AINA HUBBY'), status: 'pending', skipped: false, notes: null, decidedAt: null },
      { key: 'kadep', lecturer: null, status: 'pending', skipped: false, notes: null, decidedAt: null },
    ],
    currentStep: 'new_supervisor',
    decision: null,
    appliedAt: null,
    createdAt: '2026-10-09T03:00:00.000Z',
    viewer: { canDecideAsLecturer: false, canCancel: false },
    ...overrides,
  };
}

function context(overrides: Partial<ThesisChangeContext> = {}): ThesisChangeContext {
  return {
    thesis: {
      id: 't1',
      title: 'Judul Lama',
      status: 'research',
      topic: { id: 'topic-a', name: 'Enterprise Application' },
      supervisors: [
        { lecturerId: 'l1', name: 'HUSNIL KAMIL', position: 'pembimbing_1' },
        { lecturerId: 'l2', name: 'AFRIYANTI', position: 'pembimbing_2' },
      ],
    },
    viewerRole: 'student',
    canSubmit: true,
    blockReason: null,
    openRequest: null,
    history: [],
    ...overrides,
  };
}

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(service.getSupervisorOptions).mockResolvedValue([
    { id: 'l1', name: 'HUSNIL KAMIL', identityNumber: '1', positions: ['pembimbing_1', 'pembimbing_2'] },
    { id: 'l2', name: 'AFRIYANTI', identityNumber: '2', positions: ['pembimbing_1', 'pembimbing_2'] },
    { id: 'l3', name: 'AINA HUBBY', identityNumber: '3', positions: ['pembimbing_1', 'pembimbing_2'] },
    { id: 'l4', name: 'ULLYA MEGA', identityNumber: '4', positions: ['pembimbing_2'] },
  ]);
});

describe('ThesisChangeRequestCard (compact, Paket E4, 5)', () => {
  it('disables Ajukan Perubahan and shows the reason when a request cannot be made', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({
      viewerRole: 'pembimbing_1',
      canSubmit: false,
      blockReason: 'Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil. Tugas akhir ini sudah terdaftar atau lulus seminar hasil.',
    }));
    wrap(<ThesisChangeRequestCard thesisId="t1" />);

    expect(await screen.findByText('Perubahan Tugas Akhir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajukan Perubahan/ })).toBeDisabled();
    expect(screen.getByText(/Ajukan Perubahan belum tersedia: Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil/)).toBeInTheDocument();
    expect(screen.getByText('Tidak ada pengajuan yang sedang berjalan.')).toBeInTheDocument();
    expect(screen.getByText('Belum ada riwayat pengajuan.')).toBeInTheDocument();
  });

  it('shows the running request as one line; its detail has labelled steps and lets the requester cancel', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({
      canSubmit: false,
      blockReason: 'Masih ada pengajuan perubahan yang berjalan. Tunggu keputusannya atau batalkan lebih dulu.',
      openRequest: request({ viewer: { canDecideAsLecturer: false, canCancel: true } }),
      history: [request({ id: 'old', status: 'rejected', currentStep: null, requestType: 'title', supervisor: null, title: { previous: 'A', next: 'B', newTopic: null } })],
    }));
    vi.mocked(service.cancelChangeRequest).mockResolvedValue({ success: true, message: 'Pengajuan dibatalkan', data: request({ status: 'cancelled' }) });
    wrap(<ThesisChangeRequestCard thesisId="t1" />);

    expect(await screen.findByText(/Pengajuan perubahan pembimbing menunggu Pembimbing Baru/)).toBeInTheDocument();
    // Mini history: tanggal, jenis, status, Detail.
    expect(screen.getByText('Ditolak')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat detail' }));
    const dialog = await screen.findByRole('dialog');
    // Labels, never raw enum values.
    expect(within(dialog).getByText('Pembimbing Sebelumnya')).toBeInTheDocument();
    expect(within(dialog).getByText('Ketua Departemen')).toBeInTheDocument();
    for (const raw of ['previous_supervisor', 'new_supervisor', 'pembimbing_1', 'pending']) {
      expect(within(dialog).queryByText(raw)).not.toBeInTheDocument();
    }
    expect(within(dialog).getByText('Husnil Kamil')).toBeInTheDocument();
    expect(within(dialog).getByText('Aina Hubby')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan Pengajuan' }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Batalkan Pengajuan' }));
    await waitFor(() => expect(service.cancelChangeRequest).toHaveBeenCalledWith('req-1'));
  });

  it('submits a title change with the current title prefilled and a reason', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({ viewerRole: 'pembimbing_1' }));
    vi.mocked(service.submitChangeRequest).mockResolvedValue({ success: true, message: 'Pengajuan perubahan berhasil dikirim', data: request() });
    wrap(<ThesisChangeRequestCard thesisId="t1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Ajukan Perubahan/ }));
    const dialog = await screen.findByRole('dialog');
    const titleInput = within(dialog).getByLabelText('Judul baru') as HTMLTextAreaElement;
    expect(titleInput.value).toBe('Judul Lama');
    expect(within(dialog).getByRole('button', { name: 'Kirim Pengajuan' })).toBeDisabled();

    fireEvent.change(titleInput, { target: { value: 'Judul Baru yang Lebih Spesifik' } });
    fireEvent.change(within(dialog).getByLabelText('Alasan perubahan'), { target: { value: 'Lingkup penelitian dipersempit.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kirim Pengajuan' }));

    await waitFor(() =>
      expect(service.submitChangeRequest).toHaveBeenCalledWith(expect.objectContaining({
        thesisId: 't1',
        requestType: 'title',
        reason: 'Lingkup penelitian dipersempit.',
        newTitle: 'Judul Baru yang Lebih Spesifik',
      })),
    );
  });
});

describe('Tugas Akhir > Perubahan (Paket E4, 4.2)', () => {
  const meta = { page: 1, pageSize: 100, total: 3, totalPages: 1 };

  it('splits Menunggu Saya, Sedang Berjalan and Riwayat; the Kadep step counts as waiting for the Kadep', () => {
    const atKadep = request({ id: 'k', currentStep: 'kadep' });
    const atLecturer = request({ id: 'l', currentStep: 'main_supervisor' });
    const mine = request({ id: 'm', viewer: { canDecideAsLecturer: true, canCancel: false } });
    const closed = request({ id: 'c', status: 'approved', currentStep: null, decision: { by: null, notes: null, at: '2026-10-12T00:00:00.000Z' } });
    const lists = splitChangeRequests({
      lecturer: { awaitingMe: [mine], inProgress: [atLecturer], history: [closed] },
      departmentPending: [atKadep, atLecturer, mine],
      departmentHistory: [closed],
    });
    expect(lists.awaitingMe.map((r) => r.id)).toEqual(['k', 'm']);
    expect(lists.inProgress.map((r) => r.id)).toEqual(['l']);
    expect(lists.history.map((r) => r.id)).toEqual(['c']);
  });

  it('summarizes before and after in one line', () => {
    expect(summarizeChange(request(), (name) => name ?? '')).toBe('Pembimbing 1: HUSNIL KAMIL → AINA HUBBY');
    expect(summarizeChange(request({ supervisor: null, requestType: 'title', title: { previous: 'Lama', next: 'Baru', newTopic: null } }), (n) => n ?? '')).toBe('Lama → Baru');
  });

  it('a supervisor approves or rejects the rows waiting for their step; rejecting needs a reason', async () => {
    vi.mocked(service.getLecturerChangeRequests).mockResolvedValue({
      awaitingMe: [request({ viewer: { canDecideAsLecturer: true, canCancel: false }, newSupervisorLoad: { activeCount: 10, quotaMax: 10, isFull: true } })],
      inProgress: [],
      history: [],
    });
    vi.mocked(service.decideAsLecturer).mockResolvedValue({ success: true, message: 'Pengajuan ditolak', data: request({ status: 'rejected' }) });
    wrap(<ThesisChangeRequestTable isSupervisor isKadep={false} />);

    expect(await screen.findByText('Ilham Nofaldi')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing 1: Husnil Kamil → Aina Hubby')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing Baru')).toBeInTheDocument();
    expect(service.getDepartmentChangeRequests).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Detail' }));
    expect(await screen.findByText(/Beban bimbingan Anda saat ini: 10 dari 10 mahasiswa\. Kuota sudah penuh/)).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Tolak' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Tolak pengajuan?' });
    expect(within(dialog).getByRole('button', { name: 'Tolak' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Alasan penolakan'), { target: { value: 'Di luar bidang saya' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(service.decideAsLecturer).toHaveBeenCalledWith('req-1', { approve: false, notes: 'Di luar bidang saya' }));
  });

  it('shows the empty text of Menunggu Saya', async () => {
    vi.mocked(service.getLecturerChangeRequests).mockResolvedValue({ awaitingMe: [], inProgress: [], history: [] });
    wrap(<ThesisChangeRequestTable isSupervisor isKadep={false} />);
    expect(await screen.findByText('Tidak ada pengajuan yang menunggu keputusan Anda.')).toBeInTheDocument();
  });

  it('the Kadep decides an Alihkan batch together from its group modal', async () => {
    const batch = (id: string, name: string) =>
      request({
        id,
        batchId: 'batch-1',
        student: person(id, name),
        currentStep: 'kadep',
        steps: request().steps.map((step) => (step.key === 'kadep' ? step : { ...step, status: 'approved' as const })),
        newSupervisorLoad: { activeCount: 3, quotaMax: 10, isFull: false },
      });
    vi.mocked(service.getDepartmentChangeRequests).mockImplementation(async ({ scope }) =>
      scope === 'pending' ? { data: [batch('a', 'MAHASISWA SATU'), batch('b', 'MAHASISWA DUA')], meta } : { data: [], meta: { ...meta, total: 0 } },
    );
    vi.mocked(service.decideBatchAsKadep).mockResolvedValue({ success: true, message: '2 pengajuan disetujui', data: { batchId: 'batch-1', decided: 2, failed: 0, results: [] } });
    wrap(<ThesisChangeRequestTable isSupervisor={false} isKadep />);

    expect(await screen.findByText('Mahasiswa Satu')).toBeInTheDocument();
    expect(screen.getAllByText('Alihkan')).toHaveLength(2);
    expect(vi.mocked(service.getDepartmentChangeRequests).mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([expect.objectContaining({ scope: 'pending', pageSize: 100 }), expect.objectContaining({ scope: 'history', pageSize: 100 })]),
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Kelompok' })[0]);
    const group = await screen.findByRole('dialog', { name: 'Kelompok Alihkan Mahasiswa' });
    expect(within(group).getByText(/2 mahasiswa · Husnil Kamil → Aina Hubby/)).toBeInTheDocument();
    expect(within(group).getByText(/Beban bimbingan Aina Hubby saat ini: 3 dari 10 mahasiswa\./)).toBeInTheDocument();
    fireEvent.click(within(group).getByRole('button', { name: 'Setujui Semua' }));
    const confirm = await screen.findByRole('dialog', { name: 'Setujui 2 pengajuan?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideBatchAsKadep).toHaveBeenCalledWith('batch-1', { approve: true, notes: null }));
  });

  it('the Kadep decides directly with a reason while a lecturer step is open (Putuskan Langsung)', async () => {
    vi.mocked(service.getDepartmentChangeRequests).mockImplementation(async ({ scope }) =>
      scope === 'pending' ? { data: [request()], meta: { ...meta, total: 1 } } : { data: [], meta: { ...meta, total: 0 } },
    );
    vi.mocked(service.decideAsKadep).mockResolvedValue({ success: true, message: 'ok', data: request({ status: 'approved' }) });
    wrap(<ThesisChangeRequestTable isSupervisor={false} isKadep />);

    // Not at the Kadep step: listed under Sedang Berjalan, so Menunggu Saya is empty.
    expect(await screen.findByText('Tidak ada pengajuan yang menunggu keputusan Anda.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter status pengajuan' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Sedang Berjalan (1)' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Putuskan Langsung' }));
    const detail = await screen.findByRole('dialog', { name: 'Detail Pengajuan Perubahan' });
    expect(within(detail).getByText('Langkah dosen belum selesai. Anda tetap dapat memutuskan langsung dengan alasan.')).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole('button', { name: 'Setujui' }));
    const dialog = await screen.findByRole('dialog', { name: 'Setujui pengajuan?' });
    expect(within(dialog).getByText('Langkah dosen belum selesai: alasan memutuskan langsung wajib diisi.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Setujui' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Alasan'), { target: { value: 'Pembimbing lama sudah tidak aktif.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideAsKadep).toHaveBeenCalledWith('req-1', { approve: true, notes: 'Pembimbing lama sudah tidak aktif.' }));
  });
});

describe('LecturerTransferStudentsDialog', () => {
  it('picks the active research students, offers only lecturers who may hold the position, and sends one request for all', async () => {
    vi.mocked(lecturerGuidance.getMyStudents).mockResolvedValue({
      students: [
        { studentId: 's1', thesisId: 't1', fullName: 'ILHAM NOFALDI', identityNumber: '2211522028', thesisStatus: 'research', supervisorStatus: 'active', roles: ['Pembimbing 1'] },
        { studentId: 's2', thesisId: 't2', fullName: 'NABIL RIZKI', identityNumber: '2211522018', thesisStatus: 'research', supervisorStatus: 'active', roles: ['Pembimbing 1'] },
        { studentId: 's3', thesisId: 't3', fullName: 'MAHASISWA PROPOSAL', identityNumber: '2211522099', thesisStatus: 'proposal', supervisorStatus: 'active', roles: ['Pembimbing 1'] },
      ],
    } as unknown as Awaited<ReturnType<typeof lecturerGuidance.getMyStudents>>);
    vi.mocked(service.submitTransfer).mockResolvedValue({ success: true, message: 'ok', data: { batchId: 'b1', requests: [] } });
    const onSuccess = vi.fn();
    wrap(<LecturerTransferStudentsDialog open onOpenChange={() => {}} currentLecturerId="l1" onSuccess={onSuccess} />);

    expect(await screen.findByText(/Ilham Nofaldi/)).toBeInTheDocument();
    expect(screen.queryByText(/Mahasiswa Proposal/)).not.toBeInTheDocument();
    expect(screen.getByText('Belum dapat dikirim: Pilih minimal satu mahasiswa.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih Ilham Nofaldi' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih Nabil Rizki' }));
    expect(screen.getByText('Mahasiswa yang dialihkan (2 dipilih)')).toBeInTheDocument();
    expect(screen.getByText(/Hanya dosen yang memiliki peran Pembimbing 1 yang ditampilkan/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox'));
    const options = (await screen.findAllByRole('option')).map((option) => option.textContent);
    // Not the lecturer themselves, and not a lecturer without the Pembimbing 1 role.
    expect(options).toEqual(['Afriyanti', 'Aina Hubby']);
    fireEvent.click(screen.getByRole('option', { name: 'Aina Hubby' }));

    fireEvent.change(screen.getByLabelText('Alasan pengalihan'), { target: { value: 'Penugasan studi lanjut.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan Pengalihan' }));
    await waitFor(() =>
      expect(service.submitTransfer).toHaveBeenCalledWith({ thesisIds: ['t1', 't2'], newSupervisorId: 'l3', reason: 'Penugasan studi lanjut.' }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe('groupByBatch', () => {
  it('keeps a batch together in first-seen order and leaves single requests alone', () => {
    const groups = groupByBatch([
      request({ id: 'a', batchId: 'x' }),
      request({ id: 'solo', batchId: null }),
      request({ id: 'b', batchId: 'x' }),
      request({ id: 'solo-2', batchId: null }),
    ]);
    expect(groups.map((group) => group.requests.map((r) => r.id))).toEqual([['a', 'b'], ['solo'], ['solo-2']]);
  });
});
