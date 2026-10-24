import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TugasAkhirOverviewPage from "./Overview";
import {
  getMyThesisDetail,
  getStudentThesisHistory,
  type MyThesisDetail,
  type ThesisHistoryItem,
} from "@/services/studentGuidance.service";
import { useDefenceReadinessStatus, useSeminarReadinessStatus } from "@/hooks/milestone";
import { useThesisChangeContext } from "@/hooks/thesis-change-request/useThesisChangeRequest";
import { useEvaluationContext } from "@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation";
import type { ThesisChangeRequest } from "@/types/thesis-change-request.types";

vi.mock("@/services/studentGuidance.service", () => ({
  getMyThesisDetail: vi.fn(),
  getStudentThesisHistory: vi.fn(),
}));

vi.mock("@/hooks/milestone", () => ({
  useSeminarReadinessStatus: vi.fn(() => ({ data: null, isLoading: false })),
  useDefenceReadinessStatus: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock("@/components/milestone/student/SeminarReadinessStatusCard", () => ({
  SeminarReadinessStatusCard: () => <div>Kartu Kesiapan Seminar</div>,
}));
vi.mock("@/components/milestone/student/DefenceReadinessStatusCard", () => ({
  DefenceReadinessStatusCard: () => <div>Kartu Kesiapan Sidang</div>,
}));
vi.mock("@/hooks/thesis-change-request/useThesisChangeRequest", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useThesisChangeContext: vi.fn(() => ({ data: undefined })),
}));
vi.mock("@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useEvaluationContext: vi.fn(() => ({ data: undefined })),
}));
vi.mock("lottie-react", () => ({ default: () => <div data-testid="lottie-mock" /> }));

if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

