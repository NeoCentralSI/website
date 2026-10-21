import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAcademicYearsAPI, getLecturersAPI, getStudentsAPI } from "@/services/admin.service";
import { createMasterDataThesis, getMasterDataTheses, type MasterDataThesis } from "@/services/masterDataTa.service";
import { getTopics } from "@/services/topic.service";
import { DataMasterTaPanel } from "./DataMasterTaPanel";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("./ExportExcelDialog", () => ({ ExportExcelDialog: () => null }));
vi.mock("./ImportMasterDataDialog", () => ({ ImportMasterDataDialog: () => null }));
vi.mock("@/services/masterDataTa.service", () => ({
  getMasterDataTheses: vi.fn(),
  createMasterDataThesis: vi.fn(),
  updateMasterDataThesis: vi.fn(),
}));
vi.mock("@/services/admin.service", () => ({
  getStudentsAPI: vi.fn(),
  getLecturersAPI: vi.fn(),
  getAcademicYearsAPI: vi.fn(),
}));
vi.mock("@/services/topic.service", () => ({ getTopics: vi.fn() }));

// cmdk (combobox list) needs ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const thesis = (overrides: Partial<MasterDataThesis> = {}): MasterDataThesis => ({
  id: "t1",
  title: "Sistem Informasi Tugas Akhir",
  activityLevel: "active",
  startDate: "2026-03-02T00:00:00.000Z",
  status: "research",
  statusBeforeLeave: null,
  student: { id: "s1", nim: "2211522028", name: "Ilham Nofaldi" },
  topic: null,
  academicYear: null,
  supervisors: [{ lecturerId: "l1", roleName: "Pembimbing 1", name: "Husnil Kamil" }] as MasterDataThesis["supervisors"],
  ...overrides,
});

const students = [
  { id: "s1", fullName: "Ilham Nofaldi", email: "ilham@example.test", identityNumber: "2211522028" },
  { id: "s2", fullName: "Nabil Rizki", email: "nabil@example.test", identityNumber: "2211523030" },
  { id: "s3", fullName: "Fathur Rahman", email: "fathur@example.test", identityNumber: "2011522001" },
];
const lecturers = [
  { id: "l1", fullName: "Husnil Kamil", email: "husnil@example.test", identityNumber: "198201182008121002" },
  { id: "l2", fullName: "Ricky Akbar", email: "ricky@example.test", identityNumber: "198410062012121001" },
];

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DataMasterTaPanel />
    </QueryClientProvider>,
  );
}

async function openEdit() {
  renderPanel();
  await screen.findByText("Sistem Informasi Tugas Akhir");
  const row = screen.getByText("Sistem Informasi Tugas Akhir").closest("tr")!;
  fireEvent.click(within(row).getByRole("button"));
  return screen.findByRole("dialog");
}

