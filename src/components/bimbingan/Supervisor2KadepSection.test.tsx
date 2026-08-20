import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Supervisor2KadepSection } from "./Supervisor2KadepSection";

const mockGetRequests = vi.fn();
const mockCheckQuota = vi.fn();

vi.mock("@/services/lecturerGuidance.service", () => ({
  getSupervisor2KadepRequests: (...args: unknown[]) => mockGetRequests(...args),
  approveSupervisor2KadepRequest: vi.fn(),
  rejectSupervisor2KadepRequest: vi.fn(),
}));

vi.mock("@/services/supervisionQuota.service", () => ({
  checkLecturerQuotaAPI: (...args: unknown[]) => mockCheckQuota(...args),
}));

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

  it("shows calon P2 quota and disables Setujui when the backend gate would reject", async () => {
    mockCheckQuota.mockResolvedValue({
      lecturerId: "lec-1",
      allowed: false,
      currentCount: 10,
      quotaMax: 10,
      remaining: 0,
      reason: "Kuota pembimbing penuh.",
    });

    renderSection();

    expect(await screen.findByText(/Kuota calon P2: 10\/10/)).toBeInTheDocument();
    expect(screen.getByText("Kuota pembimbing penuh.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Setujui/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Tolak/i })).toBeEnabled();
  });

  it("keeps Setujui available when quota check fails (fail-open)", async () => {
    mockCheckQuota.mockRejectedValue(new Error("network"));

    renderSection();

    expect(await screen.findByRole("button", { name: /Setujui/i })).toBeEnabled();
    expect(screen.queryByText(/Kuota pembimbing penuh/)).not.toBeInTheDocument();
  });
});
