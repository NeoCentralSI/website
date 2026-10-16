import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyStudents, type MyStudentItem } from "@/services/lecturerGuidance.service";
import { MEASURED_MIN_WIDTH } from "@/test/columnFit";
import LecturerMyStudentsPage from "./MyStudents";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/services/lecturerGuidance.service", () => ({ getMyStudents: vi.fn(), sendWarningToStudent: vi.fn() }));
// The summary charts have their own tests.
vi.mock("@/components/bimbingan/MyStudentsCharts", () => ({ MyStudentsCharts: () => null }));
vi.mock("@/hooks/shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/shared")>()),
  useAuth: () => ({ user: { id: "lecturer-1" } }),
}));
// Paket E5: the dialogs the row actions open have their own tests; here they show what they got.
vi.mock("@/components/thesis-change-request/LecturerTransferStudentsDialog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/thesis-change-request/LecturerTransferStudentsDialog")>()),
  LecturerTransferStudentsDialog: ({ open, students }: { open: boolean; students: { name: string }[] }) =>
    open ? <div role="dialog" aria-label="Alihkan Mahasiswa">{students.map((student) => student.name).join(", ")}</div> : null,
}));
vi.mock("@/components/thesis-change-request/ThesisChangeRequestLaunchers", () => ({
  ThesisChangeRequestFormLauncher: ({ thesisId }: { thesisId: string }) => <div role="dialog">Formulir perubahan {thesisId}</div>,
  OpenThesisChangeRequestLauncher: ({ thesisId }: { thesisId: string }) => <div role="dialog">Pengajuan berjalan {thesisId}</div>,
}));
vi.mock("@/components/thesis-guidance-evaluation/EvaluationFormLauncher", () => ({
  EvaluationFormLauncher: ({ thesisId }: { thesisId: string }) => <div role="dialog">Formulir evaluasi {thesisId}</div>,
}));

const LONG_TITLE = "Rancang Bangun Sistem Informasi Monitoring Tugas Akhir Berbasis Web pada Departemen Sistem Informasi Universitas Andalas";

