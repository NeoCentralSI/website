import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFilterOptions, getThesesList, sendWarningToStudent, type ThesisListItem } from "@/services/monitoring.service";
import { ThesesTable } from "./ThesesTable";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/shared/useRole", () => ({ useRole: () => ({ isKadep: () => true, isSekdep: () => false, isGkm: () => false }) }));
vi.mock("@/services/monitoring.service", () => ({
  getThesesList: vi.fn(),
  getFilterOptions: vi.fn(),
  sendWarningToStudent: vi.fn(),
}));

const thesis = (overrides: Partial<ThesisListItem> = {}): ThesisListItem => ({
  id: "t1",
  title: "Sistem Informasi Arsip Surat Departemen",
  activityLevel: "slow",
  daysSinceActivity: 80,
  supervisionClock: null,
  startDate: "2026-03-13T00:00:00.000Z",
  topic: null,
  student: { id: "s1", userId: "s1", name: "UJI TA LAMBAT", nim: "2211529002", email: "lambat@example.test" },
  status: "research",
  academicYear: "",
  startSemester: "Genap 2025/2026",
  progress: { completed: 2, total: 5, percent: 40 },
  supervisors: { pembimbing1: "Husnil Kamil", pembimbing1Id: "l1", pembimbing2: null, pembimbing2Id: null },
  seminarApproval: { supervisor1: false, supervisor2: false, hasPembimbing2: false, isFullyApproved: false },
  lastActivity: "2026-07-25T03:00:00.000Z",
  createdAt: "2026-03-13T00:00:00.000Z",
  ...overrides,
});

function renderTable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ThesesTable academicYear="ay-now" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFilterOptions).mockResolvedValue({ statuses: [], supervisors: [], topics: [], academicYears: [] });
  vi.mocked(getThesesList).mockResolvedValue({
    data: [thesis(), thesis({ id: "t2", student: { id: "s2", userId: "s2", name: "UJI TA LANCAR", nim: "2211529001", email: "" }, activityLevel: "active", startSemester: null })],
    pagination: { page: 1, pageSize: 1000, total: 2, totalPages: 1 },
  });
  vi.mocked(sendWarningToStudent).mockResolvedValue({ success: true, message: "Peringatan telah dikirim ke Uji Ta Lambat" });
});

describe("ThesesTable", () => {
  it("asks for the theses of the chosen semester", async () => {
    renderTable();
    await screen.findByText("Uji Ta Lambat");

    expect(vi.mocked(getThesesList).mock.calls[0][0]).toMatchObject({ academicYear: "ay-now" });
  });

  it("shows the start semester under the name as 'Mulai', so it is not read as the semester filter", async () => {
    renderTable();
    await screen.findByText("Uji Ta Lambat");

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Mulai: Genap 2025/2026")).toBeInTheDocument();
    // A thesis that started outside every semester shows a dash, not an empty value.
    expect(within(rows[1]).getByText("Mulai: -")).toBeInTheDocument();
  });

  it("keeps only search, semester, actions and Muat Ulang in the toolbar; the filters sit in the column headers", async () => {
    renderTable();
    await screen.findByText("Uji Ta Lambat");

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).toEqual(["Mahasiswa", "Topik", "Status", "Progress", "Pembimbing", "Masa Bimbingan", "Aktivitas", "Aksi"]);
    // No dropdown filters in the toolbar any more.
    expect(screen.queryByText("Semua Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Semua Pembimbing")).not.toBeInTheDocument();
    expect(screen.getByRole("table").className).toContain("table-fixed");
    // Only the semester is asked from the server; the rest is filtered in the browser.
    expect(vi.mocked(getThesesList).mock.calls[0][0]).toEqual({ academicYear: "ay-now", page: 1, pageSize: 1000 });
  });

  it("shows Cuti beside the status of a student on leave", async () => {
    vi.mocked(getThesesList).mockResolvedValue({
      data: [thesis({ isOnLeave: true, activityLevel: null })],
      pagination: { page: 1, pageSize: 1000, total: 1, totalPages: 1 },
    });
    renderTable();
    await screen.findByText("Uji Ta Lambat");
    expect(screen.getByText("Penelitian")).toBeInTheDocument();
    expect(screen.getByText("Cuti")).toBeInTheDocument();
  });

  it("fetches the monitoring data again after a single warning is sent", async () => {
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    renderTable();
    await screen.findByText("Uji Ta Lambat");
    expect(getThesesList).toHaveBeenCalledTimes(1);

    // Only the Lambat row can be warned.
    fireEvent.click(screen.getByRole("button", { name: "Kirim Peringatan" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Kirim Peringatan/ }));

    await waitFor(() => expect(sendWarningToStudent).toHaveBeenCalledWith("t1", "slow"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Peringatan telah dikirim ke Uji Ta Lambat"));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monitoring"] });
    // The table itself is one of those queries.
    await waitFor(() => expect(getThesesList).toHaveBeenCalledTimes(2));
    invalidate.mockRestore();
  });

  it("fetches nothing again when the warning is refused", async () => {
    vi.mocked(sendWarningToStudent).mockRejectedValue(new Error("Peringatan tidak dikirim: Aktivitas tugas akhir Lancar."));
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    renderTable();
    await screen.findByText("Uji Ta Lambat");

    fireEvent.click(screen.getByRole("button", { name: "Kirim Peringatan" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Kirim Peringatan/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Peringatan tidak dikirim: Aktivitas tugas akhir Lancar."));
    expect(invalidate).not.toHaveBeenCalled();
    invalidate.mockRestore();
  });
});
