import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSidebarMenu } from "./useSidebarMenu";
import { useAvatarBlob } from "@/hooks/profile";
import { useAuth, useRole } from "@/hooks/shared";

vi.mock("@/hooks/profile", () => ({
  useAvatarBlob: vi.fn(),
}));

vi.mock("@/hooks/shared", () => ({
  useAuth: vi.fn(),
  useRole: vi.fn(),
}));

const { inbox } = vi.hoisted(() => ({ inbox: { counts: { waiting: 0 } } }));
vi.mock("@/hooks/thesis-proposal/useSupervisorRequests", () => ({
  useLecturerApprovalInbox: (_params: unknown, enabled: boolean) => ({ data: enabled ? inbox : undefined }),
}));

function mockAuthUser(overrides: Partial<NonNullable<ReturnType<typeof useAuth>["user"]>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: "user-1",
      fullName: "Pengguna Uji",
      email: "user@example.com",
      identityNumber: "2211521001",
      avatarUrl: null,
      ...overrides,
    },
  } as ReturnType<typeof useAuth>);
}

function mockRole(
  overrides: {
    isStudent?: boolean;
    isDosen?: boolean;
    isKadep?: boolean;
    isSekdep?: boolean;
    isGkm?: boolean;
    isAdmin?: boolean;
    isPembimbing?: boolean;
    isResearchMethodCoordinator?: boolean;
  } = {},
) {
  vi.mocked(useRole).mockReturnValue({
    isStudent: () => overrides.isStudent ?? false,
    isDosen: () => overrides.isDosen ?? false,
    isKadep: () => overrides.isKadep ?? false,
    isSekdep: () => overrides.isSekdep ?? false,
    isGkm: () => overrides.isGkm ?? false,
    isAdmin: () => overrides.isAdmin ?? false,
    isPembimbing: () => overrides.isPembimbing ?? false,
    isResearchMethodCoordinator: () => overrides.isResearchMethodCoordinator ?? false,
  } as ReturnType<typeof useRole>);
}

