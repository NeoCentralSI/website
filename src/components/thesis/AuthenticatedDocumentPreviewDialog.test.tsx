import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({ getAuthTokens: () => ({ accessToken: "JWT-RAHASIA" }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/components/pdf/DocxViewer", () => ({ DocxViewer: ({ url }: { url: string }) => <div data-testid="docx" data-url={url} /> }));

import AuthenticatedDocumentPreviewDialog from "./AuthenticatedDocumentPreviewDialog";

const PATH = "uploads/thesis/T1/guidance/g1/laporan.pdf";
const fetchMock = vi.fn();
const revoke = vi.fn();
const openMock = vi.fn();

/** Every URL the dialog put into the DOM or handed to the browser. */
function renderedUrls(): string[] {
  const attrs = [...document.querySelectorAll("[src],[href],[data-url]")].flatMap((el) =>
    ["src", "href", "data-url"].map((a) => el.getAttribute(a)).filter((v): v is string => !!v),
  );
  return [...attrs, ...fetchMock.mock.calls.map((c) => String(c[0])), ...openMock.mock.calls.map((c) => String(c[0]))];
}

beforeEach(() => {
  localStorage.setItem("accessToken", "JWT-RAHASIA");
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["%PDF"]) });
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:http://localhost/abc");
  URL.revokeObjectURL = revoke.mockReset();
  openMock.mockReset().mockReturnValue({ close: vi.fn(), location: { href: "" }, opener: null });
  vi.stubGlobal("open", openMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("AuthenticatedDocumentPreviewDialog", () => {
  it("never renders or requests a URL containing token=, and sends the Authorization header", async () => {
    render(<AuthenticatedDocumentPreviewDialog open onOpenChange={() => {}} fileName="laporan.pdf" filePath={PATH} />);
    expect(screen.getByRole("status")).toHaveTextContent("Memuat dokumen");

    const frame = await screen.findByTitle("preview");
    expect(frame).toHaveAttribute("src", "blob:http://localhost/abc");
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer JWT-RAHASIA" });

    fireEvent.click(screen.getByRole("button", { name: /Buka di tab baru/ }));
    fireEvent.click(screen.getByRole("button", { name: /Unduh/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const urls = renderedUrls();
    expect(urls.length).toBeGreaterThan(3);
    for (const url of urls) {
      expect(url).not.toContain("token=");
      expect(url).not.toContain("JWT-RAHASIA");
    }
    expect(document.body.innerHTML).not.toContain("token=");
  });

  it("does not fetch while closed, and revokes the blob URL when the dialog closes", async () => {
    const props = { onOpenChange: () => {}, fileName: "laporan.pdf", filePath: PATH };
    const { rerender } = render(<AuthenticatedDocumentPreviewDialog open={false} {...props} />);
    expect(fetchMock).not.toHaveBeenCalled();

    rerender(<AuthenticatedDocumentPreviewDialog open {...props} />);
    await screen.findByTitle("preview");
    rerender(<AuthenticatedDocumentPreviewDialog open={false} {...props} />);
    expect(revoke).toHaveBeenCalledWith("blob:http://localhost/abc");
  });

  it.each([
    [403, "Anda tidak memiliki akses ke berkas ini."],
    [404, "Berkas tidak ditemukan."],
  ])("shows the %i message instead of the viewer", async (status, message) => {
    fetchMock.mockResolvedValue({ ok: false, status });
    render(<AuthenticatedDocumentPreviewDialog open onOpenChange={() => {}} fileName="laporan.pdf" filePath={PATH} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByTitle("preview")).not.toBeInTheDocument();
  });

  it("passes the blob URL to the DOCX viewer", async () => {
    render(<AuthenticatedDocumentPreviewDialog open onOpenChange={() => {}} fileName="bab1.docx" filePath="thesis/T1/guidance/g1/bab1.docx" />);
    expect(await screen.findByTestId("docx")).toHaveAttribute("data-url", "blob:http://localhost/abc");
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/uploads\/thesis\/T1\/guidance\/g1\/bab1\.docx$/);
  });
});
