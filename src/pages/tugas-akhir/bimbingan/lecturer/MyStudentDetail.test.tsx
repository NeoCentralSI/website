import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DETAIL_SECTIONS, getStudentDetailActionItems } from "@/components/tugas-akhir/lecturer/studentDetailPending";
import { useLecturerProposalRevision } from "@/hooks/thesis-proposal/useProposalRevision";
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
vi.mock("@/hooks/thesis-proposal/useProposalRevision", () => ({ useLecturerProposalRevision: vi.fn() }));
// The cards have their own tests; here only where they are placed matters.
vi.mock("@/components/milestone/lecturer/SeminarReadinessCard", () => ({
  SeminarReadinessCard: () => <div data-testid="seminar-readiness" />,
}));
vi.mock("@/components/milestone/lecturer/DefenceReadinessCard", () => ({
  DefenceReadinessCard: () => <div data-testid="defence-readiness" />,
}));
vi.mock("@/components/thesis-proposal/LecturerProposalRevisionCard", () => ({
  LecturerProposalRevisionCard: () => <div data-testid="proposal-revision-card" />,
}));
vi.mock("@/components/thesis-change-request/LecturerThesisChangeRequestCard", () => ({
  LecturerThesisChangeRequestCard: () => <div data-testid="change-request-card" />,
}));
vi.mock("@/components/thesis-guidance-evaluation/LecturerThesisGuidanceEvaluationCard", () => ({
  LecturerThesisGuidanceEvaluationCard: () => <div data-testid="evaluation-card" />,
}));

