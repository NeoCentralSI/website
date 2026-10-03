import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRole } from "@/hooks/shared";
import KelolaTugasAkhirPage from "./TugasAkhir";

const context = vi.hoisted(() => ({
  pathname: "/kelola/tugas-akhir/master-data",
  setBreadcrumbs: vi.fn(),
  setTitle: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: context.pathname }),
  useOutletContext: () => context,
}));
vi.mock("@/hooks/shared", () => ({ useRole: vi.fn() }));
vi.mock("@/components/ui/tabs-nav", () => ({
  TabsNav: () => <nav aria-label="Tab pengelolaan TA" />,
}));
vi.mock("@/components/kelola/DataMasterTaPanel", () => ({
  DataMasterTaPanel: () => <table aria-label="Data master TA" />,
}));
vi.mock("@/components/kelola/TopicManagementPanel", () => ({
  TopicManagementPanel: () => <div>Pengelolaan topik</div>,
}));
vi.mock("@/components/master-data/thesis-cpmk/ThesisCpmkManagementPanel", () => ({
  ThesisCpmkManagementPanel: () => <div>Pengelolaan CPMK</div>,
}));
vi.mock("@/components/master-data/seminar-rubric/SeminarRubricManagementPanel", () => ({
  SeminarRubricManagementPanel: () => <div>Rubrik seminar</div>,
}));
vi.mock("@/components/master-data/defence-rubric/DefenceRubricManagementPanel", () => ({
  DefenceRubricManagementPanel: () => <div>Rubrik sidang</div>,
}));
vi.mock("@/components/master-data/seminar-requirement/SeminarRequirementManagementPanel", () => ({
  SeminarRequirementManagementPanel: () => <div>Syarat seminar</div>,
}));
vi.mock("@/components/master-data/defence-requirement/DefenceRequirementManagementPanel", () => ({
  DefenceRequirementManagementPanel: () => <div>Syarat sidang</div>,
}));

describe("KelolaTugasAkhirPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    context.pathname = "/kelola/tugas-akhir/master-data";
    vi.mocked(useRole).mockReturnValue({
      isKadep: () => true,
    } as ReturnType<typeof useRole>);
  });

  it.each(["master-data", "topik", "cpmk", "rubrik-seminar", "rubrik-sidang", "syarat-seminar", "syarat-sidang"])(
    "shows only master data for Kadep on the %s route, including old bookmarks",
    (tab) => {
      context.pathname = `/kelola/tugas-akhir/${tab}`;
      render(<KelolaTugasAkhirPage />);

      expect(screen.getByRole("heading", { name: "Data Master Tugas Akhir" })).toBeInTheDocument();
      expect(screen.getByText("Kelola data master tugas akhir, mahasiswa, topik, dan pembimbing")).toBeInTheDocument();
      expect(screen.getByRole("table", { name: "Data master TA" })).toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(screen.queryByText("Pengelolaan topik")).not.toBeInTheDocument();
      expect(context.setTitle).toHaveBeenCalledWith("Data Master Tugas Akhir");
      expect(context.setBreadcrumbs).toHaveBeenCalledWith([{ label: "Tugas Akhir" }]);
    },
  );

  it.each([
    ["topik", "Pengelolaan topik"],
    ["cpmk", "Pengelolaan CPMK"],
    ["rubrik-seminar", "Rubrik seminar"],
    ["rubrik-sidang", "Rubrik sidang"],
    ["syarat-seminar", "Syarat seminar"],
    ["syarat-sidang", "Syarat sidang"],
  ])("preserves the %s tab for other authorized roles", (tab, content) => {
    vi.mocked(useRole).mockReturnValue({
      isKadep: () => false,
    } as ReturnType<typeof useRole>);
    context.pathname = `/kelola/tugas-akhir/${tab}`;
    render(<KelolaTugasAkhirPage />);

    expect(screen.getByRole("navigation", { name: "Tab pengelolaan TA" })).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("preserves the master data tab for other authorized roles", () => {
    vi.mocked(useRole).mockReturnValue({
      isKadep: () => false,
    } as ReturnType<typeof useRole>);
    render(<KelolaTugasAkhirPage />);

    expect(screen.getByRole("navigation", { name: "Tab pengelolaan TA" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Data master TA" })).toBeInTheDocument();
  });
});
