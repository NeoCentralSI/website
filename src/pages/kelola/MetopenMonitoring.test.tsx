import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import MetopenMonitoring from "./MetopenMonitoring";
import { assessmentService } from "@/services/assessment.service";
import type {
  AdvisorStatusCategory,
  MonitoringResponse,
  ScoreCompleteness,
} from "@/types/metopenMonitoring.types";

vi.mock("@/services/assessment.service", () => ({
  assessmentService: {
    getMetopenMonitoring: vi.fn(),
  },
}));

vi.mock("@/hooks/shared/useActiveAcademicYear", () => ({
  useActiveAcademicYear: () => ({
    academicYear: {
      id: "ay-1",
      year: "2025/2026",
      semester: "genap",
    },
    label: "Genap 2025/2026",
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
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
      <MemoryRouter initialEntries={["/kelola/metopen/monitoring"]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/kelola/metopen/monitoring" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const advisorCounts = (overrides: Partial<Record<AdvisorStatusCategory, number>> = {}) => ({
  no_advisor: 0,
  pending_review: 0,
  pending_kadep: 0,
  active_pre_ta04: 0,
  active_official: 0,
  released: 0,
  revision: 0,
  rejected: 0,
  withdrawn: 0,
  other: 0,
  ...overrides,
});

const scoreCounts = (overrides: Partial<Record<ScoreCompleteness, number>> = {}) => ({
  none: 0,
  partial_ta03a: 0,
  partial_ta03b: 0,
  complete_pending: 0,
  published: 0,
  auto_zero: 0,
  ...overrides,
});

function score(completeness: ScoreCompleteness) {
  return {
    researchMethodScoreId: null,
    thesisId: "thesis-1",
    thesisTitle: "Judul TA",
    presentasi: null,
    proposalKonten: null,
    proposalStruktur: null,
    kemampuanRespon: null,
    supervisorScore: null,
    lecturerScore: null,
    finalScore: null,
    isFinalized: false,
    finalizedAt: null,
    coSignedAt: null,
    attendanceAutoZeroedAt: null,
    attendanceAutoZeroReason: null,
    completeness,
  };
}

describe("MetopenMonitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const payload: MonitoringResponse = {
      academicYear: {
        id: "ay-1",
        year: "2025/2026",
        semester: "genap",
        startDate: "2026-01-13T00:00:00.000Z",
        endDate: "2026-07-31T23:59:59.999Z",
      },
      attendanceImport: null,
      stats: {
        totalEligibleSia: 2,
        totalInImport: 0,
        missingFromImport: 2,
        unmatchedInImport: 0,
        attendanceEligible: 0,
        attendanceIneligible: 0,
        advisorByCategory: advisorCounts({
          active_pre_ta04: 1,
          active_official: 1,
        }),
        scoreByCompleteness: scoreCounts({ none: 2 }),
      },
      students: [
        {
          rowNumber: 1,
          studentId: "student-booking",
          identityNumber: "2200000001",
          fullName: "Mahasiswa Booking",
          email: null,
          avatarUrl: null,
          enrollmentYear: 2022,
          studentStatus: "active",
          researchMethodCompleted: false,
          takingThesisCourse: null,
          eligibleMetopen: true,
          eligibilitySource: "sia",
          eligibilityUpdatedAt: "2026-07-07T08:00:00.000Z",
          isMatched: true,
          isInImport: false,
          attendance: null,
          advisorRequest: {
            status: "booking_approved",
            statusLabel: "TA-04 terbit, booking",
            statusCategory: "active_pre_ta04",
            routeType: "normal",
            routeLabel: "TA-01 normal",
            requestType: "ta_01",
            proposedTitle: "Judul Booking",
            targetLecturerId: "lecturer-1",
            targetLecturerName: "Dr. P1",
            acceptedOverNormal: false,
            forwardedToKadepAt: null,
            withdrawnAt: null,
            releasedAt: null,
            releaseReason: null,
            ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
            lastUpdatedAt: "2026-07-07T08:00:00.000Z",
          },
          supervisors: {
            pembimbing1: { lecturerId: "lecturer-1", fullName: "Dr. P1" },
            pembimbing2: { lecturerId: null, fullName: null },
          },
          score: score("none"),
        },
        {
          rowNumber: 2,
          studentId: "student-active",
          identityNumber: "2200000002",
          fullName: "Mahasiswa Aktif",
          email: null,
          avatarUrl: null,
          enrollmentYear: 2022,
          studentStatus: "active",
          researchMethodCompleted: true,
          takingThesisCourse: true,
          eligibleMetopen: true,
          eligibilitySource: "sia",
          eligibilityUpdatedAt: "2026-07-07T08:00:00.000Z",
          isMatched: true,
          isInImport: false,
          attendance: null,
          advisorRequest: {
            status: "active_official",
            statusLabel: "Beban aktif TA",
            statusCategory: "active_official",
            routeType: "normal",
            routeLabel: "TA-01 normal",
            requestType: "ta_01",
            proposedTitle: "Judul Aktif",
            targetLecturerId: "lecturer-1",
            targetLecturerName: "Dr. P1",
            acceptedOverNormal: false,
            forwardedToKadepAt: null,
            withdrawnAt: null,
            releasedAt: null,
            releaseReason: null,
            ta04AssignmentIssuedAt: "2026-07-07T08:00:00.000Z",
            lastUpdatedAt: "2026-08-15T08:00:00.000Z",
          },
          supervisors: {
            pembimbing1: { lecturerId: "lecturer-1", fullName: "Dr. P1" },
            pembimbing2: { lecturerId: null, fullName: null },
          },
          score: score("none"),
        },
      ],
      unmatchedRecords: [],
    };

    vi.mocked(assessmentService.getMetopenMonitoring).mockResolvedValue(payload);
  });

  it("distinguishes early TA-04 booking from active thesis load", async () => {
    renderWithLayout(<MetopenMonitoring />);

    await waitFor(() => {
      expect(screen.getByText("Monitoring Kelas Metopen")).toBeInTheDocument();
    });

    expect(screen.getAllByText("TA-04 terbit, booking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beban aktif TA").length).toBeGreaterThan(0);
  });

  it("uses a zero-valued metric as a real filter with an explicit empty state", async () => {
    renderWithLayout(<MetopenMonitoring />);

    const metric = await screen.findByRole("button", { name: /Belum mencari pembimbing.*0/i });
    fireEvent.click(metric);

    await waitFor(() => {
      expect(screen.queryByText("Mahasiswa Booking")).not.toBeInTheDocument();
      expect(screen.queryByText("Mahasiswa Aktif")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Tidak ada mahasiswa yang cocok dengan filter saat ini.")).toBeInTheDocument();
  });
});
