import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResearchMethod from "./ResearchMethod";
import { ResearchMethodCpmkManagementPanel } from "@/components/master-data/research-method/ResearchMethodCpmkManagementPanel";
import { ResearchMethodRubricManagementPanel } from "@/components/master-data/research-method/ResearchMethodRubricManagementPanel";
import { getAcademicYearsAPI, getActiveAcademicYearAPI } from "@/services/admin.service";
import * as rmService from "@/services/researchMethodAssessment.service";
import * as rm from "@/services/research-method/research-method.service";

const setBreadcrumbs = vi.fn();
const setTitle = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useOutletContext: () => ({ setBreadcrumbs, setTitle }) };
});
vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/admin.service", () => ({ getAcademicYearsAPI: vi.fn(), getActiveAcademicYearAPI: vi.fn() }));
vi.mock("@/services/researchMethodAssessment.service");
vi.mock("@/services/research-method/research-method.service");
vi.mock("@/components/milestone/TemplateManagementPanel", () => ({
  TemplateManagementPanel: ({ phase }: { phase?: string }) => <div data-testid="template-panel">{phase}</div>,
}));


const YEARS = [
  { id: "ay-active", semester: "ganjil", year: "2026/2027", isActive: true },
  { id: "ay-old", semester: "genap", year: "2025/2026", isActive: false },
];

function wrap(ui: React.ReactNode, path = "/kelola/metode-penelitian/milestone") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/kelola/metode-penelitian/:tab" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAcademicYearsAPI).mockResolvedValue({ academicYears: YEARS } as never);
  vi.mocked(getActiveAcademicYearAPI).mockResolvedValue({ academicYear: YEARS[0] } as never);
  vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([]);
  vi.mocked(rmService.getResearchMethodConfiguration).mockResolvedValue([]);
  vi.mocked(rmService.getResearchMethodWeightSummary).mockResolvedValue({
    supervisorTotal: 75, coordinatorTotal: 25, totalScore: 100, isComplete: true, remainingScore: 0, supervisor: [], coordinator: [],
  });
  vi.mocked(rm.getAssessmentForm).mockResolvedValue({ party: "supervisor", academicYear: { id: "ay-active", label: "x" }, weight: 75, minimumScore: 60, criteria: [] });
});

describe("Kelola > Metode Penelitian", () => {
  it("Sekdep: title outside the cards, three tabs with their own address, the proposal template panel", async () => {
    wrap(<ResearchMethod />);
    expect(screen.getByRole("heading", { level: 1, name: "Kelola Metode Penelitian" })).toBeInTheDocument();
    expect(screen.getByText("Template milestone fase proposal, CPMK, serta kriteria dan rubrik Penilaian Proposal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Template Milestone" })).toHaveAttribute("href", "/kelola/metode-penelitian/milestone");
    expect(screen.getByRole("link", { name: "CPMK" })).toHaveAttribute("href", "/kelola/metode-penelitian/cpmk");
    expect(screen.getByRole("link", { name: "Rubrik Penilaian" })).toHaveAttribute("href", "/kelola/metode-penelitian/rubrik");
    expect(screen.getByTestId("template-panel")).toHaveTextContent("proposal");
    // The period is chosen inside the CPMK and Rubrik panels, not next to the title.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith("Kelola Metode Penelitian");
  });

  it("an unknown tab goes back to Template Milestone; the three tabs are always there (the page is the Sekdep's)", async () => {
    wrap(<ResearchMethod />, "/kelola/metode-penelitian/tidak-ada");
    await waitFor(() => expect(screen.getByTestId("template-panel")).toBeInTheDocument());
    for (const name of ["Template Milestone", "CPMK", "Rubrik Penilaian"]) expect(screen.getByRole("link", { name })).toBeInTheDocument();
  });
});

