import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getThesisEventMonitoring,
  type MonitoringEvent,
  type MonitoringEventAttention,
  type ThesisEventMonitoring,
} from "@/services/monitoring.service";
import { ThesisEventMonitoringTab } from "./thesis-event-monitoring-tab";

const role = vi.hoisted(() => ({ isAdmin: false, isDosen: true }));

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/hooks/shared/useRole", () => ({ useRole: () => ({ isAdmin: () => role.isAdmin, isDosen: () => role.isDosen }) }));
vi.mock("@/services/monitoring.service", () => ({ getThesisEventMonitoring: vi.fn() }));

let sequence = 0;
const event = (status: string, overrides: Partial<MonitoringEvent> = {}): MonitoringEvent => {
  sequence += 1;
  return {
    id: `event-${sequence}`,
    thesisId: `thesis-${sequence}`,
    title: `Judul Tugas Akhir ${sequence}`,
    student: { name: `MAHASISWA NOMOR ${sequence}`, nim: `20110000${String(sequence).padStart(2, "0")}` },
    status,
    date: null,
    startTime: null,
    endTime: null,
    room: null,
    examiners: [],
    finalScore: null,
    registeredAt: "2026-10-11T03:00:00.000Z",
    resultFinalizedAt: null,
    revisionFinalizedAt: null,
    ...overrides,
  };
};

const attention = (
  base: MonitoringEvent,
  reason: MonitoringEventAttention["attention"]["reason"],
  reasonLabel: string,
  days: number,
): MonitoringEventAttention => ({ ...base, attention: { reason, reasonLabel, since: "2026-09-01T00:00:00.000Z", days } });

const scheduledNextWeek = (overrides: Partial<MonitoringEvent> = {}) =>
  event("scheduled", {
    id: "sem-terjadwal",
    title: "Sistem Informasi Pengelolaan Jurnal Departemen",
    student: { name: "UJI MON SEMINAR TERJADWAL", nim: "2211529105" },
    date: "2026-10-20T00:00:00.000Z",
    startTime: "1970-01-01T09:00:00.000Z",
    endTime: "1970-01-01T11:00:00.000Z",
    room: "Ruang Seminar SI",
    examiners: [{ order: 1, name: "FAJRIL AKBAR" }, { order: 2, name: "HARIS SURYAMEN" }],
    ...overrides,
  });

function seminarData(): ThesisEventMonitoring {
  sequence = 0;
  const upcoming = scheduledNextWeek();
  const waitingVerification = event("registered", { id: "sem-verif", student: { name: "UJI MON SEMINAR VERIFIKASI LAMA", nim: "2211529102" } });
  const unscheduled = event("examiner_assigned", { id: "sem-jadwal" });
  const resultPending = event("scheduled", { id: "sem-hasil", date: "2026-10-08T00:00:00.000Z", startTime: "1970-01-01T13:30:00.000Z", endTime: "1970-01-01T15:30:00.000Z" });
  const revisionPending = event("passed_with_revision", { id: "sem-revisi", date: "2026-09-03T00:00:00.000Z", finalScore: 76 });
  const passed = event("passed", { id: "sem-lulus", date: "2026-09-23T00:00:00.000Z", finalScore: 82.5, student: { name: "UJI MON SEMINAR LULUS", nim: "2211529107" } });
  const failed = event("failed", { id: "sem-gagal", date: "2026-09-18T00:00:00.000Z", finalScore: 48 });
  const cancelled = event("cancelled", { id: "sem-batal" });
  return {
    kind: "seminar",
    summary: { total: 8, inProcess: 2, scheduled: 2, passed: 2, revisionPending: 1, notPassed: 2 },
    readyToRegister: [
      {
        thesisId: "thesis-siap",
        title: "Sistem Informasi Pengelolaan Kerja Praktik Terpadu",
        student: { name: "UJI MON SIAP DAFTAR SEMINAR", nim: "2211529141" },
        supervisors: [{ name: "Hafzatin Nurlatifa", role: "Pembimbing 1" }],
      },
    ],
    upcoming: [upcoming],
    upcomingTotal: 1,
    attention: [
      attention(revisionPending, "revision", "Revisi belum selesai", 40),
      attention(unscheduled, "scheduling", "Belum dijadwalkan", 20),
      attention(waitingVerification, "document_verification", "Menunggu verifikasi dokumen", 10),
      attention(resultPending, "result_finalization", "Hasil belum difinalkan", 5),
    ],
    items: [upcoming, waitingVerification, unscheduled, resultPending, passed, failed, revisionPending, cancelled],
  };
}

