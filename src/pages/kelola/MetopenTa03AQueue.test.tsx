import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import MetopenTa03AQueue from "./MetopenTa03AQueue";
import {
  assessmentService,
  type SupervisorScoringHistoryItem,
  type SupervisorScoringQueueItem,
} from "@/services/assessment.service";

vi.mock("@/services/assessment.service", () => ({
  assessmentService: {
    getSupervisorScoringQueue: vi.fn(),
    getSupervisorScoringHistory: vi.fn(),
  },
}));

vi.mock("@/components/metopen/SupervisorScoreCard", () => ({
  SupervisorScoreCard: ({ thesisId }: { thesisId: string }) => <div>Detail {thesisId}</div>,
}));
vi.mock("@/components/metopen/InformalLogReadonlyList", () => ({
  InformalLogReadonlyList: () => null,
}));
vi.mock("@/components/thesis/ProposalVersionHistory", () => ({
  ProposalVersionHistory: () => null,
}));
vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title }: { title?: string }) => <div>{title}</div>,
}));

function item(overrides: Partial<SupervisorScoringQueueItem> = {}): SupervisorScoringQueueItem {
  return {
    thesisId: "thesis-active",
    thesisTitle: "Proposal Aktif",
    student: { id: "student-1", fullName: "Mahasiswa Aktif", identityNumber: "2211520001" },
    actorRole: "P1",
    actionStatus: "p1_pending",
    partnerName: null,
    supervisorScore: null,
    lecturerScore: null,
    finalScore: null,
    coSignedAt: null,
    attendanceAutoZeroedAt: null,
    attendanceAutoZeroReason: null,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const layoutContext = { setBreadcrumbs: vi.fn(), setTitle: vi.fn() };
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/kelola/metopen/ta03a"]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/kelola/metopen/ta03a" element={<MetopenTa03AQueue />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MetopenTa03AQueue metric drill-down", () => {
  it("prefetches history and opens auto-zero records from history", async () => {
    vi.mocked(assessmentService.getSupervisorScoringQueue).mockResolvedValue([item()]);
    const historyItem: SupervisorScoringHistoryItem = {
      ...item({
        thesisId: "thesis-auto-zero",
        thesisTitle: "Proposal Auto-zero",
        student: { id: "student-2", fullName: "Mahasiswa Auto-zero", identityNumber: "2211520002" },
        actionStatus: "auto_zeroed",
        supervisorScore: 0,
        lecturerScore: 0,
        finalScore: 0,
        attendanceAutoZeroedAt: "2026-07-11T00:00:00.000Z",
        attendanceAutoZeroReason: "Presensi kurang dari 75%",
      }),
      isFinalized: true,
      finalizedAt: "2026-07-11T00:00:00.000Z",
    };
    vi.mocked(assessmentService.getSupervisorScoringHistory).mockResolvedValue([historyItem]);

    renderPage();

    await waitFor(() => expect(assessmentService.getSupervisorScoringHistory).toHaveBeenCalled());
    const metric = await screen.findByRole("button", { name: /Nilai otomatis 0 presensi.*1/i });
    fireEvent.click(metric);

    expect((await screen.findAllByText("Mahasiswa Auto-zero")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Mahasiswa Aktif")).not.toBeInTheDocument();
  });
});
