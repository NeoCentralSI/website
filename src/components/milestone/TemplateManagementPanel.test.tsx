import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TemplateManagementPanel } from "./TemplateManagementPanel";

type QueryState = {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  refetch?: () => void;
};

const { state, useTemplatesMock, mutation } = vi.hoisted(() => ({
  state: { templates: {}, templateTopics: {}, topics: {} } as {
    templates: QueryState;
    templateTopics: QueryState;
    topics: QueryState;
  },
  useTemplatesMock: vi.fn(),
  mutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/milestone/useMilestone", () => ({
  useTemplates: (...args: unknown[]) => {
    useTemplatesMock(...args);
    return { isLoading: false, isError: false, error: null, refetch: vi.fn(), ...state.templates };
  },
  useTemplateTopics: () => ({ isLoading: false, isError: false, error: null, refetch: vi.fn(), ...state.templateTopics }),
  useTopics: () => ({ isLoading: false, isError: false, error: null, refetch: vi.fn(), ...state.topics }),
  useCreateTemplate: mutation,
  useUpdateTemplate: mutation,
  useDeleteTemplate: mutation,
  useBulkDeleteTemplates: mutation,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// The same panel for the general proposal templates (Kelola > Metode Penelitian).
const proposal = vi.hoisted(() => ({
  query: { data: [] as unknown[], isLoading: false, isError: false, error: null, refetch: () => {} },
  create: { mutate: vi.fn(), isPending: false },
  update: { mutate: vi.fn(), isPending: false },
  remove: { mutate: vi.fn(), isPending: false },
  removeMany: { mutate: vi.fn(), isPending: false },
  reorder: { mutateAsync: vi.fn(), isPending: false },
}));
vi.mock("@/hooks/research-method/useMilestoneTemplates", () => ({
  useProposalMilestoneTemplates: () => proposal.query,
  useProposalMilestoneTemplateMutations: () => ({
    create: proposal.create, update: proposal.update, remove: proposal.remove, removeMany: proposal.removeMany, reorder: proposal.reorder,
  }),
}));

const TOPICS = [
  { id: "topic-bi", name: "Business Intelligence (BI)", count: 0 },
  { id: "topic-ps", name: "Pengembangan Sistem (Enterprise Application)", count: 1 },
];

const template = (id: string, name: string, topicId: string, isActive = true) => ({
  id,
  name,
  description: null,
  topicId,
  topic: TOPICS.find((t) => t.id === topicId) ?? null,
  orderIndex: 0,
  isActive,
});

vi.mock("lottie-react", () => ({ default: () => <div data-testid="lottie-mock" /> }));

// cmdk (combobox list) needs ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Topics are picked from one searchable combobox.
function pickTopic(name: RegExp) {
  fireEvent.click(screen.getByRole("combobox", { name: /Pilih topik/ }));
  fireEvent.click(screen.getByRole("option", { name }));
}

beforeEach(() => {
  useTemplatesMock.mockClear();
  state.templates = { data: [] };
  state.templateTopics = { data: TOPICS };
  state.topics = { data: TOPICS };
});

describe("TemplateManagementPanel", () => {
  it("requests active and inactive TA templates for the first topic", () => {
    render(<TemplateManagementPanel />);
    expect(useTemplatesMock).toHaveBeenLastCalledWith("topic-bi", { includeInactive: true });
  });

  it("explains that the selected topic has no templates (not a generic empty list)", () => {
    render(<TemplateManagementPanel />);
    expect(
      screen.getByText(/Belum ada template milestone untuk topik Business Intelligence \(BI\)/),
    ).toBeInTheDocument();
  });

  it("shows a loading state while templates load", () => {
    state.templates = { data: undefined, isLoading: true };
    render(<TemplateManagementPanel />);
    expect(screen.getByText("Memuat template...")).toBeInTheDocument();
  });

  it("shows a request error with retry instead of the empty state", () => {
    const refetch = vi.fn();
    state.templates = { data: undefined, isError: true, error: new Error("Server error 500"), refetch };
    render(<TemplateManagementPanel />);

    expect(screen.getByText("Gagal memuat template")).toBeInTheDocument();
    expect(screen.getByText("Server error 500")).toBeInTheDocument();
    expect(screen.queryByText(/Belum ada template milestone/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Coba lagi/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows a topic-list error with retry", () => {
    const refetch = vi.fn();
    state.templateTopics = { data: undefined, isError: true, error: new Error("Gagal mengambil topik template"), refetch };
    render(<TemplateManagementPanel />);

    expect(screen.getByText("Gagal memuat daftar topik")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Coba lagi/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("distinguishes 'no search results' from 'no templates'", () => {
    state.templates = { data: [template("tpl-1", "Studi Literatur", "topic-ps")] };
    render(<TemplateManagementPanel />);
    expect(screen.getByText("Studi Literatur")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cari template"), { target: { value: "tidak-ada" } });
    expect(screen.getByText(/Tidak ada template yang cocok dengan pencarian/)).toBeInTheDocument();
    expect(screen.queryByText(/Belum ada template milestone/)).not.toBeInTheDocument();
  });

  it("shows inactive templates so they can be re-activated", () => {
    state.templates = { data: [template("tpl-2", "Template Lama", "topic-bi", false)] };
    render(<TemplateManagementPanel />);
    expect(screen.getByText("Template Lama")).toBeInTheDocument();
    expect(screen.getByText("Nonaktif")).toBeInTheDocument();
  });

  it("keeps the user's topic choice when topic data is refetched", () => {
    const { rerender } = render(<TemplateManagementPanel />);
    pickTopic(/Pengembangan Sistem/);
    expect(useTemplatesMock).toHaveBeenLastCalledWith("topic-ps", { includeInactive: true });

    // Refetch returns new array/object identities with the same topics.
    state.templateTopics = { data: TOPICS.map((t) => ({ ...t })) };
    rerender(<TemplateManagementPanel />);
    expect(useTemplatesMock).toHaveBeenLastCalledWith("topic-ps", { includeInactive: true });
  });

  it("falls back to the first topic only when the selected topic disappears", () => {
    const { rerender } = render(<TemplateManagementPanel />);
    pickTopic(/Pengembangan Sistem/);

    state.templateTopics = { data: [TOPICS[0]] };
    rerender(<TemplateManagementPanel />);
    expect(useTemplatesMock).toHaveBeenLastCalledWith("topic-bi", { includeInactive: true });
  });

  it("shows the selected topic with its template count in the combobox, and counts per option", () => {
    render(<TemplateManagementPanel />);
    const trigger = screen.getByRole("combobox", { name: /Pilih topik/ });
    expect(trigger).toHaveTextContent("Business Intelligence (BI)");
    expect(trigger).toHaveTextContent("0");
    fireEvent.click(trigger);
    expect(screen.getByRole("option", { name: /Pengembangan Sistem.*1/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cari topik...")).toBeInTheDocument();
  });

  it("empty topic: EmptyState with a 'Tambah Template' button that opens the add dialog", () => {
    render(<TemplateManagementPanel />);
    expect(screen.getByText("Belum Ada Template")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /Tambah Template/ });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("TemplateManagementPanel phase=\"proposal\"", () => {
  const proposalTemplate = (id: string, name: string, orderIndex: number, usedCount = 0, isActive = true) => ({
    id, name, description: `Deskripsi ${name}`, orderIndex, isActive, usedCount, updatedAt: "2026-10-01T00:00:00.000Z",
  });

  beforeEach(() => {
    proposal.query = { data: [], isLoading: false, isError: false, error: null, refetch: () => {} };
    vi.clearAllMocks();
  });

  it("is the same panel without the topic picker; it never reads the thesis templates", () => {
    render(<TemplateManagementPanel phase="proposal" />);
    expect(screen.getByText("Kelola Template Milestone")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Pilih topik/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Belum ada template milestone fase proposal/)).toBeInTheDocument();
    expect(useTemplatesMock).not.toHaveBeenCalled();
  });

  it("lists the templates in order with their usage, and edits without a topic field", () => {
    proposal.query = { ...proposal.query, data: [proposalTemplate("p2", "Bab II", 1), proposalTemplate("p1", "Bab I", 0, 3), proposalTemplate("p3", "Lama", 2, 0, false)] };
    render(<TemplateManagementPanel phase="proposal" />);
    const names = screen.getAllByText(/^(Bab I|Bab II|Lama)$/).map((el) => el.textContent);
    expect(names).toEqual(["Bab I", "Bab II", "Lama"]);
    expect(screen.getByText(/Dipakai 3 milestone mahasiswa/)).toBeInTheDocument();
    expect(screen.getByText("Nonaktif")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Edit/ })[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Template fase Proposal, berlaku umum tanpa topik");
    expect(screen.queryByLabelText("Topik")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(proposal.update.mutate).toHaveBeenCalledWith(
      { id: "p1", dto: { name: "Bab I", description: "Deskripsi Bab I", isActive: true, orderIndex: 0 } },
      expect.anything(),
    );
  });

  it("asks for at least three characters, as the server does", () => {
    render(<TemplateManagementPanel phase="proposal" />);
    fireEvent.click(screen.getAllByRole("button", { name: /Tambah Template/ })[0]);
    fireEvent.change(screen.getByLabelText("Nama"), { target: { value: "ab" } });
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
    expect(screen.getByText("Nama template minimal 3 karakter.")).toBeInTheDocument();
  });

  it("deletes the selected templates together", () => {
    proposal.query = { ...proposal.query, data: [proposalTemplate("p1", "Bab I", 0), proposalTemplate("p2", "Bab II", 1)] };
    render(<TemplateManagementPanel phase="proposal" />);
    fireEvent.click(screen.getByLabelText(/Pilih semua/));
    fireEvent.click(screen.getByRole("button", { name: /Hapus \(2\)/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, Hapus" }));
    expect(proposal.removeMany.mutate).toHaveBeenCalledWith(["p1", "p2"], expect.anything());
  });
});
