import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import MetopenTa03BQueue from "./MetopenTa03BQueue";
import { assessmentService, type MetopenScoringHistoryItem, type ScoringQueueItem } from "@/services/assessment.service";

vi.mock("@/services/assessment.service", () => ({
  assessmentService: {
    getMetopenScoringQueue: vi.fn(),
    getMetopenScoringHistory: vi.fn(),
    getMetopenScoreDetail: vi.fn(),
    downloadMetopenScoresXlsx: vi.fn(),
  },
}));
vi.mock("@/components/metopen/MetopenAttendanceUploadCard", () => ({
  MetopenAttendanceUploadCard: () => null,
}));
vi.mock("@/components/metopen/ResearchMethodScoreReadOnly", () => ({
  ResearchMethodScoreReadOnly: () => <div>Detail nilai read-only</div>,
}));
vi.mock("@/components/metopen/RubricGradingForm", () => ({
  RubricGradingForm: () => <div>Form rubrik</div>,
}));
vi.mock("@/components/thesis/ProposalVersionHistory", () => ({
  ProposalVersionHistory: () => null,
}));
vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title }: { title?: string }) => <div>{title}</div>,
}));

const activeItem: ScoringQueueItem = {
  thesisId: "thesis-active",
  studentName: "Mahasiswa Aktif",
  studentNim: "2211520001",
  proposedTitle: "Proposal Aktif",
  supervisorName: "Dosen Pembimbing",
  supervisorScore: 70,
  existingScore: null,
  isScored: false,
};

const autoZeroItem: MetopenScoringHistoryItem = {
  ...activeItem,
  thesisId: "thesis-auto-zero",
  studentName: "Mahasiswa Auto-zero",
  studentNim: "2211520002",
  proposedTitle: "Proposal Auto-zero",
  supervisorScore: 0,
  existingScore: 0,
  isScored: true,
  finalScore: 0,
  isFinalized: true,
  finalizedAt: "2026-07-11T00:00:00.000Z",
  coSignedAt: null,
  attendanceAutoZeroedAt: "2026-07-11T00:00:00.000Z",
  attendanceAutoZeroReason: "Presensi kurang dari 75%",
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const layoutContext = { setBreadcrumbs: vi.fn(), setTitle: vi.fn() };
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/kelola/metopen/ta03b"]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/kelola/metopen/ta03b" element={<MetopenTa03BQueue />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MetopenTa03BQueue metric drill-down", () => {
  it("prefetches history and opens auto-zero records from history", async () => {
    vi.mocked(assessmentService.getMetopenScoringQueue).mockResolvedValue([activeItem]);
    vi.mocked(assessmentService.getMetopenScoringHistory).mockResolvedValue([autoZeroItem]);
    vi.mocked(assessmentService.getMetopenScoreDetail).mockResolvedValue({} as never);

    renderPage();

    await waitFor(() => expect(assessmentService.getMetopenScoringHistory).toHaveBeenCalled());
    const metric = await screen.findByRole("button", { name: /Nilai otomatis 0 presensi.*1/i });
    fireEvent.click(metric);

    expect((await screen.findAllByText("Mahasiswa Auto-zero")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Mahasiswa Aktif")).not.toBeInTheDocument();
  });
});
