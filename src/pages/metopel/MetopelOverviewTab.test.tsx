import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { MetopelOverviewTab } from "./MetopelOverviewTab";
import { useAdvisorAccessState } from "@/hooks/shared";
import { metopenService } from "@/services/metopen.service";

vi.mock("@/hooks/shared", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/shared")>("@/hooks/shared");
  return {
    ...actual,
    useAdvisorAccessState: vi.fn(),
  };
});

vi.mock("@/services/metopen.service", () => ({
  metopenService: {
    getMyTasks: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MetopelOverviewTab", () => {
  it("should show advisor search CTA when gate is open and no supervisor exists", async () => {
    vi.mocked(metopenService.getMyTasks).mockResolvedValue({
      thesisId: "thesis-1",
      tasks: [],
      progress: 0,
      gateOpen: true,
    });
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Metopel",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [],
        hasOfficialSupervisor: false,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: true,
        canSubmitRequest: true,
        canOpenLogbook: false,
        reason: "Anda sudah memenuhi syarat untuk mencari dan mengajukan dosen pembimbing.",
        nextStep: "browse_catalog",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    render(<MetopelOverviewTab />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Cari Pembimbing")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Syarat pencarian pembimbing terpenuhi. Silakan ajukan sekarang.")
    ).toBeInTheDocument();
  });
});
