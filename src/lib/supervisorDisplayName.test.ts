import { describe, expect, it } from "vitest";
import {
  looksLikeSupervisorRoleLabel,
  resolveSupervisorDisplayName,
} from "./supervisorDisplayName";

describe("looksLikeSupervisorRoleLabel", () => {
  it("detects snapshot role labels", () => {
    expect(looksLikeSupervisorRoleLabel("Pembimbing 1")).toBe(true);
    expect(looksLikeSupervisorRoleLabel("Pembimbing 2")).toBe(true);
    expect(looksLikeSupervisorRoleLabel("Dosen Pembimbing")).toBe(true);
  });

  it("does not treat a person name as a role label", () => {
    expect(looksLikeSupervisorRoleLabel("Dr. Andi Pembimbing")).toBe(false);
  });
});

describe("resolveSupervisorDisplayName", () => {
  it("keeps a real person name", () => {
    expect(resolveSupervisorDisplayName("Dr. Andi Pembimbing", "lecturer-1")).toBe(
      "Dr. Andi Pembimbing",
    );
  });

  it("falls back to the matching live lecturer name", () => {
    expect(
      resolveSupervisorDisplayName("Pembimbing 1", "lecturer-live", {
        latestRequest: {
          lecturer: {
            id: "lecturer-live",
            user: { fullName: "Dr. Andi Pembimbing" },
          },
        },
      }),
    ).toBe("Dr. Andi Pembimbing");
  });

  it("does not use a live name from a different lecturer", () => {
    expect(
      resolveSupervisorDisplayName("Pembimbing 2", "lecturer-p2", {
        latestRequest: {
          lecturer: {
            id: "lecturer-p1",
            user: { fullName: "Dr. Andi Pembimbing" },
          },
        },
      }),
    ).toBe("");
  });
});