describe("DataMasterTaPanel form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMasterDataTheses).mockResolvedValue([thesis()]);
    vi.mocked(getStudentsAPI).mockResolvedValue({ students, meta: { page: 1, pageSize: 1000, total: 3, totalPages: 1 } } as never);
    vi.mocked(getLecturersAPI).mockResolvedValue({ lecturers, meta: { page: 1, pageSize: 1000, total: 2, totalPages: 1 } } as never);
    vi.mocked(getAcademicYearsAPI).mockResolvedValue({ academicYears: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } } as never);
    vi.mocked(getTopics).mockResolvedValue([]);
    vi.mocked(createMasterDataThesis).mockResolvedValue({});
  });

  it("The title is clamped to two lines with an ellipsis and the topic badge ends with one", async () => {
    renderPanel();
    const title = await screen.findByText("Sistem Informasi Tugas Akhir");
    expect(title.className).toContain("line-clamp-2");
    expect(title.className).toContain("whitespace-normal");
    expect(title).toHaveAttribute("title", "Sistem Informasi Tugas Akhir");
    const topic = screen.getByText("Tanpa Topik");
    expect(topic.className).toContain("truncate");
    expect(topic.className).toContain("inline-block");
    expect(topic).toHaveAttribute("title", "Tanpa Topik");
  });

  it("picks the student from a combobox searched by name or NIM and shows 'Nama (NIM)'", async () => {
    renderPanel();
    await screen.findByText("Sistem Informasi Tugas Akhir");
    fireEvent.click(screen.getByRole("button", { name: /Tambah Data TA/ }));

    const trigger = await screen.findByRole("combobox", { name: "Pilih mahasiswa" });
    expect(trigger).toHaveTextContent("Pilih mahasiswa...");
    fireEvent.click(trigger);

    const search = screen.getByPlaceholderText("Cari nama atau NIM...");
    expect(screen.getAllByRole("option")).toHaveLength(3);

    // By NIM: only the matching student stays in the list.
    fireEvent.change(search, { target: { value: "2011522001" } });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByRole("option", { name: "Fathur Rahman (2011522001)" })).toBeInTheDocument();

    // By name, in any letter case.
    fireEvent.change(search, { target: { value: "nabil" } });
    await waitFor(() => expect(screen.getByRole("option", { name: "Nabil Rizki (2211523030)" })).toBeInTheDocument());
    expect(screen.getAllByRole("option")).toHaveLength(1);

    fireEvent.change(search, { target: { value: "tidak ada" } });
    expect(await screen.findByText("Mahasiswa tidak ditemukan.")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "nabil" } });
    fireEvent.click(await screen.findByRole("option", { name: "Nabil Rizki (2211523030)" }));
    expect(screen.getByRole("combobox", { name: "Pilih mahasiswa" })).toHaveTextContent("Nabil Rizki (2211523030)");
  });

  it("uses the same combobox for Pembimbing 1 and 2, searchable by NIP, and sends the chosen ids", async () => {
    renderPanel();
    await screen.findByText("Sistem Informasi Tugas Akhir");
    fireEvent.click(screen.getByRole("button", { name: /Tambah Data TA/ }));

    fireEvent.click(await screen.findByRole("combobox", { name: "Pilih mahasiswa" }));
    fireEvent.click(await screen.findByRole("option", { name: "Nabil Rizki (2211523030)" }));

    fireEvent.click(screen.getByRole("combobox", { name: "Pilih pembimbing 1" }));
    fireEvent.change(screen.getByPlaceholderText("Cari nama atau NIP..."), { target: { value: "19841006" } });
    fireEvent.click(await screen.findByRole("option", { name: "Ricky Akbar" }));
    expect(screen.getByRole("combobox", { name: "Pilih pembimbing 1" })).toHaveTextContent("Ricky Akbar");
    expect(screen.getByRole("combobox", { name: "Pilih pembimbing 2" })).toHaveTextContent("-- Silahkan Pilih --");

    fireEvent.click(screen.getByRole("button", { name: /Simpan Data/ }));
    await waitFor(() => expect(createMasterDataThesis).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createMasterDataThesis).mock.calls[0][0]).toMatchObject({
      studentId: "s2",
      pembimbing1: "l2",
      pembimbing2: "none",
    });
  });

  it("keeps the student fixed while editing and shows them as 'Nama (NIM)'", async () => {
    const dialog = await openEdit();
    const trigger = within(dialog).getByRole("combobox", { name: "Pilih mahasiswa" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent("Ilham Nofaldi (2211522028)");
  });

  it("always shows a hint under Status: the allowed targets for an open status", async () => {
    const dialog = await openEdit();
    expect(within(dialog).getByText("Dapat diubah menjadi BSS, Selesai, atau Gagal.")).toBeInTheDocument();
    expect(within(dialog).getByText(/Masa bimbingan dihitung dari tanggal ini/)).toBeInTheDocument();
  });

  it("keeps the BSS hint for a thesis on leave", async () => {
    vi.mocked(getMasterDataTheses).mockResolvedValue([thesis({ status: "on_leave", statusBeforeLeave: "research", activityLevel: null })]);
    const dialog = await openEdit();
    expect(within(dialog).getByText("Dari BSS, tugas akhir hanya dapat kembali ke status sebelumnya atau dihentikan.")).toBeInTheDocument();
  });

  it("says a closed thesis cannot change any more", async () => {
    vi.mocked(getMasterDataTheses).mockResolvedValue([thesis({ status: "completed", activityLevel: null })]);
    const dialog = await openEdit();
    expect(within(dialog).getByText('Tugas akhir berstatus "Selesai" tidak dapat diubah lagi.')).toBeInTheDocument();
  });
});

describe("DataMasterTaPanel table search", () => {
  it("goes back to page 1 when the keyword changes", async () => {
    vi.clearAllMocks();
    const many = Array.from({ length: 12 }, (_, i) =>
      thesis({ id: `t${i}`, title: `Judul ${i}`, student: { id: `s${i}`, nim: `22115220${String(i).padStart(2, "0")}`, name: `Mahasiswa ${i}` } }),
    );
    vi.mocked(getMasterDataTheses).mockResolvedValue(many);
    vi.mocked(getStudentsAPI).mockResolvedValue({ students: [], meta: {} } as never);
    vi.mocked(getLecturersAPI).mockResolvedValue({ lecturers: [], meta: {} } as never);
    vi.mocked(getAcademicYearsAPI).mockResolvedValue({ academicYears: [], meta: {} } as never);
    vi.mocked(getTopics).mockResolvedValue([]);

    renderPanel();
    await screen.findByText("Judul 0");
    fireEvent.click(screen.getByRole("link", { name: "2" }));
    expect(await screen.findByText("Judul 11")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 11-12 dari 12")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Cari..."), { target: { value: "Mahasiswa 1" } });
    // "Mahasiswa 1", "Mahasiswa 10", "Mahasiswa 11": three rows, shown from the first page.
    expect(await screen.findByText("Menampilkan 1-3 dari 3")).toBeInTheDocument();
    expect(screen.getByText("Judul 1")).toBeInTheDocument();
  });
});
