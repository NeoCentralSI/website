import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getScienceGroupsAPI } = await import("./admin.service");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("getScienceGroupsAPI", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "token"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes direct API data to an array", async () => {
    const group = {
      id: "sg-1",
      name: "Rekayasa Perangkat Lunak",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [group] })));

    await expect(getScienceGroupsAPI()).resolves.toEqual({ data: [group] });
  });

  it("normalizes nested science group payloads to an array", async () => {
    const group = {
      id: "sg-2",
      name: "Sistem Cerdas",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { scienceGroups: [group] } })),
    );

    await expect(getScienceGroupsAPI()).resolves.toEqual({ data: [group] });
  });
});
