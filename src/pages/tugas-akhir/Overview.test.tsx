import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
vi.mock("@/components/thesis-guidance-evaluation/StudentThesisGuidanceEvaluationCard", () => ({
  StudentThesisGuidanceEvaluationCard: () => <div>Kartu Evaluasi Bimbingan</div>,
}));
vi.mock("@/components/thesis-change-request/StudentThesisChangeRequestCard", () => ({
  StudentThesisChangeRequestCard: () => <div>Kartu Perubahan Tugas Akhir</div>,
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

  it("shows readiness, change request and evaluation cards; the old document card is gone", async () => {
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Kartu Kesiapan Seminar")).toBeInTheDocument();
    expect(screen.getByText("Kartu Kesiapan Sidang")).toBeInTheDocument();
    expect(screen.getByText("Kartu Perubahan Tugas Akhir")).toBeInTheDocument();
    expect(screen.getByText("Kartu Evaluasi Bimbingan")).toBeInTheDocument();
    expect(screen.queryByText("Dokumen Tugas Akhir")).not.toBeInTheDocument();
    expect(screen.queryByText("Belum ada dokumen")).not.toBeInTheDocument();
  });

  it("hides the seminar card once the results seminar is passed", async () => {
    vi.mocked(useDefenceReadinessStatus).mockReturnValue({ data: { requirementsMet: true }, isLoading: false } as unknown as ReturnType<typeof useDefenceReadinessStatus>);
    vi.mocked(useSeminarReadinessStatus).mockReturnValue({ data: { guidanceProgress: { completed: 9, required: 8, isComplete: true } }, isLoading: false } as unknown as ReturnType<typeof useSeminarReadinessStatus>);
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Kartu Kesiapan Sidang")).toBeInTheDocument();
    expect(screen.queryByText("Kartu Kesiapan Seminar")).not.toBeInTheDocument();
  });

  it("shows the academic warning with the extension deadline", async () => {
    const thesis = buildThesis();
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({
      supervisionClock: { ...thesis.supervisionClock!, extensionUntil: "2026-11-09T03:00:00.000Z", evaluationDue: null },
    }));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Peringatan akademik")).toBeInTheDocument();
    expect(screen.getByText(/diperpanjang 1 bulan sampai 9 November 2026 10\.00 WIB/)).toBeInTheDocument();
    expect(screen.getByText("Tidak ada yang jatuh tempo")).toBeInTheDocument();
  });

  it("disables Ajukan Bimbingan with its reason while the thesis is on leave", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({ status: "on_leave", activityLevel: null }));
    renderAt("/tugas-akhir");

    expect(await screen.findByRole("button", { name: /Ajukan Bimbingan/ })).toBeDisabled();
    expect(screen.getByText(/Ajukan Bimbingan belum tersedia:/)).toBeInTheDocument();
    expect(screen.getByText("Berhenti Studi Sementara (BSS)")).toBeInTheDocument();
    expect(screen.queryByText("on_leave")).not.toBeInTheDocument();
  });

  it("shows an empty state when the student has no thesis", async () => {
    vi.mocked(getMyThesisDetail).mockRejectedValue(new Error("Active thesis not found for this student"));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Belum Ada Tugas Akhir yang Berjalan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat Riwayat" })).not.toBeInTheDocument();
    expect(screen.queryByText("Informasi Tugas Akhir")).not.toBeInTheDocument();
  });

  it("points to Riwayat when the latest thesis has ended", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(buildThesis({ status: "failed" }));
    renderAt("/tugas-akhir");

    expect(await screen.findByText("Belum Ada Tugas Akhir yang Berjalan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat Riwayat" })).toBeInTheDocument();
  });

  it("Riwayat lists ended theses with the reason a thesis was stopped", async () => {
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
    expect(getMyThesisDetail).not.toHaveBeenCalled();
  });

  it("Riwayat shows an empty state when nothing has ended", async () => {
    renderAt("/tugas-akhir/riwayat");

    expect(await screen.findByText("Belum Ada Riwayat")).toBeInTheDocument();
  });
});
