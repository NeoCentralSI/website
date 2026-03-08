import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import CariPembimbing from "./CariPembimbing";
import { useAdvisorAccessState } from "@/hooks/shared";

vi.mock("@/hooks/shared", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/shared")>("@/hooks/shared");
  return {
    ...actual,
    useAdvisorAccessState: vi.fn(),
  };
});

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

describe("CariPembimbing", () => {
  it("should show active supervisor state when advisor is already assigned", async () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        studentId: "student-1",
        thesisId: "thesis-1",
        thesisTitle: "Judul Uji",
        thesisStatus: "Bimbingan",
        gateConfigured: true,
        gateOpen: true,
        gates: [],
        supervisors: [
          {
            id: "supervisor-1",
            lecturerId: "lecturer-1",
            name: "Dosen Pembimbing",
            email: "lecturer@example.com",
            avatarUrl: null,
            role: "Pembimbing 1",
          },
        ],
        hasOfficialSupervisor: true,
        hasBlockingRequest: false,
        blockingRequest: null,
        requestStatus: null,
        canBrowseCatalog: false,
        canSubmitRequest: false,
        canOpenLogbook: true,
        reason: "Anda sudah memiliki dosen pembimbing resmi.",
        nextStep: "open_logbook",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    render(<CariPembimbing />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Anda sudah memiliki dosen pembimbing resmi.")
    ).toBeInTheDocument();
    expect(screen.getByText("Buka Logbook Bimbingan")).toBeInTheDocument();
    expect(screen.getByText("Dosen Pembimbing")).toBeInTheDocument();
  });
});
