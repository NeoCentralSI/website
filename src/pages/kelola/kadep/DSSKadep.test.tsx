import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    getRecommendations: vi.fn(),
    getAssignableLecturers: vi.fn(),
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

vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
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
    vi.stubGlobal(
      "URL",
      class {
        static createObjectURL = vi.fn(() => "blob:ta04-preview");
        static revokeObjectURL = vi.fn();
      } as unknown as typeof URL,
    );
    vi.mocked(advisorRequestService.getKadepQueue).mockResolvedValue({
      success: true,
      data: {
        escalated: [],
        pendingAssignment: [],
      },
    });
    vi.mocked(advisorRequestService.getRecommendations).mockResolvedValue({
      success: true,
      data: { alternatives: [] },
    } as Awaited<ReturnType<typeof advisorRequestService.getRecommendations>>);
    vi.mocked(advisorRequestService.getAssignableLecturers).mockResolvedValue({
      success: true,
      data: { lecturers: [] },
    } as Awaited<ReturnType<typeof advisorRequestService.getAssignableLecturers>>);
    vi.mocked(getSupervisor2KadepRequests).mockResolvedValue([]);
    vi.mocked(metopenTitleService.getPendingTitleReports).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(advisorRequestService.getBatchTA04).mockResolvedValue(
      new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    );
    vi.mocked(advisorRequestService.finalizeBatchTA04).mockResolvedValue({
      success: true,
      data: {
        documentId: "doc-1",
        fileName: "TA04-Batch-Genap.pdf",
        storedFileName: "TA04_BATCH_Genap.pdf",
        filePath: "uploads/documents/ta04/TA04_BATCH_Genap.pdf",
        thesisCount: 2,
        academicYear: "Genap 2025/2026",
        alreadyFinalized: false,
      },
    } as Awaited<ReturnType<typeof advisorRequestService.finalizeBatchTA04>>);
    vi.mocked(metopenTitleService.getKadepTitleReportHistory).mockResolvedValue({
      success: true,
      data: [
        {
          thesisId: "thesis-pending-batch",
          title: "Judul Booking Baru",
          studentName: "Mahasiswa Baru Booking",
          studentNim: "2200000000",
          supervisors: "Dr. P1",
          proposalStatus: null,
          isProposal: true,
          ta04AssignmentIssuedAt: null,
          activeAcademicYear: null,
          activePromotedAt: null,
          reviewedAt: null,
          reviewedByName: null,
          reviewNotes: null,
          academicYear: { id: "ay-1", year: "2025/2026", semester: "genap" },
          titleApprovalDocument: null,
          documentKind: null,
          ta04BatchEligible: true,
          ta04BatchBlock: null,
          listSection: "batch_cohort",
        },
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
          listSection: "batch_cohort",
        },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens /pengesahan-judul as early TA-04 batch without promoted history rows", async () => {
    renderWithRoute(<DSSKadep />);

    await waitFor(() => {
      expect(screen.getByText("Formulir TA-04 Awal per Periode")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Batch TA-04 Awal").length).toBeGreaterThan(0);
    expect(screen.queryByText("Finalisasi Booking")).not.toBeInTheDocument();
    expect(screen.getByText("Daftar Batch Aktif")).toBeInTheDocument();
    expect(screen.getByText("Booking belum batch")).toBeInTheDocument();
    expect(screen.getByText("TA-04 terbit, booking")).toBeInTheDocument();
    expect(screen.queryByText("Beban aktif TA")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Unduh Pratinjau Batch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Perbarui Formulir TA-04/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Batch Sudah Sinkron/i })).not.toBeInTheDocument();
    const downloadButtons = screen.getAllByRole("button", { name: /Unduh \(perlu perbarui\)/i });
    expect(downloadButtons.length).toBeGreaterThan(0);
    expect(downloadButtons.every((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getByText(/Batch belum sinkron/i)).toBeInTheDocument();

    fireEvent.click(downloadButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/Batch belum diperbarui/i)).toBeInTheDocument();
    });
    expect(metopenTitleService.downloadKadepTitleApprovalDocument).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Perbarui Formulir TA-04/i })).toBeInTheDocument();
  });

  it("requires two-step modal preview before finalize", async () => {
    renderWithRoute(<DSSKadep />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Perbarui Formulir TA-04/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Perbarui Formulir TA-04/i }));

    await waitFor(() => {
      expect(screen.getByTitle("Pratinjau TA-04")).toBeInTheDocument();
    });
    expect(advisorRequestService.getBatchTA04).toHaveBeenCalledWith("ay-1");
    expect(screen.getByRole("button", { name: /Lanjut konfirmasi/i })).toBeEnabled();
    expect(advisorRequestService.finalizeBatchTA04).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Lanjut konfirmasi/i }));
    expect(screen.getByRole("button", { name: /Ya, Finalisasi Formulir/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Ya, Finalisasi Formulir/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Ya, Finalisasi Formulir/i }));
    await waitFor(() => {
      expect(advisorRequestService.finalizeBatchTA04).toHaveBeenCalledWith("ay-1");
    });
  });

  it("shows a repair task instead of admitting a booking without active P1 to the TA-04 cohort", async () => {
    vi.mocked(metopenTitleService.getKadepTitleReportHistory).mockResolvedValue({
      success: true,
      data: [
        {
          thesisId: "thesis-missing-p1",
          title: "Judul Perlu Perbaikan",
          studentName: "Mahasiswa Tanpa P1",
          studentNim: "2200000002",
          supervisors: "-",
          proposalStatus: null,
          isProposal: true,
          ta04AssignmentIssuedAt: null,
          activeAcademicYear: null,
          activePromotedAt: null,
          reviewedAt: null,
          reviewedByName: null,
          reviewNotes: null,
          academicYear: { id: "ay-1", year: "2025/2026", semester: "genap" },
          titleApprovalDocument: null,
          documentKind: null,
          ta04BatchEligible: false,
          ta04BatchBlock: "no_active_pembimbing_1",
          repairRequired: true,
          listSection: "history_other",
        },
      ],
    });

    renderWithRoute(<DSSKadep />);

    await waitFor(() => {
      expect(screen.getByText("Data Booking Perlu Diperbaiki")).toBeInTheDocument();
    });

    expect(screen.getByText("Mahasiswa Tanpa P1")).toBeInTheDocument();
    expect(screen.getByText(/P1 aktif belum tercatat/i)).toBeInTheDocument();
    expect(screen.queryByText("Daftar Batch Aktif")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Finalisasi TA-04 Awal/i })).not.toBeInTheDocument();
  });

  it("shows full TA-02 form fields instead of Path C quota hero on Penetapan Dosen tab", async () => {
    vi.mocked(advisorRequestService.getKadepQueue).mockResolvedValue({
      success: true,
      data: {
        escalated: [
          {
            id: "req-ta02-1",
            studentId: "student-1",
            lecturerId: null,
            topicId: "topic-1",
            proposedTitle: "Rancang Bangun Modul Proposal",
            backgroundSummary: "Latar belakang singkat untuk pengujian TA-02 KaDep.",
            problemStatement: "Tujuan permasalahan yang diajukan mahasiswa pada TA-02.",
            proposedSolution: "Rencana solusi yang diajukan pada formulir TA-02.",
            researchObject: "Objek penelitian TA-02",
            researchPermitStatus: "in_process",
            justificationText: null,
            studentJustification: null,
            requestType: "ta_02",
            status: "pending_kadep",
            routeType: "dept",
            rejectionReason: null,
            kadepNotes: null,
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
            withdrawnAt: null,
            withdrawCount: 0,
            reviewedAt: null,
            lecturerRespondedAt: null,
            student: {
              id: "student-1",
              user: { id: "user-mhs", fullName: "Mahasiswa TA Dua", identityNumber: "2211522000" },
            },
            lecturer: null,
            topic: {
              id: "topic-1",
              name: "Sistem Informasi",
              scienceGroup: { id: "kbk-1", name: "KBK SI" },
            },
            quotaSnapshot: null,
            quotaPreview: null,
          },
        ],
        pendingAssignment: [],
      },
    } as Awaited<ReturnType<typeof advisorRequestService.getKadepQueue>>);

    renderWithRoute(<DSSKadep />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /TA-02 Penetapan Dosen/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /TA-02 Penetapan Dosen/i }));

    await waitFor(() => {
      expect(screen.getByText("Rancang Bangun Modul Proposal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mahasiswa TA Dua"));

    await waitFor(() => {
      expect(screen.getByText("Isi Formulir Pengajuan TA-02")).toBeInTheDocument();
    });

    expect(screen.getByText("Latar belakang singkat untuk pengujian TA-02 KaDep.")).toBeInTheDocument();
    expect(screen.getByText("Tujuan permasalahan yang diajukan mahasiswa pada TA-02.")).toBeInTheDocument();
    expect(screen.getByText("Rencana solusi yang diajukan pada formulir TA-02.")).toBeInTheDocument();
    expect(screen.getByText("Objek penelitian TA-02")).toBeInTheDocument();
    expect(screen.getByText("Rekomendasi Dosen Pembimbing")).toBeInTheDocument();
    expect(screen.queryByText("Justifikasi Akademik Mahasiswa")).not.toBeInTheDocument();
    expect(screen.queryByText("Snapshot Kuota Dosen")).not.toBeInTheDocument();
  });
});
