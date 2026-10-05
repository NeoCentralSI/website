import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResearchMethod from "./ResearchMethod";
import {
  getAcademicYearsAPI,
  getActiveAcademicYearAPI,
} from "@/services/admin.service";

const setBreadcrumbs = vi.fn();
const setTitle = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useOutletContext: () => ({ setBreadcrumbs, setTitle }),
  };
});

vi.mock("@/services/admin.service", () => ({
  getAcademicYearsAPI: vi.fn(),
  getActiveAcademicYearAPI: vi.fn(),
}));

vi.mock(
  "@/components/master-data/research-method/ResearchMethodCpmkManagementPanel",
  () => ({
    ResearchMethodCpmkManagementPanel: ({
      academicYearId,
    }: {
      academicYearId?: string;
    }) => <div data-testid="cpmk-panel">{academicYearId}</div>,
  }),
);

vi.mock(
  "@/components/master-data/research-method/ResearchMethodRubricManagementPanel",
  () => ({
    ResearchMethodRubricManagementPanel: ({
      academicYearId,
    }: {
      academicYearId?: string;
    }) => <div data-testid="rubric-panel">{academicYearId}</div>,
  }),
);

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ResearchMethod />
    </QueryClientProvider>,
  );
}

describe("ResearchMethod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAcademicYearsAPI).mockResolvedValue({
      academicYears: [
        {
          id: "ay-active",
          semester: "ganjil",
          year: "2026/2027",
          startDate: "2026-08-01",
          endDate: "2027-01-31",
          isActive: true,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(getActiveAcademicYearAPI).mockResolvedValue({
      academicYear: {
        id: "ay-active",
        semester: "ganjil",
        year: "2026/2027",
        startDate: "2026-08-01",
        endDate: "2027-01-31",
        isActive: true,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
    });
  });

  it("menggunakan tahun ajaran aktif dan membuka panel CPMK secara default", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Kelola Metode Penelitian" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("cpmk-panel")).toHaveTextContent("ay-active"),
    );
    expect(setTitle).toHaveBeenCalledWith("Kelola Metode Penelitian");
  });

  it("berpindah ke panel rubrik tanpa kehilangan tahun ajaran", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("cpmk-panel")).toHaveTextContent("ay-active"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Rubrik Penilaian" }));

    expect(screen.getByTestId("rubric-panel")).toHaveTextContent("ay-active");
  });
});
