import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth.service", () => ({
  apiRequest: vi.fn(),
}));

const { apiRequest } = await import("./auth.service");
const { assessmentService } = await import("./assessment.service");

const mockedApiRequest = vi.mocked(apiRequest);

function makeXlsxResponse({
  contentDisposition,
  body = "BINARY_PAYLOAD",
  status = 200,
}: {
  contentDisposition?: string;
  body?: string;
  status?: number;
} = {}) {
  const headers = new Headers();
  if (contentDisposition) headers.set("content-disposition", contentDisposition);
  return new Response(body, { status, headers });
}

describe("assessmentService.downloadMetopenScoresXlsx", () => {
  let revokeSpy: ReturnType<typeof vi.fn>;
  let createUrlSpy: ReturnType<typeof vi.fn>;
  let anchorClickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    revokeSpy = vi.fn();
    createUrlSpy = vi.fn(() => "blob:fake-url");
    window.URL.createObjectURL = createUrlSpy as unknown as typeof window.URL.createObjectURL;
    window.URL.revokeObjectURL = revokeSpy as unknown as typeof window.URL.revokeObjectURL;
    anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  it("triggers a browser download with filename from content-disposition", async () => {
    mockedApiRequest.mockResolvedValueOnce(
      makeXlsxResponse({
        contentDisposition: 'attachment; filename="Nilai-TA-03-Kuliah-A-2026-05-15.xlsx"',
      }),
    );

    await assessmentService.downloadMetopenScoresXlsx();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/assessment/metopen/scores/export"),
      { method: "GET" },
    );
    expect(createUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:fake-url");
  });

  it("appends attendanceImportId as query parameter when provided", async () => {
    mockedApiRequest.mockResolvedValueOnce(makeXlsxResponse());

    await assessmentService.downloadMetopenScoresXlsx("import-123");

    const [calledUrl] = mockedApiRequest.mock.calls[0];
    expect(calledUrl).toContain("attendanceImportId=import-123");
  });

  it("throws with server error message when response is not ok", async () => {
    mockedApiRequest.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Belum ada import presensi" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(assessmentService.downloadMetopenScoresXlsx()).rejects.toThrow(
      /Belum ada import presensi/,
    );
    expect(createUrlSpy).not.toHaveBeenCalled();
  });
});
