import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MetopenCpmkRubric from "./MetopenCpmkRubric";

const mockSetBreadcrumbs = vi.fn();
const mockSetTitle = vi.fn();

vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
    setTitle: mockSetTitle,
  }),
}));

vi.mock("@/components/kelola/rubric-metopen/RubricMetopenManagementPanel", () => ({
  RubricMetopenManagementPanel: () => (
    <div data-testid="rubric-metopen-panel">Rubric panel</div>
  ),
}));

describe("MetopenCpmkRubric", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets Metopen-scoped breadcrumbs and title", () => {
    render(<MetopenCpmkRubric />);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: "Metode Penelitian", href: "/kelola/metopen" },
      { label: "CPMK & Rubrik Penilaian" },
    ]);
    expect(mockSetTitle).toHaveBeenCalledWith("CPMK & Rubrik Penilaian");
  });

  it("shows focused page heading for Metopen assessment setup", () => {
    render(<MetopenCpmkRubric />);

    expect(
      screen.getByRole("heading", { name: /CPMK & Rubrik Penilaian/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/komposisi batas poin TA-03A\/TA-03B per/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("rubric-metopen-panel")).toBeInTheDocument();
  });
});
