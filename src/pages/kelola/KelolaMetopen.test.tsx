import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KelolaMetopen from "./KelolaMetopen";
import { useRole } from "@/hooks/shared";

const mockSetBreadcrumbs = vi.fn();
const mockSetTitle = vi.fn();

vi.mock("react-router-dom", () => ({
  Navigate: ({
    to,
    replace,
  }: {
    to: string;
    replace?: boolean;
  }) => <div data-replace={String(Boolean(replace))} data-testid="navigate" data-to={to} />,
  useOutletContext: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
    setTitle: mockSetTitle,
  }),
}));

vi.mock("@/hooks/shared", () => ({
  useRole: vi.fn(),
}));

function mockRole(
  overrides: {
    isKoordinatorMetopen?: boolean;
    isKadep?: boolean;
    isSekdep?: boolean;
    isLoading?: boolean;
  } = {},
) {
  vi.mocked(useRole).mockReturnValue({
    isKoordinatorMetopen: vi.fn(
      () => overrides.isKoordinatorMetopen ?? false,
    ),
    isKadep: vi.fn(() => overrides.isKadep ?? false),
    isSekdep: vi.fn(() => overrides.isSekdep ?? false),
    isLoading: overrides.isLoading ?? false,
  } as unknown as ReturnType<typeof useRole>);
}

describe("KelolaMetopen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole();
  });

  it("redirects KOORDINATOR_METOPEN users to the TA-03B queue", () => {
    mockRole({ isKoordinatorMetopen: true });

    render(<KelolaMetopen />);

    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/kelola/metopen/ta03b",
    );
  });

  it("redirects Sekdep users to the thesis management surface", () => {
    mockRole({ isSekdep: true });

    render(<KelolaMetopen />);

    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/kelola/tugas-akhir",
    );
  });

  it("redirects Kadep users to the department decision surface", () => {
    mockRole({ isKadep: true });

    render(<KelolaMetopen />);

    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/kelola/tugas-akhir/kadep",
    );
  });

  it("prioritizes the Kadep surface when the user has multiple roles", () => {
    mockRole({ isKoordinatorMetopen: true, isKadep: true, isSekdep: true });

    render(<KelolaMetopen />);

    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/kelola/tugas-akhir/kadep",
    );
  });

  it("prioritizes the TA-03B queue over Sekdep coordination for combined KOORDINATOR_METOPEN and Sekdep roles", () => {
    mockRole({ isKoordinatorMetopen: true, isSekdep: true });

    render(<KelolaMetopen />);

    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/kelola/metopen/ta03b",
    );
  });

  it("shows a loading state while role data is still resolving", () => {
    mockRole({ isLoading: true });

    render(<KelolaMetopen />);

    expect(screen.getByText("Mengarahkan...")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("sets the breadcrumb to Metode Penelitian on mount", () => {
    render(<KelolaMetopen />);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: "Metode Penelitian" },
    ]);
  });

  it("sets the page title to Metode Penelitian on mount", () => {
    render(<KelolaMetopen />);

    expect(mockSetTitle).toHaveBeenCalledWith("Metode Penelitian");
  });

  it("no longer renders the legacy static guide content", () => {
    render(<KelolaMetopen />);

    expect(
      screen.queryByText("Ruang Lingkup Aktif SIMPTA"),
    ).not.toBeInTheDocument();
  });
});