function renderTab(props: Partial<Parameters<typeof ThesisEventMonitoringTab>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ThesisEventMonitoringTab kind="seminar" academicYear="ay-now" enabled {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The card (title, description and list) that carries a heading. */
const card = (title: string) => screen.getByText(title).closest('[data-slot="card"]') as HTMLElement;
const summary = (title: string) => screen.getByTestId(`summary-${title}`);

beforeEach(() => {
  vi.clearAllMocks();
  role.isAdmin = false;
  role.isDosen = true;
  vi.mocked(getThesisEventMonitoring).mockResolvedValue(seminarData());
});

describe("ThesisEventMonitoringTab — Seminar Hasil", () => {
  it("asks for the seminars of the chosen semester, once it is known", async () => {
    const view = renderTab({ enabled: false });
    expect(getThesisEventMonitoring).not.toHaveBeenCalled();
    view.unmount();

    renderTab();
    await screen.findByText("Uji Mon Siap Daftar Seminar");
    expect(getThesisEventMonitoring).toHaveBeenCalledTimes(1);
    expect(getThesisEventMonitoring).toHaveBeenCalledWith("seminar", "ay-now");
  });

  it("shows the five summary cards, without an average score", async () => {
    renderTab();
    await screen.findByText("Uji Mon Siap Daftar Seminar");

    expect(summary("Dalam Proses")).toHaveTextContent(/^2$/);
    expect(summary("Terjadwal")).toHaveTextContent(/^2$/);
    expect(summary("Lulus")).toHaveTextContent(/^2$/);
    expect(summary("Revisi Belum Final")).toHaveTextContent(/^1$/);
    expect(summary("Tidak Lulus / Dibatalkan")).toHaveTextContent(/^2$/);
    expect(screen.queryByText("Rata-rata Nilai Akhir")).not.toBeInTheDocument();
  });

  it("lists the students ready to register with name, NIM and title", async () => {
    renderTab();
    const ready = within(card("Siap Mendaftar"));

    expect(await ready.findByText("Uji Mon Siap Daftar Seminar")).toBeInTheDocument();
    expect(ready.getByText("2211529141")).toBeInTheDocument();
    expect(ready.getByText("Sistem Informasi Pengelolaan Kerja Praktik Terpadu")).toBeInTheDocument();
    expect(ready.getByText("Acc Seminar")).toBeInTheDocument();
    expect(ready.getByText(/menyetujui kesiapan seminar hasil/)).toBeInTheDocument();
  });

  it("shows the coming schedule with date, time, room, student, title and examiners", async () => {
    renderTab();
    const upcoming = within(card("Jadwal Mendatang"));

    expect(await upcoming.findByText("20 Oktober 2026")).toBeInTheDocument();
    expect(upcoming.getByText("09.00 – 11.00 WIB")).toBeInTheDocument();
    expect(upcoming.getByText("Ruang Seminar SI")).toBeInTheDocument();
    expect(upcoming.getByText("Uji Mon Seminar Terjadwal")).toBeInTheDocument();
    expect(upcoming.getByText("(2211529105)")).toBeInTheDocument();
    expect(upcoming.getByText("Sistem Informasi Pengelolaan Jurnal Departemen")).toHaveClass("truncate");
    expect(upcoming.getByText("Penguji: Fajril Akbar, Haris Suryamen")).toBeInTheDocument();
    // One schedule, one row: nothing is said about a remainder.
    expect(upcoming.queryByText(/jadwal terdekat/)).not.toBeInTheDocument();
  });

  it("says how many schedules there are when only the nearest ten are listed", async () => {
    const data = seminarData();
    data.upcoming = Array.from({ length: 10 }, (_, index) => scheduledNextWeek({ id: `up-${index}` }));
    data.upcomingTotal = 13;
    vi.mocked(getThesisEventMonitoring).mockResolvedValue(data);
    renderTab();
    const upcoming = within(card("Jadwal Mendatang"));

    expect(await upcoming.findByText("Menampilkan 10 jadwal terdekat dari 13. Sisanya ada di tabel di bawah.")).toBeInTheDocument();
    expect(upcoming.getByText("13")).toBeInTheDocument();
  });

  it("gives every row of Perlu Perhatian its reason and how long it has waited", async () => {
    renderTab();
    const list = within(card("Perlu Perhatian"));
    await list.findByText("Revisi belum selesai");

    const rows = list.getAllByRole("listitem");
    expect(rows.map((row) => within(row).getByText(/hari sejak/).textContent)).toEqual([
      "40 hari sejak hasil difinalkan",
      "20 hari sejak diverifikasi",
      "10 hari sejak mendaftar",
      "5 hari sejak pelaksanaan",
    ]);
    expect(within(rows[1]).getByText("Belum dijadwalkan")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Menunggu verifikasi dokumen")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Uji Mon Seminar Verifikasi Lama")).toBeInTheDocument();
    expect(within(rows[3]).getByText("Hasil belum difinalkan")).toBeInTheDocument();
    // The reason code of the server never reaches the screen.
    expect(screen.queryByText(/document_verification|result_finalization/)).not.toBeInTheDocument();
  });

  it("lists every seminar in the table with the status labels of the seminar module", async () => {
    renderTab();
    const table = await screen.findByRole("table");
    await within(table).findByText("Uji Mon Seminar Lulus");

    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent?.trim())).toEqual([
      "Mahasiswa", "Judul", "Status", "Tanggal Pelaksanaan", "Nilai Akhir", "Aksi",
    ]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(8);

    // Scheduled next week: label of the shared badge, date and time, no score yet.
    expect(within(rows[0]).getByText("Terjadwalkan")).toBeInTheDocument();
    expect(within(rows[0]).getByText("20 Oktober 2026")).toBeInTheDocument();
    expect(within(rows[0]).getByText("09.00 – 11.00 WIB")).toBeInTheDocument();
    expect(within(rows[0]).getAllByRole("cell")[4]).toHaveTextContent(/^-$/);
    // A registration without a schedule.
    expect(within(rows[1]).getByText("Menunggu Verifikasi")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Belum dijadwalkan")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Menunggu Jadwal")).toBeInTheDocument();
    // Held five days ago and not final: the table shows the stored status.
    expect(within(rows[3]).getByText("Terjadwalkan")).toBeInTheDocument();
    expect(within(rows[4]).getByText("Lulus")).toBeInTheDocument();
    expect(within(rows[4]).getAllByRole("cell")[4]).toHaveTextContent("82,5");
    expect(within(rows[5]).getByText("Tidak Lulus")).toBeInTheDocument();
    expect(within(rows[6]).getByText("Lulus dengan Revisi")).toBeInTheDocument();
    expect(within(rows[7]).getByText("Dibatalkan")).toBeInTheDocument();
    for (const raw of ["registered", "examiner_assigned", "scheduled", "passed_with_revision", "cancelled"]) {
      expect(within(table).queryByText(raw)).not.toBeInTheDocument();
    }

    expect(within(rows[4]).getByRole("link", { name: /Lihat detail/ })).toHaveAttribute("href", "/tugas-akhir/seminar-hasil/sem-lulus");
  });

  it("searches the table by name or NIM and filters it by status, in the browser", async () => {
    renderTab();
    const table = await screen.findByRole("table");
    await within(table).findByText("Uji Mon Seminar Lulus");
    const bodyRows = () => within(table).getAllByRole("row").slice(1);

    fireEvent.change(screen.getByPlaceholderText("Cari nama atau NIM..."), { target: { value: "2211529107" } });
    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(within(bodyRows()[0]).getByText("Uji Mon Seminar Lulus")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Cari nama atau NIM..."), { target: { value: "terjadwal" } });
    await waitFor(() => expect(within(bodyRows()[0]).getByText("Uji Mon Seminar Terjadwal")).toBeInTheDocument());
    expect(bodyRows()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    await waitFor(() => expect(bodyRows()).toHaveLength(8));

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Filter status" }), { key: "ArrowDown" });
    // The options carry the labels of the shared badge.
    expect(await screen.findByRole("option", { name: "Menunggu Penetapan Penguji" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Terjadwalkan" }));
    await waitFor(() => expect(bodyRows()).toHaveLength(2));
    expect(getThesisEventMonitoring).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText("Cari nama atau NIM..."), { target: { value: "tidak ada" } });
    expect(await screen.findByText("Tidak ada seminar hasil yang cocok dengan pencarian atau filter.")).toBeInTheDocument();
  });

  it("has no detail link for a viewer who may not open the seminar page", async () => {
    role.isDosen = false;
    renderTab();
    const table = await screen.findByRole("table");
    await within(table).findByText("Uji Mon Seminar Lulus");

    expect(screen.queryByRole("link", { name: /Lihat detail/ })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Aksi" })).not.toBeInTheDocument();
  });

  it("shows an empty state in every block when the semester has no seminar", async () => {
    vi.mocked(getThesisEventMonitoring).mockResolvedValue({
      kind: "seminar",
      summary: { total: 0, inProcess: 0, scheduled: 0, passed: 0, revisionPending: 0, notPassed: 0 },
      readyToRegister: [],
      upcoming: [],
      upcomingTotal: 0,
      attention: [],
      items: [],
    });
    renderTab();

    expect(await screen.findByText("Belum ada mahasiswa yang siap mendaftar seminar hasil.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada seminar hasil yang terjadwal ke depan.")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada seminar hasil yang perlu perhatian.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada seminar hasil pada semester ini.")).toBeInTheDocument();
    expect(summary("Dalam Proses")).toHaveTextContent(/^0$/);
  });

  it("says so when the data cannot be read, and tries again on request", async () => {
    vi.mocked(getThesisEventMonitoring).mockRejectedValueOnce(new Error("Gagal mengambil data seminar hasil"));
    renderTab();

    expect(await screen.findByText("Gagal Memuat Data")).toBeInTheDocument();
    expect(screen.getByText("Gagal mengambil data seminar hasil")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Coba Lagi/ }));
    expect(await screen.findByText("Uji Mon Siap Daftar Seminar")).toBeInTheDocument();
  });
});

describe("ThesisEventMonitoringTab — Sidang", () => {
  function defenceData(overrides: Partial<ThesisEventMonitoring> = {}): ThesisEventMonitoring {
    sequence = 0;
    const passed = event("passed", { id: "sid-lulus", date: "2026-09-28T00:00:00.000Z", finalScore: 84, grade: "A", student: { name: "UJI MON SIDANG LULUS", nim: "2211529127" } });
    const revision = event("passed_with_revision", { id: "sid-revisi", date: "2026-08-29T00:00:00.000Z", finalScore: 78, grade: "B+" });
    const registered = event("registered", { id: "sid-daftar", grade: null });
    return {
      kind: "defence",
      summary: { total: 3, inProcess: 1, scheduled: 0, passed: 2, revisionPending: 1, notPassed: 0, averageFinalScore: 80.67 },
      readyToRegister: [
        { thesisId: "thesis-siap", title: "Aplikasi Pengelolaan Sertifikat Kompetensi", student: { name: "UJI MON SIAP DAFTAR SIDANG", nim: "2211529142" }, supervisors: [] },
      ],
      upcoming: [],
      upcomingTotal: 0,
      attention: [],
      items: [passed, revision, registered],
      ...overrides,
    };
  }

  it("asks for the defences and adds the average final score card", async () => {
    vi.mocked(getThesisEventMonitoring).mockResolvedValue(defenceData());
    renderTab({ kind: "defence", academicYear: undefined });
    await screen.findByText("Uji Mon Siap Daftar Sidang");

    expect(getThesisEventMonitoring).toHaveBeenCalledWith("defence", undefined);
    expect(summary("Rata-rata Nilai Akhir")).toHaveTextContent(/^80,67$/);
    expect(screen.getByText("Dari sidang yang sudah lulus")).toBeInTheDocument();
    expect(summary("Lulus")).toHaveTextContent(/^2$/);
    expect(within(card("Siap Mendaftar")).getByText("Acc Sidang")).toBeInTheDocument();
    expect(screen.getByText("Belum ada sidang yang terjadwal ke depan.")).toBeInTheDocument();
  });

  it("shows a dash while no defence has passed with a score", async () => {
    vi.mocked(getThesisEventMonitoring).mockResolvedValue(defenceData({
      summary: { total: 1, inProcess: 1, scheduled: 0, passed: 0, revisionPending: 0, notPassed: 0, averageFinalScore: null },
    }));
    renderTab({ kind: "defence" });
    await screen.findByText("Uji Mon Siap Daftar Sidang");

    expect(summary("Rata-rata Nilai Akhir")).toHaveTextContent(/^-$/);
  });

  it("shows the grade beside the final score and links to the defence page", async () => {
    vi.mocked(getThesisEventMonitoring).mockResolvedValue(defenceData());
    renderTab({ kind: "defence" });
    const table = await screen.findByRole("table");
    await within(table).findByText("Uji Mon Sidang Lulus");
    const rows = within(table).getAllByRole("row").slice(1);

    expect(within(rows[0]).getAllByRole("cell")[4]).toHaveTextContent("84 (A)");
    expect(within(rows[1]).getAllByRole("cell")[4]).toHaveTextContent("78 (B+)");
    expect(within(rows[2]).getAllByRole("cell")[4]).toHaveTextContent(/^-$/);
    expect(within(rows[0]).getByRole("link", { name: /Lihat detail/ })).toHaveAttribute("href", "/tugas-akhir/sidang/sid-lulus");
  });
});