const row = (overrides: Partial<MyStudentItem> = {}): MyStudentItem => ({
  supervisorStatus: "active",
  studentId: "s1",
  fullName: "ILHAM NOFALDI",
  email: "ilham@example.test",
  identityNumber: "2211522028",
  thesisId: "t1",
  thesisTitle: LONG_TITLE,
  thesisStatus: "research",
  roles: ["pembimbing1"],
  activityLevel: "at_risk",
  supervisionClock: {
    startedAt: "2026-03-02T00:00:00.000Z", elapsedDays: 224, elapsedMonths: 7, elapsedLabel: "7 bulan 12 hari",
    sixMonthAt: null, oneYearAt: null, extensionUntil: null, evaluationDue: "six_month", isPaused: false,
  },
  latestMilestone: "Bab 3 Metodologi",
  totalMilestones: 5,
  completedMilestones: 2,
  milestoneProgress: 40,
  completedGuidanceCount: 6,
  lastGuidanceAt: "2026-09-14T07:00:00.000Z",
  changeRequest: { hasOpenRequest: false, canSubmit: true, blockReason: null, canTransfer: true, transferBlockReason: null },
  ...overrides,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/" element={<LecturerMyStudentsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LecturerMyStudentsPage table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyStudents).mockResolvedValue({ success: true, count: 1, students: [row()] });
  });

  it("has the columns of Paket E2 in a fixed layout, with the thesis title folded into Mahasiswa", async () => {
    renderPage();
    await screen.findByText("Ilham Nofaldi");

    // Paket E5 (3.3): the tick column for "Alihkan" is back, first.
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).toEqual(["", "Mahasiswa", "Milestone", "Bimbingan", "Masa Bimbingan", "Aktivitas", "Aksi"]);
    // Only "Mahasiswa" has no width: it takes what the other columns leave.
    const widths = screen.getAllByRole("columnheader").map((header) => (header as HTMLElement).style.width);
    // Paket E6 (1): Aksi fits four icons; the minimum width keeps Mahasiswa as wide as its
    // longest badge ("Berhenti Studi Sementara (BSS)", 229 px) beside the 782 px of fixed columns.
    expect(widths).toEqual(["44px", "", "140px", "140px", "170px", "124px", "164px"]);
    expect(screen.getByRole("table").className).toContain("table-fixed");
    expect(screen.getByRole("table").className).toContain("min-w-[1014px]");
    // The "Alihkan" button appears only once a student is ticked.
    expect(screen.queryByRole("button", { name: /Alihkan/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Permohonan Pembimbing")).not.toBeInTheDocument();
    expect(screen.queryByText("Pengajuan Perubahan")).not.toBeInTheDocument();
  });

  it("marks a replaced supervisor's student 'Tidak lagi membimbing', read-only (Paket E4, 1.1)", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({
      success: true,
      count: 1,
      students: [row({ supervisorStatus: "released", noLongerSupervising: true })],
    });
    renderPage();
    const tableRow = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;
    expect(within(tableRow).getByText("Tidak lagi membimbing")).toBeInTheDocument();
    expect(within(tableRow).queryByText("Kirim Peringatan")).not.toBeInTheDocument();
    expect(within(tableRow).getByText("Detail")).toBeInTheDocument();
    // Paket E5: neither a change, an evaluation nor a hand-over from a released relation.
    expect(within(tableRow).queryByRole("button", { name: "Ajukan Perubahan" })).not.toBeInTheDocument();
    expect(within(tableRow).queryByRole("button", { name: "Isi Evaluasi" })).not.toBeInTheDocument();
  });

  it("keeps every piece of information of the old columns", async () => {
    renderPage();
    const cells = within((await screen.findByText("Ilham Nofaldi")).closest("tr")!).getAllByRole("cell");
    const [, student, milestone, guidance, clock, activity, actions] = cells;

    // Mahasiswa: name, NIM, one truncated title line, status badge.
    expect(within(student).getByText("Ilham Nofaldi")).toBeInTheDocument();
    expect(within(student).getByText("2211522028")).toBeInTheDocument();
    expect(within(student).getByText(LONG_TITLE).className).toContain("truncate");
    expect(within(student).getByText("Penelitian")).toBeInTheDocument();
    expect(within(student).queryByText("research")).not.toBeInTheDocument();

    expect(within(milestone).getByText("2/5")).toBeInTheDocument();
    expect(within(milestone).getByText("40%")).toBeInTheDocument();
    expect(within(milestone).getByRole("progressbar")).toBeInTheDocument();
    expect(within(milestone).getByText("Bab 3 Metodologi")).toBeInTheDocument();

    expect(within(guidance).getByText("6 sesi")).toBeInTheDocument();
    expect(within(guidance).getByText("Terakhir:")).toBeInTheDocument();
    expect(within(guidance).getByText("14 September 2026")).toBeInTheDocument();

    expect(within(clock).getByText("7 bulan 12 hari")).toBeInTheDocument();
    expect(within(clock).getByText("Evaluasi 6 bulan jatuh tempo")).toBeInTheDocument();

    expect(within(activity).getByText("Berisiko")).toBeInTheDocument();
    expect(within(activity).getByLabelText("Perlu perhatian")).toBeInTheDocument();

    expect(within(actions).getByText("Kirim Peringatan")).toBeInTheDocument();
    expect(within(actions).getByText("Detail")).toBeInTheDocument();
  });

  it("Paket E6 (1): the longest status badge is clipped inside the Mahasiswa cell, never over the next one", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({ success: true, count: 1, students: [row({ thesisStatus: "on_leave" })] });
    renderPage();
    const tableRow = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;
    const cell = within(tableRow).getAllByRole("cell")[1];
    expect(cell.className).toContain("overflow-hidden");
    expect(within(cell).getByText("Berhenti Studi Sementara (BSS)").className).toContain("truncate");
    const fixed = [0, 2, 3, 4, 5, 6].map((index) => Number.parseFloat((screen.getAllByRole("columnheader")[index] as HTMLElement).style.width));
    const minWidth = Number(/min-w-\[(\d+)px\]/.exec(screen.getByRole("table").className)?.[1]);
    expect(minWidth - fixed.reduce((sum, width) => sum + width, 0)).toBeGreaterThanOrEqual(MEASURED_MIN_WIDTH["Berhenti Studi Sementara (BSS)"]);
  });

  it("shows placeholders instead of blanks for a student without title, sessions or activity", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({
      success: true,
      count: 1,
      students: [row({ thesisTitle: undefined, activityLevel: null, supervisionClock: null, lastGuidanceAt: null, completedGuidanceCount: 0, latestMilestone: undefined, thesisStatus: "on_leave" })],
    });
    renderPage();
    const tableRow = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;

    expect(within(tableRow).getByText("Judul belum ditentukan")).toBeInTheDocument();
    expect(within(tableRow).getByText("Berhenti Studi Sementara (BSS)")).toBeInTheDocument();
    expect(within(tableRow).getByText("0 sesi")).toBeInTheDocument();
    expect(within(tableRow).getByText("Belum pernah")).toBeInTheDocument();
    // No warning for a thesis without an activity level.
    expect(within(tableRow).queryByText("Kirim Peringatan")).not.toBeInTheDocument();
  });
});

