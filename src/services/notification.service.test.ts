import { describe, expect, it } from "vitest";

import { getNotificationRoute, type NotificationItem } from "./notification.service";

function item(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: "n1",
    isRead: false,
    createdAt: "2026-08-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("getNotificationRoute", () => {
  it("returns data.route when it is an in-app path", () => {
    expect(getNotificationRoute(item({ data: { route: "/tugas-akhir/proposal" } }))).toBe("/tugas-akhir/proposal");
    expect(getNotificationRoute(item({ data: { route: "/metode-penelitian/penilaian" } }))).toBe(
      "/metode-penelitian/penilaian",
    );
  });

  it("parses data when the API returns a JSON string", () => {
    expect(
      getNotificationRoute(item({ data: JSON.stringify({ route: "/dosen/inbox-pembimbing" }) })),
    ).toBe("/dosen/inbox-pembimbing");
  });

  it("does not invent a route when data.route is missing", () => {
    expect(getNotificationRoute(item({ type: "research_method_assessment_finalized" }))).toBeNull();
    expect(getNotificationRoute(item({ data: { type: "research_method_assessment_finalized" } }))).toBeNull();
    expect(getNotificationRoute(item({ data: null }))).toBeNull();
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(getNotificationRoute(item({ data: { route: "https://evil.example/phish" } }))).toBeNull();
    expect(getNotificationRoute(item({ data: { route: "//evil.example/phish" } }))).toBeNull();
    expect(getNotificationRoute(item({ data: { route: "/tugas-akhir://skip" } }))).toBeNull();
  });
});
