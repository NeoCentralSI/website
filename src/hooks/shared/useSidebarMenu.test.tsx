import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useSidebarMenu } from "./useSidebarMenu";
import { useAdvisorAccessState } from "./useAdvisorAccessState";
import { useAvatarBlob } from "@/hooks/profile";
import { useAuth, useRole } from "@/hooks/shared";

vi.mock("./useAdvisorAccessState", () => ({
  useAdvisorAccessState: vi.fn(),
}));

vi.mock("@/hooks/profile", () => ({
  useAvatarBlob: vi.fn(),
}));

vi.mock("@/hooks/shared", () => ({
  useAuth: vi.fn(),
  useRole: vi.fn(),
}));

describe("useSidebarMenu", () => {
  beforeEach(() => {
    vi.mocked(useAvatarBlob).mockReturnValue("");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "student-1",
        fullName: "Mahasiswa Uji",
        email: "mhs@example.com",
        identityNumber: "2211521001",
        avatarUrl: null,
      },
    } as ReturnType<typeof useAuth>);
    vi.mocked(useRole).mockReturnValue({
      isStudent: () => true,
      isDosen: () => false,
      isKadep: () => false,
      isSekdep: () => false,
      isGkm: () => false,
      isAdmin: () => false,
      isPembimbing1: () => false,
      isDosenPengampuMetopel: () => false,
    } as ReturnType<typeof useRole>);
  });

  it("should hide logbook while advisor has not been assigned", () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        hasOfficialSupervisor: false,
        canOpenLogbook: false,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());
    const metopenMenu = result.current.navMain.find((item) => item.title === "Metode Penelitian");
    const itemTitles = metopenMenu?.items.map((item: { title: string }) => item.title) ?? [];

    expect(itemTitles).toContain("Cari Pembimbing");
    expect(itemTitles).not.toContain("Logbook Bimbingan");
  });

  it("should hide advisor search and show logbook after advisor is assigned", () => {
    vi.mocked(useAdvisorAccessState).mockReturnValue({
      data: {
        hasOfficialSupervisor: true,
        canOpenLogbook: true,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvisorAccessState>);

    const { result } = renderHook(() => useSidebarMenu());
    const metopenMenu = result.current.navMain.find((item) => item.title === "Metode Penelitian");
    const itemTitles = metopenMenu?.items.map((item: { title: string }) => item.title) ?? [];

    expect(itemTitles).not.toContain("Cari Pembimbing");
    expect(itemTitles).toContain("Logbook Bimbingan");
  });
});
