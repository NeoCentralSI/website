import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as service from '@/services/thesis-change-request/thesis-change-request.service';
import type { ThesisChangeContext, ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { KadepThesisChangeRequestPanel } from './KadepThesisChangeRequestPanel';
import { LecturerThesisChangeRequestPanel } from './LecturerThesisChangeRequestPanel';
import { LecturerTransferStudentsDialog } from './LecturerTransferStudentsDialog';
import { StudentThesisChangeRequestCard } from './StudentThesisChangeRequestCard';
import { groupByBatch } from './thesisChangeRequestGroups';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/topic.service', () => ({ getTopics: vi.fn().mockResolvedValue([]) }));
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

describe('StudentThesisChangeRequestCard', () => {
  it('disables Ajukan Perubahan and shows the reason when a request cannot be made', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({
      canSubmit: false,
      blockReason: 'Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil. Tugas akhir ini sudah terdaftar atau lulus seminar hasil.',
    }));
    wrap(<StudentThesisChangeRequestCard />);

    expect(await screen.findByText('Perubahan Tugas Akhir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajukan Perubahan/ })).toBeDisabled();
    expect(screen.getByText(/Ajukan Perubahan belum tersedia: Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil/)).toBeInTheDocument();
    expect(screen.getByText('Tidak ada pengajuan yang sedang berjalan.')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Riwayat')).toBeInTheDocument();
  });

  it('shows the running request with labelled steps, and lets the requester cancel it', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({
      canSubmit: false,
      blockReason: 'Masih ada pengajuan perubahan yang berjalan. Tunggu keputusannya atau batalkan lebih dulu.',
      openRequest: request({ viewer: { canDecideAsLecturer: false, canCancel: true } }),
    }));
    vi.mocked(service.cancelChangeRequest).mockResolvedValue({ success: true, message: 'Pengajuan dibatalkan', data: request({ status: 'cancelled' }) });
    wrap(<StudentThesisChangeRequestCard />);

    expect(await screen.findByText('Pengajuan berjalan')).toBeInTheDocument();
    // Labels, never raw enum values.
    expect(screen.getByText('Pembimbing')).toBeInTheDocument();
    expect(screen.getByText('Menunggu Persetujuan')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing Sebelumnya')).toBeInTheDocument();
    expect(screen.getByText('Pembimbing Baru')).toBeInTheDocument();
    expect(screen.getByText('Ketua Departemen')).toBeInTheDocument();
    for (const raw of ['previous_supervisor', 'new_supervisor', 'pembimbing_1', 'pending']) {
      expect(screen.queryByText(raw)).not.toBeInTheDocument();
    }
    // Before and after.
    expect(screen.getByText('Husnil Kamil')).toBeInTheDocument();
    expect(screen.getByText('Aina Hubby')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Batalkan Pengajuan' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan Pengajuan' }));
    await waitFor(() => expect(service.cancelChangeRequest).toHaveBeenCalledWith('req-1'));
  });

  it('submits a title change with the current title prefilled and a reason', async () => {
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context());
    vi.mocked(service.submitChangeRequest).mockResolvedValue({ success: true, message: 'Pengajuan perubahan berhasil dikirim', data: request() });
    wrap(<StudentThesisChangeRequestCard />);

    fireEvent.click(await screen.findByRole('button', { name: /Ajukan Perubahan/ }));
    const dialog = await screen.findByRole('dialog');
    const titleInput = within(dialog).getByLabelText('Judul baru') as HTMLTextAreaElement;
    expect(titleInput.value).toBe('Judul Lama');
    expect(within(dialog).getByText('Belum dapat dikirim: Judul baru masih sama dengan judul saat ini.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Kirim Pengajuan' })).toBeDisabled();

    fireEvent.change(titleInput, { target: { value: 'Judul Baru yang Lebih Spesifik' } });
    expect(within(dialog).getByText('Belum dapat dikirim: Alasan minimal 10 karakter.')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Alasan perubahan'), { target: { value: 'Lingkup penelitian dipersempit.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kirim Pengajuan' }));

    await waitFor(() =>
      expect(service.submitChangeRequest).toHaveBeenCalledWith({
        thesisId: 't1',
        requestType: 'title',
        reason: 'Lingkup penelitian dipersempit.',
        newTitle: 'Judul Baru yang Lebih Spesifik',
        newTopicId: null,
      }),
    );
  });
});