function buildThesis(overrides: Partial<MyThesisDetail> = {}): MyThesisDetail {
  return {
    id: "thesis-1",
    title: "Sistem Rekomendasi Tugas Akhir",
    status: "research",
    activityLevel: "slow",
    supervisionClock: {
      startedAt: "2026-03-01T00:00:00.000Z",
      elapsedDays: 224,
      elapsedMonths: 7,
      elapsedLabel: "7 bulan 10 hari",
      sixMonthAt: "2026-09-01T00:00:00.000Z",
      oneYearAt: "2027-03-01T00:00:00.000Z",
      extensionUntil: null,
      evaluationDue: "six_month",
      isPaused: false,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    student: { id: "stu-1", name: "Mahasiswa Uji", nim: "2211520001", email: "mhs@example.test" },
    topic: { id: "topic-1", name: "Sistem Pendukung Keputusan" },
    academicYear: null,
    document: null,
    proposalDocument: null,
    uploadedFiles: [],
    supervisors: [
      { id: "sup-2", name: "AINA HUBBY AZIIRA", email: "p2@example.test", role: "Pembimbing 2" },
      { id: "sup-1", name: "HUSNIL KAMIL", email: "p1@example.test", role: "Pembimbing 1" },
    ],
    examiners: [],
    stats: {
      totalGuidances: 5,
      completedGuidances: 3,
      totalSessions: 5,
      totalMilestones: 4,
      completedMilestones: 1,
      inProgressMilestones: 1,
      overdueMilestones: 0,
      milestoneProgress: 25,
    },
    seminarApproval: { pembimbing1: false, pembimbing2: false },
    ...overrides,
  };
}

function historyItem(overrides: Partial<ThesisHistoryItem> = {}): ThesisHistoryItem {
  return {
    id: "thesis-0",
    title: "Judul Tugas Akhir Lama",
    status: "failed",
    topic: "Data Mining",
    academicYear: "2024/2025 Ganjil",
    createdAt: "2024-09-01T00:00:00.000Z",
    terminationReason: "supervision_evaluation",
    terminationNote: "Tidak ada kemajuan selama satu tahun.",
    terminatedAt: "2025-10-01T03:00:00.000Z",
    stats: { guidances: 2, completedMilestones: "0/3" },
    supervisors: [{ id: "sup-1", name: "HUSNIL KAMIL", role: "Pembimbing 1" }],
    ...overrides,
  };
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/tugas-akhir" element={<TugasAkhirOverviewPage />} />
            <Route path="/tugas-akhir/riwayat" element={<TugasAkhirOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TugasAkhirOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis());
    vi.mocked(getStudentThesisHistory).mockResolvedValue({ success: true, theses: [] });
    vi.mocked(useThesisChangeContext).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useThesisChangeContext>);
    vi.mocked(useEvaluationContext).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useEvaluationContext>);
    vi.mocked(useSeminarReadinessStatus).mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<typeof useSeminarReadinessStatus>);
    vi.mocked(useDefenceReadinessStatus).mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<typeof useDefenceReadinessStatus>);
  });

  it("has the tabs Tugas Akhir Saat Ini and Riwayat", async () => {
    renderAt("/tugas-akhir");

    expect(screen.getAllByRole("link").slice(0, 2).map((link) => link.textContent)).toEqual(["Tugas Akhir Saat Ini", "Riwayat"]);
    expect(await screen.findByText("Informasi Tugas Akhir")).toBeInTheDocument();
    expect(getStudentThesisHistory).not.toHaveBeenCalled();
  });

  it("shows title, topic, status label and every supervisor with their role, Pembimbing 1 first", async () => {
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Sistem Rekomendasi Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("Sistem Pendukung Keputusan")).toBeInTheDocument();
    expect(screen.getByText("Penelitian")).toBeInTheDocument();
    expect(screen.queryByText(/^research$/i)).not.toBeInTheDocument();
    const names = screen.getAllByText(/Husnil Kamil|Aina Hubby Aziira/).map((node) => node.textContent);
    expect(names).toEqual(["Husnil Kamil", "Aina Hubby Aziira"]);
    expect(screen.getByText("Pembimbing 1")).toBeInTheDocument();
    expect(screen.getByText("Pembimbing 2")).toBeInTheDocument();
  });

  it("shows supervision time, activity, completed sessions out of 8 and milestone progress", async () => {
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Masa Bimbingan dan Progres")).toBeInTheDocument();
    expect(screen.getByText("7 bulan 10 hari")).toBeInTheDocument();
    expect(screen.getByText("Lambat")).toBeInTheDocument();
    expect(screen.getByText("Evaluasi 6 bulan jatuh tempo")).toBeInTheDocument();
    expect(screen.getByText("3 dari 8 sesi")).toBeInTheDocument();
    expect(screen.getByText("1 dari 4 milestone")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ajukan Bimbingan/ })).toHaveAttribute("href", "/tugas-akhir/bimbingan/student?action=create");
  });

  it("shows both readiness cards side by side; no separate change request, evaluation or document card", async () => {
    renderAt("/tugas-akhir");

    const seminar = await screen.findByText("Kartu Kesiapan Seminar");
    expect(screen.getByText("Kartu Kesiapan Sidang").parentElement).toBe(seminar.parentElement);
    expect(seminar.parentElement?.className).toContain("lg:grid-cols-2");
    expect(screen.queryByText("Perubahan Tugas Akhir")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluasi Bimbingan")).not.toBeInTheDocument();
    expect(screen.queryByText("Dokumen Tugas Akhir")).not.toBeInTheDocument();
    expect(screen.queryByText("Belum ada dokumen")).not.toBeInTheDocument();
  });

  it("keeps the seminar card after the results seminar is passed", async () => {
    vi.mocked(useDefenceReadinessStatus).mockReturnValue({ data: { requirementsMet: true }, isLoading: false } as unknown as ReturnType<typeof useDefenceReadinessStatus>);
    vi.mocked(useSeminarReadinessStatus).mockReturnValue({ data: { guidanceProgress: { completed: 9, required: 8, isComplete: true }, isPassed: true }, isLoading: false } as unknown as ReturnType<typeof useSeminarReadinessStatus>);
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Kartu Kesiapan Sidang")).toBeInTheDocument();
    expect(screen.getByText("Kartu Kesiapan Seminar")).toBeInTheDocument();
  });

  it("puts Ajukan Perubahan, the history links, the running request and the evaluation history in the info card; a running warning is a ribbon", async () => {
    const change = (overrides: Partial<ThesisChangeRequest>): ThesisChangeRequest => ({
      id: "c1", thesisId: "thesis-1", batchId: null, requestType: "title", status: "approved", reason: "Alasan.",
      student: null, thesisTitle: null, title: { previous: "Lama", next: "Baru", newTopic: null }, supervisor: null,
      requestedBy: null, requestedByStudent: true, steps: [], currentStep: null, decision: null, appliedAt: null,
      createdAt: "2026-05-01T03:00:00.000Z", viewer: { canDecideAsLecturer: false, canCancel: false }, ...overrides,
    });
    vi.mocked(useThesisChangeContext).mockReturnValue({
      data: {
        thesis: null, viewerRole: "student", canSubmit: false,
        blockReason: "Masih ada pengajuan perubahan yang berjalan. Tunggu keputusannya atau batalkan lebih dulu.",
        openRequest: change({ id: "open", status: "pending", currentStep: "main_supervisor" }),
        history: [
          change({ id: "h1" }),
          change({ id: "h2", requestType: "supervisor", title: null, supervisor: { position: "pembimbing_2", replaced: null, next: { id: "l9", name: "ULLYA", identityNumber: null } } }),
        ],
      },
    } as unknown as ReturnType<typeof useThesisChangeContext>);
    vi.mocked(useEvaluationContext).mockReturnValue({
      data: {
        thesis: null, viewerRole: "student", basis: null, stage: null, allowedRecommendations: [], canSubmit: false, blockReason: null,
        openEvaluation: null, history: [{ id: "e1", stage: "six_month", status: "approved", requiresKadep: true, createdAt: "2026-09-02T03:00:00.000Z" }],
        academicWarning: { extensionUntil: "2026-11-09T03:00:00.000Z", followUpDue: false },
      },
    } as unknown as ReturnType<typeof useEvaluationContext>);
    renderAt("/tugas-akhir");

    const card = (await screen.findByText("Informasi Tugas Akhir")).closest("[data-slot=card]") as HTMLElement;
    expect(within(card).getByRole("button", { name: /Ajukan Perubahan/ })).toBeDisabled();
    expect(within(card).getByText(/Ajukan Perubahan belum tersedia: Masih ada pengajuan perubahan yang berjalan/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Riwayat perubahan judul (1)" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Riwayat pembimbing (1)" })).toBeInTheDocument();
    expect(within(card).getByText(/Pengajuan perubahan judul menunggu Pembimbing 1/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Riwayat evaluasi (1)" })).toBeInTheDocument();
    // The ribbon is above the card.
    const ribbon = screen.getByText("Peringatan akademik").closest("[role=alert]") as HTMLElement;
    expect(ribbon.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(within(card).getByRole("button", { name: "Riwayat perubahan judul (1)" }));
    const modal = await screen.findByRole("dialog", { name: "Riwayat Perubahan Judul" });
    expect(within(modal).getByText("Disetujui")).toBeInTheDocument();
  });

  it("hides the history links when there is nothing to show", async () => {
    renderAt("/tugas-akhir");
    await screen.findByText("Informasi Tugas Akhir");
    expect(screen.queryByRole("button", { name: /Riwayat perubahan judul|Riwayat pembimbing|Riwayat evaluasi/ })).not.toBeInTheDocument();
  });

  it("shows the academic warning with the extension deadline", async () => {
    const thesis = buildThesis();
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({
      supervisionClock: { ...thesis.supervisionClock!, extensionUntil: "2026-11-09T03:00:00.000Z", evaluationDue: null },
    }));
    renderAt("/tugas-akhir");

    // One ribbon on top of the page.
    expect(await screen.findByText("Peringatan akademik")).toBeInTheDocument();
    expect(screen.getAllByText("Peringatan akademik")).toHaveLength(1);
    expect(screen.getByText(/Perpanjangan masa bimbingan 1 bulan berlaku sampai 9 November 2026 10\.00 WIB/)).toBeInTheDocument();
    expect(screen.getByText("Tidak ada yang jatuh tempo")).toBeInTheDocument();
  });

  it("disables Ajukan Bimbingan with its reason and shows the Cuti badge while the student is on leave", async () => {
    const base = buildThesis({ activityLevel: null });
    vi.mocked(getMyThesisDetail).mockResolvedValue({ ...base, status: "research", supervisionClock: { ...base.supervisionClock!, isPaused: true } });
    renderAt("/tugas-akhir");

    expect(await screen.findByRole("button", { name: /Ajukan Bimbingan/ })).toBeDisabled();
    expect(screen.getByText(/Ajukan Bimbingan belum tersedia:/)).toBeInTheDocument();
    expect(screen.getByText(/Anda sedang cuti/)).toBeInTheDocument();
    expect(screen.getByText("Cuti")).toBeInTheDocument();
    expect(screen.queryByText("bss")).not.toBeInTheDocument();
  });

  it("shows an empty state when the student has no thesis", async () => {
    vi.mocked(getMyThesisDetail).mockRejectedValue(new Error("Tugas akhir aktif tidak ditemukan"));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Belum Ada Tugas Akhir yang Berjalan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat Riwayat" })).not.toBeInTheDocument();
    expect(screen.queryByText("Informasi Tugas Akhir")).not.toBeInTheDocument();
  });

  it("a stopped thesis without a newer one: empty first tab that points to Riwayat", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({ status: "failed" }));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Belum Ada Tugas Akhir yang Berjalan")).toBeInTheDocument();
    expect(screen.getByText("Tugas akhir Anda sebelumnya dihentikan. Rincian dapat dilihat pada tab Riwayat.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat Riwayat" })).toBeInTheDocument();
    expect(screen.queryByText("Informasi Tugas Akhir")).not.toBeInTheDocument();
  });

  it("a finished thesis stays on the first tab with the badge Selesai and no action buttons", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({
      status: "completed",
      activityLevel: null,
      stats: { ...buildThesis().stats, completedGuidances: 9, completedMilestones: 4 },
    }));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Informasi Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.getByText("Sistem Rekomendasi Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("7 bulan 10 hari")).toBeInTheDocument();
    expect(screen.getByText("9 dari 8 sesi")).toBeInTheDocument();
    expect(screen.getByText("4 dari 4 milestone")).toBeInTheDocument();
    // Read-only: no actions; the readiness cards stay, in their passed state.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ajukan Bimbingan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ajukan Perubahan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kelola Milestone/)).not.toBeInTheDocument();
    expect(screen.getByText("Kartu Kesiapan Seminar")).toBeInTheDocument();
    expect(screen.getByText("Kartu Kesiapan Sidang")).toBeInTheDocument();
    expect(screen.queryByText("Belum Ada Tugas Akhir yang Berjalan")).not.toBeInTheDocument();
    // The readiness of a finished thesis is not requested.
    expect(vi.mocked(useSeminarReadinessStatus)).toHaveBeenLastCalledWith(undefined);
  });

  it("Riwayat lists the theses before the current one, with the reason a thesis was stopped", async () => {
    vi.mocked(getStudentThesisHistory).mockResolvedValue({
      success: true,
      theses: [
        historyItem({ id: "thesis-1", title: "Sistem Rekomendasi Tugas Akhir", status: "research", terminationReason: null, terminationNote: null, terminatedAt: null }),
        historyItem(),
        historyItem({ id: "thesis-00", title: "Judul Tugas Akhir Selesai", status: "completed", terminationReason: null, terminationNote: null, terminatedAt: null, stats: { guidances: 9, completedMilestones: 4 } }),
      ],
    });
    renderAt("/tugas-akhir/riwayat");

    expect(await screen.findByText("Judul Tugas Akhir Lama")).toBeInTheDocument();
    expect(screen.getByText("Judul Tugas Akhir Selesai")).toBeInTheDocument();
    // The running thesis is not history.
    expect(screen.queryByText("Sistem Rekomendasi Tugas Akhir")).not.toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.getAllByText("Alasan penghentian")).toHaveLength(1);
    expect(screen.getByText("Dihentikan melalui evaluasi bimbingan")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada kemajuan selama satu tahun.")).toBeInTheDocument();
    expect(screen.queryByText("supervision_evaluation")).not.toBeInTheDocument();
  });

  it("Riwayat leaves out a finished thesis that the first tab shows", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({ id: "thesis-1", status: "completed" }));
    vi.mocked(getStudentThesisHistory).mockResolvedValue({
      success: true,
      theses: [
        historyItem({ id: "thesis-1", title: "Sistem Rekomendasi Tugas Akhir", status: "completed", terminationReason: null, terminationNote: null, terminatedAt: null }),
        historyItem(),
      ],
    });
    renderAt("/tugas-akhir/riwayat");

    expect(await screen.findByText("Judul Tugas Akhir Lama")).toBeInTheDocument();
    expect(screen.queryByText("Sistem Rekomendasi Tugas Akhir")).not.toBeInTheDocument();
  });

  it("Riwayat keeps a stopped thesis even when it is the latest one", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({ id: "thesis-0", status: "failed" }));
    vi.mocked(getStudentThesisHistory).mockResolvedValue({ success: true, theses: [historyItem()] });
    renderAt("/tugas-akhir/riwayat");

    expect(await screen.findByText("Judul Tugas Akhir Lama")).toBeInTheDocument();
    expect(screen.getByText("Dihentikan melalui evaluasi bimbingan")).toBeInTheDocument();
  });

  it("Riwayat shows an empty state when nothing has ended", async () => {
    renderAt("/tugas-akhir/riwayat");

    expect(await screen.findByText("Belum Ada Riwayat")).toBeInTheDocument();
  });
});
