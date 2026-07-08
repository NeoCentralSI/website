import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import TugasAkhirOverviewPage from "./Overview";
import {
  getMyThesisDetail,
  getPendingSupervisor2Request,
  getProposalSubmissionStatus,
  getStudentSupervisors,
  getStudentThesisHistory,
} from "@/services/studentGuidance.service";
import { metopenTitleService } from "@/services/metopenTitle.service";

vi.mock("@/services/studentGuidance.service", () => ({
  getStudentSupervisors: vi.fn(),
  getMyThesisDetail: vi.fn(),
  getStudentThesisHistory: vi.fn(),
  getProposalSubmissionStatus: vi.fn(),
  getPendingSupervisor2Request: vi.fn(),
}));

vi.mock("@/services/metopenTitle.service", () => ({
  metopenTitleService: {
    getMyProposalApproval: vi.fn(),
    getMySeminarEligibilitySnapshot: vi.fn(),
  },
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

vi.mock("@/components/thesis/ProposalVersionHistory", () => ({
  ProposalVersionHistory: () => <div>Proposal Version History</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
      title: "Judul TA",
      status: "Bimbingan",
      rating: "ONGOING",
      deadlineDate: null,
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
    vi.mocked(getProposalSubmissionStatus).mockResolvedValue({
      thesisId: "thesis-1",
      hasSupervisor: true,
      proposalStatus: null,
      uploadLocked: false,
      uploadLockedReason: null,
      latestVersion: {
        id: "version-1",
        version: 1,
        isLatest: true,
        fileName: "proposal.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        description: null,
        createdAt: "2026-07-07T08:00:00.000Z",
        url: null,
      },
      finalProposalVersion: null,
    });
    vi.mocked(getPendingSupervisor2Request).mockResolvedValue(null);
    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: {
        eligible: false,
        reason: "Menunggu TA-03 final dan KRS Tugas Akhir.",
      },
    });
  });

  it("does not activate full thesis state when only early TA-04 has been issued", async () => {
    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-1",
          title: "Judul TA",
          isProposal: true,
          proposalStatus: null,
          ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
          ta04AssignmentTitle: "Judul Frozen TA-04",
          ta04AssignmentSupervisorNames: "Dr. P1",
          activeAcademicYearId: null,
          activePromotedAt: null,
          titleApprovalDocumentId: "doc-ta04",
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-07-07T08:00:00.000Z",
          titleApprovalDocument: {
            id: "doc-ta04",
            fileName: "TA04_BATCH_2025-2026_Genap.pdf",
            filePath: "uploads/documents/ta04/TA04_BATCH_2025-2026_Genap.pdf",
          },
        },
      },
    });

    renderWithLayout(<TugasAkhirOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("5. Promosi Aktif Tugas Akhir")).toBeInTheDocument();
    });

    expect(screen.getByText("Belum promosi aktif")).toBeInTheDocument();
    expect(screen.queryByText("Beban aktif TA")).not.toBeInTheDocument();
  });

  it("shows active thesis load only after automatic promotion", async () => {
    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-1",
          title: "Judul TA",
          isProposal: false,
          proposalStatus: "accepted",
          ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
          ta04AssignmentTitle: "Judul Frozen TA-04",
          ta04AssignmentSupervisorNames: "Dr. P1",
          activeAcademicYearId: "ay-active",
          activePromotedAt: "2026-08-15T08:00:00.000Z",
          titleApprovalDocumentId: "doc-ta04",
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-08-15T08:00:00.000Z",
          titleApprovalDocument: {
            id: "doc-ta04",
            fileName: "TA04_BATCH_2025-2026_Genap.pdf",
            filePath: "uploads/documents/ta04/TA04_BATCH_2025-2026_Genap.pdf",
          },
        },
      },
    });

    renderWithLayout(<TugasAkhirOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Beban aktif TA")).toBeInTheDocument();
    });
  });
});
