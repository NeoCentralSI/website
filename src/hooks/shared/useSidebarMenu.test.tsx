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
      requirements: {
        kerjaPraktek: { sks: { met: true, current: 120, required: 90 } },
        // BR-25: Tidak ada lagi check `sks >= 110` di tugasAkhir; gate hanya
        // berdasarkan snapshot SIA `taking_thesis_course` yang dikemas di
        // requirement `course`.
        tugasAkhir: {
          course: { met: true, description: "OK" },
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

  it("shows advisor search only when students can still browse the catalog", () => {
    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    const itemTitles = metopenMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toContain("Overview");
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

    expect(itemTitles).toContain("Overview");
    expect(itemTitles).not.toContain("Cari Pembimbing");
  });

  it("shows Inbox Pembimbing for lecturers with supervisor roles", () => {
    mockAuthUser({ id: "lecturer-1", fullName: "Dosen Uji" });
    mockRole({ isDosen: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
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
    ]);
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
      { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
    ]);
  });

  // BR-24 (canon §4 + §5.8 + audit P0-06/P1-06):
  // Sekdep role saja BUKAN dosen pembimbing operasional.
  // Sekdep BUKAN co-approver TA-04 → menu "Tugas Akhir" hanya monitoring read-only,
  // tanpa Bimbingan / Seminar / Sidang.
  it("does not expose operational Metode Penelitian menu to Sekdep-only accounts (BR-24)", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu).toBeUndefined();
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
    expect(itemTitles).not.toContain("Seminar");
    expect(itemTitles).not.toContain("Sidang");
  });

  it("restores Tugas Akhir operational items when Sekdep is also a supervisor", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isPembimbing: true });

    const { result } = renderHook(() => useSidebarMenu());

    const taMenu = result.current.navMain.find(
      (item) => item.title === "Tugas Akhir",
    );
    const itemTitles = taMenu?.items.map((item) => item.title) ?? [];

    expect(itemTitles).toEqual(["Bimbingan", "Seminar", "Sidang", "Monitoring"]);
  });
  it("keeps Sekdep TA-03B queue when Sekdep also has KOORDINATOR_METOPEN role", () => {
    mockAuthUser({ id: "sekdep-1", fullName: "Sekdep Uji" });
    mockRole({ isDosen: true, isSekdep: true, isKoordinatorMetopen: true });

    const { result } = renderHook(() => useSidebarMenu());

    const metopenMenu = result.current.navMain.find(
      (item) => item.title === "Metode Penelitian",
    );
    expect(metopenMenu?.items).toEqual([
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
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
      { title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" },
      { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
    ]);
  });

  it("does not expose Inbox Pembimbing menu to GKM (P1-06)", () => {
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
    const itemTitles = taMenu?.items.map((item) => item.title) ?? [];
    expect(itemTitles).toEqual(["Monitoring"]);
  });
});
