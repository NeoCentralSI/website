import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadProgressReportPdf, getFilterOptions, type FilterOptions } from "@/services/monitoring.service";
import MonitoringDashboard from "./MonitoringDashboard";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/monitoring.service", () => ({
  getFilterOptions: vi.fn(),
  downloadProgressReportPdf: vi.fn(),
}));
// The tabs have their own tests; here only what the page hands them matters. A tab that is
// not ready yet (the semester is still being resolved) renders nothing.
vi.mock("@/components/monitoring", () => ({
  GuidanceMonitoringTab: ({ academicYear, enabled }: { academicYear?: string; enabled: boolean }) =>
    enabled ? <div data-testid="tab-bimbingan">{academicYear ?? "semua"}</div> : null,
  ThesisEventMonitoringTab: ({ kind, academicYear, enabled }: { kind: string; academicYear?: string; enabled: boolean }) =>
    enabled ? <div data-testid={`tab-${kind}`}>{academicYear ?? "semua"}</div> : null,
}));

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
});

describe("MonitoringDashboard — semester filter", () => {
  it("opens on the semester that is running now, without asking for every semester first", async () => {
    renderPage();

    // The tab is not rendered ready before the semester is known, so nothing asks for "all".
    expect(screen.queryByTestId("tab-bimbingan")).not.toBeInTheDocument();
    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("ay-now");

    expect(screen.getByLabelText("Semester")).toHaveTextContent("Ganjil 2026/2027 (Berjalan)");
    expect(screen.getByText("Menampilkan tugas akhir yang berjalan pada semester ini.")).toBeInTheDocument();
    // The running semester needs no remark about "now".
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    // The default is not written to the address.
    expect(screen.getByTestId("location")).toHaveTextContent("");
  });

  it("reads the semester from ?semester= and says the indicators are about now", async () => {
    renderPage("/monitoring?semester=ay-prev");

    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("ay-prev");
    expect(screen.getByLabelText("Semester")).toHaveTextContent("Genap 2025/2026");
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it("keeps 'Semua Semester' as a choice", async () => {
    renderPage("/monitoring?semester=all");

    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("semua");
    expect(screen.getByLabelText("Semester")).toHaveTextContent("Semua Semester");
    expect(screen.getByText("Menampilkan tugas akhir dari semua semester.")).toBeInTheDocument();
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it("stores the choice in ?semester=", async () => {
    renderPage();
    await screen.findByTestId("tab-bimbingan");

    fireEvent.keyDown(screen.getByLabelText("Semester"), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Genap 2025/2026" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?semester=ay-prev"));
    expect(screen.getByTestId("tab-bimbingan")).toHaveTextContent("ay-prev");
    expect(screen.getByText(NOTE)).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText("Semester"), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Semua Semester" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?semester=all"));
    expect(screen.getByTestId("tab-bimbingan")).toHaveTextContent("semua");
  });

  it("falls back to the running semester for a semester the list does not have", async () => {
    renderPage("/monitoring?semester=ay-hilang");

    await waitFor(() => expect(screen.getByTestId("tab-bimbingan")).toHaveTextContent("ay-now"));
  });

  it("shows every semester when none is running or the semesters cannot be read", async () => {
    vi.mocked(getFilterOptions).mockResolvedValue(filterOptions({
      academicYears: [{ value: "ay-prev", label: "Genap 2025/2026 ", isActive: false }],
    }));
    const first = renderPage();
    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("semua");
    first.unmount();

    vi.mocked(getFilterOptions).mockRejectedValue(new Error("Gagal mengambil opsi filter"));
    renderPage();
    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("semua");
  });
});

describe("MonitoringDashboard — tabs", () => {
  const REPORT_REASON = "Laporan hanya memuat data bimbingan. Buka tab Bimbingan untuk mengunduhnya.";

  it("has one head and three tabs, Bimbingan first", async () => {
    renderPage();
    await screen.findByTestId("tab-bimbingan");

    expect(screen.getByRole("heading", { name: "Monitoring Tugas Akhir" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^(Bimbingan|Seminar Hasil|Sidang)$/ }).map((tab) => tab.textContent)).toEqual([
      "Bimbingan",
      "Seminar Hasil",
      "Sidang",
    ]);
    expect(screen.queryByTestId("tab-seminar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-defence")).not.toBeInTheDocument();
  });

  it("opens the tab named in ?tab= and keeps the semester for it", async () => {
    renderPage("/monitoring?tab=seminar&semester=ay-prev");

    expect(await screen.findByTestId("tab-seminar")).toHaveTextContent("ay-prev");
    expect(screen.queryByTestId("tab-bimbingan")).not.toBeInTheDocument();
    expect(screen.getByText("Menampilkan seminar hasil yang tanggalnya jatuh pada semester ini.")).toBeInTheDocument();
    expect(screen.getByText("Siap Mendaftar dan Perlu Perhatian menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.")).toBeInTheDocument();
  });

  it("writes the tab to ?tab= without losing the semester, and drops it for the first tab", async () => {
    renderPage("/monitoring?semester=all");
    await screen.findByTestId("tab-bimbingan");

    fireEvent.click(screen.getByRole("button", { name: "Sidang" }));
    expect(await screen.findByTestId("tab-defence")).toHaveTextContent("semua");
    expect(screen.getByTestId("location")).toHaveTextContent("?semester=all&tab=sidang");
    expect(screen.getByText("Menampilkan sidang dari semua semester.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Seminar Hasil" }));
    expect(await screen.findByTestId("tab-seminar")).toHaveTextContent("semua");
    expect(screen.getByTestId("location")).toHaveTextContent("?semester=all&tab=seminar");

    fireEvent.click(screen.getByRole("button", { name: "Bimbingan" }));
    expect(await screen.findByTestId("tab-bimbingan")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\?semester=all$/);
  });

  it("falls back to Bimbingan for a tab that does not exist", async () => {
    renderPage("/monitoring?tab=yudisium");

    expect(await screen.findByTestId("tab-bimbingan")).toHaveTextContent("ay-now");
  });

  it("applies a new semester to the tab that is open", async () => {
    renderPage("/monitoring?tab=sidang");
    expect(await screen.findByTestId("tab-defence")).toHaveTextContent("ay-now");

    fireEvent.keyDown(screen.getByLabelText("Semester"), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Genap 2025/2026" }));

    await waitFor(() => expect(screen.getByTestId("tab-defence")).toHaveTextContent("ay-prev"));
    expect(screen.getByTestId("location")).toHaveTextContent("?tab=sidang&semester=ay-prev");
  });

  it("offers the report on Bimbingan only, and says why on the other tabs", async () => {
    vi.mocked(downloadProgressReportPdf).mockResolvedValue(new Blob(["%PDF"]));
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/laporan");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPage();
    await screen.findByTestId("tab-bimbingan");

    const download = screen.getByRole("button", { name: /Download Laporan/ });
    expect(download).toBeEnabled();
    expect(screen.queryByTitle(REPORT_REASON)).not.toBeInTheDocument();
    fireEvent.click(download);
    await waitFor(() => expect(downloadProgressReportPdf).toHaveBeenCalledWith({ academicYearId: "ay-now" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Download Laporan/ })).toBeEnabled());

    for (const tab of ["Seminar Hasil", "Sidang"]) {
      fireEvent.click(screen.getByRole("button", { name: tab }));
      const disabled = await screen.findByRole("button", { name: /Download Laporan/ });
      expect(disabled).toBeDisabled();
      expect(screen.getByTitle(REPORT_REASON)).toContainElement(disabled);
    }
    expect(downloadProgressReportPdf).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("shows the message of the server when the PDF service is not running", async () => {
    const PDF_DOWN = "Layanan pembuat PDF sedang tidak aktif. Hubungi admin sistem.";
    vi.mocked(downloadProgressReportPdf).mockRejectedValue(new Error(PDF_DOWN));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPage();
    await screen.findByTestId("tab-bimbingan");

    fireEvent.click(screen.getByRole("button", { name: /Download Laporan/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(PDF_DOWN));
    expect(toast.success).not.toHaveBeenCalled();
    // Nothing is saved, and the button can be used again.
    expect(click).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: /Download Laporan/ })).toBeEnabled());
    click.mockRestore();
  });
});
