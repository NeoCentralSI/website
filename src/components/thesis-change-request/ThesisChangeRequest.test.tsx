import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as service from '@/services/thesis-change-request/thesis-change-request.service';
import type { ThesisChangeContext, ThesisChangeRequest, ThesisChangeRequestRow } from '@/types/thesis-change-request.types';
import { LecturerTransferStudentsDialog, toTransferStudents } from './LecturerTransferStudentsDialog';
import { ThesisChangeRequestCard } from './ThesisChangeRequestCard';
import { ThesisChangeRequestTable } from './ThesisChangeRequestTable';
import { ThesisChangeRequestMiniTable } from './ThesisChangeRequestViews';
import { expectColumnFits } from '@/test/columnFit';
import { groupByBatch, summarizeChange } from './thesisChangeRequestGroups';

vi.mock('lottie-react', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/topic.service', () => ({ getTopics: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/thesis-change-request/thesis-change-request.service', () => ({
  getThesisChangeContext: vi.fn(),
  getSupervisorOptions: vi.fn(),
  submitChangeRequest: vi.fn(),
  submitTransfer: vi.fn(),
  decideAsLecturer: vi.fn(),
  cancelChangeRequest: vi.fn(),
  getChangeRequestInbox: vi.fn(),
  decideAsKadep: vi.fn(),
  decideBatchAsKadep: vi.fn(),
}));