describe("CPMK panel", () => {
  it("chooses the period inside the panel and copies an empty period from another one", async () => {
    vi.mocked(rmService.copyResearchMethodCpmkTemplate).mockResolvedValue({ cpmk: 2, supervisorCriteria: 3, supervisorRubrics: 9, coordinatorCriteria: 1, coordinatorRubrics: 3 });
    wrap(<ResearchMethodCpmkManagementPanel />, "/kelola/metode-penelitian/cpmk");

    const period = await screen.findByRole("combobox", { name: "Tahun ajaran" });
    await waitFor(() => expect(period).toHaveTextContent("Ganjil 2026/2027 (Aktif)"));
    fireEvent.click(await screen.findByRole("button", { name: /Salin Template/ }));
    const dialog = await screen.findByRole("dialog", { name: "Salin Template CPMK" });
    const copy = within(dialog).getByRole("button", { name: "Salin Template" });
    expect(copy).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Genap 2025/2026" }));
    fireEvent.click(copy);
    await waitFor(() =>
      expect(rmService.copyResearchMethodCpmkTemplate).toHaveBeenCalledWith({ sourceAcademicYearId: "ay-old", targetAcademicYearId: "ay-active" }),
    );
  });

  it("offers no copy once the period has CPMKs", async () => {
    vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([
      { id: "c1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah penelitian", createdAt: "", updatedAt: "", criteriaCount: 2 },
    ]);
    wrap(<ResearchMethodCpmkManagementPanel />, "/kelola/metode-penelitian/cpmk");
    expect(await screen.findByText("CPMK-01")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Salin Template/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit CPMK-01" })).toBeInTheDocument();
  });

  it("is the thesis CPMK table: No, Kode CPMK, Deskripsi, Aksi; Hapus is red, and locked once Penilaian Proposal started", async () => {
    vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([
      { id: "c1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah penelitian", createdAt: "", updatedAt: "", criteriaCount: 2, hasAssessmentDetails: true },
    ]);
    wrap(<ResearchMethodCpmkManagementPanel />, "/kelola/metode-penelitian/cpmk");
    await screen.findByText("CPMK-01");
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["No", "Kode CPMK", "Deskripsi", "Aksi"]);
    const remove = screen.getByRole("button", { name: "Hapus CPMK-01" });
    expect(remove).toBeDisabled();
    expect(remove.className).toMatch(/text-red/);
    expect(remove.parentElement).toHaveAttribute("title", "Penilaian proposal semester ini sudah dimulai; CPMK, kriteria, dan rubrik tidak dapat dihapus.");
    expect(screen.getByRole("button", { name: "Edit CPMK-01" })).toBeEnabled();
  });

  it("Hapus works while Penilaian Proposal has not started", async () => {
    vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([
      { id: "c1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah penelitian", createdAt: "", updatedAt: "", hasAssessmentDetails: false },
    ]);
    wrap(<ResearchMethodCpmkManagementPanel />, "/kelola/metode-penelitian/cpmk");
    const remove = await screen.findByRole("button", { name: "Hapus CPMK-01" });
    expect(remove).toBeEnabled();
    expect(remove.parentElement).toHaveAttribute("title", "Hapus");
  });
});

