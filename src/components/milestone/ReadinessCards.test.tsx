import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as milestoneService from "@/services/milestone.service";
import { openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import type { DefenceReadinessStatus, SeminarReadinessStatus } from "@/types/milestone.types";
import { DefenceReadinessCard } from "./lecturer/DefenceReadinessCard";
import { SeminarReadinessCard } from "./lecturer/SeminarReadinessCard";
import { DefenceReadinessStatusCard } from "./student/DefenceReadinessStatusCard";
import { SeminarReadinessStatusCard } from "./student/SeminarReadinessStatusCard";

vi.mock("@/services/milestone.service", () => ({
  getSeminarReadinessStatus: vi.fn(),
  getDefenceReadinessStatus: vi.fn(),
  approveSeminarReadiness: vi.fn(),
  revokeSeminarReadiness: vi.fn(),
  approveDefenceReadiness: vi.fn(),
  revokeDefenceReadiness: vi.fn(),
  requestReadinessApproval: vi.fn(),
}));
vi.mock("@/lib/authenticatedFile", () => ({ openAuthenticatedFileOrToast: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base = {
  thesisId: "t1",
  thesisTitle: "Judul TA",
  thesisStatus: "research",
  student: { id: "s1", userId: "s1", name: "ILHAM NOFALDI", nim: "2211522028", email: "i@x.test" },
  supervisors: [
    { id: "l1", name: "HUSNIL KAMIL", email: "h@x.test", role: "Pembimbing 1", hasApproved: true },
    { id: "l2", name: "AFRIYANTI", email: "a@x.test", role: "Pembimbing 2", hasApproved: false },
  ],
  currentUserRole: null,
  currentUserHasApproved: false,
  latestGuidanceAttachment: null,
  requestBlockedReason: null,
  approveBlockedReason: null,
};

const seminar = (overrides: Partial<SeminarReadinessStatus> = {}): SeminarReadinessStatus => ({
  ...base,
  requirements: [
    { key: "guidance", label: "Minimal 8 sesi bimbingan fase penelitian berstatus Selesai", met: true, detail: "8 dari 8 sesi" },
    { key: "milestone", label: "Seluruh milestone selesai (100%)", met: true, detail: "5 dari 5 milestone selesai" },
  ],
  requirementsMet: true,
  milestoneProgress: { total: 5, completed: 5, percentComplete: 100, isComplete: true },
  guidanceProgress: { completed: 8, required: 8, isComplete: true },
  seminarReadiness: { approvedBySupervisor1: true, approvedBySupervisor2: false, isFullyApproved: false },
  canRegisterSeminar: false,
  ...overrides,
});

const defence = (overrides: Partial<DefenceReadinessStatus> = {}): DefenceReadinessStatus => ({
  ...base,
  requirements: [{ key: "seminar", label: "Seminar hasil dinyatakan lulus", met: true, detail: "Lulus" }],
  requirementsMet: true,
  defenceReadiness: { approvedBySupervisor1: true, approvedBySupervisor2: false, isFullyApproved: false },
  canRegisterDefence: false,
  ...overrides,
});

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("readiness cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(milestoneService.requestReadinessApproval).mockResolvedValue({
      message: "Permintaan persetujuan berhasil dikirim ke pembimbing.",
      data: { thesisId: "t1", notifiedSupervisors: 1 },
    });
  });

  it("student seminar card: unmet requirement disables Minta Persetujuan and shows the reason", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      requirements: [
        { key: "guidance", label: "Minimal 8 sesi bimbingan fase penelitian berstatus Selesai", met: false, detail: "5 dari 8 sesi" },
        { key: "milestone", label: "Seluruh milestone selesai (100%)", met: true, detail: "5 dari 5 milestone selesai" },
      ],
      requirementsMet: false,
      requestBlockedReason: "Syarat sistem belum terpenuhi.",
    }));
    const { container } = wrap(<SeminarReadinessStatusCard thesisId="t1" />);

    expect(await screen.findByText("Kesiapan Seminar Hasil")).toBeInTheDocument();
    expect(screen.getByText("Syarat Belum Terpenuhi")).toBeInTheDocument();
    expect(screen.getByText("5 dari 8 sesi")).toBeInTheDocument();
    expect(screen.getByLabelText("Belum terpenuhi")).toBeInTheDocument();
    expect(screen.getByLabelText("Terpenuhi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Minta Persetujuan/ })).toBeDisabled();
    expect(screen.getByText(/Minta Persetujuan belum tersedia: Syarat sistem belum terpenuhi\./)).toBeInTheDocument();
    // Nothing is uploaded in this flow.
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("student cards: Minta Persetujuan sends the request for the right kind, and links to the registration page", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar());
    vi.mocked(milestoneService.getDefenceReadinessStatus).mockResolvedValue(defence());
    wrap(<><SeminarReadinessStatusCard thesisId="t1" /><DefenceReadinessStatusCard thesisId="t1" /></>);

    expect(await screen.findByText("Kesiapan Sidang")).toBeInTheDocument();
    expect(screen.getAllByText("Menunggu Persetujuan Pembimbing")).toHaveLength(2);
    expect(screen.getAllByText("Menyetujui")).toHaveLength(2);
    expect(screen.getAllByText("Belum menyetujui")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Buka Halaman Seminar Hasil/ })).toHaveAttribute("href", "/tugas-akhir/seminar-hasil");
    expect(screen.getByRole("link", { name: /Buka Halaman Sidang/ })).toHaveAttribute("href", "/tugas-akhir/sidang");

    const buttons = screen.getAllByRole("button", { name: /Minta Persetujuan/ });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(milestoneService.requestReadinessApproval).toHaveBeenCalledTimes(2));
    expect(vi.mocked(milestoneService.requestReadinessApproval).mock.calls).toEqual([["seminar", "t1"], ["defence", "t1"]]);
  });

  it("lecturer defence card: lists requirements, opens the latest guidance attachment, and approves", async () => {
    vi.mocked(milestoneService.getDefenceReadinessStatus).mockResolvedValue(defence({
      currentUserRole: "Pembimbing 2",
      latestGuidanceAttachment: {
        guidanceId: "g1",
        fileName: "draf-bab-4.pdf",
        filePath: "uploads/thesis/t1/guidance/g1/draf-bab-4.pdf",
        uploadedAt: "2026-10-01T03:00:00.000Z",
      },
    }));
    vi.mocked(milestoneService.approveDefenceReadiness).mockResolvedValue({
      thesisId: "t1", thesisTitle: "Judul TA", approvedBySupervisor1: true, approvedBySupervisor2: true, isFullyApproved: true,
    });
    wrap(<DefenceReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);

    expect(await screen.findByText("Seminar hasil dinyatakan lulus")).toBeInTheDocument();
    expect(screen.getByText(/draf-bab-4\.pdf · diunggah 1 Oktober 2026 10\.00 WIB/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Lampiran bimbingan terakhir/ }));
    expect(openAuthenticatedFileOrToast).toHaveBeenCalledWith("uploads/thesis/t1/guidance/g1/draf-bab-4.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Setujui" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Catatan (opsional)"), { target: { value: "Siap sidang" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Setujui" }));
    await waitFor(() => expect(milestoneService.approveDefenceReadiness).toHaveBeenCalledWith("t1", { notes: "Siap sidang" }));
  });

  it("lecturer seminar card: disabled Setujui shows its reason; an approved supervisor gets Batalkan Persetujuan", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      currentUserRole: "Pembimbing 2",
      requirementsMet: false,
      approveBlockedReason: "Syarat sistem belum terpenuhi.",
    }));
    const first = wrap(<SeminarReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);
    expect(await screen.findByRole("button", { name: "Setujui" })).toBeDisabled();
    expect(screen.getByText("Belum dapat disetujui: Syarat sistem belum terpenuhi.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada lampiran pada sesi bimbingan.")).toBeInTheDocument();
    first.unmount();

    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      currentUserRole: "Pembimbing 1",
      currentUserHasApproved: true,
    }));
    vi.mocked(milestoneService.revokeSeminarReadiness).mockResolvedValue({
      thesisId: "t1", thesisTitle: "Judul TA", approvedBySupervisor1: false, approvedBySupervisor2: false, isFullyApproved: false,
    });
    wrap(<SeminarReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);
    fireEvent.click(await screen.findByRole("button", { name: "Batalkan Persetujuan" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Batalkan Persetujuan" }));
    await waitFor(() => expect(milestoneService.revokeSeminarReadiness).toHaveBeenCalledWith("t1", undefined));
  });

  it("lecturer card: a reader who is not an active supervisor gets no action buttons", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar());
    wrap(<SeminarReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);
    expect(await screen.findByText(/Hanya pembimbing aktif tugas akhir ini/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
  });
});

