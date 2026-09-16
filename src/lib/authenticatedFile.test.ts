import { beforeEach, describe, expect, it, vi } from "vitest";
import { openAuthenticatedFile, resolveApiFileUrl } from "./authenticatedFile";

vi.mock("@/config/api", () => ({
  getApiUrl: (path: string) => `https://api.example.test${path}`,
}));

vi.mock("@/services/auth.service", () => ({
  getAuthTokens: () => ({ accessToken: "header-token", refreshToken: null }),
}));

describe("authenticatedFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prefixes relative upload paths without putting a token in the URL", () => {
    expect(resolveApiFileUrl("/uploads/thesis/abc/informal-log/file.pdf")).toBe(
      "https://api.example.test/uploads/thesis/abc/informal-log/file.pdf",
    );
  });

  it("opens the file with an Authorization header and a blob URL", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:https://example/file");
    const open = vi.fn();
    vi.stubGlobal("open", open);

    await openAuthenticatedFile("/uploads/thesis/abc/informal-log/file.pdf");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/uploads/thesis/abc/informal-log/file.pdf",
      { headers: { Authorization: "Bearer header-token" } },
    );
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(requestedUrl).not.toContain("token=");
    expect(open).toHaveBeenCalledWith("blob:https://example/file", "_blank", "noopener,noreferrer");
    createObjectURL.mockRestore();
  });
});
