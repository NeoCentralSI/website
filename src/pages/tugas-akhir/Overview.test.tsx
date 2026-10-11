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
  type MyThesisDetail,
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

function buildThesis(overrides: Partial<MyThesisDetail> = {}): MyThesisDetail {
  return {
    id: "thesis-1",
    title: "Sistem Rekomendasi Tugas Akhir",
    status: "research",
    rating: null,
    deadlineDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    student: { id: "stu-1", name: "Mahasiswa Uji", nim: "2211520001", email: "mhs@example.test" },
    topic: null,
    academicYear: null,
    document: null,
    proposalDocument: null,
    uploadedFiles: [],
    supervisors: [{ id: "sup-1", name: "Dr. P1", email: "p1@example.test", role: "Pembimbing 1" }],
    examiners: [],
    stats: {
      totalGuidances: 0,
      totalSessions: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      inProgressMilestones: 0,
      overdueMilestones: 0,
      milestoneProgress: 0,
    },
    seminarApproval: { pembimbing1: false, pembimbing2: false },
    ...overrides,
  };
}

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
      success: true,
      thesisId: "thesis-1",
      supervisors: [{ id: "sup-1", name: "Dr. P1", email: "p1@example.test", role: "Pembimbing 1" }],
    });
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis());
    vi.mocked(getStudentThesisHistory).mockResolvedValue({ success: true, theses: [] });
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

  it("shows the status label (not the enum value) and 'Belum ada dokumen' without a report", async () => {
    renderWithLayout(<TugasAkhirOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Informasi Tugas Akhir")).toBeInTheDocument();
    });

    expect(screen.getByText("Penelitian")).toBeInTheDocument();
    expect(screen.queryByText(/^research$/i)).not.toBeInTheDocument();
    expect(screen.getByText("Belum ada dokumen")).toBeInTheDocument();
  });

  // Guidance revival: the "Tugas Akhir Belum Aktif" proposal-phase copy came from the
  // post-baseline TA-04 alignment and was released with it.

});
