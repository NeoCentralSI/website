import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  getAllowedThesisStatusOptions,
  getGuidanceActionBlockReason,
  THESIS_STATUS_TRANSITIONS,
  getThesisActivityLabel,
  getThesisActivityOptions,
  getEvaluationDueLabel,
  getThesisStatusLabel,
  getThesisStatusOptions,
  GUIDANCE_ACTOR_LABELS,
  GUIDANCE_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  THESIS_PHASE_LABELS,
  THESIS_PHASE_VARIANTS,
  THESIS_ACTIVITY_LABELS,
  THESIS_ACTIVITY_VARIANTS,
  THESIS_ACTIVITY_DESCRIPTIONS,
  THESIS_ACTIVITY_LEVELS,
  EVALUATION_DUE_LABELS,
  CHANGE_REQUEST_TYPE_LABELS,
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_VARIANTS,
  CHANGE_REQUEST_STEP_LABELS,
  SUPERVISOR_POSITION_LABELS,
  GUIDANCE_EVALUATION_TYPE_LABELS,
  GUIDANCE_EVALUATION_STAGE_LABELS,
  GUIDANCE_EVALUATION_RECOMMENDATION_LABELS,
  GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS,
  GUIDANCE_EVALUATION_STATUS_LABELS,
  GUIDANCE_EVALUATION_STATUS_VARIANTS,
  GUIDANCE_EVALUATION_OBSERVATION_LABELS,
  THESIS_STATUS_LABELS,
  THESIS_STATUS_VARIANTS,
  THESIS_TERMINATION_REASON_LABELS,
  SUPERVISOR_REQUEST_STATUS_LABELS,
  SUPERVISOR_REQUEST_STATUS_VARIANTS,
  SUPERVISOR_REQUEST_ROUTE_LABELS,
  SUPERVISION_LOAD_LEVEL_LABELS,
  SUPERVISION_LOAD_LEVEL_VARIANTS,
  RESEARCH_METHOD_RESULT_LABELS,
  RESEARCH_METHOD_RESULT_VARIANTS,
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
  // Guidance session status, cancelling party, milestone status
  ["GuidanceStatus", GUIDANCE_STATUS_LABELS, "GUIDANCE_STATUS_LABELS"],
  ["GuidanceActor", GUIDANCE_ACTOR_LABELS, "GUIDANCE_ACTOR_LABELS"],
  ["MilestoneStatus", MILESTONE_STATUS_LABELS, "MILESTONE_STATUS_LABELS"],
  // Pengajuan Perubahan Tugas Akhir
  ["ThesisChangeRequestType", CHANGE_REQUEST_TYPE_LABELS, "CHANGE_REQUEST_TYPE_LABELS"],
  ["ThesisChangeRequestStatus", CHANGE_REQUEST_STATUS_LABELS, "CHANGE_REQUEST_STATUS_LABELS"],
  ["ThesisSupervisorPosition", SUPERVISOR_POSITION_LABELS, "SUPERVISOR_POSITION_LABELS"],
  // Evaluasi Bimbingan
  ["GuidanceEvaluationType", GUIDANCE_EVALUATION_TYPE_LABELS, "GUIDANCE_EVALUATION_TYPE_LABELS"],
  ["GuidanceEvaluationRecommendation", GUIDANCE_EVALUATION_RECOMMENDATION_LABELS, "GUIDANCE_EVALUATION_RECOMMENDATION_LABELS"],
  ["GuidanceEvaluationStatus", GUIDANCE_EVALUATION_STATUS_LABELS, "GUIDANCE_EVALUATION_STATUS_LABELS"],
  // Pengajuan Pembimbing and Metode Penelitian
  ["ThesisSupervisorRequestStatus", SUPERVISOR_REQUEST_STATUS_LABELS, "SUPERVISOR_REQUEST_STATUS_LABELS"],
  ["SupervisorRequestRoute", SUPERVISOR_REQUEST_ROUTE_LABELS, "SUPERVISOR_REQUEST_ROUTE_LABELS"],
  ["ResearchMethodAssessmentResult", RESEARCH_METHOD_RESULT_LABELS, "RESEARCH_METHOD_RESULT_LABELS"],
] as const;

