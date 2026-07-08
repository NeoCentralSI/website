import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { MetopelOverviewTab } from "./MetopelOverviewTab";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { metopenTitleService } from "@/services/metopenTitle.service";

vi.mock("@/hooks/shared", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/shared")>("@/hooks/shared");
  return {
    ...actual,
    useAdvisorAccessState: vi.fn(),
    useRole: vi.fn(),
  };
});

vi.mock("@/services/metopenTitle.service", () => ({
  metopenTitleService: {
    getMyProposalApproval: vi.fn(),
    getMySeminarEligibilitySnapshot: vi.fn(),
    getMyAssessmentHistory: vi.fn(),
    getMyArchive: vi.fn(),
    syncMyProposalQueue: vi.fn(),
    downloadMyTitleApprovalDocument: vi.fn().mockResolvedValue(undefined),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MetopelOverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(metopenTitleService.syncMyProposalQueue).mockResolvedValue({
      success: true,
      data: {},
    });
  });

  it("explains TA-01 and TA-02 as alternative entry routes, not universal sequential steps", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: null,
        thesisTitle: null,
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canViewCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason:
          "Silakan mulai pengajuan awal pembimbing dan judul. Gunakan TA-01 untuk pengajuan normal ke dosen tujuan, atau TA-02 digital bila usulan perlu diproses melalui departemen.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Pengajuan Awal Pembimbing dan Judul"),
    ).toBeInTheDocument();
    expect(screen.getByText("TA-01 / TA-02")).toBeInTheDocument();
    expect(
      screen.getByText(/TA-01 dipakai saat mahasiswa sudah memiliki calon dosen pembimbing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/TA-02 dipakai saat mahasiswa belum memiliki calon dosen pembimbing/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Submit Proposal Final")).toBeInTheDocument();
    expect(screen.getByText("Proposal Final")).toBeInTheDocument();
    expect(
      screen.queryByText("Pengajuan Calon Pembimbing"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Penetapan Topik dan Rencana Judul"),
    ).not.toBeInTheDocument();
  });

  it("shows TA-04 status without manual sync or title-report CTA", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-1",
            lecturerId: "lecturer-1",
            name: "Dosen Pembimbing",
            email: "lecturer@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
        ],
        hasOfficialSupervisor: true,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: true,
        reason: "Anda sudah memiliki dosen pembimbing resmi.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-1",
          title: "Judul Uji",
          proposalStatus: "submitted",
          queueReadiness: {
            ready: true,
            block: null,
            proposalStatus: "submitted",
          },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-04-07T08:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });

    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: {
        eligible: false,
        reason: "Metopel sudah lulus, tetapi judul/proposal belum disahkan oleh KaDep.",
      },
    });

    vi.mocked(metopenTitleService.getMyAssessmentHistory).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Status TA-04 Awal")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("Legacy Review KaDep")).toHaveLength(2);
    });

    expect(
      screen.queryByRole("button", { name: /Sinkronkan Status/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Proposal final masuk alur KaDep")).toBeInTheDocument();
    expect(screen.queryByText("Lapor Judul TA")).not.toBeInTheDocument();
  });

  it("explains TA-04 queue block when thesis course is not confirmed by SIA", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-1",
            lecturerId: "lecturer-1",
            name: "Dosen Pembimbing",
            email: "lecturer@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
        ],
        hasOfficialSupervisor: true,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: true,
        reason: "Anda sudah memiliki dosen pembimbing resmi.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-1",
          title: "Judul Uji",
          proposalStatus: null,
          queueReadiness: {
            ready: false,
            block: "ta_course_not_confirmed",
            proposalStatus: null,
          },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-04-07T08:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });

    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: {
        eligible: false,
        reason: "Metopel sudah lulus, tetapi judul/proposal belum disahkan oleh KaDep.",
        requirements: {
          metopelPassed: true,
          metopelScore: 90,
          proposalAccepted: false,
          proposalStatus: null,
        },
      },
    });

    vi.mocked(metopenTitleService.getMyAssessmentHistory).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("Menunggu MK Tugas Akhir SIA")).toHaveLength(2);
    });

    expect(
      screen.getAllByText(/snapshot SIA belum mencatat Anda mengambil mata kuliah Tugas Akhir/i)[0],
    ).toBeInTheDocument();
  });

  it("shows early TA-04 document while Metopel remains active", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-dimas",
        thesisId: "thesis-dimas",
        thesisTitle: "Judul Berjalan",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-1",
            lecturerId: "lecturer-1",
            name: "Dosen Pembimbing",
            email: "lecturer@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
        ],
        hasOfficialSupervisor: true,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: true,
        reason: "Booking pembimbing sudah disetujui.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-dimas",
          title: "Judul Berjalan",
          isProposal: true,
          proposalStatus: null,
          ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
          ta04AssignmentTitle: "Judul Frozen TA-04",
          ta04AssignmentSupervisorNames: "Dosen Pembimbing",
          activeAcademicYearId: null,
          activePromotedAt: null,
          queueReadiness: {
            ready: false,
            block: "scores_not_finalized",
            proposalStatus: null,
          },
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
    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: {
        eligible: false,
        reason: "Menunggu TA-03 final.",
      },
    });
    vi.mocked(metopenTitleService.getMyAssessmentHistory).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("TA-04 Terbit, Booking").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Formulir TA-04 awal")).toBeInTheDocument();
    expect(screen.getByText("TA04_BATCH_2025-2026_Genap.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unduh PDF/i })).toBeInTheDocument();
    expect(metopenTitleService.getMyArchive).not.toHaveBeenCalled();
  });

  it("does not auto-sync lifecycle from the student overview page", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-dimas",
        thesisId: "thesis-dimas",
        thesisTitle: "Judul Dimas",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-1",
            lecturerId: "lecturer-1",
            name: "Dosen Pembimbing",
            email: "lecturer@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
        ],
        hasOfficialSupervisor: true,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: true,
        reason: "Anda sudah memiliki dosen pembimbing resmi.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-dimas",
          title: "Judul Dimas",
          proposalStatus: null,
          queueReadiness: {
            ready: true,
            block: null,
            proposalStatus: "ready",
          },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-06-23T00:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });
    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: {},
    });
    vi.mocked(metopenTitleService.getMyAssessmentHistory).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("Siap Promosi Aktif").length).toBeGreaterThan(0);
    });
    expect(metopenTitleService.syncMyProposalQueue).not.toHaveBeenCalled();
  });
});
