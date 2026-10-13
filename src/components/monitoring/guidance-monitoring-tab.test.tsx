import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMonitoringDashboard, type MonitoringDashboard } from "@/services/monitoring.service";
import { GuidanceMonitoringTab } from "./guidance-monitoring-tab";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/hooks/shared/useRole", () => ({ useRole: () => ({ isKadep: () => true }) }));
vi.mock("@/services/monitoring.service", () => ({ getMonitoringDashboard: vi.fn(), sendBatchWarnings: vi.fn() }));
// The charts and the table have their own tests.
vi.mock("./StatusDistributionChart", () => ({ StatusDistributionChart: () => null }));
vi.mock("./ActivityDistributionChart", () => ({ ActivityDistributionChart: () => null }));
vi.mock("./ProgressDistributionChart", () => ({ ProgressDistributionChart: () => null }));
vi.mock("./TopicDistributionChart", () => ({ TopicDistributionChart: () => null }));
vi.mock("./BatchDistributionChart", () => ({ BatchDistributionChart: () => null }));
vi.mock("./MonthlyTrendChart", () => ({ GuidanceTrendChart: () => null }));
vi.mock("./ThesesTable", () => ({
  ThesesTable: ({ academicYear, initialActivity }: { academicYear?: string; initialActivity?: string }) => (
    <div data-testid="theses-table">{academicYear ?? "semua"}|{initialActivity ?? "-"}</div>
  ),
}));

const dashboard = (): MonitoringDashboard => ({
  summary: {
    totalActiveTheses: 56, totalMilestones: 280, completedMilestones: 200, averageProgress: 71,
    studentsComplete100: 30, studentsWithNoProgress: 4, totalReadyForSeminar: 1, totalAtRisk: 11, totalSlow: 4, totalEvaluationDue: 15,
  },
  statusDistribution: [],
  activityDistribution: [],
  topicDistribution: [],
  batchDistribution: [],
  progressDistribution: [],
  guidanceTrend: [],
  atRiskStudents: [],
  slowStudents: [],
  evaluationDueStudents: [],
  supervisorLoads: [],
  readyForSeminar: [
    { thesisId: "t1", title: "Judul", student: { name: "UJI MON SIAP DAFTAR SEMINAR", nim: "2211529141", email: "" }, supervisors: [], approvedAt: "" },
  ],
});

function renderTab(props: Partial<Parameters<typeof GuidanceMonitoringTab>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <GuidanceMonitoringTab academicYear="ay-now" enabled {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMonitoringDashboard).mockResolvedValue(dashboard());
});

describe("GuidanceMonitoringTab", () => {
  it("waits for the semester before it asks for anything", () => {
    renderTab({ enabled: false });

    expect(screen.getByText("Memuat data monitoring...")).toBeInTheDocument();
    expect(getMonitoringDashboard).not.toHaveBeenCalled();
    expect(screen.queryByTestId("theses-table")).not.toBeInTheDocument();
  });

  it("shows the guidance content of the semester and hands the semester to the table", async () => {
    renderTab({ initialActivity: "at_risk" });

    expect(await screen.findByTestId("theses-table")).toHaveTextContent("ay-now|at_risk");
    expect(getMonitoringDashboard).toHaveBeenCalledWith("ay-now");
    expect(screen.getByText("Total Mahasiswa Aktif")).toBeInTheDocument();
    expect(screen.getByText("Perlu Evaluasi")).toBeInTheDocument();
    expect(screen.getByText("Progres Lambat & Berisiko")).toBeInTheDocument();
    expect(screen.getByText("Beban Bimbingan")).toBeInTheDocument();
  });

  it("no longer lists the students ready for seminar: that card moved to the Seminar Hasil tab", async () => {
    renderTab();
    await screen.findByTestId("theses-table");

    expect(screen.queryByText("Siap Mendaftar")).not.toBeInTheDocument();
    expect(screen.queryByText("Uji Mon Siap Daftar Seminar")).not.toBeInTheDocument();
    expect(screen.queryByText("Acc Seminar")).not.toBeInTheDocument();
    // The number of the summary row stays.
    expect(screen.getByText("Siap Seminar")).toBeInTheDocument();
  });
});
