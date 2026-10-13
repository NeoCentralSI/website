import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFilterOptions, getMonitoringDashboard, type FilterOptions, type MonitoringDashboard as DashboardData } from "@/services/monitoring.service";
import MonitoringDashboard from "./MonitoringDashboard";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/monitoring.service", () => ({
  getMonitoringDashboard: vi.fn(),
  getFilterOptions: vi.fn(),
  downloadProgressReportPdf: vi.fn(),
}));
// The cards, charts and table have their own tests; here only what the page hands them matters.
vi.mock("@/components/monitoring", () => {
  const Nothing = () => null;
  return {
    MonitoringSummaryCards: Nothing,
    StatusDistributionChart: Nothing,
    ActivityDistributionChart: Nothing,
    TopicDistributionChart: Nothing,
    BatchDistributionChart: Nothing,
    ProgressDistributionChart: Nothing,
    GuidanceTrendChart: Nothing,
    SlowStudentsCard: Nothing,
    EvaluationDueCard: Nothing,
    ReadyForSeminarCard: Nothing,
    SupervisorLoadCard: Nothing,
    ThesesTable: ({ academicYear }: { academicYear?: string }) => (
      <div data-testid="theses-table">{academicYear ?? "semua"}</div>
    ),
  };
});

const NOTE = "Indikator aktivitas dan evaluasi menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.";

const filterOptions = (overrides: Partial<FilterOptions> = {}): FilterOptions => ({
  statuses: [],
  supervisors: [],
  topics: [],
  academicYears: [
    { value: "ay-now", label: "Ganjil 2026/2027 ", isActive: true },
    { value: "ay-prev", label: "Genap 2025/2026 ", isActive: false },
  ],
  ...overrides,
});

function LocationProbe() {
  const { search } = useLocation();
  return <div data-testid="location">{search}</div>;
}

function renderPage(initialEntry = "/monitoring") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/monitoring" element={<><MonitoringDashboard /><LocationProbe /></>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFilterOptions).mockResolvedValue(filterOptions());
  vi.mocked(getMonitoringDashboard).mockResolvedValue({} as DashboardData);
});

describe("MonitoringDashboard — semester filter", () => {
  it("opens on the semester that is running now, without asking for every semester first", async () => {
    renderPage();

    expect(await screen.findByTestId("theses-table")).toHaveTextContent("ay-now");
    expect(getMonitoringDashboard).toHaveBeenCalledTimes(1);
    expect(getMonitoringDashboard).toHaveBeenCalledWith("ay-now");

    expect(screen.getByLabelText("Semester")).toHaveTextContent("Ganjil 2026/2027 (Berjalan)");
    expect(screen.getByText("Menampilkan tugas akhir yang berjalan pada semester ini.")).toBeInTheDocument();
    // The running semester needs no remark about "now".
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    // The default is not written to the address.
    expect(screen.getByTestId("location")).toHaveTextContent("");
  });

  it("reads the semester from ?semester= and says the indicators are about now", async () => {
    renderPage("/monitoring?semester=ay-prev");

    expect(await screen.findByTestId("theses-table")).toHaveTextContent("ay-prev");
    expect(getMonitoringDashboard).toHaveBeenCalledWith("ay-prev");
    expect(getMonitoringDashboard).not.toHaveBeenCalledWith("ay-now");
    expect(screen.getByLabelText("Semester")).toHaveTextContent("Genap 2025/2026");
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it("keeps 'Semua Semester' as a choice", async () => {
    renderPage("/monitoring?semester=all");

    expect(await screen.findByTestId("theses-table")).toHaveTextContent("semua");
    expect(getMonitoringDashboard).toHaveBeenCalledWith(undefined);
    expect(screen.getByLabelText("Semester")).toHaveTextContent("Semua Semester");
    expect(screen.getByText("Menampilkan tugas akhir dari semua semester.")).toBeInTheDocument();
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it("stores the choice in ?semester=", async () => {
    renderPage();
    await screen.findByTestId("theses-table");

    fireEvent.keyDown(screen.getByLabelText("Semester"), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Genap 2025/2026" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?semester=ay-prev"));
    await waitFor(() => expect(getMonitoringDashboard).toHaveBeenCalledWith("ay-prev"));
    expect(screen.getByTestId("theses-table")).toHaveTextContent("ay-prev");
    expect(screen.getByText(NOTE)).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText("Semester"), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Semua Semester" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?semester=all"));
    await waitFor(() => expect(getMonitoringDashboard).toHaveBeenCalledWith(undefined));
  });

  it("falls back to the running semester for a semester the list does not have", async () => {
    renderPage("/monitoring?semester=ay-hilang");

    await waitFor(() => expect(screen.getByTestId("theses-table")).toHaveTextContent("ay-now"));
    await waitFor(() => expect(getMonitoringDashboard).toHaveBeenLastCalledWith("ay-now"));
  });

  it("shows every semester when none is running or the semesters cannot be read", async () => {
    vi.mocked(getFilterOptions).mockResolvedValue(filterOptions({
      academicYears: [{ value: "ay-prev", label: "Genap 2025/2026 ", isActive: false }],
    }));
    const first = renderPage();
    expect(await screen.findByTestId("theses-table")).toHaveTextContent("semua");
    expect(getMonitoringDashboard).toHaveBeenCalledWith(undefined);
    first.unmount();

    vi.clearAllMocks();
    vi.mocked(getMonitoringDashboard).mockResolvedValue({} as DashboardData);
    vi.mocked(getFilterOptions).mockRejectedValue(new Error("Gagal mengambil opsi filter"));
    renderPage();
    expect(await screen.findByTestId("theses-table")).toHaveTextContent("semua");
    expect(getMonitoringDashboard).toHaveBeenCalledWith(undefined);
  });
});
