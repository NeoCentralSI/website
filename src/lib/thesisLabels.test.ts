import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACTIVE_THESIS_RATINGS,
  getAllowedThesisStatusOptions,
  getGuidanceActionBlockReason,
  THESIS_STATUS_TRANSITIONS,
  getThesisRatingLabel,
  getThesisRatingOptions,
  getThesisStatusLabel,
  getThesisStatusOptions,
  GUIDANCE_ACTOR_LABELS,
  GUIDANCE_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  THESIS_PHASE_LABELS,
  THESIS_PHASE_VARIANTS,
  THESIS_RATING_LABELS,
  THESIS_RATING_VARIANTS,
  THESIS_STATUS_LABELS,
  THESIS_STATUS_VARIANTS,
  THESIS_TERMINATION_REASON_LABELS,
} from "@/lib/thesisLabels";

const BACKEND = resolve(__dirname, "../../../backend");
// The backend lives in a separate repository; the parity tests only run where it is checked out
// next to the frontend (local development), and are skipped elsewhere (frontend-only CI).
const HAS_BACKEND = existsSync(resolve(BACKEND, "prisma/schema.prisma"));
const readBackend = (file: string) => readFileSync(resolve(BACKEND, file), "utf8");
const schema = HAS_BACKEND ? readBackend("prisma/schema.prisma") : "";
const backendLabels = HAS_BACKEND ? readBackend("src/constants/thesisLabels.js") : "";

function backendMap(exportName: string): Record<string, string> {
  const match = backendLabels.match(new RegExp(`export const ${exportName} = Object\\.freeze\\(\\{([^}]*)\\}\\)`));
  if (!match) throw new Error(`${exportName} not found in backend thesisLabels.js`);
  return Object.fromEntries([...match[1].matchAll(/(\w+):\s*"([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

function enumValues(name: string): string[] {
  const match = schema.match(new RegExp(`enum ${name} \\{([^}]*)\\}`));
  if (!match) throw new Error(`enum ${name} not found in schema.prisma`);
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, "").trim().split(/\s+/)[0])
    .filter(Boolean);
}

const CASES = [
  ["ThesisLifecycleStatus", THESIS_STATUS_LABELS, "THESIS_STATUS_LABELS"],
  ["ThesisPhase", THESIS_PHASE_LABELS, "THESIS_PHASE_LABELS"],
  ["ThesisTerminationReason", THESIS_TERMINATION_REASON_LABELS, "THESIS_TERMINATION_REASON_LABELS"],
  ["ThesisRating", THESIS_RATING_LABELS, "THESIS_RATING_LABELS"],
  // Paket B: guidance session status (K19), cancelling party, milestone status (K20)
  ["GuidanceStatus", GUIDANCE_STATUS_LABELS, "GUIDANCE_STATUS_LABELS"],
  ["GuidanceActor", GUIDANCE_ACTOR_LABELS, "GUIDANCE_ACTOR_LABELS"],
  ["MilestoneStatus", MILESTONE_STATUS_LABELS, "MILESTONE_STATUS_LABELS"],
] as const;

describe.skipIf(!HAS_BACKEND)("thesisLabels parity with the backend", () => {
  it.each(CASES)("labels every %s value from the schema, and nothing else", (enumName, labels) => {
    expect(Object.keys(labels).sort()).toEqual(enumValues(enumName).sort());
    for (const label of Object.values(labels)) expect(label.trim()).not.toBe("");
  });

  it.each(CASES)("%s labels are identical to the backend map", (_enumName, labels, exportName) => {
    expect({ ...labels }).toEqual(backendMap(exportName));
  });

  it("offers every status from the schema as an option, in schema order", () => {
    expect(getThesisStatusOptions().map((o) => o.value)).toEqual(enumValues("ThesisLifecycleStatus"));
  });

  it("K15 transitions are identical to the backend lifecycle table", () => {
    const backend = readBackend("src/services/thesisLifecycle.service.js");
    const block = backend.match(/THESIS_STATUS_TRANSITIONS = Object\.freeze\(\{([\s\S]*?)\}\);/);
    expect(block).not.toBeNull();
    const toValue = (name: string) => name.trim().replace("THESIS_STATUS.", "").toLowerCase();
    const parsed = Object.fromEntries(
      [...block![1].matchAll(/\[(THESIS_STATUS\.\w+)\]: \[([^\]]*)\]/g)].map((m) => [
        toValue(m[1]),
        m[2].split(",").map((v) => v.trim()).filter(Boolean).map(toValue),
      ]),
    );
    expect(parsed).toEqual(THESIS_STATUS_TRANSITIONS);
  });
});

describe("thesisLabels", () => {
  it("gives every status, phase and rating a badge variant", () => {
    expect(Object.keys(THESIS_STATUS_VARIANTS).sort()).toEqual(Object.keys(THESIS_STATUS_LABELS).sort());
    expect(Object.keys(THESIS_PHASE_VARIANTS).sort()).toEqual(Object.keys(THESIS_PHASE_LABELS).sort());
    expect(Object.keys(THESIS_RATING_VARIANTS).sort()).toEqual(Object.keys(THESIS_RATING_LABELS).sort());
    expect(THESIS_STATUS_VARIANTS).toMatchObject({
      research: "info", proposal: "secondary", on_leave: "warning", completed: "success", failed: "destructive",
    });
    expect(THESIS_RATING_VARIANTS).toMatchObject({ ONGOING: "success", SLOW: "warning", AT_RISK: "destructive" });
  });

  it("offers every status as an option, and only active ratings for new input", () => {
    expect(getThesisStatusOptions().map((o) => o.value).sort()).toEqual(Object.keys(THESIS_STATUS_LABELS).sort());
    expect(getThesisRatingOptions().map((o) => o.value)).toEqual(ACTIVE_THESIS_RATINGS);
    expect(getThesisRatingOptions().map((o) => o.value)).not.toContain("FAILED");
  });

  it("falls back to '-' for empty values and to the raw value for unknown ones", () => {
    expect(getThesisStatusLabel(null)).toBe("-");
    expect(getThesisStatusLabel("on_leave")).toBe("Berhenti Studi Sementara (BSS)");
    expect(getThesisRatingLabel("AT_RISK")).toBe("Berisiko");
    expect(getThesisStatusLabel("unknown_value")).toBe("unknown_value");
  });

  it("blocks guidance actions unless the thesis is in research", () => {
    expect(getGuidanceActionBlockReason("research")).toBeNull();
    expect(getGuidanceActionBlockReason(undefined)).toMatch(/belum memiliki/);
    const reason = getGuidanceActionBlockReason("on_leave");
    expect(reason).toContain("Berhenti Studi Sementara (BSS)");
    expect(reason).not.toContain("on_leave");
  });

  it("status options follow the allowed transitions", () => {
    expect(getAllowedThesisStatusOptions(null).map((o) => o.value)).toEqual(["proposal", "research", "completed", "failed"]);
    expect(getAllowedThesisStatusOptions("research").map((o) => o.value)).toEqual(["research", "on_leave", "completed", "failed"]);
    expect(getAllowedThesisStatusOptions("on_leave", "proposal").map((o) => o.value)).toEqual(["on_leave", "proposal", "failed"]);
    expect(getAllowedThesisStatusOptions("failed").map((o) => o.value)).toEqual(["failed"]);
  });
});
