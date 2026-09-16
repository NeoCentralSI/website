import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MetopenAssessmentCriteria,
  MetopenCpmkWithRubrics,
} from "./rubricMetopen.service";

vi.mock("./auth.service", () => ({
  apiRequest: vi.fn(),
}));

const { apiRequest } = await import("./auth.service");
const rubricMetopenService = await import("./rubricMetopen.service");

const mockedApiRequest = vi.mocked(apiRequest);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("rubricMetopen service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes nested CPMK rubric list payloads", async () => {
    const cpmk: MetopenCpmkWithRubrics = {
      id: "cpmk-1",
      code: "CPMK-01",
      description: "Presentasi lisan",
      metopenAssessmentCriterias: [],
    };
    mockedApiRequest.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { cpmks: [cpmk] } }),
    );

    await expect(
      rubricMetopenService.getCpmksWithRubrics("supervisor", "ay-1"),
    ).resolves.toEqual([cpmk]);
  });

  it("normalizes nested all-CPMK payloads", async () => {
    const cpmk = {
      id: "cpmk-2",
      code: "CPMK-02",
      description: "Penulisan proposal",
      academicYearId: "ay-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    mockedApiRequest.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { metopenCpmks: [cpmk] } }),
    );

    await expect(rubricMetopenService.getAllMetopenCpmks("ay-1")).resolves.toEqual([cpmk]);
  });

  it("unwraps nested criteria mutation payloads", async () => {
    const criteria: MetopenAssessmentCriteria = {
      id: "criteria-1",
      metopenCpmkId: "cpmk-1",
      name: "Presentasi",
      maxScore: 20,
      role: "supervisor",
      displayOrder: 1,
      metopenAssessmentRubrics: [],
    };
    mockedApiRequest.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { data: criteria } }),
    );

    await expect(
      rubricMetopenService.createCriteria({
        metopenCpmkId: "cpmk-1",
        role: "supervisor",
        name: "Presentasi",
        maxScore: 20,
      }),
    ).resolves.toEqual(criteria);
  });
});