const milestone = (id: string, status: string, title = `Milestone ${id}`, phase: "proposal" | "research" = "research"): StudentDetail["milestones"][number] => ({
  id, title, status, phase, updatedAt: "2026-10-01T03:00:00.000Z", progressPercentage: status === "completed" ? 100 : 60,
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
  vi.mocked(useLecturerProposalRevision).mockReturnValue({ data: undefined } as never);
}

function renderPage(route = "/tugas-akhir/bimbingan/lecturer/my-students/t1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const CHANGE_CONTEXT = {
  thesis: {
    id: "t1", title: "Judul", status: "research", topic: { id: "tp1", name: "Sistem Informasi" },
    supervisors: [
      { lecturerId: "l1", name: "HUSNIL KAMIL", position: "pembimbing_1" },
      { lecturerId: "l2", name: "RICKY AKBAR", position: "pembimbing_2" },
    ],
  },
  viewerRole: "pembimbing_1", canSubmit: true, blockReason: null, openRequest: null, history: [],
};

const ribbon = () => screen.queryByRole("region", { name: "Perlu tindakan Anda" });

describe("LecturerMyStudentDetailPage (one compact page)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail() });
    mockQueries();
  });

  it("has no tabs: a quiet header, one Informasi Tugas Akhir card, then every section in order", async () => {
    mockQueries({ change: CHANGE_CONTEXT });
    const { container } = renderPage();

    expect(await screen.findByRole("heading", { name: "Ilham Nofaldi" })).toBeInTheDocument();
    // The subtitle is the NIM only: no email, no supervisors in the header.
    expect(screen.getByText("2211522028")).toBeInTheDocument();
    expect(screen.queryByText(/ilham@example\.test/)).not.toBeInTheDocument();
    expect(screen.getByText("Penelitian")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke Mahasiswa Bimbingan" })).toHaveAttribute("href", "/tugas-akhir/bimbingan/lecturer/my-students");
    for (const name of ["Progres", "Kesiapan Seminar & Sidang", "Evaluasi & Perubahan"]) {
      expect(screen.queryByRole("button", { name: new RegExp(`^${name}`) })).not.toBeInTheDocument();
    }

    const info = screen.getByRole("region", { name: "Informasi Tugas Akhir" });
    expect(within(info).getByText("Informasi Tugas Akhir")).toBeInTheDocument();
    for (const label of ["Judul", "Topik", "Pembimbing 1", "Pembimbing 2", "Masa Bimbingan", "Aktivitas", "Progres bimbingan", "Progres milestone"]) {
      expect(within(info).getByText(label)).toBeInTheDocument();
    }
    // The supervisors are in the card.
    expect(within(info).getByText("Husnil Kamil")).toBeInTheDocument();
    expect(within(info).getByText("Ricky Akbar")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="card"]').length).toBeGreaterThan(0);
    expect(within(info).getByText("5 dari 8 sesi")).toBeInTheDocument();
    expect(within(info).getByText("1 dari 3 milestone")).toBeInTheDocument();
    expect(within(info).getByText("Sistem Informasi")).toBeInTheDocument();

    // Milestone | Riwayat Bimbingan, Kesiapan Seminar | Kesiapan Sidang, Evaluasi | Perubahan.
    const ids = [...container.querySelectorAll("section[id]")].map((section) => section.id);
    expect(ids).toEqual([DETAIL_SECTIONS.milestone, DETAIL_SECTIONS.readiness, DETAIL_SECTIONS.evaluation, DETAIL_SECTIONS.change]);
    expect(screen.getByText("Riwayat Bimbingan")).toBeInTheDocument();
    // Milestone and Riwayat Bimbingan stretch to the same height, each card fills
    // its column and scrolls its list inside at the same maximum height.
    const pair = container.querySelector(`#${DETAIL_SECTIONS.milestone}`)!.parentElement!;
    expect(pair.className).toContain("items-stretch");
    for (const column of [...pair.children]) {
      expect(column.className).toContain("flex-col");
      expect(column.firstElementChild!.className).toContain("flex-1");
    }
    // The milestone list scrolls at the shared maximum height (the guidance list too, once it has sessions).
    expect(pair.querySelector(`#${DETAIL_SECTIONS.milestone} .max-h-150`)).not.toBeNull();
    expect(screen.getByTestId("seminar-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("defence-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("evaluation-card")).toBeInTheDocument();
    expect(screen.getByTestId("change-request-card")).toBeInTheDocument();
  });

  it("lists the proposal-phase milestones in the same list, read-only with a Proposal badge, and both phases of guidance (2.3, 2.4)", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({
      success: true,
      data: detail({
        milestones: [milestone("m1", "in_progress", "Bab 4 Implementasi"), milestone("p1", "in_progress", "Bab 1 Proposal", "proposal")],
        guidanceHistory: {
          count: 2,
          items: [
            { id: "g1", status: "completed", phase: "proposal", requestedDate: "2026-04-01T03:00:00.000Z" },
            { id: "g2", status: "completed", phase: "research", requestedDate: "2026-09-01T03:00:00.000Z" },
          ] as StudentDetail["guidanceHistory"]["items"],
        },
      }),
    });
    renderPage();

    expect(await screen.findByText("Bab 4 Implementasi")).toBeInTheDocument();
    expect(screen.queryByText("Milestone Fase Proposal")).not.toBeInTheDocument();
    const proposalItem = screen.getByText("Bab 1 Proposal").closest("div.ml-6") as HTMLElement;
    expect(within(proposalItem).getByText("Proposal")).toBeInTheDocument();
    expect(within(proposalItem).queryByRole("button")).not.toBeInTheDocument();
    // No phase filter on the guidance history; the Jenis badge tells the sessions apart.
    expect(screen.queryByRole("group", { name: "Fase" })).not.toBeInTheDocument();
    const history = screen.getByText("Riwayat Bimbingan").closest("[data-slot=card]") as HTMLElement;
    expect(within(history).getByText("Proposal")).toBeInTheDocument();
    expect(within(history).getByText("Penelitian")).toBeInTheDocument();
  });

  it("shows 'Perlu tindakan Anda' for Pembimbing 1 and scrolls to the section of each item", async () => {
    mockQueries({
      seminar: readiness({ approveBlockedReason: null }),
      evaluation: { viewerRole: "pembimbing_1", canSubmit: true },
      change: { ...CHANGE_CONTEXT, openRequest: { viewer: { canDecideAsLecturer: true, canCancel: false } } },
    });
    renderPage();

    const box = await screen.findByRole("region", { name: "Perlu tindakan Anda" });
    expect(within(box).getByText("Perlu tindakan Anda")).toBeInTheDocument();
    expect(within(box).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "1 milestone menunggu tinjauan",
      "Kesiapan seminar hasil menunggu persetujuan Anda",
      "Evaluasi bimbingan jatuh tempo",
      "Pengajuan perubahan menunggu persetujuan Anda",
    ]);
    fireEvent.click(within(box).getByRole("button", { name: "1 milestone menunggu tinjauan" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toHaveProperty("id", DETAIL_SECTIONS.milestone);

    // The review itself is in the milestone section.
    fireEvent.click(screen.getByRole("button", { name: /Tinjau/ }));
    expect(await screen.findByText("Review Milestone")).toBeInTheDocument();
  });

  it("shows no ribbon when nothing waits, and Pembimbing 2 has no review button", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ userRole: "Pembimbing 2" }) });
    mockQueries({ seminar: readiness({ currentUserRole: "Pembimbing 2" }), defence: readiness({ currentUserRole: "Pembimbing 2" }) });
    renderPage();

    expect(await screen.findByText("Milestone m2")).toBeInTheDocument();
    expect(ribbon()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tinjau/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Beri feedback" }).length).toBeGreaterThan(0);
  });

  it("an ended thesis is read-only: no ribbon, no review, the readiness cards still shown", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ status: "failed" }) });
    mockQueries({ seminar: readiness({ approveBlockedReason: null }) });
    renderPage();

    expect(await screen.findByText("Tugas Akhir Berakhir")).toBeInTheDocument();
    expect(ribbon()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tinjau/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("seminar-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("defence-readiness")).toBeInTheDocument();
  });

  it("a replaced supervisor reads the page only", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ noLongerSupervising: true }) });
    mockQueries({ seminar: readiness({ approveBlockedReason: null }) });
    renderPage();

    expect(await screen.findByText("Tidak lagi membimbing")).toBeInTheDocument();
    expect(screen.getByText("Anda tidak lagi membimbing mahasiswa ini. Halaman ini hanya dapat dibaca.")).toBeInTheDocument();
    expect(ribbon()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tinjau/ })).not.toBeInTheDocument();
    // Only an active Pembimbing 1 adds milestones.
    expect(screen.queryByRole("button", { name: /Tambah/ })).not.toBeInTheDocument();
  });

  it("puts the repeated proposal review in section 3 and in the ribbon", async () => {
    vi.mocked(getStudentDetail).mockResolvedValue({ success: true, data: detail({ status: "proposal", repeatingProposal: true, currentPhase: "proposal" }) });
    mockQueries();
    vi.mocked(useLecturerProposalRevision).mockReturnValue({ data: { applicable: true, canReview: true } } as never);
    renderPage();

    expect(await screen.findByTestId("proposal-revision-card")).toBeInTheDocument();
    expect(within(ribbon() as HTMLElement).getByRole("button", { name: "Proposal revisi menunggu tinjauan" })).toBeInTheDocument();
  });
});

