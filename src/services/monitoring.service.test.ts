import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./auth.service";
import { downloadProgressReportPdf } from "./monitoring.service";

vi.mock("./auth.service", () => ({ apiRequest: vi.fn() }));
vi.mock("@/config/api", () => ({ getApiUrl: (path: string) => `http://api.test${path}` }));

const PDF_DOWN = "Layanan pembuat PDF sedang tidak aktif. Hubungi admin sistem.";

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body, blob: async () => new Blob([JSON.stringify(body)]) }) as unknown as Response;

beforeEach(() => {
  vi.mocked(apiRequest).mockReset();
});

describe("downloadProgressReportPdf", () => {
  it("returns the PDF of the chosen semester", async () => {
    const pdf = new Blob(["%PDF-1.7"], { type: "application/pdf" });
    vi.mocked(apiRequest).mockResolvedValue({ ok: true, status: 200, blob: async () => pdf } as unknown as Response);

    await expect(downloadProgressReportPdf({ academicYearId: "ay-now" })).resolves.toBe(pdf);
    expect(apiRequest).toHaveBeenCalledWith("http://api.test/thesisGuidance/monitoring/report/download?academicYear=ay-now");
  });

  it("asks for every semester without a semester, or with 'all'", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob([]) } as unknown as Response);

    await downloadProgressReportPdf();
    await downloadProgressReportPdf({ academicYearId: "all" });

    expect(vi.mocked(apiRequest).mock.calls.map(([url]) => url)).toEqual([
      "http://api.test/thesisGuidance/monitoring/report/download?",
      "http://api.test/thesisGuidance/monitoring/report/download?",
    ]);
  });

  it("fails with the message of the server when the PDF service is not running (503)", async () => {
    vi.mocked(apiRequest).mockResolvedValue(jsonResponse(503, { success: false, status: 503, message: PDF_DOWN }));

    await expect(downloadProgressReportPdf({ academicYearId: "ay-now" })).rejects.toThrow(PDF_DOWN);
  });

  it("fails with a general message when the answer carries none", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError("Unexpected token <"); },
    } as unknown as Response);

    await expect(downloadProgressReportPdf()).rejects.toThrow("Gagal mengunduh laporan");
  });
});
