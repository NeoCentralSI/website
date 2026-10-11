import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAuthenticatedBlobUrl,
  openAuthenticatedFile,
  openAuthenticatedFileOrToast,
  resolveApiFileUrl,
} from "./authenticatedFile";

vi.mock("@/config/api", () => ({
  getApiUrl: (path: string) => `https://api.example.test${path}`,
}));

vi.mock("@/services/auth.service", () => ({
  getAuthTokens: () => ({ accessToken: "header-token", refreshToken: null }),
}));

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const FILE = "/uploads/thesis/abc/guidance/g1/123-laporan.pdf";
const okResponse = () => ({ ok: true, status: 200, blob: async () => new Blob(["pdf"], { type: "application/pdf" }) });

describe("authenticatedFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    toastError.mockClear();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:https://example/file");
  });

  it("prefixes relative upload paths without putting a token in the URL", () => {
    expect(resolveApiFileUrl("/uploads/thesis/abc/informal-log/file.pdf")).toBe(
      "https://api.example.test/uploads/thesis/abc/informal-log/file.pdf",
    );
    expect(resolveApiFileUrl("uploads/thesis/abc/file.pdf")).toBe("https://api.example.test/uploads/thesis/abc/file.pdf");
    expect(resolveApiFileUrl(null)).toBeNull();
  });

  it("fetches with an Authorization header and never puts token= in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAuthenticatedBlobUrl(FILE)).resolves.toBe("blob:https://example/file");

    expect(fetchMock).toHaveBeenCalledWith(`https://api.example.test${FILE}`, {
      headers: { Authorization: "Bearer header-token" },
    });
    expect(String(fetchMock.mock.calls[0]?.[0] ?? "")).not.toContain("token=");
  });

  it("opens a blank tab synchronously, then points it at the blob URL", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise((r) => (resolveFetch = r))));
    const tab = { location: { href: "" }, opener: {} as unknown, close: vi.fn() };
    const open = vi.fn().mockReturnValue(tab);
    vi.stubGlobal("open", open);

    const pending = openAuthenticatedFile(FILE);
    // the tab exists before the download finishes (popup blockers need the click context)
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(tab.location.href).toBe("");

    resolveFetch(okResponse());
    await pending;
    expect(tab.location.href).toBe("blob:https://example/file");
    expect(tab.opener).toBeNull();
    expect(tab.close).not.toHaveBeenCalled();
  });

  it.each([
    [403, "Anda tidak memiliki akses ke berkas ini."],
    [404, "Berkas tidak ditemukan."],
    [500, "Gagal membuka berkas."],
  ])("status %i closes the tab and reports '%s'", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    const tab = { location: { href: "" }, opener: null, close: vi.fn() };
    vi.stubGlobal("open", vi.fn().mockReturnValue(tab));

    await expect(openAuthenticatedFile(FILE)).rejects.toThrow(message);
    expect(tab.close).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();

    await openAuthenticatedFileOrToast(FILE);
    expect(toastError).toHaveBeenCalledWith(message);
  });
});
