import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyStudents, type MyStudentItem } from "@/services/lecturerGuidance.service";
import LecturerMyStudentsPage from "./MyStudents";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/services/lecturerGuidance.service", () => ({ getMyStudents: vi.fn(), sendWarningToStudent: vi.fn() }));
vi.mock("@/hooks/shared/useAuth", () => ({ useAuth: () => ({ user: { id: "l1" } }) }));
// Sections around the table have their own tests.
vi.mock("@/components/bimbingan/Supervisor2RequestsSection", () => ({ Supervisor2RequestsSection: () => null }));
vi.mock("@/components/bimbingan/MyStudentsCharts", () => ({ MyStudentsCharts: () => null }));
vi.mock("@/components/thesis-change-request/LecturerThesisChangeRequestPanel", () => ({ LecturerThesisChangeRequestPanel: () => null }));
vi.mock("@/components/thesis-change-request/LecturerTransferStudentsDialog", () => ({ LecturerTransferStudentsDialog: () => null }));

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

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).toEqual(["", "Mahasiswa", "Milestone", "Bimbingan", "Masa Bimbingan", "Aktivitas", "Aksi"]);
    // Only "Mahasiswa" has no width: it takes what the other columns leave.
    const widths = screen.getAllByRole("columnheader").map((header) => (header as HTMLElement).style.width);
    expect(widths).toEqual(["44px", "", "150px", "150px", "190px", "124px", "96px"]);
    expect(screen.getByRole("table").className).toContain("table-fixed");
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