describe("getStudentDetailActionItems", () => {
  type ActionInput = Parameters<typeof getStudentDetailActionItems>[0];
  const base: Record<string, unknown> = {
    milestones: [milestone("a", "pending_review"), milestone("b", "pending_review"), milestone("c", "in_progress")],
    isPembimbing1: true,
    isEnded: false,
    seminarReadiness: null,
    defenceReadiness: null,
    evaluationContext: null,
    changeContext: null,
    proposalRevisionWaiting: false,
  };
  const keys = (input: Record<string, unknown>) =>
    getStudentDetailActionItems({ ...base, ...input } as unknown as ActionInput).map((item) => item.key);

  it("counts milestones waiting for review only for Pembimbing 1 on a running thesis", () => {
    expect(getStudentDetailActionItems(base as unknown as ActionInput)[0].label).toBe("2 milestone menunggu tinjauan");
    expect(keys({ isPembimbing1: false })).toEqual([]);
    expect(keys({ isEnded: true })).toEqual([]);
  });

  it("lists a readiness card only when this supervisor can approve it now, never after it is passed", () => {
    expect(keys({ milestones: [], seminarReadiness: readiness({ approveBlockedReason: null }) })).toEqual(["seminar"]);
    expect(keys({ milestones: [], seminarReadiness: readiness({ approveBlockedReason: null, currentUserHasApproved: true }) })).toEqual([]);
    expect(keys({ milestones: [], seminarReadiness: readiness() })).toEqual([]);
    expect(keys({ milestones: [], defenceReadiness: readiness({ approveBlockedReason: null, isPassed: true }) })).toEqual([]);
  });

  it("lists a due evaluation for Pembimbing 1 only, and a change request at the viewer's step", () => {
    expect(keys({ milestones: [], evaluationContext: { viewerRole: "pembimbing_1", canSubmit: true } })).toEqual(["evaluation"]);
    expect(keys({ milestones: [], evaluationContext: { viewerRole: "pembimbing_2", canSubmit: true } })).toEqual([]);
    expect(keys({ milestones: [], changeContext: { openRequest: { viewer: { canDecideAsLecturer: true } } } })).toEqual(["change"]);
    expect(keys({ milestones: [], proposalRevisionWaiting: true })).toEqual(["revision"]);
  });
});
