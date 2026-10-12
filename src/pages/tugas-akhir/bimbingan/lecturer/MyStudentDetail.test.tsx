import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStudentDetailPendingCounts } from "@/components/tugas-akhir/lecturer/studentDetailPending";
import { useDefenceReadinessStatus, useSeminarReadinessStatus } from "@/hooks/milestone/useMilestone";
import { useThesisChangeContext } from "@/hooks/thesis-change-request/useThesisChangeRequest";
import { useEvaluationContext } from "@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation";
import { getStudentDetail, type StudentDetail } from "@/services/lecturerGuidance.service";
import type { ReadinessStatusBase } from "@/types/milestone.types";
import LecturerMyStudentDetailPage from "./MyStudentDetail";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/services/lecturerGuidance.service", () => ({
  getStudentDetail: vi.fn(),
  validateMilestone: vi.fn(),
  requestMilestoneRevision: vi.fn(),
  createMilestoneForStudent: vi.fn(),
}));
vi.mock("@/services/milestone.service", () => ({ addFeedback: vi.fn() }));
vi.mock("@/hooks/milestone/useMilestone", () => ({
  useSeminarReadinessStatus: vi.fn(),
  useDefenceReadinessStatus: vi.fn(),
}));
vi.mock("@/hooks/thesis-change-request/useThesisChangeRequest", () => ({ useThesisChangeContext: vi.fn() }));
vi.mock("@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation", () => ({ useEvaluationContext: vi.fn() }));
// The cards have their own tests; here only where they are placed matters.
vi.mock("@/components/milestone/lecturer/SeminarReadinessCard", () => ({
  SeminarReadinessCard: ({ stacked }: { stacked?: boolean }) => <div data-testid="seminar-readiness" data-stacked={String(!!stacked)} />,
}));
vi.mock("@/components/milestone/lecturer/DefenceReadinessCard", () => ({
  DefenceReadinessCard: ({ stacked }: { stacked?: boolean }) => <div data-testid="defence-readiness" data-stacked={String(!!stacked)} />,
}));
vi.mock("@/components/thesis-change-request/LecturerThesisChangeRequestCard", () => ({
  LecturerThesisChangeRequestCard: () => <div data-testid="change-request-card" />,
}));
vi.mock("@/components/thesis-guidance-evaluation/LecturerThesisGuidanceEvaluationCard", () => ({
  LecturerThesisGuidanceEvaluationCard: () => <div data-testid="evaluation-card" />,
}));

const milestone = (id: string, status: string, title = `Milestone ${id}`): StudentDetail["milestones"][number] => ({
  id, title, status, updatedAt: "2026-10-01T03:00:00.000Z", progressPercentage: status === "completed" ? 100 : 60,
});

const detail = (overrides: Partial<StudentDetail> = {}): StudentDetail => ({
  thesisId: "t1",
  title: "Sistem Informasi Tugas Akhir",
  status: "research",
  activityLevel: "slow",
  lastActivityAt: null,
  daysSinceActivity: 70,
  supervisionClock: {
    startedAt: "2026-03-02T00:00:00.000Z", elapsedDays: 224, elapsedMonths: 7, elapsedLabel: "7 bulan 12 hari",
    sixMonthAt: null, oneYearAt: null, extensionUntil: null, evaluationDue: "six_month", isPaused: false,
  },
  startDate: "2026-03-02T00:00:00.000Z",
  startDateFormatted: null,
  student: { id: "s1", fullName: "ILHAM NOFALDI", nim: "2211522028", email: "ilham@example.test" },
  document: null,
  proposalDocument: null,
  uploadedFiles: [],
  milestones: [milestone("m1", "completed"), milestone("m2", "pending_review"), milestone("m3", "in_progress")],
  guidanceHistory: { count: 0, items: [] },
  userRole: "Pembimbing 1",
  ...overrides,
});

const readiness = (overrides: Partial<ReadinessStatusBase> = {}) => ({
  thesisId: "t1", thesisTitle: "Judul", thesisStatus: "research",
  student: { id: "s1", userId: "u1", name: "Ilham Nofaldi", nim: "2211522028", email: "ilham@example.test" },
  requirements: [], requirementsMet: false,
  supervisors: [{ id: "l1", name: "HUSNIL KAMIL", email: "h@example.test", role: "pembimbing1", hasApproved: false }],
  currentUserRole: "Pembimbing 1", currentUserHasApproved: false,
  latestGuidanceAttachment: null, requestBlockedReason: null, approveBlockedReason: "Syarat belum terpenuhi.",
  ...overrides,
});

function mockQueries({
  seminar = readiness(),
  defence = readiness(),
  change = null as unknown,
  evaluation = null as unknown,
} = {}) {
  vi.mocked(useSeminarReadinessStatus).mockReturnValue({
    data: seminar ? { ...seminar, guidanceProgress: { completed: 5, required: 8, isComplete: false } } : undefined,
  } as never);
  vi.mocked(useDefenceReadinessStatus).mockReturnValue({ data: defence ?? undefined } as never);
  vi.mocked(useThesisChangeContext).mockReturnValue({ data: change ?? undefined } as never);
  vi.mocked(useEvaluationContext).mockReturnValue({ data: evaluation ?? undefined } as never);
}

