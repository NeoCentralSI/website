import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Supervisor2KadepSection } from "./Supervisor2KadepSection";

const mockGetRequests = vi.fn();
const mockLoadOverview = vi.fn();

vi.mock("@/services/lecturerGuidance.service", () => ({
  getSupervisor2KadepRequests: (...args: unknown[]) => mockGetRequests(...args),
  approveSupervisor2KadepRequest: vi.fn(),
  rejectSupervisor2KadepRequest: vi.fn(),
}));

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

describe("Supervisor2KadepSection quota gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequests.mockResolvedValue([request]);
  });

  it("shows the candidate's load; a full lecturer can still be approved", async () => {
    mockLoadOverview.mockResolvedValue(overview({ activeCount: 10, acceptingRequests: true, level: "full" }));

    renderSection();

    expect(await screen.findByText(/Beban calon P2: 10\/10/)).toBeInTheDocument();
    expect(screen.getByText(/sudah mencapai batas bimbingan/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Setujui/i })).toBeEnabled();
  });

  it("disables Setujui when the lecturer closed intake, as the backend does", async () => {
    mockLoadOverview.mockResolvedValue(overview({ activeCount: 3, acceptingRequests: false, level: "available" }));

    renderSection();

    expect(await screen.findByText("Dosen sedang menutup penerimaan permintaan pembimbing.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Setujui/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Tolak/i })).toBeEnabled();
  });

  it("keeps Setujui available when the load cannot be read (fail-open)", async () => {
    mockLoadOverview.mockRejectedValue(new Error("network"));

    renderSection();

    expect(await screen.findByRole("button", { name: /Setujui/i })).toBeEnabled();
  });
});
