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
    isKoordinatorMetopen?: boolean;
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
    isKoordinatorMetopen: () => overrides.isKoordinatorMetopen ?? false,
  } as ReturnType<typeof useRole>);
}

describe("useSidebarMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAvatarBlob).mockReturnValue("");
    mockAuthUser();
    mockRole({ isStudent: true });
  });

  // K14 (Paket P): one Tugas Akhir menu for students, no separate Metode Penelitian menu.
  it("gives students Tugas Akhir > Overview, Proposal, Bimbingan, Seminar Hasil, Sidang and no Metode Penelitian menu", () => {
    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find((item) => item.title === "Tugas Akhir");
    expect(taMenu?.items?.map((item) => item.title)).toEqual(["Overview", "Proposal", "Bimbingan", "Seminar Hasil", "Sidang TA"]);
    expect(taMenu?.items?.[1].url).toBe("/tugas-akhir/proposal");
    expect(result.current.navMain.find((item) => item.title.startsWith("Metode Penelitian"))).toBeUndefined();
  });

  it("moves Permohonan Pembimbing out of the menu (a panel on Mahasiswa Bimbingan, K16)", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
    ]);
  });

  it("gives lecturers without supervisor capability no Metode Penelitian menu", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu).toBeUndefined();
  });

  it("adds the TA-03B queue for KOORDINATOR_METOPEN without exposing the old guide hub", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isKoordinatorMetopen: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Monitoring Kelas", url: "/kelola/metopen/monitoring" },
    ]);
  });

  it("gives Kadep Tugas Akhir > Penetapan Pembimbing and Kelola > Batas Bimbingan", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find((item) => item.title === "Tugas Akhir");
    expect(taMenu?.items?.[0]).toEqual({ title: "Penetapan Pembimbing", url: "/kelola/tugas-akhir/kadep/penetapan-pembimbing" });
    const kelolaMenu = result.current.navMain.find((item) => item.title === "Kelola");
    expect(kelolaMenu?.items).toContainEqual({ title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" });
    expect(kelolaMenu?.items).toContainEqual({ title: "Tugas Akhir", url: "/kelola/tugas-akhir/master-data" });
    expect(result.current.navMain.find((item) => item.title === "Metode Penelitian")).toBeUndefined();
  });

  it("keeps the supervisor scoring item for a Kadep who is also a supervisor", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
    ]);
  });

  // BR-24: Sekdep-only tidak mendapat antrean operasional (TA-03A/B, inbox).
  // Master CPMK & rubrik Metopen tetap wajib karena kewenangan Sekdep (FR-SCR / persona).
  it("exposes Metopen master CPMK menu to Sekdep-only without operational queues (BR-24)", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "CPMK & Rubrik Penilaian", url: "/kelola/metopen/cpmk-rubrik" },
    ]);
    const kelolaMenu = result.current.navMain.find((item) => item.title === "Kelola");
    expect(kelolaMenu?.items).toContainEqual({ title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" });
    expect(kelolaMenu?.items).toContainEqual({
      title: "Metode Penelitian",
      url: "/kelola/metode-penelitian",
    });
    const kelolaTitles = kelolaMenu?.items.map((item) => item.title) ?? [];
    expect(kelolaTitles.indexOf("Metode Penelitian")).toBeLessThan(
      kelolaTitles.indexOf("Tugas Akhir"),
    );
    const titles = metopenMenu?.items.map((item) => item.title) ?? [];
    expect(titles).not.toContain("Penilaian TA-03A");
    expect(titles).not.toContain("Penilaian TA-03B");
    expect(titles).not.toContain("Monitoring Kelas");
    expect(titles).not.toContain("Inbox Pembimbing");
  });

  it("limits Sekdep Tugas Akhir menu to Monitoring read-only (BR-24)", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find(
      (item) => item.title === "Tugas Akhir",
    );
    const itemTitles = taMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toEqual(["Monitoring"]);
    expect(itemTitles).not.toContain("Bimbingan");
    expect(itemTitles).not.toContain("Seminar Hasil");
    expect(itemTitles).not.toContain("Sidang TA");
  });

  it("restores Tugas Akhir operational items when Sekdep is also a supervisor", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find(
      (item) => item.title === "Tugas Akhir",
    );
    const itemTitles = taMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toEqual(["Bimbingan", "Seminar Hasil", "Sidang TA", "Monitoring"]);
  });
  it("keeps Sekdep TA-03B queue when Sekdep also has KOORDINATOR_METOPEN role", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isKoordinatorMetopen: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "CPMK & Rubrik Penilaian", url: "/kelola/metopen/cpmk-rubrik" },
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Monitoring Kelas", url: "/kelola/metopen/monitoring" },
    ]);
  });

  it("shows both scoring queues for Sekdep who also has coordinator and supervisor roles", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({
      isDosen: true,
      isSekdep: true,
      isPembimbing: true,
      isKoordinatorMetopen: true,
    });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "CPMK & Rubrik Penilaian", url: "/kelola/metopen/cpmk-rubrik" },
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Monitoring Kelas", url: "/kelola/metopen/monitoring" },
    ]);
  });

  it("gives GKM read-only TA monitoring without Metopen inbox or supervisor items (guidance revival)", () => {
    mockAuthUser({ id: "gkm-1", fullName: "GKM Uji" });
    mockRole({ isDosen: true, isGkm: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu).toBeUndefined();

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
      { isDosen: true, isPembimbing: true, isKoordinatorMetopen: true },
      { isDosen: true, isKadep: true, isPembimbing: true },
      { isDosen: true, isSekdep: true, isPembimbing: true, isKoordinatorMetopen: true },
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