describe('LecturerThesisChangeRequestPanel', () => {
  it('lists requests waiting for the lecturer and needs a reason to reject', async () => {
    vi.mocked(service.getLecturerChangeRequests).mockResolvedValue({
      awaitingMe: [request({ viewer: { canDecideAsLecturer: true, canCancel: false }, newSupervisorLoad: { activeCount: 10, quotaMax: 10, isFull: true } })],
      inProgress: [],
      history: [],
    });
    vi.mocked(service.decideAsLecturer).mockResolvedValue({ success: true, message: 'Pengajuan ditolak', data: request({ status: 'rejected' }) });
    wrap(<LecturerThesisChangeRequestPanel />);

    expect(await screen.findByText('Menunggu Persetujuan Anda (1)')).toBeInTheDocument();
    expect(screen.getByText('Anda menyetujui sebagai Pembimbing Baru.')).toBeInTheDocument();
    expect(screen.getByText(/Beban bimbingan Anda saat ini: 10 dari 10 mahasiswa\. Kuota sudah penuh/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tolak' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Tolak' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Alasan penolakan'), { target: { value: 'Di luar bidang saya' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(service.decideAsLecturer).toHaveBeenCalledWith('req-1', { approve: false, notes: 'Di luar bidang saya' }));
  });

  it('shows an empty state per tab', async () => {
    vi.mocked(service.getLecturerChangeRequests).mockResolvedValue({ awaitingMe: [], inProgress: [], history: [] });
    wrap(<LecturerThesisChangeRequestPanel />);
    expect(await screen.findByText('Tidak ada pengajuan yang menunggu persetujuan Anda.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(screen.getByText('Belum ada pengajuan yang ditutup.')).toBeInTheDocument();
  });
});

describe('LecturerTransferStudentsDialog', () => {
  it('offers only lecturers who may hold the handed-over position, and sends one request for all students', async () => {
    vi.mocked(service.submitTransfer).mockResolvedValue({ success: true, message: 'ok', data: { batchId: 'b1', requests: [] } });
    const onSuccess = vi.fn();
    wrap(
      <LecturerTransferStudentsDialog
        open
        onOpenChange={() => {}}
        currentLecturerId="l1"
        onSuccess={onSuccess}
        students={[
          { thesisId: 't1', name: 'ILHAM NOFALDI', identityNumber: '2211522028', position: 'pembimbing_1' },
          { thesisId: 't2', name: 'NABIL RIZKI', identityNumber: '2211522018', position: 'pembimbing_1' },
        ]}
      />,
    );

    expect(await screen.findByText('Mahasiswa yang dialihkan (2)')).toBeInTheDocument();
    expect(screen.getByText('Belum dapat dikirim: Pilih dosen tujuan.')).toBeInTheDocument();
    expect(screen.getByText(/Hanya dosen yang memiliki peran Pembimbing 1 yang ditampilkan/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
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

describe('KadepThesisChangeRequestPanel', () => {
  const meta = { page: 1, pageSize: 20, total: 3, totalPages: 1 };

  it('groups a batch, shows before/after and the load, and decides the batch together', async () => {
    const batch = (id: string, name: string) =>
      request({
        id,
        batchId: 'batch-1',
        student: person(id, name),
        currentStep: 'kadep',
        steps: request().steps.map((step) => (step.key === 'kadep' ? step : { ...step, status: 'approved' as const })),
        newSupervisorLoad: { activeCount: 3, quotaMax: 10, isFull: false },
      });
    vi.mocked(service.getDepartmentChangeRequests).mockResolvedValue({
      data: [batch('a', 'MAHASISWA SATU'), batch('b', 'MAHASISWA DUA'), request({ id: 'solo', requestType: 'title', supervisor: null, title: { previous: 'Judul Lama', next: 'Judul Baru', newTopic: null }, currentStep: 'main_supervisor' })],
      meta,
    });
    vi.mocked(service.decideBatchAsKadep).mockResolvedValue({ success: true, message: '2 pengajuan disetujui', data: { batchId: 'batch-1', decided: 2, failed: 0, results: [] } });
    wrap(<KadepThesisChangeRequestPanel />);

    expect(await screen.findByText('Alihkan Mahasiswa')).toBeInTheDocument();
    expect(screen.getByText(/2 mahasiswa · Husnil Kamil → Aina Hubby/)).toBeInTheDocument();
    expect(screen.getAllByText(/Beban bimbingan Aina Hubby saat ini: 3 dari 10 mahasiswa\./)).toHaveLength(2);
    expect(screen.getByText('Judul Baru')).toBeInTheDocument();
    // The request whose lecturer step is still open can be decided directly, with a reason.
    expect(screen.getByText(/Langkah dosen belum selesai\. Anda tetap dapat memutuskan langsung dengan alasan\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Setujui Semua' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Setujui 2 pengajuan?')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideBatchAsKadep).toHaveBeenCalledWith('batch-1', { approve: true, notes: null }));
  });

  it('requires a reason to approve directly while a lecturer step is open', async () => {
    vi.mocked(service.getDepartmentChangeRequests).mockResolvedValue({ data: [request()], meta: { ...meta, total: 1 } });
    vi.mocked(service.decideAsKadep).mockResolvedValue({ success: true, message: 'ok', data: request({ status: 'approved' }) });
    wrap(<KadepThesisChangeRequestPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Setujui' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Langkah dosen belum selesai: alasan memutuskan langsung wajib diisi.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Setujui' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Alasan'), { target: { value: 'Pembimbing lama sudah tidak aktif.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideAsKadep).toHaveBeenCalledWith('req-1', { approve: true, notes: 'Pembimbing lama sudah tidak aktif.' }));
  });

  it('reads the history tab without decision buttons', async () => {
    vi.mocked(service.getDepartmentChangeRequests).mockResolvedValue({ data: [], meta: { ...meta, total: 0 } });
    wrap(<KadepThesisChangeRequestPanel />);
    expect(await screen.findByText('Tidak ada pengajuan perubahan yang menunggu keputusan.')).toBeInTheDocument();

    vi.mocked(service.getDepartmentChangeRequests).mockResolvedValue({ data: [request({ status: 'rejected', currentStep: null })], meta: { ...meta, total: 1 } });
    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(await screen.findByText('Ditolak')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Setujui' })).not.toBeInTheDocument();
    expect(vi.mocked(service.getDepartmentChangeRequests).mock.calls.at(-1)?.[0]).toMatchObject({ scope: 'history' });
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
