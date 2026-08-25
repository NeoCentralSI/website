import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSidebarMenu } from "./useSidebarMenu";
import { useAdvisorAccessState } from "./useAdvisorAccessState";
import { useStudentEligibility } from "./useStudentEligibility";
import { useAvatarBlob } from "@/hooks/profile";
import { useAuth, useRole } from "@/hooks/shared";

vi.mock("./useAdvisorAccessState", () => ({
  useAdvisorAccessState: vi.fn(),
}));

vi.mock("./useStudentEligibility", () => ({
  useStudentEligibility: vi.fn(),
}));

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
    vi.mocked(useStudentEligibility).mockReturnValue({
      isLoading: false,
      sks: 120,
      hasTugasAkhirCourse: true,
      canAccessKerjaPraktek: true,
      canAccessTugasAkhir: true,
      canAccessMetopel: true,
      isMetopenReadOnly: false,
      isMetopenOnlyTrack: false,
      requirements: {
        kerjaPraktek: { sks: { met: true, current: 120, required: 90 } },
        // BR-25: Tidak ada lagi check `sks >= 110` di tugasAkhir; gate hanya
        // berdasarkan snapshot SIA `taking_thesis_course` yang dikemas di
        // requirement `course`.
        tugasAkhir: {
          course: { met: true, description: "OK" },
          module: { met: true, description: "OK" },
        },
        metopel: {
          eligibility: { met: true, description: "OK" },
        },
      },
    } as unknown as ReturnType<typeof useStudentEligibility>);
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: true,
        hasBlockingRequest: false,
        hasOfficialSupervisor: false,
        canOpenLogbook: false,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);
  });

  it("hides Tugas Akhir menu when student is Metopen-eligible but not enrolled in MK Tugas Akhir", () => {
    vi.mocked(useStudentEligibility).mockReturnValue({
      isLoading: false,
      sks: 100,
      hasTugasAkhirCourse: false,
      canAccessKerjaPraktek: true,
      canAccessTugasAkhir: false,
      canAccessMetopel: true,
      isMetopenReadOnly: false,
      isMetopenOnlyTrack: true,
      requirements: {
        kerjaPraktek: { sks: { met: true, current: 100, required: 90 } },
        tugasAkhir: {
          course: { met: false, description: "Belum MK TA" },
          module: { met: false, description: "Gunakan Metopen" },
        },
        metopel: { eligibility: { met: true, description: "OK" } },
      },
    } as unknown as ReturnType<typeof useStudentEligibility>);

    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find((item) => item.title === "Tugas Akhir");
    expect(taMenu).toBeUndefined();

    const metopenMenu = result.current.navMain.find((item) => item.title === "Metode Penelitian");
    expect(metopenMenu).toBeDefined();
  });

  it("shows Metopen proposal and informal logbook when Metopen-only track has official supervisor", () => {
    vi.mocked(useStudentEligibility).mockReturnValue({
      isLoading: false,
      sks: 100,
      hasTugasAkhirCourse: false,
      canAccessKerjaPraktek: true,
      canAccessTugasAkhir: false,
      canAccessMetopel: true,
      isMetopenReadOnly: false,
      isMetopenOnlyTrack: true,
      requirements: {
        kerjaPraktek: { sks: { met: true, current: 100, required: 90 } },
        tugasAkhir: {
          course: { met: false, description: "Belum MK TA" },
          module: { met: false, description: "Gunakan Metopen" },
        },
        metopel: { eligibility: { met: true, description: "OK" } },
      },
    } as unknown as ReturnType<typeof useStudentEligibility>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: false,
        hasBlockingRequest: false,
        hasOfficialSupervisor: true,
        canOpenLogbook: true,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find((item) => item.title === "Metode Penelitian");
    const urls = metopenMenu?.items.map((i) => i.url) ?? [];
    expect(urls).toContain("/metopel/proposal");
    expect(urls).toContain("/metopel/logbook");
  });

  it("shows advisor search only when students can still browse the catalog", () => {
    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    const itemTitles = metopenMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toContain("Ringkasan");
    expect(itemTitles).toContain("Cari Pembimbing");
  });

  it("hides advisor search after an official supervisor is assigned", () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: false,
        hasBlockingRequest: false,
        hasOfficialSupervisor: true,
        canOpenLogbook: true,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    const itemTitles = metopenMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toContain("Ringkasan");
    expect(itemTitles).not.toContain("Cari Pembimbing");
  });

  it("does not retitle Metopel as archive when eligibility is read-only but TA is not promoted", () => {
    vi.mocked(useStudentEligibility).mockReturnValue({
      isLoading: false,
      sks: 120,
      hasTugasAkhirCourse: true,
      canAccessKerjaPraktek: true,
      canAccessTugasAkhir: true,
      canAccessMetopel: true,
      isMetopenReadOnly: true,
      isMetopenOnlyTrack: false,
      requirements: {
        kerjaPraktek: { sks: { met: true, current: 120, required: 90 } },
        tugasAkhir: {
          course: { met: true, description: "OK" },
          module: { met: true, description: "OK" },
        },
        metopel: { eligibility: { met: true, description: "OK" } },
      },
    } as unknown as ReturnType<typeof useStudentEligibility>);

    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: true,
        hasBlockingRequest: false,
        hasOfficialSupervisor: false,
        canOpenLogbook: false,
        requestStatus: "booking_approved",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());

    const archiveMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian (Arsip)",
    );
    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    const itemTitles = metopenMenu?.items.map((item) => item.title) ?? [];

    expect(archiveMenu).toBeUndefined();
    expect(metopenMenu).toBeDefined();
    expect(itemTitles).toContain("Cari Pembimbing");
  });

  it("titles Metopel as archive after promotion to active_official", () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: false,
        hasBlockingRequest: false,
        hasOfficialSupervisor: true,
        canOpenLogbook: true,
        requestStatus: "active_official",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian (Arsip)",
    );
    const itemTitles = metopenMenu?.items.map((item) => item.title) ?? [];

    expect(metopenMenu).toBeDefined();
    expect(itemTitles).toContain("Ringkasan");
    expect(itemTitles).not.toContain("Cari Pembimbing");
  });

  it("does not title Metopel as archive after period-close even if KRS TA is true", () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        canBrowseCatalog: true,
        hasBlockingRequest: false,
        hasOfficialSupervisor: false,
        canOpenLogbook: false,
        requestStatus: "released",
        hasTakenMetopen: true,
        takingThesisCourse: true,
        isMetopenArchive: false,
        metopenReadOnly: false,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());

    expect(
      result.current.navMain.find((item) => item.title === "Metode Penelitian (Arsip)"),
    ).toBeUndefined();
    expect(
      result.current.navMain.find((item) => item.title === "Metode Penelitian"),
    ).toBeDefined();
  });

  it("shows Inbox Pembimbing for lecturers with supervisor roles", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
      { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
    ]);
  });

  it("does not expose Inbox Pembimbing to lecturer roles without supervisor capability", () => {
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

  it("shows the Kadep decision surface instead of a static guide page", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      {
        title: "Keputusan TA-01 s.d. TA-04",
        url: "/kelola/tugas-akhir/kadep",
      },
      { title: "Kuota Dosen", url: "/kelola/metopen/kuota-dosen" },
    ]);
  });

  it("keeps the Kadep decision menu distinct from Kelola master data", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    const kelolaMenu = result.current.navMain.find(
      (item) => item.title === "Kelola",
    );

    expect(metopenMenu?.items).toContainEqual({
      title: "Keputusan TA-01 s.d. TA-04",
      url: "/kelola/tugas-akhir/kadep",
    });
    expect(metopenMenu?.items).toContainEqual({
      title: "Kuota Dosen",
      url: "/kelola/metopen/kuota-dosen",
    });
    expect(kelolaMenu?.items).toContainEqual({
      title: "Master Tugas Akhir",
      url: "/kelola/tugas-akhir/topik",
    });
    expect(kelolaMenu?.items).not.toContainEqual({
      title: "Tugas Akhir",
      url: "/kelola/tugas-akhir/kadep",
    });
  });

  it("adds Inbox Pembimbing to Kadep only when the account is also a supervisor", () => {
    mockAuthUser({ id: "kadep-1", fullName: "Kadep Uji" });
    mockRole({ isDosen: true, isKadep: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      {
        title: "Keputusan TA-01 s.d. TA-04",
        url: "/kelola/tugas-akhir/kadep",
      },
      { title: "Kuota Dosen", url: "/kelola/metopen/kuota-dosen" },
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
      { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
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
      { title: "Kuota Dosen", url: "/kelola/metopen/kuota-dosen" },
    ]);
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
      { title: "Kuota Dosen", url: "/kelola/metopen/kuota-dosen" },
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Monitoring Kelas", url: "/kelola/metopen/monitoring" },
    ]);
  });

  it("shows both TA-03B and Inbox Pembimbing for Sekdep who also has coordinator and supervisor roles", () => {
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
      { title: "Kuota Dosen", url: "/kelola/metopen/kuota-dosen" },
      { title: "Penilaian TA-03A", url: "/kelola/metopen/ta03a" },
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Monitoring Kelas", url: "/kelola/metopen/monitoring" },
      { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
    ]);
  });

  it("does not expose Metopen inbox or TA monitoring menu to GKM (P1-06)", () => {
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
    expect(taMenu).toBeUndefined();
  });

  it("preserves Fathur student navigation alongside staging eligibility menus", () => {
    const { result } = renderHook(() => useSidebarMenu());
    const titles = result.current.navMain.map((item) => item.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        "Metode Penelitian",
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
    ).toContainEqual({ title: "Kelola Data CPL", url: "/kelola/cpl" });
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