describe("Rubrik panel", () => {
  it("has its own period select, the preview, and the minimum passing score of the period", async () => {
    vi.mocked(rm.setMinimumScore).mockResolvedValue({ success: true } as never);
    wrap(<ResearchMethodRubricManagementPanel />, "/kelola/metode-penelitian/rubrik");

    expect(await screen.findByRole("combobox", { name: "Tahun ajaran" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pratinjau Form Penilaian/ })).toBeDisabled();
    expect(await screen.findByText("100 / 100")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /Min Lulus: 60/ }));
    const dialog = await screen.findByRole("dialog", { name: "Pengaturan Skor Minimum Lulus" });
    fireEvent.change(within(dialog).getByLabelText(/Skor Minimum/), { target: { value: "65" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(rm.setMinimumScore).toHaveBeenCalledWith("ay-active", 65));
    expect(screen.getByText(/belum punya CPMK/)).toBeInTheDocument();
  });

  const configured = [{
    id: "cp1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah", createdAt: "", updatedAt: "",
    assessmentCriterias: [{
      id: "k1", researchMethodCpmkId: "cp1", name: "Presentasi", maxScore: 20, displayOrder: 0, assessor: "supervisor" as const,
      assessmentRubrics: [{ id: "r1", assessmentCriteriaId: "k1", minScore: 0, maxScore: 20, description: "Baik", displayOrder: 0, createdAt: "", updatedAt: "" }],
    }],
  }];

  it("locks deleting, new criteria and rubrics, and the minimum score once Penilaian Proposal started and a result is final", async () => {
    vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([{ id: "cp1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah", createdAt: "", updatedAt: "" }]);
    vi.mocked(rmService.getResearchMethodConfiguration).mockResolvedValue(configured);
    vi.mocked(rmService.getResearchMethodWeightSummary).mockResolvedValue({
      supervisorTotal: 75, coordinatorTotal: 25, totalScore: 100, isComplete: true, remainingScore: 0, supervisor: [], coordinator: [],
      assessmentStarted: true, minimumScoreLocked: true,
    });
    wrap(<ResearchMethodRubricManagementPanel />, "/kelola/metode-penelitian/rubrik");

    const minimum = await screen.findByRole("button", { name: /Min Lulus: 60/ });
    await waitFor(() => expect(minimum).toBeDisabled());
    expect(minimum.parentElement).toHaveAttribute("title", "Nilai minimum lulus terkunci karena sudah ada hasil penilaian final pada semester ini.");
    fireEvent.click(await screen.findByText(/\[CPMK-01\]/));
    const deleteReason = "Penilaian proposal semester ini sudah dimulai; CPMK, kriteria, dan rubrik tidak dapat dihapus.";
    const scoreReason = "Penilaian proposal semester ini sudah dimulai; skor maksimum kriteria dan rentang rubrik tidak dapat diubah.";
    for (const name of ["Hapus kriteria", "Hapus rubrik"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button.parentElement).toHaveAttribute("title", deleteReason);
    }
    const all = screen.getByRole("button", { name: /Hapus Semua/ });
    expect(all).toBeDisabled();
    expect(all.parentElement).toHaveAttribute("title", deleteReason);
    for (const name of [/^Kriteria$/, /^Rubrik$/]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button.parentElement).toHaveAttribute("title", scoreReason);
    }
    // Names stay editable; the maximum score field is locked with the reason.
    fireEvent.click(screen.getByRole("button", { name: "Ubah kriteria" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Nama Kriteria/)).toBeEnabled();
    expect(within(dialog).getByLabelText(/Skor Maksimal/)).toBeDisabled();
    expect(within(dialog).getByText(scoreReason)).toBeInTheDocument();
  });

  it("the preview is the score form itself in preview mode (typing works, nothing is saved)", async () => {
    vi.mocked(rmService.getResearchMethodCpmks).mockResolvedValue([{ id: "cp1", academicYearId: "ay-active", code: "CPMK-01", description: "Merumuskan masalah", createdAt: "", updatedAt: "" }]);
    vi.mocked(rmService.getResearchMethodConfiguration).mockResolvedValue(configured);
    wrap(<ResearchMethodRubricManagementPanel />, "/kelola/metode-penelitian/rubrik");
    const open = await screen.findByRole("button", { name: /Pratinjau Form Penilaian/ });
    await waitFor(() => expect(open).toBeEnabled());
    fireEvent.click(open);
    const dialog = await screen.findByRole("dialog", { name: /Pratinjau Form Penilaian Proposal/ });
    expect(within(dialog).getByText("Form Penilaian Proposal (Pembimbing)")).toBeInTheDocument();
    expect(within(dialog).getByRole("table", { name: "Rubrik Presentasi" })).toHaveTextContent("0 – 20");
    fireEvent.change(within(dialog).getByLabelText("(a) Presentasi"), { target: { value: "15" } });
    expect(within(dialog).getByLabelText("Total skor")).toHaveTextContent("15");
    for (const name of ["Simpan Draf", "Kirim Nilai"]) {
      const button = within(dialog).getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button.parentElement).toHaveAttribute("title", "Pratinjau: nilai tidak disimpan.");
    }
  });
});