describe("useSidebarMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAvatarBlob).mockReturnValue("");
    inbox.counts.waiting = 0;
    mockAuthUser();
    mockRole({ isStudent: true });
  });

  // One Tugas Akhir menu for students, no separate Metode Penelitian menu.
  it("gives students Tugas Akhir > Overview, Bimbingan, Proposal, Seminar Hasil, Sidang and no Metode Penelitian menu", () => {
    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find((item) => item.title === "Tugas Akhir");
    expect(taMenu?.items?.map((item) => item.title)).toEqual(["Overview", "Bimbingan", "Proposal", "Seminar Hasil", "Sidang TA"]);
    expect(taMenu?.items?.[2].url).toBe("/tugas-akhir/proposal");
    expect(result.current.navMain.find((item) => item.title.startsWith("Metode Penelitian"))).toBeUndefined();
  });

  const menuOf = (title: string) => {
    const { result } = renderHook(() => useSidebarMenu());
    return result.current.navMain.find((item) => item.title === title);
  };
  const COORDINATOR_ITEMS = [
    { title: "Monitoring Kelas", url: "/metode-penelitian/monitoring" },
    { title: "Penilaian Proposal", url: "/metode-penelitian/penilaian" },
  ];

  // Supervisors score in Tugas Akhir > Proposal (no Metode Penelitian menu).
  // Permohonan, Bimbingan, Proposal, Seminar Hasil, Sidang TA; supervisors have
  // no Perubahan or Evaluasi page.
  const SUPERVISOR_TA = ["Permohonan", "Bimbingan", "Proposal", "Seminar Hasil", "Sidang TA"];
  const KADEP_DECISIONS = ["Perubahan", "Evaluasi"];

  it("gives supervisors their Tugas Akhir order and no Metode Penelitian menu", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isPembimbing: true });

    expect(menuOf("Metode Penelitian")).toBeUndefined();
    const items = menuOf("Tugas Akhir")?.items ?? [];
    expect(items.map((item) => item.title)).toEqual(SUPERVISOR_TA);
    expect(items[0]).toEqual({ title: "Permohonan", url: "/tugas-akhir/permohonan" });
    expect(items.map((item) => item.url)).not.toContain("/tugas-akhir/perubahan");
    expect(items.map((item) => item.url)).not.toContain("/tugas-akhir/evaluasi");
  });

  it("shows what waits for the lecturer on Permohonan, both kinds", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isPembimbing: true });
    inbox.counts.waiting = 2;

    expect(menuOf("Tugas Akhir")?.items?.[0]).toEqual({ title: "Permohonan", url: "/tugas-akhir/permohonan", badge: 2 });
  });

  it("gives lecturers without supervisor capability neither menu item", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true });

    expect(menuOf("Metode Penelitian")).toBeUndefined();
    expect(menuOf("Tugas Akhir")?.items?.map((item) => item.title)).toEqual(["Bimbingan", "Seminar Hasil", "Sidang TA"]);
  });

  it("gives the Research Method coordinator Monitoring Kelas and Penilaian Proposal (no Presensi) and no Kelola", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isResearchMethodCoordinator: true });

    expect(menuOf("Metode Penelitian")?.items).toEqual(COORDINATOR_ITEMS);
    expect(menuOf("Kelola")).toBeUndefined();
  });

  it("gives Kadep Tugas Akhir > Monitoring first, Penetapan, then Perubahan and Evaluasi last; Kelola > Batas Bimbingan; Monitoring Kelas", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true });

    expect(menuOf("Tugas Akhir")?.items?.map((item) => item.title)).toEqual([
      "Monitoring", "Penetapan", "Bimbingan", "Seminar Hasil", "Sidang TA", "Perubahan", "Evaluasi",
    ]);
    // The submenu is "Penetapan"; its page keeps the title "Penetapan Pembimbing".
    expect(menuOf("Tugas Akhir")?.items?.[1]).toEqual({ title: "Penetapan", url: "/kelola/tugas-akhir/kadep/penetapan-pembimbing" });
    const kelolaMenu = menuOf("Kelola");
    // "Persetujuan Tugas Akhir" is gone, replaced by Perubahan and Evaluasi.
    expect(kelolaMenu?.items.map((item) => item.title)).not.toContain("Persetujuan Tugas Akhir");
    expect(kelolaMenu?.items).toContainEqual({ title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" });
    expect(kelolaMenu?.items).toContainEqual({ title: "Tugas Akhir", url: "/kelola/tugas-akhir/master-data" });
    expect(menuOf("Metode Penelitian")?.items).toEqual([{ title: "Monitoring Kelas", url: "/metode-penelitian/monitoring" }]);
  });

  it("gives a Kadep who is also a supervisor Monitoring, Penetapan, the supervisor's order, then the decisions", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true, isPembimbing: true });

    // Monitoring, Penetapan, Permohonan, Bimbingan, Proposal, Seminar Hasil, Sidang TA, Perubahan, Evaluasi.
    expect(menuOf("Tugas Akhir")?.items?.map((item) => item.title)).toEqual(["Monitoring", "Penetapan", ...SUPERVISOR_TA, ...KADEP_DECISIONS]);
  });

  // Sekdep-only gets no operational queues; master data stays in Kelola > Metode
  // Penelitian (the duplicate "CPMK & Rubrik Penilaian" entry is gone).
  it("gives Sekdep read-only Monitoring Kelas and the master data under Kelola", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true });

    expect(menuOf("Metode Penelitian")?.items).toEqual([{ title: "Monitoring Kelas", url: "/metode-penelitian/monitoring" }]);
    const kelolaMenu = menuOf("Kelola");
    expect(kelolaMenu?.items).toContainEqual({ title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" });
    expect(kelolaMenu?.items).toContainEqual({ title: "Metode Penelitian", url: "/kelola/metode-penelitian" });
    const kelolaTitles = kelolaMenu?.items.map((item) => item.title) ?? [];
    expect(kelolaTitles.indexOf("Metode Penelitian")).toBeLessThan(kelolaTitles.indexOf("Tugas Akhir"));
  });

  it("limits Sekdep Tugas Akhir menu to read-only pages", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true });

    const itemTitles = menuOf("Tugas Akhir")?.items.map((item) => item.title) ?? [];
    expect(itemTitles).toEqual(["Monitoring", "Penetapan"]);
  });

  it("restores Tugas Akhir operational items when Sekdep is also a supervisor", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isPembimbing: true });

    const itemTitles = menuOf("Tugas Akhir")?.items.map((item) => item.title) ?? [];
    expect(itemTitles).toEqual(["Monitoring", "Penetapan", ...SUPERVISOR_TA]);
  });

  it("gives a Sekdep who is also the coordinator the coordinator's items", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isResearchMethodCoordinator: true, isPembimbing: true });

    expect(menuOf("Metode Penelitian")?.items).toEqual(COORDINATOR_ITEMS);
    expect(menuOf("Tugas Akhir")?.items).toContainEqual({ title: "Proposal", url: "/tugas-akhir/proposal" });
  });

  it("gives GKM read-only TA monitoring without Metode Penelitian or supervisor items (guidance revival)", () => {
    mockAuthUser({ id: "gkm-1", fullName: "GKM Uji" });
    mockRole({ isDosen: true, isGkm: true });

    const { result } = renderHook(() => useSidebarMenu());

    expect(result.current.navMain.find((item) => item.title === "Metode Penelitian")).toBeUndefined();

    const taMenu = result.current.navMain.find(
      (item) => item.title === "Tugas Akhir",
    );
    expect(taMenu?.items?.map((item) => item.url)).toEqual(["/tugas-akhir/monitoring"]);
  });

  it("preserves Fathur student navigation alongside staging eligibility menus", () => {
    const { result } = renderHook(() => useSidebarMenu());
    const titles = result.current.navMain.map((item) => item.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        "Tugas Akhir",
        "Yudisium",
        "Pengumuman",
        "Repositori",
      ]),
    );
    expect(
      result.current.navMain.find((item) => item.title === "Pengumuman")?.items,
    ).toEqual([
      { title: "Seminar Hasil", url: "/pengumuman/seminar-hasil" },
      { title: "Yudisium", url: "/pengumuman/yudisium" },
    ]);
  });

  it("preserves shared Yudisium and announcement menus for operational roles", () => {
    const scenarios = [
      { isDosen: true, isPembimbing: true },
      { isDosen: true, isKadep: true },
      { isDosen: true, isSekdep: true },
      { isDosen: true, isGkm: true },
      { isAdmin: true },
    ];

    for (const scenario of scenarios) {
      mockRole(scenario);
      const { result, unmount } = renderHook(() => useSidebarMenu());
      const titles = result.current.navMain.map((item) => item.title);
      expect(titles).toEqual(expect.arrayContaining(["Yudisium", "Pengumuman"]));
      unmount();
    }
  });

  it("keeps GKM CPL and Admin master-data additions from fathur-sidang", () => {
    mockRole({ isDosen: true, isGkm: true });
    const gkm = renderHook(() => useSidebarMenu());
    expect(
      gkm.result.current.navMain.find((item) => item.title === "Kelola")?.items,
    ).toContainEqual({ title: "CPL", url: "/kelola/cpl" });
    gkm.unmount();

    mockRole({ isAdmin: true });
    const admin = renderHook(() => useSidebarMenu());
    const masterItems = admin.result.current.navMain.find(
      (item) => item.title === "Master Data",
    )?.items;
    expect(masterItems).toEqual(
      expect.arrayContaining([
        { title: "Kelola Ruangan", url: "/master-data/ruangan" },
        { title: "Data Hari Libur", url: "/master-data/hari-libur" },
      ]),
    );
    // Admin has no "Batas Bimbingan" (Kadep and Sekdep set it).
    expect(masterItems?.map((item) => item.title)).not.toContain("Batas Bimbingan");
    expect(admin.result.current.navMain.flatMap((item) => item.items ?? []).map((item) => item.url)).not.toContain("/master-data/kuota-bimbingan");
    admin.unmount();
  });

  it("does not emit sidebar URLs that are not registered routes", () => {
    const invalidUrls = [
      "/tugas-akhir/seminar",
      "/tugas-akhir/seminar/admin",
      "/kelola/data-cpl",
      "/tugas-akhir/sidang/admin",
      "/kelola/kerja-praktik/pendaftaran/bimbingan",
      "/admin/kerja-praktik/seminar",
    ];
    const scenarios = [
      { isStudent: true },
      { isDosen: true, isPembimbing: true, isResearchMethodCoordinator: true },
      { isDosen: true, isKadep: true, isPembimbing: true },
      { isDosen: true, isSekdep: true, isPembimbing: true, isResearchMethodCoordinator: true },
      { isAdmin: true },
    ];

    for (const scenario of scenarios) {
      mockRole(scenario);
      const { result } = renderHook(() => useSidebarMenu());
      const urls = result.current.navMain.flatMap((item) => [
        item.url,
        ...item.items.map((child) => child.url),
      ]);

      expect(urls).not.toEqual(expect.arrayContaining(invalidUrls));
    }
  });
});