function LocationProbe() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

function renderPage(route = "/tugas-akhir/bimbingan/lecturer/my-students/t1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<><LecturerMyStudentDetailPage /><LocationProbe /></>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const tab = (name: RegExp) => screen.getByRole("button", { name });

describe("LecturerMyStudentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail() });
    mockQueries();
  });

  it("always shows the header and opens on the Progres tab", async () => {
    mockQueries({
      change: {
        thesis: {
          id: "t1", title: "Judul", status: "research", topic: { id: "tp1", name: "Sistem Informasi" },
          supervisors: [
            { lecturerId: "l1", name: "HUSNIL KAMIL", position: "pembimbing_1" },
            { lecturerId: "l2", name: "RICKY AKBAR", position: "pembimbing_2" },
          ],
        },
        viewerRole: "pembimbing_1", canSubmit: true, blockReason: null, openRequest: null, history: [],
      },
    });
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Ilham Nofaldi" })).toBeInTheDocument();
    expect(screen.getByText("2211522028 • ilham@example.test")).toBeInTheDocument();
    expect(screen.getAllByText("Penelitian").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Kembali ke Mahasiswa Bimbingan" })).toHaveAttribute("href", "/tugas-akhir/bimbingan/lecturer/my-students");

    // Compact thesis information: title, topic, supervisors, supervision time, activity, progress.
    expect(screen.getByText("Informasi Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("Sistem Informasi Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("Sistem Informasi")).toBeInTheDocument();
    expect(screen.getByText("Husnil Kamil")).toBeInTheDocument();
    expect(screen.getByText("Ricky Akbar")).toBeInTheDocument();
    expect(screen.getByText("7 bulan 12 hari")).toBeInTheDocument();
    expect(screen.getByText("Lambat")).toBeInTheDocument();
    expect(screen.getByText("5 dari 8 sesi")).toBeInTheDocument();
    expect(screen.getByText("1 dari 3 milestone")).toBeInTheDocument();
    // Enum values never show raw.
    expect(screen.queryByText("research")).not.toBeInTheDocument();
    expect(screen.queryByText("pending_review")).not.toBeInTheDocument();

    // Milestone and guidance history sit on this tab; the other tabs' cards do not.
    expect(screen.getByText("Milestone m2")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Bimbingan")).toBeInTheDocument();
    expect(screen.queryByTestId("seminar-readiness")).not.toBeInTheDocument();
    expect(screen.queryByTestId("evaluation-card")).not.toBeInTheDocument();
  });

  it("lets Pembimbing 1 open the review from the milestone that waits, and marks the tab", async () => {
    renderPage();
    await screen.findByText("Milestone m2");

    expect(within(tab(/^Progres/)).getByLabelText("1 menunggu tindakan")).toBeInTheDocument();
    expect(screen.getByText("1 menunggu tinjauan")).toBeInTheDocument();

    const reviewButtons = screen.getAllByRole("button", { name: "Tinjau" });
    expect(reviewButtons).toHaveLength(1);
    fireEvent.click(reviewButtons[0]);
    expect(await screen.findByRole("dialog", { name: "Review Milestone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setujui" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minta Revisi" })).toBeInTheDocument();
  });

  it("gives Pembimbing 2 feedback only: no review button and no mark on the tab", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ userRole: "Pembimbing 2" }) });
    renderPage();
    await screen.findByText("Milestone m2");

    expect(screen.queryByRole("button", { name: "Tinjau" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tambah/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Beri feedback" })).toHaveLength(3);
    expect(within(tab(/^Progres/)).queryByLabelText(/menunggu tindakan/)).not.toBeInTheDocument();
    expect(screen.getByText(/Hanya Pembimbing 1 yang dapat menyetujui atau meminta revisi milestone/)).toBeInTheDocument();
  });

  it("keeps the active tab in ?tab= and shows the two readiness cards side by side", async () => {
    renderPage();
    await screen.findByText("Milestone m2");

    fireEvent.click(tab(/^Kesiapan Seminar & Sidang/));
    expect(screen.getByTestId("search")).toHaveTextContent("?tab=kesiapan");
    expect(screen.getByTestId("seminar-readiness")).toHaveAttribute("data-stacked", "true");
    expect(screen.getByTestId("defence-readiness")).toHaveAttribute("data-stacked", "true");
    expect(screen.queryByText("Milestone m2")).not.toBeInTheDocument();

    fireEvent.click(tab(/^Evaluasi & Perubahan/));
    expect(screen.getByTestId("search")).toHaveTextContent("?tab=evaluasi");
    expect(screen.getByTestId("evaluation-card")).toBeInTheDocument();
    expect(screen.getByTestId("change-request-card")).toBeInTheDocument();

    // The default tab leaves the address clean.
    fireEvent.click(tab(/^Progres/));
    expect(screen.getByTestId("search")).toHaveTextContent("");
    expect(screen.getByText("Milestone m2")).toBeInTheDocument();
  });

  it("opens the tab named in the address and falls back to Progres for an unknown one", async () => {
    const first = renderPage("/tugas-akhir/bimbingan/lecturer/my-students/t1?tab=evaluasi");
    expect(await screen.findByTestId("evaluation-card")).toBeInTheDocument();
    expect(screen.queryByText("Milestone m2")).not.toBeInTheDocument();
    first.unmount();

    renderPage("/tugas-akhir/bimbingan/lecturer/my-students/t1?tab=tidak-ada");
    expect(await screen.findByText("Milestone m2")).toBeInTheDocument();
  });

  it("marks the readiness and evaluation tabs when something waits for this supervisor", async () => {
    mockQueries({
      seminar: readiness({ approveBlockedReason: null }),
      defence: readiness(),
      change: { thesis: null, viewerRole: "pembimbing_1", canSubmit: false, blockReason: null, history: [], openRequest: { viewer: { canDecideAsLecturer: true, canCancel: false } } },
      evaluation: { viewerRole: "pembimbing_1", canSubmit: true },
    });
    renderPage();
    await screen.findByText("Milestone m2");

    expect(within(tab(/^Kesiapan Seminar & Sidang/)).getByLabelText("1 menunggu tindakan")).toBeInTheDocument();
    expect(within(tab(/^Evaluasi & Perubahan/)).getByLabelText("2 menunggu tindakan")).toBeInTheDocument();
  });

  it("shows only the defence card, full width, once the seminar is passed", async () => {
    mockQueries({ defence: readiness({ requirementsMet: true }) });
    renderPage("/tugas-akhir/bimbingan/lecturer/my-students/t1?tab=kesiapan");

    expect(await screen.findByTestId("defence-readiness")).toHaveAttribute("data-stacked", "false");
    expect(screen.queryByTestId("seminar-readiness")).not.toBeInTheDocument();
  });

  it("has no readiness to review and no review button for an ended thesis", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ status: "failed", activityLevel: null }) });
    renderPage();
    expect(await screen.findByText("Tugas Akhir Berakhir")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tinjau" })).not.toBeInTheDocument();
    expect(within(tab(/^Progres/)).queryByLabelText(/menunggu tindakan/)).not.toBeInTheDocument();

    fireEvent.click(tab(/^Kesiapan Seminar & Sidang/));
    expect(screen.getByText("Tidak Ada Kesiapan untuk Ditinjau")).toBeInTheDocument();
    // The banner belongs to the header area: it stays on every tab.
    expect(screen.getByText("Tugas Akhir Berakhir")).toBeInTheDocument();
  });
});

