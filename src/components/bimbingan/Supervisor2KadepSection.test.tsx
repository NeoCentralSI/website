import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { expectFooter } from "@/test/dialogFooter";

import { Supervisor2KadepSection } from "./Supervisor2KadepSection";

const mockGetRequests = vi.fn();
const mockLoadOverview = vi.fn();

vi.mock("@/services/lecturerGuidance.service", () => ({
  getSupervisor2KadepRequests: (...args: unknown[]) => mockGetRequests(...args),
  approveSupervisor2KadepRequest: vi.fn(),
  rejectSupervisor2KadepRequest: vi.fn(),
}));

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/services/thesis-proposal/supervision-quota.service", () => ({
  getLoadOverview: (...args: unknown[]) => mockLoadOverview(...args),
}));

const overview = (row: { activeCount: number; acceptingRequests: boolean; level: string }) => ({
  academicYear: null,
  general: { softLimit: 8, hardLimit: 10 },
  period: null,
  applicable: { softLimit: 8, hardLimit: 10, source: "general" },
  lecturers: [{ lecturerId: "lec-1", fullName: "Dosen Penuh", identityNumber: null, scienceGroup: null, breakdown: {}, ...row }],
});

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Supervisor2KadepSection />
    </QueryClientProvider>,
  );
}

const request = {
  requestId: "req-1",
  thesisId: "th-1",
  studentId: "st-1",
  lecturerId: "lec-1",
  studentName: "Mahasiswa Uji",
  studentNim: "2211522028",
  lecturerName: "Dosen Penuh",
  thesisTitle: "Judul Proposal",
  requestedAt: "2026-08-01T00:00:00.000Z",
};

// Paket P8: one table; Setujui and Tolak are icons in the row and buttons in the detail modal.
describe("Supervisor2KadepSection quota gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequests.mockResolvedValue([request]);
  });

  it("shows the candidate's load; a full lecturer can still be approved", async () => {
    mockLoadOverview.mockResolvedValue(overview({ activeCount: 10, acceptingRequests: true, level: "full" }));

    renderSection();

    expect(await screen.findByText("10/10 · Penuh")).toBeInTheDocument();
    const row = screen.getByText("Mahasiswa Uji").closest("tr")!;
    expect(within(row).getByRole("button", { name: "Setujui" })).toBeEnabled();

    fireEvent.click(within(row).getByRole("button", { name: "Lihat Detail" }));
    const detail = await screen.findByRole("dialog", { name: "Detail Permintaan Pembimbing 2" });
    expectFooter(detail, ["Batal", "Tolak", "Setujui"], "sudah mencapai batas bimbingan");
  });

  it("disables Setujui when the lecturer closed intake, as the backend does", async () => {
    mockLoadOverview.mockResolvedValue(overview({ activeCount: 3, acceptingRequests: false, level: "available" }));

    renderSection();

    expect(await screen.findByText("Penerimaan ditutup dosen")).toBeInTheDocument();
    const row = screen.getByText("Mahasiswa Uji").closest("tr")!;
    const approve = within(row).getByRole("button", { name: "Setujui" });
    expect(approve).toBeDisabled();
    expect(approve.parentElement).toHaveAttribute("title", "Setujui: Dosen sedang menutup penerimaan permintaan pembimbing.");
    expect(within(row).getByRole("button", { name: "Tolak" })).toBeEnabled();
  });

  it("keeps Setujui available when the load cannot be read (fail-open)", async () => {
    mockLoadOverview.mockRejectedValue(new Error("network"));

    renderSection();

    const row = (await screen.findByText("Mahasiswa Uji")).closest("tr")!;
    expect(within(row).getByRole("button", { name: "Setujui" })).toBeEnabled();
  });
});
