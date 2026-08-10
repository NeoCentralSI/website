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
      screen.getByText(/Ajukan TA-01 ke calon pembimbing, atau TA-02 melalui departemen/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Ajukan proposal final")).toBeInTheDocument();
    expect(screen.getByText("Proposal Final")).toBeInTheDocument();
    expect(
      screen.queryByText("Pengajuan Calon Pembimbing"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Penetapan Topik dan Rencana Judul"),
    ).not.toBeInTheDocument();
  });

  it("keeps private drafts available but explains that booking waits for TA-04", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-booked",
        thesisId: "thesis-booked",
        thesisTitle: "Judul Draf",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasBookedSupervisor: true,
        hasOfficialSupervisor: false,
        guidanceGateOpen: false,
        guidanceGateReason:
          "Booking pembimbing sudah disetujui, tetapi TA-04 belum difinalisasi KaDep.",
        hasBlockingRequest: true,
        blockingRequest: null,
        requestStatus: "booking_approved",
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: false,
        reason: "Booking pembimbing sudah disetujui, menunggu TA-04.",
        nextStep: "wait_ta04_assignment",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-booked",
          title: "Judul Draf",
          proposalStatus: null,
          hasBookedSupervisor: true,
          hasOfficialSupervisor: false,
          canUploadProposal: true,
          canSubmitFinalProposal: false,
          canUseInformalLog: false,
          guidanceGateOpen: false,
          guidanceGateReason:
            "Booking pembimbing sudah disetujui, tetapi TA-04 belum difinalisasi KaDep.",
          queueReadiness: { ready: false, block: "ta04_not_issued", proposalStatus: null },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-07-10T08:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Booking disetujui, menunggu TA-04")).toBeInTheDocument();
    });
    expect(screen.getByText("Menunggu TA-04 KaDep")).toBeInTheDocument();
    expect(screen.getAllByText(/draf pribadi boleh disimpan/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("Boleh unggah proposal final")).not.toBeInTheDocument();
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
        hasBookedSupervisor: true,
        hasOfficialSupervisor: true,
        guidanceGateOpen: true,
        guidanceGateReason: null,
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
          hasBookedSupervisor: true,
          hasOfficialSupervisor: true,
          ta04AssignmentIssuedAt: "2026-04-07T07:00:00.000Z",
          canUploadProposal: true,
          canSubmitFinalProposal: true,
          canUseInformalLog: true,
          guidanceGateOpen: true,
          guidanceGateReason: null,
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
      expect(screen.getAllByText("TA-04 Terbit, Booking").length).toBeGreaterThan(0);
    });

    expect(
      screen.queryByRole("button", { name: /Sinkronkan Status/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Penugasan awal dicatat di sistem")).toBeInTheDocument();
    expect(screen.queryByText("Lapor Judul TA")).not.toBeInTheDocument();
  });

  it("shows assigned supervisor names on Overview after TA-04 so students need not open Cari Pembimbing", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-official",
        thesisId: "thesis-official",
        thesisTitle: "Judul Resmi",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-p1",
            lecturerId: "lecturer-p1",
            name: "Dr. Andi Pembimbing",
            email: "andi@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
          {
            id: "supervisor-p2",
            lecturerId: "lecturer-p2",
            name: "Dr. Budi Pendamping",
            email: "budi@example.com",
            avatarUrl: null,
            role: "Pembimbing 2",
          },
        ],
        hasBookedSupervisor: true,
        hasOfficialSupervisor: true,
        guidanceGateOpen: true,
        guidanceGateReason: null,
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
          id: "thesis-official",
          title: "Judul Resmi",
          proposalStatus: null,
          hasBookedSupervisor: true,
          hasOfficialSupervisor: true,
          ta04AssignmentIssuedAt: "2026-08-01T07:00:00.000Z",
          canUploadProposal: true,
          canSubmitFinalProposal: true,
          canUseInformalLog: true,
          guidanceGateOpen: true,
          guidanceGateReason: null,
          queueReadiness: { ready: false, block: "scores_not_finalized", proposalStatus: null },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-08-01T08:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });

    vi.mocked(metopenTitleService.getMySeminarEligibilitySnapshot).mockResolvedValue({
      success: true,
      data: { eligible: false, reason: "Menunggu TA-03 final." },
    });

    vi.mocked(metopenTitleService.getMyAssessmentHistory).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Dosen Pembimbing")).toBeInTheDocument();
    });

    expect(screen.getByText("Dr. Andi Pembimbing")).toBeInTheDocument();
    expect(screen.getByText("Dr. Budi Pendamping")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif").length).toBeGreaterThanOrEqual(2);
  });

  it("shows booked supervisor name on Overview while waiting for TA-04", async () => {
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
    } as unknown as ReturnType<typeof useRole>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-booked-named",
        thesisId: "thesis-booked-named",
        thesisTitle: "Judul Booking",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasBookedSupervisor: true,
        hasOfficialSupervisor: false,
        guidanceGateOpen: false,
        guidanceGateReason:
          "Booking pembimbing sudah disetujui, tetapi TA-04 belum difinalisasi KaDep.",
        hasBlockingRequest: true,
        blockingRequest: {
          id: "req-booked",
          studentId: "student-booked-named",
          lecturerId: "lecturer-booked",
          topicId: null,
          proposedTitle: "Judul Booking",
          backgroundSummary: null,
          problemStatement: null,
          proposedSolution: null,
          researchObject: null,
          researchPermitStatus: null,
          justificationText: null,
          studentJustification: null,
          requestType: "ta01",
          status: "booking_approved",
          routeType: "normal",
          rejectionReason: null,
          kadepNotes: null,
          createdAt: "2026-08-01T08:00:00.000Z",
          updatedAt: "2026-08-01T08:00:00.000Z",
          withdrawnAt: null,
          withdrawCount: 0,
          reviewedAt: null,
          lecturerRespondedAt: null,
          student: {
            id: "student-booked-named",
            user: { id: "user-student", fullName: "Mahasiswa Uji", identityNumber: "2211522028" },
          },
          lecturer: {
            id: "lecturer-booked",
            user: { id: "user-lecturer", fullName: "Dr. Calon Pembimbing" },
          },
          topic: null,
        },
        requestStatus: "booking_approved",
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        canOpenLogbook: false,
        reason: "Booking pembimbing sudah disetujui, menunggu TA-04.",
        nextStep: "wait_ta04_assignment",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(metopenTitleService.getMyProposalApproval).mockResolvedValue({
      success: true,
      data: {
        thesis: {
          id: "thesis-booked-named",
          title: "Judul Booking",
          proposalStatus: null,
          hasBookedSupervisor: true,
          hasOfficialSupervisor: false,
          canUploadProposal: true,
          canSubmitFinalProposal: false,
          canUseInformalLog: false,
          guidanceGateOpen: false,
          guidanceGateReason:
            "Booking pembimbing sudah disetujui, tetapi TA-04 belum difinalisasi KaDep.",
          queueReadiness: { ready: false, block: "ta04_not_issued", proposalStatus: null },
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-08-01T08:00:00.000Z",
          titleApprovalDocument: null,
        },
      },
    });

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Dosen Pembimbing")).toBeInTheDocument();
    });

    expect(screen.getByText("Dr. Calon Pembimbing")).toBeInTheDocument();
    expect(screen.getByText("Booking disetujui")).toBeInTheDocument();
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
        hasBookedSupervisor: true,
        hasOfficialSupervisor: true,
        guidanceGateOpen: true,
        guidanceGateReason: null,
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
          hasBookedSupervisor: true,
          hasOfficialSupervisor: true,
          canUploadProposal: true,
          canSubmitFinalProposal: true,
          canUseInformalLog: true,
          guidanceGateOpen: true,
          guidanceGateReason: null,
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
      screen.getAllByText(/Menunggu SIA mencatat mata kuliah Tugas Akhir/i)[0],
    ).toBeInTheDocument();
  });

  it("shows early TA-04 system status without PDF download while Metopel remains active", async () => {
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
        hasBookedSupervisor: true,
        hasOfficialSupervisor: true,
        guidanceGateOpen: true,
        guidanceGateReason: null,
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
          hasBookedSupervisor: true,
          hasOfficialSupervisor: true,
          canUploadProposal: true,
          canSubmitFinalProposal: true,
          canUseInformalLog: true,
          guidanceGateOpen: true,
          guidanceGateReason: null,
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
          titleApprovalDocumentId: null,
          proposalReviewNotes: null,
          proposalReviewedAt: null,
          updatedAt: "2026-07-07T08:00:00.000Z",
          titleApprovalDocument: null,
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

    expect(screen.getByText(/Penugasan awal dicatat di sistem/i)).toBeInTheDocument();
    expect(screen.queryByText("TA04_BATCH_2025-2026_Genap.pdf")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Unduh PDF/i })).not.toBeInTheDocument();
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
        hasBookedSupervisor: true,
        hasOfficialSupervisor: true,
        guidanceGateOpen: true,
        guidanceGateReason: null,
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
          hasBookedSupervisor: true,
          hasOfficialSupervisor: true,
          canUploadProposal: true,
          canSubmitFinalProposal: true,
          canUseInformalLog: true,
          guidanceGateOpen: true,
          guidanceGateReason: null,
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