describe("LecturerMyStudentsPage row actions (Paket E5, 3.2-3.4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Pembimbing 1 with a due evaluation gets Isi Evaluasi and Ajukan Perubahan; each opens its form", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({ success: true, count: 1, students: [row()] });
    renderPage();
    const tableRow = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;

    fireEvent.click(within(tableRow).getByRole("button", { name: "Isi Evaluasi" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Formulir evaluasi t1");
    fireEvent.click(within(tableRow).getByRole("button", { name: "Ajukan Perubahan" }));
    expect(screen.getByText("Formulir perubahan t1")).toBeInTheDocument();
  });

  it("no Isi Evaluasi when nothing is due or for Pembimbing 2; a blocked Ajukan Perubahan is disabled with its reason", async () => {
    const reason = "Perubahan diajukan oleh mahasiswa atau Pembimbing 1. Sebagai Pembimbing 2, Anda dapat mengalihkan posisi Anda lewat aksi Alihkan di tabel Mahasiswa Bimbingan.";
    vi.mocked(getMyStudents).mockResolvedValue({
      success: true,
      count: 2,
      students: [
        row({ supervisionClock: { ...row().supervisionClock!, evaluationDue: null } }),
        row({
          studentId: "s2", thesisId: "t2", fullName: "NABIL RIZKI", roles: ["Pembimbing 2"],
          changeRequest: { hasOpenRequest: false, canSubmit: false, blockReason: reason, canTransfer: true, transferBlockReason: null },
        }),
      ],
    });
    renderPage();
    const first = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;
    const second = screen.getByText("Nabil Rizki").closest("tr")!;

    expect(within(first).queryByRole("button", { name: "Isi Evaluasi" })).not.toBeInTheDocument();
    expect(within(second).queryByRole("button", { name: "Isi Evaluasi" })).not.toBeInTheDocument();
    const ask = within(second).getByRole("button", { name: "Ajukan Perubahan" });
    expect(ask).toBeDisabled();
    expect(ask.parentElement).toHaveAttribute("title", `Ajukan Perubahan: ${reason}`);
  });

  it("marks a student with a running change request; the marker opens its detail", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({
      success: true,
      count: 1,
      students: [row({ changeRequest: { hasOpenRequest: true, canSubmit: false, blockReason: "Masih ada pengajuan perubahan yang berjalan.", canTransfer: false, transferBlockReason: "Masih ada pengajuan perubahan yang berjalan." } })],
    });
    renderPage();
    const tableRow = (await screen.findByText("Ilham Nofaldi")).closest("tr")!;

    fireEvent.click(within(tableRow).getByText("Perubahan berjalan"));
    expect(screen.getByRole("dialog")).toHaveTextContent("Pengajuan berjalan t1");
  });

  it("ticks only the students that may be handed over and opens Alihkan (N) with them", async () => {
    vi.mocked(getMyStudents).mockResolvedValue({
      success: true,
      count: 3,
      students: [
        row(),
        row({ studentId: "s2", thesisId: "t2", fullName: "NABIL RIZKI" }),
        row({
          studentId: "s3", thesisId: "t3", fullName: "FATHUR RAHMAN",
          changeRequest: { hasOpenRequest: false, canSubmit: false, blockReason: "x", canTransfer: false, transferBlockReason: "Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil." },
        }),
      ],
    });
    renderPage();
    await screen.findByText("Ilham Nofaldi");

    const blocked = screen.getByRole("checkbox", { name: "Pilih Fathur Rahman" });
    expect(blocked).toBeDisabled();
    expect(blocked.parentElement).toHaveAttribute("title", "Pengajuan perubahan hanya dapat dibuat sampai sebelum pendaftaran seminar hasil.");

    fireEvent.click(screen.getByRole("checkbox", { name: "Pilih semua mahasiswa yang dapat dialihkan di halaman ini" }));
    expect(screen.getByRole("checkbox", { name: "Pilih Ilham Nofaldi" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pilih Nabil Rizki" })).toBeChecked();
    expect(blocked).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Alihkan (2)" }));
    expect(screen.getByRole("dialog", { name: "Alihkan Mahasiswa" })).toHaveTextContent("ILHAM NOFALDI, NABIL RIZKI");
  });
});

describe("LecturerMyStudentsPage search", () => {
  const students = [
    row(),
    row({ studentId: "s2", thesisId: "t2", fullName: "NABIL RIZKI", email: "nabil@example.test", identityNumber: "2211523030", thesisTitle: "Analisis Sentimen Ulasan Aplikasi" }),
    row({ studentId: "s3", thesisId: "t3", fullName: "FATHUR RAHMAN", email: "fathur@example.test", identityNumber: "2011522001", thesisTitle: undefined }),
  ];
  const shownNames = () => ["Ilham Nofaldi", "Nabil Rizki", "Fathur Rahman"].filter((name) => screen.queryByText(name));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyStudents).mockResolvedValue({ success: true, count: students.length, students });
  });

  it("matches the name, the NIM and the thesis title, in any letter case", async () => {
    renderPage();
    await screen.findByText("Ilham Nofaldi");
    const search = screen.getByPlaceholderText("Cari nama, NIM, atau judul...");
    expect(shownNames()).toHaveLength(3);

    fireEvent.change(search, { target: { value: "nabil" } });
    expect(shownNames()).toEqual(["Nabil Rizki"]);

    // NIM: a whole number or its beginning.
    fireEvent.change(search, { target: { value: "2011522001" } });
    expect(shownNames()).toEqual(["Fathur Rahman"]);
    fireEvent.change(search, { target: { value: "22115" } });
    expect(shownNames()).toEqual(["Ilham Nofaldi", "Nabil Rizki"]);

    // Thesis title; a student without a title is simply not matched.
    fireEvent.change(search, { target: { value: "analisis SENTIMEN" } });
    expect(shownNames()).toEqual(["Nabil Rizki"]);
    fireEvent.change(search, { target: { value: " monitoring tugas akhir " } });
    expect(shownNames()).toEqual(["Ilham Nofaldi"]);

    fireEvent.change(search, { target: { value: "" } });
    expect(shownNames()).toHaveLength(3);
  });

  it("shows the empty text when nothing matches", async () => {
    renderPage();
    await screen.findByText("Ilham Nofaldi");
    fireEvent.change(screen.getByPlaceholderText("Cari nama, NIM, atau judul..."), { target: { value: "tidak ada yang cocok" } });
    expect(shownNames()).toEqual([]);
    expect(screen.getByText("Tidak ada mahasiswa bimbingan")).toBeInTheDocument();
  });
});
