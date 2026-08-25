import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TugasAkhirOverviewPage from "./Overview";
import {
  getMyThesisDetail,
  getPendingSupervisor2Request,
  getStudentSupervisors,
  getStudentThesisHistory,
} from "@/services/studentGuidance.service";

vi.mock("@/services/studentGuidance.service", () => ({
  getStudentSupervisors: vi.fn(),
  getMyThesisDetail: vi.fn(),
  getStudentThesisHistory: vi.fn(),
  getPendingSupervisor2Request: vi.fn(),
}));

vi.mock("@/hooks/milestone", () => ({
  useMilestones: vi.fn(() => ({
    data: { milestones: [] },
    isLoading: false,
  })),
  useDefenceReadinessStatus: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

vi.mock("@/components/bimbingan/RequestSupervisor2Dialog", () => ({
  RequestSupervisor2Dialog: () => <div>Request Supervisor 2 Dialog</div>,
}));

vi.mock("@/components/bimbingan/PendingRequestCard", () => ({
  PendingRequestCard: () => <div>Pending Request Card</div>,
}));

vi.mock("@/components/thesis/PendingApprovalCard", () => ({
  PendingApprovalCard: () => <div>Pending Approval Card</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lottie-react", () => ({
  default: () => <div data-testid="lottie-mock" />,
}));

function renderWithLayout(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const layoutContext = {
    setBreadcrumbs: vi.fn(),
    setTitle: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/tugas-akhir"]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/tugas-akhir" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TugasAkhirOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStudentSupervisors).mockResolvedValue({
      thesisId: "thesis-1",
      supervisors: [{ id: "sup-1", name: "Dr. P1", email: "p1@example.test", role: "Pembimbing 1" }],
    });
    vi.mocked(getMyThesisDetail).mockResolvedValue({
      id: "thesis-1",
      title: "Sistem Rekomendasi Tugas Akhir",
      status: "Bimbingan",
      rating: "ONGOING",
      deadlineDate: null,
      isProposal: false,
      supervisors: [{
        id: "sup-1",
        name: "Dr. P1",
        email: "p1@example.test",
        identityNumber: "198001012010011001",
        role: "Pembimbing 1",
      }],
      stats: {
        totalGuidances: 0,
        totalSessions: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        inProgressMilestones: 0,
        overdueMilestones: 0,
        milestoneProgress: 0,
      },
    });
    vi.mocked(getStudentThesisHistory).mockResolvedValue({ theses: [] });
    vi.mocked(getPendingSupervisor2Request).mockResolvedValue(null);
  });

  it("renders active thesis overview dashboard correctly", async () => {
    renderWithLayout(<TugasAkhirOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Informasi Tugas Akhir")).toBeInTheDocument();
    });

    expect(screen.getByText("Status Terkini")).toBeInTheDocument();
    expect(screen.getByText("Sistem Rekomendasi Tugas Akhir")).toBeInTheDocument();
  });

  it("shows requirements not met when thesis is still in proposal phase", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue({
      id: "thesis-1",
      title: "Proposal TA",
      status: "Diajukan",
      rating: "ONGOING",
      deadlineDate: null,
      isProposal: true,
      supervisors: [],
      stats: {
        totalGuidances: 0,
        totalSessions: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        inProgressMilestones: 0,
        overdueMilestones: 0,
        milestoneProgress: 0,
      },
    });

    renderWithLayout(<TugasAkhirOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Tugas Akhir Belum Aktif")).toBeInTheDocument();
    });
  });
});
