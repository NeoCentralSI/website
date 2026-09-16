import { describe, expect, it } from "vitest";

import { resolveCriteriaRubricKind } from "@/lib/metopenRubric";

describe("resolveCriteriaRubricKind", () => {
  it("resolves by CPMK code + maxScore without requiring name keywords", () => {
    expect(resolveCriteriaRubricKind(null, 20, "CPMK-01", "TA-03A")).toBe("presentasi");
    expect(resolveCriteriaRubricKind("Apa saja", 40, "CPMK-02", "TA-03A")).toBe("konten-sub");
    expect(resolveCriteriaRubricKind(null, 15, "CPMK-03", "supervisor")).toBe("respon");
    expect(resolveCriteriaRubricKind(null, 25, "CPMK-02", "TA-03B")).toBe("struktur");
  });

  it("still accepts legacy name-based matching", () => {
    expect(resolveCriteriaRubricKind("Presentasi Lisan", 20, null)).toBe("presentasi");
    expect(resolveCriteriaRubricKind("Proposal (Konten)", 40, null)).toBe("konten-sub");
    expect(resolveCriteriaRubricKind("Proposal (Struktur)", 25, null)).toBe("struktur");
  });
});