// cmdk (the searchable lecturer picker) needs ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

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
    { id: 'l1', name: 'HUSNIL KAMIL', identityNumber: '198001', positions: ['pembimbing_1', 'pembimbing_2'], load: { activeCount: 31, quotaMax: 10, isFull: true } },
    { id: 'l2', name: 'AFRIYANTI', identityNumber: '198002', positions: ['pembimbing_1', 'pembimbing_2'], load: { activeCount: 6, quotaMax: 10, isFull: false } },
    { id: 'l3', name: 'AINA HUBBY', identityNumber: '198003', positions: ['pembimbing_1', 'pembimbing_2'], load: { activeCount: 9, quotaMax: 10, isFull: false } },
    { id: 'l4', name: 'ULLYA MEGA', identityNumber: '198004', positions: ['pembimbing_2'], load: { activeCount: 7, quotaMax: 10, isFull: false } },
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

  it('K34 (Paket E6): a kind the rules block is disabled with its reason', async () => {
    const supervisorReason = 'Perubahan pembimbing hanya dapat diajukan sampai sebelum pendaftaran seminar hasil. Tugas akhir ini sudah terdaftar atau lulus seminar hasil.';
    vi.mocked(service.getThesisChangeContext).mockResolvedValue(context({
      viewerRole: 'pembimbing_1',
      typeBlocks: { title: null, supervisor: supervisorReason, both: supervisorReason },
    }));
    wrap(<ThesisChangeRequestCard thesisId="t1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Ajukan Perubahan/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(`Pembimbing tidak tersedia: ${supervisorReason}`)).toBeInTheDocument();
    expect(within(dialog).getByText(`Judul dan Pembimbing tidak tersedia: ${supervisorReason}`)).toBeInTheDocument();
    fireEvent.keyDown(within(dialog).getByRole('combobox', { name: 'Jenis perubahan' }), { key: 'ArrowDown' });
    expect(await screen.findByRole('option', { name: 'Pembimbing' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Judul' })).not.toHaveAttribute('aria-disabled', 'true');
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

/** Radix menus open on pointer down in jsdom. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
}

describe('Tugas Akhir > Perubahan (Ketua Departemen, Paket E5, 3.2)', () => {
  const meta = (total: number, page = 1, pageSize = 10) => ({ page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
  const counts = { awaitingDecision: 1, inProgress: 0 };
  const row = (overrides: Partial<ThesisChangeRequestRow> = {}): ThesisChangeRequestRow => ({ ...request(), viewStatus: 'in_progress', ...overrides });
  const inbox = (data: ThesisChangeRequestRow[], total = data.length) => ({ data, meta: meta(total), counts });
  const atKadep = (overrides: Partial<ThesisChangeRequestRow> = {}) =>
    row({
      currentStep: 'kadep',
      viewStatus: 'awaiting_decision',
      steps: request().steps.map((step) => (step.key === 'kadep' ? step : { ...step, status: 'approved' as const })),
      ...overrides,
    });

  it('summarizes before and after in one line', () => {
    expect(summarizeChange(request(), (name) => name ?? '')).toBe('Pembimbing 1: HUSNIL KAMIL → AINA HUBBY');
    expect(summarizeChange(request({ supervisor: null, requestType: 'title', title: { previous: 'Lama', next: 'Baru', newTopic: null } }), (n) => n ?? '')).toBe('Lama → Baru');
  });

  it('"Semua" by default in the server order; Status and Jenis are filtered in the column header', async () => {
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox([atKadep(), row({ id: 'req-2' })]));
    wrap(<ThesisChangeRequestTable />);

    await screen.findAllByText('Ilham Nofaldi');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(service.getChangeRequestInbox).toHaveBeenCalledWith({ status: undefined, kind: undefined, search: undefined, page: 1, pageSize: 10 });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual([
      'Mahasiswa dan Perubahan', 'Jenis', 'Langkah Berjalan', 'Tanggal', 'Status', 'Aksi',
    ]);
    // The viewer's own status is a label of its own, at the top (1.5); the summary sits under the name (1.2).
    expect(within(rows[1]).getByText('Menunggu Keputusan Anda')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Pembimbing 1: Husnil Kamil → Aina Hubby')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Sedang Berjalan')).toBeInTheDocument();
    // No dropdown filter above the table (the only select left is the page size).
    expect(screen.queryByRole('combobox', { name: /Filter/ })).not.toBeInTheDocument();

    openMenu(within(screen.getByRole('columnheader', { name: /Status/ })).getByRole('button'));
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'Semua', 'Menunggu Keputusan Anda', 'Sedang Berjalan', 'Disetujui', 'Ditolak', 'Dibatalkan',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sedang Berjalan' }));
    await waitFor(() => expect(service.getChangeRequestInbox).toHaveBeenLastCalledWith({ status: 'in_progress', kind: undefined, search: undefined, page: 1, pageSize: 10 }));

    openMenu(within(screen.getByRole('columnheader', { name: /Jenis/ })).getByRole('button'));
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual(['Semua', 'Judul', 'Pembimbing', 'Judul dan Pembimbing', 'Alihkan']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Alihkan' }));
    await waitFor(() => expect(service.getChangeRequestInbox).toHaveBeenLastCalledWith({ status: 'in_progress', kind: 'transfer', search: undefined, page: 1, pageSize: 10 }));

    fireEvent.change(screen.getByPlaceholderText('Cari nama, NIM, atau judul...'), { target: { value: ' 2211522 ' } });
    await waitFor(() => expect(service.getChangeRequestInbox).toHaveBeenLastCalledWith({ status: 'in_progress', kind: 'transfer', search: '2211522', page: 1, pageSize: 10 }));
  });

  it('Paket E6 (1): the longest jenis, status and date stay inside their cells', async () => {
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox([atKadep({ requestType: 'both', createdAt: '2026-09-30T03:00:00.000Z' })]));
    wrap(<ThesisChangeRequestTable />);
    await screen.findByText('Ilham Nofaldi');
    const table = screen.getByRole('table');
    const header = (name: string) => within(table).getByRole('columnheader', { name: new RegExp(`^${name}`) });
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    expectColumnFits(header('Jenis'), cells[1], 'Judul dan Pembimbing');
    expectColumnFits(header('Tanggal'), cells[3], '30 September 2026');
    expectColumnFits(header('Status'), cells[4], 'Menunggu Keputusan Anda');
  });

  it('Paket E6 (6): a request the rules block now is marked, and Setujui waits with the reason', async () => {
    const reason = 'Pengajuan ini tidak dapat disetujui saat ini. Perubahan judul tidak dapat diajukan selama seminar hasil sedang berproses. Pengajuan tetap menunggu dan dapat ditolak.';
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox([atKadep({ applyBlockReason: reason })]));
    wrap(<ThesisChangeRequestTable />);
    const tableRow = (await screen.findByText('Ilham Nofaldi')).closest('tr')!;
    expect(within(tableRow).getByText('Terblokir')).toHaveAttribute('title', reason);
    const approve = within(tableRow).getByRole('button', { name: 'Setujui' });
    expect(approve).toBeDisabled();
    expect(approve.parentElement).toHaveAttribute('title', `Setujui: ${reason}`);
    // Rejecting stays possible.
    expect(within(tableRow).getByRole('button', { name: 'Tolak' })).toBeEnabled();
  });

  it('pages past the first hundred rows: page 11 of 150 shows rows 101-110', async () => {
    const rows = Array.from({ length: 150 }, (_, i) => row({ id: `req-${i + 1}`, student: person(`s${i + 1}`, `MAHASISWA ${i + 1}`) }));
    vi.mocked(service.getChangeRequestInbox).mockImplementation(async ({ page = 1, pageSize = 10 }) => ({
      data: rows.slice((page - 1) * pageSize, page * pageSize),
      meta: meta(150, page, pageSize),
      counts,
    }));
    wrap(<ThesisChangeRequestTable />);

    expect(await screen.findByText('Menampilkan 1-10 dari 150')).toBeInTheDocument();
    for (let next = 2; next <= 11; next += 1) {
      fireEvent.click(screen.getByRole('link', { name: 'Go to next page' }));
      await screen.findByText(`Menampilkan ${(next - 1) * 10 + 1}-${next * 10} dari 150`);
    }
    expect(screen.getByText('Mahasiswa 101')).toBeInTheDocument();
    expect(screen.getByText('Mahasiswa 110')).toBeInTheDocument();
    expect(screen.queryByText('Mahasiswa 100')).not.toBeInTheDocument();
    expect(vi.mocked(service.getChangeRequestInbox).mock.calls.at(-1)?.[0]).toMatchObject({ page: 11, pageSize: 10 });
  });

  it('approves or rejects with icons once every lecturer step is done; rejecting needs a reason', async () => {
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox([atKadep()]));
    vi.mocked(service.decideAsKadep).mockResolvedValue({ success: true, message: 'Pengajuan ditolak', data: request({ status: 'rejected' }) });
    wrap(<ThesisChangeRequestTable />);

    const tableRow = (await screen.findByText('Ilham Nofaldi')).closest('tr')!;
    expect(within(tableRow).getByRole('button', { name: 'Lihat Detail' })).toBeInTheDocument();
    // Approve is green, as on the reference table (1.1).
    expect(within(tableRow).getByRole('button', { name: 'Setujui' }).className).toContain('text-emerald-600');
    fireEvent.click(within(tableRow).getByRole('button', { name: 'Tolak' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tolak pengajuan?' });
    expect(within(dialog).getByRole('button', { name: 'Tolak' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Alasan penolakan'), { target: { value: 'Tidak sesuai aturan' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    await waitFor(() => expect(service.decideAsKadep).toHaveBeenCalledWith('req-1', { approve: false, notes: 'Tidak sesuai aturan' }));
  });

  it('decides an Alihkan batch together from its group modal, read from the server', async () => {
    const batch = (id: string, name: string) =>
      atKadep({ id, batchId: 'batch-1', student: person(id, name), newSupervisorLoad: { activeCount: 3, quotaMax: 10, isFull: false } });
    const rows = [batch('a', 'MAHASISWA SATU'), batch('b', 'MAHASISWA DUA')];
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox(rows));
    vi.mocked(service.decideBatchAsKadep).mockResolvedValue({ success: true, message: '2 pengajuan disetujui', data: { batchId: 'batch-1', decided: 2, failed: 0, results: [] } });
    wrap(<ThesisChangeRequestTable />);

    expect(await screen.findByText('Mahasiswa Satu')).toBeInTheDocument();
    expect(screen.getAllByText('Alihkan')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Keputusan Kelompok' })[0]);
    const group = await screen.findByRole('dialog', { name: 'Kelompok Alihkan Mahasiswa' });
    await waitFor(() => expect(service.getChangeRequestInbox).toHaveBeenCalledWith({ batchId: 'batch-1', pageSize: 100 }));
    expect(await within(group).findByText(/2 mahasiswa · Husnil Kamil → Aina Hubby/)).toBeInTheDocument();
    expect(within(group).getByText(/Beban bimbingan Aina Hubby saat ini: 3 dari 10 mahasiswa\./)).toBeInTheDocument();
    fireEvent.click(within(group).getByRole('button', { name: 'Setujui Semua' }));
    const confirm = await screen.findByRole('dialog', { name: 'Setujui 2 pengajuan?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Setujui' }));
    await waitFor(() => expect(service.decideBatchAsKadep).toHaveBeenCalledWith('batch-1', { approve: true, notes: null }));
  });

  it('decides directly with a reason while a lecturer step is open (Putuskan Langsung)', async () => {
    vi.mocked(service.getChangeRequestInbox).mockResolvedValue(inbox([row()]));
    vi.mocked(service.decideAsKadep).mockResolvedValue({ success: true, message: 'ok', data: request({ status: 'approved' }) });
    wrap(<ThesisChangeRequestTable />);

    const tableRow = (await screen.findByText('Ilham Nofaldi')).closest('tr')!;
    expect(within(tableRow).queryByRole('button', { name: 'Setujui' })).not.toBeInTheDocument();
    fireEvent.click(within(tableRow).getByRole('button', { name: 'Putuskan Langsung' }));
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

describe('LecturerTransferStudentsDialog (Paket E5, 3.3: the students ticked in Mahasiswa Bimbingan)', () => {
  it('lists the ticked students, offers only lecturers who may hold the position, and sends one request for all', async () => {
    vi.mocked(service.submitTransfer).mockResolvedValue({ success: true, message: 'ok', data: { batchId: 'b1', requests: [] } });
    const onSuccess = vi.fn();
    const students = toTransferStudents([
      { studentId: 's1', thesisId: 't1', fullName: 'ILHAM NOFALDI', identityNumber: '2211522028', roles: ['Pembimbing 1'], changeRequest: { hasOpenRequest: false, canSubmit: true, blockReason: null, canTransfer: true, transferBlockReason: null } },
      { studentId: 's2', thesisId: 't2', fullName: 'NABIL RIZKI', identityNumber: '2211522018', roles: ['Pembimbing 1'], changeRequest: { hasOpenRequest: false, canSubmit: true, blockReason: null, canTransfer: true, transferBlockReason: null } },
      { studentId: 's3', thesisId: 't3', fullName: 'MAHASISWA PROPOSAL', identityNumber: '2211522099', roles: ['Pembimbing 1'], changeRequest: { hasOpenRequest: false, canSubmit: false, blockReason: 'x', canTransfer: false, transferBlockReason: 'x' } },
    ]);
    wrap(<LecturerTransferStudentsDialog open onOpenChange={() => {}} students={students} currentLecturerId="l1" onSuccess={onSuccess} />);

    expect(await screen.findByText('Mahasiswa yang dialihkan (2)')).toBeInTheDocument();
    expect(screen.getByText(/Ilham Nofaldi/)).toBeInTheDocument();
    expect(screen.queryByText(/Mahasiswa Proposal/)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Hanya dosen yang memiliki peran Pembimbing 1 yang ditampilkan/)).toBeInTheDocument();

    // Paket E6 (4): a searchable picker (name or NIP) with each lecturer's load at the right.
    fireEvent.click(await screen.findByRole('combobox', { name: 'Dosen tujuan' }));
    const options = (await screen.findAllByRole('option')).map((option) => option.textContent);
    // Not the lecturer themselves, and not a lecturer without the Pembimbing 1 role.
    expect(options).toEqual(['Afriyanti6/10', 'Aina Hubby9/10']);
    fireEvent.change(screen.getByPlaceholderText('Cari nama atau NIP...'), { target: { value: '198003' } });
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    fireEvent.click(screen.getByRole('option', { name: /^Aina Hubby/ }));
    expect(screen.getByRole('combobox', { name: 'Dosen tujuan' })).toHaveTextContent('Aina Hubby');

    fireEvent.change(screen.getByLabelText('Alasan pengalihan'), { target: { value: 'Penugasan studi lanjut.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan Pengalihan' }));
    await waitFor(() =>
      expect(service.submitTransfer).toHaveBeenCalledWith({ thesisIds: ['t1', 't2'], newSupervisorId: 'l3', reason: 'Penugasan studi lanjut.' }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe('ThesisChangeRequestMiniTable (Paket E5, 1.1 and 1.2)', () => {
  it('shows a two-line date, nowrap badges and the detail as an icon', () => {
    const onDetail = vi.fn();
    wrap(<ThesisChangeRequestMiniTable requests={[request({ status: 'approved' })]} onDetail={onDetail} />);

    const table = screen.getByRole('table');
    expect(table.className).toContain('table-fixed');
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    expect(within(cells[0]).getByText('9 Oktober 2026')).toBeInTheDocument();
    // Paket E6 (1): jenis and status stacked in one column as wide as the longest badge.
    expect(within(cells[1]).getByText('Disetujui').className).toContain('whitespace-nowrap');
    fireEvent.click(within(cells[2]).getByRole('button', { name: 'Lihat Detail' }));
    expect(onDetail).toHaveBeenCalled();
  });

  it('Paket E6 (1): the longest badge and date stay inside their cells', () => {
    wrap(<ThesisChangeRequestMiniTable requests={[request({ requestType: 'both', createdAt: '2026-09-30T03:00:00.000Z' })]} onDetail={() => {}} />);
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    expectColumnFits(headers[0], cells[0], '30 September 2026');
    expectColumnFits(headers[1], cells[1], 'Menunggu Persetujuan');
    expectColumnFits(headers[1], cells[1], 'Judul dan Pembimbing');
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