describe("getStudentDetailPendingCounts", () => {
  const base = {
    milestones: [milestone("m1", "pending_review"), milestone("m2", "pending_review"), milestone("m3", "revision_needed")],
    isPembimbing1: true,
    isEnded: false,
    seminarReadiness: null,
    defenceReadiness: null,
    evaluationContext: null,
    changeContext: null,
  };

  it("counts milestones waiting for review only for Pembimbing 1 on a running thesis", () => {
    expect(getStudentDetailPendingCounts(base).progress).toBe(2);
    expect(getStudentDetailPendingCounts({ ...base, isPembimbing1: false }).progress).toBe(0);
    expect(getStudentDetailPendingCounts({ ...base, isEnded: true }).progress).toBe(0);
  });

  it("counts a readiness card only when this supervisor can approve it now", () => {
    const canApprove = readiness({ approveBlockedReason: null });
    expect(getStudentDetailPendingCounts({ ...base, seminarReadiness: canApprove, defenceReadiness: canApprove }).readiness).toBe(2);
    expect(getStudentDetailPendingCounts({ ...base, seminarReadiness: readiness() }).readiness).toBe(0);
    expect(getStudentDetailPendingCounts({ ...base, seminarReadiness: readiness({ approveBlockedReason: null, currentUserHasApproved: true }) }).readiness).toBe(0);
    expect(getStudentDetailPendingCounts({ ...base, seminarReadiness: readiness({ approveBlockedReason: null, currentUserRole: null }) }).readiness).toBe(0);
  });

  it("counts a due evaluation for Pembimbing 1 only, and a change request at the viewer's step", () => {
    const due = { viewerRole: "pembimbing_1", canSubmit: true } as never;
    const notMine = { viewerRole: "pembimbing_2", canSubmit: true } as never;
    const atMyStep = { openRequest: { viewer: { canDecideAsLecturer: true, canCancel: false } } } as never;
    const elsewhere = { openRequest: { viewer: { canDecideAsLecturer: false, canCancel: true } } } as never;
    expect(getStudentDetailPendingCounts({ ...base, evaluationContext: due }).evaluation).toBe(1);
    expect(getStudentDetailPendingCounts({ ...base, evaluationContext: notMine }).evaluation).toBe(0);
    expect(getStudentDetailPendingCounts({ ...base, evaluationContext: due, changeContext: atMyStep }).evaluation).toBe(2);
    expect(getStudentDetailPendingCounts({ ...base, changeContext: elsewhere }).evaluation).toBe(0);
  });
});
