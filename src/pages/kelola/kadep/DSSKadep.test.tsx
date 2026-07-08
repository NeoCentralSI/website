import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import DSSKadep from "./DSSKadep";
import { advisorRequestService } from "@/services/advisorRequest.service";
import { getSupervisor2KadepRequests } from "@/services/lecturerGuidance.service";
import { metopenTitleService } from "@/services/metopenTitle.service";

vi.mock("@/services/advisorRequest.service", () => ({
  advisorRequestService: {
    getKadepQueue: vi.fn(),
    decideRequest: vi.fn(),
    assignAdvisor: vi.fn(),
    getBatchTA04: vi.fn(),
    finalizeBatchTA04: vi.fn(),
  },
}));

vi.mock("@/services/lecturerGuidance.service", () => ({
  getSupervisor2KadepRequests: vi.fn(),
}));

vi.mock("@/services/metopenTitle.service", () => ({
  metopenTitleService: {
    getPendingTitleReports: vi.fn(),
    reviewTitleReport: vi.fn(),
    getKadepTitleReportHistory: vi.fn(),
    downloadKadepTitleApprovalDocument: vi.fn(),
  },
}));

vi.mock("@/components/bimbingan/Supervisor2KadepSection", () => ({
  Supervisor2KadepSection: () => <div>Supervisor 2 Section</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithRoute(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const layoutContext = {
    setBreadcrumbs: vi.fn(),
    setTitle: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/kelola/tugas-akhir/kadep/pengesahan-judul"]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/kelola/tugas-akhir/kadep/pengesahan-judul" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DSSKadep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(advisorRequestService.getKadepQueue).mockResolvedValue({
      success: true,
      data: {
        escalated: [],
        pendingAssignment: [],
      },
    });
    vi.mocked(getSupervisor2KadepRequests).mockResolvedValue([]);
    vi.mocked(metopenTitleService.getPendingTitleReports).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(metopenTitleService.getKadepTitleReportHistory).mockResolvedValue({
      success: true,
      data: [
        {
          thesisId: "thesis-booking",
          title: "Judul Frozen TA-04",
          studentName: "Mahasiswa Booking",
          studentNim: "2200000001",
          supervisors: "Dr. P1",
          proposalStatus: null,
          isProposal: true,
          ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
          activeAcademicYear: null,
          activePromotedAt: null,
          reviewedAt: "2026-07-07T08:00:00.000Z",
          reviewedByName: "Ketua Departemen",
          reviewNotes: null,
          academicYear: { id: "ay-1", year: "2025/2026", semester: "genap" },
          titleApprovalDocument: {
            id: "doc-ta04",
            fileName: "TA04_BATCH_2025-2026_Genap.pdf",
          },
          documentKind: "batch",
          ta04BatchEligible: true,
          ta04BatchBlock: null,
        },
        {
          thesisId: "thesis-active",
          title: "Judul Promoted",
          studentName: "Mahasiswa Aktif",
          studentNim: "2200000002",
          supervisors: "Dr. P1",
          proposalStatus: "accepted",
          isProposal: false,
          ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
          activeAcademicYear: { id: "ay-2", year: "2026/2027", semester: "ganjil" },
          activePromotedAt: "2026-08-15T08:00:00.000Z",
          reviewedAt: "2026-07-07T08:00:00.000Z",
          reviewedByName: "Ketua Departemen",
          reviewNotes: null,
          academicYear: { id: "ay-1", year: "2025/2026", semester: "genap" },
          titleApprovalDocument: {
            id: "doc-ta04",
            fileName: "TA04_BATCH_2025-2026_Genap.pdf",
          },
          documentKind: "batch",
          ta04BatchEligible: true,
          ta04BatchBlock: null,
        },
      ],
    });
  });

  it("opens /pengesahan-judul as early TA-04 batch, not legacy manual review", async () => {
    renderWithRoute(<DSSKadep />);

    await waitFor(() => {
      expect(screen.getByText("Formulir TA-04 Awal per Periode")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Batch TA-04 Awal").length).toBeGreaterThan(0);
    expect(screen.getByText(/booking TA-01\/TA-02/i)).toBeInTheDocument();
    expect(screen.getByText("TA-04 terbit, booking")).toBeInTheDocument();
    expect(screen.getByText("Beban aktif TA")).toBeInTheDocument();
    expect(screen.queryByText("Legacy Review TA-04 Manual")).not.toBeInTheDocument();
    expect(screen.queryByText(/Verifikasi prasyarat jalur legacy/i)).not.toBeInTheDocument();
  });
});