describe.skipIf(!HAS_BACKEND)("thesisLabels parity with the backend", () => {
  it.each(CASES)("labels every %s value from the schema, and nothing else", (enumName, labels) => {
    expect(Object.keys(labels).sort()).toEqual(enumValues(enumName).sort());
    for (const label of Object.values(labels)) expect(label.trim()).not.toBe("");
  });

  it.each(CASES)("%s labels are identical to the backend map", (_enumName, labels, exportName) => {
    expect({ ...labels }).toEqual(backendMap(exportName));
  });

  it.each([
    ["THESIS_ACTIVITY_LABELS", THESIS_ACTIVITY_LABELS],
    ["EVALUATION_DUE_LABELS", EVALUATION_DUE_LABELS],
    ["SUPERVISION_LOAD_LEVEL_LABELS", SUPERVISION_LOAD_LEVEL_LABELS],
  ] as const)("%s (derived, no schema enum) are identical to the backend map", (exportName, labels) => {
    expect({ ...labels }).toEqual(backendMap(exportName));
  });

  it("change request steps: every ThesisChangeApprovalRole plus the Kadep step, same as the backend", () => {
    expect(Object.keys(CHANGE_REQUEST_STEP_LABELS).sort()).toEqual([...enumValues("ThesisChangeApprovalRole"), "kadep"].sort());
    expect({ ...CHANGE_REQUEST_STEP_LABELS }).toEqual(backendMap("CHANGE_REQUEST_STEP_LABELS"));
  });

  it("guidance evaluation observations are identical to the backend map", () => {
    expect({ ...GUIDANCE_EVALUATION_OBSERVATION_LABELS }).toEqual(backendMap("GUIDANCE_EVALUATION_OBSERVATION_LABELS"));
  });

  it("offers every status from the schema as an option, in schema order", () => {
    expect(getThesisStatusOptions().map((o) => o.value)).toEqual(enumValues("ThesisLifecycleStatus"));
  });

  it("status transitions are identical to the backend lifecycle table", () => {
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
    expect(Object.keys(THESIS_ACTIVITY_VARIANTS).sort()).toEqual(Object.keys(THESIS_ACTIVITY_LABELS).sort());
    expect(THESIS_STATUS_VARIANTS).toMatchObject({
      research: "info", proposal: "secondary", on_leave: "warning", completed: "success", failed: "destructive",
    });
    expect(THESIS_ACTIVITY_VARIANTS).toEqual({ active: "success", slow: "warning", at_risk: "destructive" });
  });

  it("gives every proposal status, load level and result a badge variant", () => {
    expect(Object.keys(SUPERVISOR_REQUEST_STATUS_VARIANTS).sort()).toEqual(Object.keys(SUPERVISOR_REQUEST_STATUS_LABELS).sort());
    expect(Object.keys(SUPERVISION_LOAD_LEVEL_VARIANTS).sort()).toEqual(Object.keys(SUPERVISION_LOAD_LEVEL_LABELS).sort());
    expect(Object.keys(RESEARCH_METHOD_RESULT_VARIANTS).sort()).toEqual(Object.keys(RESEARCH_METHOD_RESULT_LABELS).sort());
  });

  it("gives every change request status a badge variant", () => {
    expect(Object.keys(CHANGE_REQUEST_STATUS_VARIANTS).sort()).toEqual(Object.keys(CHANGE_REQUEST_STATUS_LABELS).sort());
  });

  it("guidance evaluation: every recommendation has an effect text, every stage and status a label", () => {
    expect(Object.keys(GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS).sort()).toEqual(Object.keys(GUIDANCE_EVALUATION_RECOMMENDATION_LABELS).sort());
    expect(Object.keys(GUIDANCE_EVALUATION_STATUS_VARIANTS).sort()).toEqual(Object.keys(GUIDANCE_EVALUATION_STATUS_LABELS).sort());
    expect(Object.keys(GUIDANCE_EVALUATION_STAGE_LABELS).sort()).toEqual(Object.keys(EVALUATION_DUE_LABELS).sort());
    expect(GUIDANCE_EVALUATION_STAGE_LABELS.extension_follow_up).toBe("Tindak Lanjut Evaluasi 6 Bulan");
  });

  it("names the guidance evaluation as the reason while a thesis repeats its proposal", () => {
    const reason = getGuidanceActionBlockReason("proposal", "Anda", { repeatingProposal: true });
    expect(reason).toContain("Mengulang proposal berdasarkan evaluasi bimbingan.");
    expect(getGuidanceActionBlockReason("proposal")).not.toContain("Mengulang proposal");
    expect(getGuidanceActionBlockReason("research", "Anda", { repeatingProposal: true })).toBeNull();
    // The proposal phase opens after Penetapan Pembimbing, never while repeating
    expect(getGuidanceActionBlockReason("proposal")).toContain("Penetapan Pembimbing");
    expect(getGuidanceActionBlockReason("proposal", "Anda", { proposalPhaseOpen: true })).toBeNull();
    expect(getGuidanceActionBlockReason("proposal", "Anda", { proposalPhaseOpen: true, repeatingProposal: true })).toContain("Mengulang proposal");
  });

  it("offers every status as an option", () => {
    expect(getThesisStatusOptions().map((o) => o.value).sort()).toEqual(Object.keys(THESIS_STATUS_LABELS).sort());
  });

  it("labels the derived activity levels and due evaluations, with a rule text per level", () => {
    expect(THESIS_ACTIVITY_LABELS).toEqual({ active: "Lancar", slow: "Lambat", at_risk: "Berisiko" });
    expect(getThesisActivityOptions().map((o) => o.value)).toEqual(THESIS_ACTIVITY_LEVELS);
    expect(Object.keys(THESIS_ACTIVITY_DESCRIPTIONS).sort()).toEqual([...THESIS_ACTIVITY_LEVELS].sort());
    expect(THESIS_ACTIVITY_DESCRIPTIONS.slow).toContain("60 sampai 120 hari");
    expect(THESIS_ACTIVITY_DESCRIPTIONS.at_risk).toContain("lebih dari 120 hari");
    expect(getThesisActivityLabel(null)).toBe("-");
    expect(getEvaluationDueLabel("one_year")).toBe("Evaluasi 1 tahun jatuh tempo");
    expect(Object.keys(EVALUATION_DUE_LABELS).sort()).toEqual(["extension_follow_up", "one_year", "six_month"]);
  });

  it("falls back to '-' for empty values and to the raw value for unknown ones", () => {
    expect(getThesisStatusLabel(null)).toBe("-");
    expect(getThesisStatusLabel("on_leave")).toBe("Berhenti Studi Sementara (BSS)");
    expect(getThesisActivityLabel("at_risk")).toBe("Berisiko");
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
