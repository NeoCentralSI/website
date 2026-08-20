import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import CariPembimbing from "./CariPembimbing";
import { useAdvisorAccessState } from "@/hooks/shared";
import { getApiUrl } from "@/config/api";
import { advisorRequestService, type AdvisorRequestDraft } from "@/services/advisorRequest.service";
import { apiRequest } from "@/services/auth.service";

vi.mock("@/hooks/shared", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/shared")>("@/hooks/shared");
  return {
    ...actual,
    useAdvisorAccessState: vi.fn(),
  };
});

vi.mock("@/config/api", async () => {
  const actual = await vi.importActual<typeof import("@/config/api")>("@/config/api");
  return {
    ...actual,
    getApiUrl: vi.fn((path: string) => path),
  };
});

vi.mock("@/services/auth.service", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/services/advisorRequest.service", () => ({
  advisorRequestService: {
    getCatalog: vi.fn(),
    getMyDraft: vi.fn(),
    getMyRequests: vi.fn(),
    saveDraft: vi.fn(),
    submitRequest: vi.fn(),
    withdrawRequest: vi.fn(),
  },
}));

vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
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

describe("CariPembimbing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(advisorRequestService.getMyDraft).mockResolvedValue({
      success: true,
      data: {
        id: null,
        studentId: "student-1",
        lecturerId: null,
        topicId: null,
        proposedTitle: null,
        backgroundSummary: null,
        problemStatement: null,
        proposedSolution: null,
        researchObject: null,
        researchPermitStatus: null,
        justificationText: null,
        studentJustification: null,
        attachmentId: null,
        attachment: null,
        lecturer: null,
        topic: null,
        lastSubmittedAt: null,
        createdAt: null,
        updatedAt: null,
        requestType: "ta_02",
        source: "empty",
      },
    });
  });

  it("should provide a TA-02 department route when student has no candidate supervisor yet", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: null,
        thesisTitle: null,
        thesisStatus: "Metopel",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenEligibilitySource: "sia",
        metopenEligibilityUpdatedAt: "2026-04-23T10:00:00.000Z",
        metopenReadOnly: false,
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        latestRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canViewCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason: "Silakan mulai pengajuan awal pembimbing dan judul.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(advisorRequestService.getCatalog).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(getApiUrl).mockReturnValue("/topics");
    vi.mocked(apiRequest).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<CariPembimbing />, { wrapper: createWrapper() });
    fireEvent.click(await screen.findByRole("button", { name: /^Pilihan Dosen$/i }));

    const departmentRouteButton = await screen.findByRole("button", { name: /Gunakan jalur TA-02/i });
    expect(departmentRouteButton).toBeInTheDocument();
    expect(
      screen.getByText(/belum punya calon dosen pembimbing/i),
    ).toBeInTheDocument();

    fireEvent.click(departmentRouteButton);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Kirim TA-02 ke KaDep/i }),
    ).toBeInTheDocument();
  });

  it("should autosave TA-02 safely when a legacy draft has no student justification field", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: null,
        thesisTitle: null,
        thesisStatus: "Metopel",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenEligibilitySource: "sia",
        metopenEligibilityUpdatedAt: "2026-04-23T10:00:00.000Z",
        metopenReadOnly: false,
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        latestRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canViewCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason: "Silakan mulai pengajuan awal pembimbing dan judul.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const legacyDraft = {
      id: null,
      studentId: "student-1",
      lecturerId: null,
      topicId: null,
      proposedTitle: null,
      backgroundSummary: null,
      problemStatement: null,
      proposedSolution: null,
      researchObject: null,
      researchPermitStatus: null,
      justificationText: null,
      attachmentId: null,
      attachment: null,
      lecturer: null,
      topic: null,
      lastSubmittedAt: null,
      createdAt: null,
      updatedAt: null,
      requestType: "ta_02",
      source: "empty",
    } as unknown as AdvisorRequestDraft;

    vi.mocked(advisorRequestService.getMyDraft).mockResolvedValue({
      success: true,
      data: legacyDraft,
    });
    vi.mocked(advisorRequestService.getCatalog).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(advisorRequestService.saveDraft).mockResolvedValue({
      success: true,
      data: {
        ...legacyDraft,
        proposedTitle: "Sistem Pakar Penjadwalan",
        justificationText: null,
        studentJustification: null,
      },
    });
    vi.mocked(getApiUrl).mockReturnValue("/topics");
    vi.mocked(apiRequest).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<CariPembimbing />, { wrapper: createWrapper() });
    fireEvent.click(await screen.findByRole("button", { name: /^Pilihan Dosen$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Gunakan jalur TA-02/i }));

    fireEvent.change(await screen.findByPlaceholderText(/Judul rencana tugas akhir/i), {
      target: { value: "Sistem Pakar Penjadwalan" },
    });

    await waitFor(
      () => {
        expect(advisorRequestService.saveDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            lecturerId: null,
            proposedTitle: "Sistem Pakar Penjadwalan",
            justificationText: null,
            studentJustification: null,
          }),
        );
      },
      { timeout: 2500 },
    );
  });

  it("should explain dosen-first Path C routing for red-quota lecturers", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: null,
        thesisTitle: null,
        thesisStatus: "Metopel",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenEligibilitySource: "sia",
        metopenEligibilityUpdatedAt: "2026-04-23T10:00:00.000Z",
        metopenReadOnly: false,
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        latestRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canViewCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason: "Silakan mulai pengajuan awal pembimbing dan judul.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(advisorRequestService.getCatalog).mockResolvedValue({
      success: true,
      data: [
        {
          lecturerId: "lecturer-red",
          fullName: "Dosen Merah",
          identityNumber: "19800101",
          email: "red@example.com",
          avatarUrl: null,
          scienceGroup: { id: "kbk-1", name: "AI" },
          quotaMax: 8,
          activeTheses: 6,
          activeCount: 6,
          normalAvailable: 0,
          trafficLight: "red",
          supervisedTopics: [],
        },
      ],
    });
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(getApiUrl).mockReturnValue("/topics");
    vi.mocked(apiRequest).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<CariPembimbing />, { wrapper: createWrapper() });
    fireEvent.click(await screen.findByRole("button", { name: /^Pilihan Dosen$/i }));

    expect(await screen.findByRole("button", { name: /Ajukan dengan justifikasi/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Dosen meninjau justifikasi Anda terlebih dahulu/i),
    ).toBeInTheDocument();
  });

  it("disables TA-01 submit when the lecturer closed acceptingRequests", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: null,
        thesisTitle: null,
        thesisStatus: "Metopel",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenEligibilitySource: "sia",
        metopenEligibilityUpdatedAt: "2026-04-23T10:00:00.000Z",
        metopenReadOnly: false,
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        latestRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canViewCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason: "Silakan mulai pengajuan awal pembimbing dan judul.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    vi.mocked(advisorRequestService.getCatalog).mockResolvedValue({
      success: true,
      data: [
        {
          lecturerId: "lecturer-closed",
          fullName: "Dosen Tutup",
          identityNumber: "19800102",
          email: "closed@example.com",
          avatarUrl: null,
          scienceGroup: { id: "kbk-1", name: "AI" },
          quotaMax: 8,
          activeTheses: 1,
          activeCount: 1,
          normalAvailable: 7,
          trafficLight: "green",
          acceptingRequests: false,
          supervisedTopics: ["Sistem Informasi"],
        },
      ],
    });
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(getApiUrl).mockReturnValue("/topics");
    vi.mocked(apiRequest).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<CariPembimbing />, { wrapper: createWrapper() });
    fireEvent.click(await screen.findByRole("button", { name: /^Pilihan Dosen$/i }));

    const closedButton = await screen.findByRole("button", { name: /Tidak menerima pengajuan/i });
    expect(closedButton).toBeDisabled();
    expect(screen.getByText("Sistem Informasi")).toBeInTheDocument();
  });

  it("should show active supervisor state when advisor is already assigned", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Bimbingan",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenEligibilitySource: "sia",
        metopenEligibilityUpdatedAt: "2026-04-23T10:00:00.000Z",
        metopenReadOnly: false,
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
        latestRequest: null,
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
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CariPembimbing />, { wrapper: createWrapper() });

    expect(
      await screen.findByText("Anda sudah memiliki dosen pembimbing resmi.")
    ).toBeInTheDocument();
    expect(screen.getByText("Dosen Pembimbing")).toBeInTheDocument();
    expect(screen.queryByText("Kembali ke Overview")).not.toBeInTheDocument();
  });

  it("should hide withdraw after TA-04 assignment is issued", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Metopel",
        eligibleMetopen: true,
        hasExternalEligibility: true,
        metopenReadOnly: false,
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBookedSupervisor: true,
        ta04AssignmentIssued: true,
        hasBlockingRequest: true,
        blockingRequest: {
          id: "request-1",
          status: "booking_approved",
          lecturerId: "lecturer-1",
          createdAt: "2026-07-10T00:00:00.000Z",
          lecturer: { user: { fullName: "Dosen Pembimbing" } },
        },
        latestRequest: null,
        canBrowseCatalog: false,
        canViewCatalog: true,
        canSubmitRequest: false,
        reason: "TA-04 sudah diterbitkan.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);
    vi.mocked(advisorRequestService.getMyRequests).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CariPembimbing />, { wrapper: createWrapper() });

    expect(await screen.findByText("Penugasan TA-04 terkunci")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tarik Pengajuan/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Penugasan sudah terkunci/i)).toBeInTheDocument();
    expect(screen.getByText(/Perubahan pembimbing menghubungi departemen/i)).toBeInTheDocument();
  });
});
