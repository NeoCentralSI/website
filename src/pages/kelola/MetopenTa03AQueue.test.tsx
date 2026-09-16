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

vi.mock("@/services/assessment.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/assessment.service")>();
  return {
    ...actual,
    assessmentService: {
      getSupervisorScoringQueue: vi.fn(),
      getSupervisorScoringHistory: vi.fn(),
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
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <div>{title}</div>
      {description ? <p>{description}</p> : null}
    </div>
  ),
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
    vi.mocked(assessmentService.getSupervisorScoringQueue).mockResolvedValue({
      items: [item()],
      meta: { emptyReason: null, emptyReasonText: null, blockedByGate: [], otherPeriods: [] },
    });
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

    await waitFor(() =>
      expect(assessmentService.getSupervisorScoringHistory).toHaveBeenCalledWith("ay-active"),
    );
    const metric = await screen.findByRole("button", { name: /Nilai otomatis 0 presensi.*1/i });
    fireEvent.click(metric);

    expect((await screen.findAllByText("Mahasiswa Auto-zero")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Mahasiswa Aktif")).not.toBeInTheDocument();
  });

  it("keeps a TA-04+final student on another period visible and lets the supervisor open that period", async () => {
    const akramItem = item({
      thesisId: "thesis-akram",
      thesisTitle: "Proposal Akram",
      student: {
        id: "student-akram",
        fullName: "Akram Makruf Aidil",
        identityNumber: "2211522035",
      },
    });
    vi.mocked(assessmentService.getSupervisorScoringQueue).mockImplementation(async (academicYearId) => {
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
    vi.mocked(assessmentService.getSupervisorScoringHistory).mockResolvedValue([]);

    renderPage();

    expect(
      (await screen.findAllByText(/Akram Makruf Aidil \(2211522035\) di 2025\/2026 Genap/i)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Belum ada proposal yang siap dinilai TA-03A."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Buka 2025\/2026 Genap/i }));

    await waitFor(() =>
      expect(assessmentService.getSupervisorScoringQueue).toHaveBeenCalledWith("tahun-2025-genap"),
    );
    expect((await screen.findAllByText("Akram Makruf Aidil")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Belum ada proposal yang siap dinilai TA-03A.")).not.toBeInTheDocument();
  });
});
