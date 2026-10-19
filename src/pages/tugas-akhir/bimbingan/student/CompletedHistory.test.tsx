import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CompletedHistoryPage from "./CompletedHistory";
import { getMyThesisDetail, getStudentSupervisors, type MyThesisDetail } from "@/services/studentGuidance.service";

vi.mock("@/services/studentGuidance.service", () => ({
  getMyThesisDetail: vi.fn(),
  getStudentSupervisors: vi.fn(),
}));
vi.mock("@/components/thesis/CompletedGuidanceHistory", () => ({
  default: () => <div>Daftar Riwayat Bimbingan</div>,
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/tugas-akhir/bimbingan/student/history"]}>
        <Routes>
          <Route element={<Outlet context={{ setBreadcrumbs: vi.fn(), setTitle: vi.fn() }} />}>
            <Route path="/tugas-akhir/bimbingan/student/history" element={<CompletedHistoryPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const thesisWith = (status: MyThesisDetail["status"], extra: Partial<MyThesisDetail> = {}) =>
  ({ id: "thesis-1", title: "Sistem Uji", status, ...extra }) as MyThesisDetail;

describe("Riwayat Bimbingan", () => {
  beforeEach(() => {
    vi.mocked(getStudentSupervisors).mockResolvedValue({ thesisId: "thesis-1", supervisors: [] } as never);
  });

  it("a thesis made Selesai by its defence keeps its history readable, with the closed notice", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(thesisWith("completed", { completedAt: "2026-10-17T03:00:00.000Z" }));
    renderPage();
    expect(await screen.findByText(/Tugas akhir ini selesai pada/)).toBeInTheDocument();
    expect(screen.getByText("Daftar Riwayat Bimbingan")).toBeInTheDocument();
    expect(screen.queryByText("Tugas Akhir Tidak Aktif")).not.toBeInTheDocument();
  });

  it("a running thesis shows the history without a notice", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(thesisWith("research"));
    renderPage();
    expect(await screen.findByText("Daftar Riwayat Bimbingan")).toBeInTheDocument();
    expect(screen.queryByText(/Tugas akhir ini selesai pada/)).not.toBeInTheDocument();
  });

  it("a stopped thesis (Gagal) is still not readable here", async () => {
    vi.mocked(getMyThesisDetail).mockResolvedValue(thesisWith("failed"));
    renderPage();
    expect(await screen.findByText("Tugas Akhir Tidak Aktif")).toBeInTheDocument();
    expect(screen.queryByText("Daftar Riwayat Bimbingan")).not.toBeInTheDocument();
  });
});