describe("readiness cards after the event", () => {
  beforeEach(() => vi.clearAllMocks());

  const passedSupervisors = [
    { id: "l1", name: "HUSNIL KAMIL", email: "h@x.test", role: "Pembimbing 1", hasApproved: true, approvedAt: "2026-09-20T03:00:00.000Z" },
    { id: "l2", name: "AFRIYANTI", email: "a@x.test", role: "Pembimbing 2", hasApproved: true, approvedAt: "2026-09-21T03:00:00.000Z" },
  ];

  it("lecturer seminar card after the seminar passed: read-only, each approval with its date, no buttons", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      currentUserRole: "Pembimbing 1",
      currentUserHasApproved: true,
      supervisors: passedSupervisors,
      isPassed: true,
      passedAt: "2026-10-01T03:00:00.000Z",
      approveBlockedReason: "Seminar hasil sudah lulus. Persetujuan kesiapan seminar tidak dapat diubah lagi.",
      revokeBlockedReason: "Seminar hasil sudah lulus. Persetujuan kesiapan seminar tidak dapat diubah lagi.",
    }));
    wrap(<SeminarReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);

    expect(await screen.findByText("Seminar hasil lulus pada 1 Oktober 2026")).toBeInTheDocument();
    expect(screen.getByText("Lulus")).toBeInTheDocument();
    expect(screen.getByText("Menyetujui · 20 September 2026")).toBeInTheDocument();
    expect(screen.getByText("Menyetujui · 21 September 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Setujui|Batalkan Persetujuan/ })).not.toBeInTheDocument();
    expect(screen.getByText("Seminar hasil sudah lulus. Persetujuan kesiapan seminar tidak dapat diubah lagi.")).toBeInTheDocument();
  });

  it("student seminar card after the seminar passed: the passed state without Minta Persetujuan", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      supervisors: passedSupervisors,
      isPassed: true,
      passedAt: "2026-10-01T03:00:00.000Z",
      requestBlockedReason: "Seminar hasil sudah lulus.",
    }));
    wrap(<SeminarReadinessStatusCard thesisId="t1" />);

    expect(await screen.findByText("Seminar hasil lulus pada 1 Oktober 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Minta Persetujuan/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Buka Halaman Seminar Hasil/ })).not.toBeInTheDocument();
  });

  it("defence card before the seminar passes: only the unmet requirement, without the approval list", async () => {
    vi.mocked(milestoneService.getDefenceReadinessStatus).mockResolvedValue(defence({
      currentUserRole: "Pembimbing 1",
      requirements: [{ key: "seminar", label: "Seminar hasil dinyatakan lulus", met: false, detail: "Belum lulus" }],
      requirementsMet: false,
      seminarPassed: false,
      approveBlockedReason: "Syarat sistem belum terpenuhi.",
    }));
    wrap(<DefenceReadinessCard thesisId="t1" studentName="ILHAM NOFALDI" />);

    expect(await screen.findByText("Menunggu seminar hasil lulus.")).toBeInTheDocument();
    expect(screen.getByText("Seminar hasil dinyatakan lulus")).toBeInTheDocument();
    expect(screen.queryByText("Husnil Kamil")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setujui" })).toBeDisabled();
    expect(screen.getByText("Belum dapat disetujui: Menunggu seminar hasil lulus")).toBeInTheDocument();
  });

  it("student card of a finished thesis without a passed event on record: no buttons, a read-only note", async () => {
    vi.mocked(milestoneService.getSeminarReadinessStatus).mockResolvedValue(seminar({
      thesisStatus: "completed",
      requestBlockedReason: "Tugas akhir tidak berstatus Penelitian.",
    }));
    wrap(<SeminarReadinessStatusCard thesisId="t1" />);

    expect(await screen.findByText("Tugas akhir sudah selesai; kesiapan seminar hasil tidak dapat diubah lagi.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("defence card after the defence passed: read-only like the seminar card", async () => {
    vi.mocked(milestoneService.getDefenceReadinessStatus).mockResolvedValue(defence({
      supervisors: passedSupervisors,
      seminarPassed: true,
      isPassed: true,
      passedAt: "2026-12-01T03:00:00.000Z",
      requestBlockedReason: "Sidang sudah lulus.",
    }));
    wrap(<DefenceReadinessStatusCard thesisId="t1" />);

    expect(await screen.findByText("Sidang lulus pada 1 Desember 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
