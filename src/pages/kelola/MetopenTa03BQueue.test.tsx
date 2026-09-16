import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import MetopenTa03BQueue from "./MetopenTa03BQueue";
import { assessmentService, type MetopenScoringHistoryItem, type ScoringQueueItem } from "@/services/assessment.service";

vi.mock("@/services/assessment.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/assessment.service")>();
  return {
    ...actual,
    assessmentService: {
      getMetopenScoringQueue: vi.fn(),
      getMetopenScoringHistory: vi.fn(),
      getMetopenScoreDetail: vi.fn(),
      downloadMetopenScoresXlsx: vi.fn(),
    },
  };
});
vi.mock("@/hooks/shared/useActiveAcademicYear", () => ({
  useActiveAcademicYear: () => ({
    academicYear: { id: "ay-active", year: "2026/2027", semester: "ganjil" },
  }),
}));
vi.mock("@/services/admin.service", () => ({
  getAcademicYearsAPI: vi.fn().mockResolvedValue({
    academicYears: [
      { id: "ay-active", year: "2026/2027", semester: "ganjil", isActive: true },
      { id: "tahun-2025-genap", year: "2025/2026", semester: "genap", isActive: false },
    ],
    meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
  }),
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
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <div>{title}</div>
      {description ? <p>{description}</p> : null}
    </div>
  ),
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
    vi.mocked(assessmentService.getMetopenScoringQueue).mockResolvedValue({
      items: [activeItem],
      meta: { emptyReason: null, emptyReasonText: null, blockedByGate: [], otherPeriods: [] },
    });
    vi.mocked(assessmentService.getMetopenScoringHistory).mockResolvedValue([autoZeroItem]);
    vi.mocked(assessmentService.getMetopenScoreDetail).mockResolvedValue({} as never);

    renderPage();

    await waitFor(() =>
      expect(assessmentService.getMetopenScoringHistory).toHaveBeenCalledWith("ay-active"),
    );
    const metric = await screen.findByRole("button", { name: /Nilai otomatis 0 presensi.*1/i });
    fireEvent.click(metric);

    expect((await screen.findAllByText("Mahasiswa Auto-zero")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Mahasiswa Aktif")).not.toBeInTheDocument();
  });

  it("keeps a TA-04+final student on another period visible and lets the coordinator open that period", async () => {
    const akramItem: ScoringQueueItem = {
      thesisId: "thesis-akram",
      studentName: "Akram Makruf Aidil",
      studentNim: "2211522035",
      proposedTitle: "Proposal Akram",
      supervisorName: "Afriyanti Dwi Kartika",
      supervisorScore: null,
      existingScore: null,
      isScored: false,
    };
    vi.mocked(assessmentService.getMetopenScoringQueue).mockImplementation(async (academicYearId) => {
      if (academicYearId === "tahun-2025-genap") {
        return {
          items: [akramItem],
          meta: { emptyReason: null, emptyReasonText: null, blockedByGate: [], otherPeriods: [] },
        };
      }
      return {
        items: [],
        meta: {
          emptyReason: "none_in_scope",
          emptyReasonText: "Tidak ada mahasiswa pada periode ini yang masuk lingkup penilaian.",
          blockedByGate: [],
          otherPeriods: [
            {
              academicYearId: "tahun-2025-genap",
              periodLabel: "2025/2026 Genap",
              students: [
                {
                  fullName: "Akram Makruf Aidil",
                  identityNumber: "2211522035",
                  thesisId: "thesis-akram",
                },
              ],
            },
          ],
        },
      };
    });
    vi.mocked(assessmentService.getMetopenScoringHistory).mockResolvedValue([]);

    renderPage();

    expect(
      (await screen.findAllByText(/Akram Makruf Aidil \(2211522035\) di 2025\/2026 Genap/i)).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Buka 2025\/2026 Genap/i }));

    await waitFor(() =>
      expect(assessmentService.getMetopenScoringQueue).toHaveBeenCalledWith("tahun-2025-genap"),
    );
    expect((await screen.findAllByText("Akram Makruf Aidil")).length).toBeGreaterThan(0);
  });
});
