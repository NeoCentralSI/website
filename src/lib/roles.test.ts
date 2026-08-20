import { describe, expect, it } from "vitest";

import { assignableRoleOptions, ROLES, roleOptions } from "@/lib/roles";

describe("roleOptions", () => {
  it("covers every role constant exactly once", () => {
    expect(roleOptions.map((option) => option.value).sort()).toEqual(Object.values(ROLES).sort());
  });

  it("labels every option", () => {
    for (const option of roleOptions) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});

describe("assignableRoleOptions", () => {
  it("offers every role except Admin, which the backend never assigns manually", () => {
    expect(assignableRoleOptions.map((option) => option.value)).not.toContain(ROLES.ADMIN);
    expect(assignableRoleOptions).toHaveLength(roleOptions.length - 1);
  });

  it("includes Tim Pengelola CPL", () => {
    expect(assignableRoleOptions.map((option) => option.value)).toContain(ROLES.TIM_PENGELOLA_CPL);
  });
});
