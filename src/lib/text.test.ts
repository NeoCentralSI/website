import { describe, expect, it } from "vitest";

import { formatDateShortId, formatDateTimeWib } from "@/lib/text";

// Paket C (C5): "14 Oktober 2026 14.00 WIB", always Asia/Jakarta, 24-hour clock with a dot.
describe("formatDateTimeWib", () => {
  it("formats an ISO value in WIB with a dot as the time separator", () => {
    expect(formatDateTimeWib("2026-10-14T07:00:00.000Z")).toBe("14 Oktober 2026 14.00 WIB");
    expect(formatDateTimeWib(new Date("2026-03-01T03:00:00.000Z"))).toBe("1 Maret 2026 10.00 WIB");
  });

  it("adds the weekday on request", () => {
    expect(formatDateTimeWib("2026-10-14T07:00:00.000Z", { withWeekday: true })).toBe("Rabu, 14 Oktober 2026 14.00 WIB");
  });

  it("uses a 24-hour clock and crosses the date line in WIB", () => {
    expect(formatDateTimeWib("2026-10-13T17:05:00.000Z")).toBe("14 Oktober 2026 00.05 WIB");
    expect(formatDateTimeWib("2026-10-14T16:59:00.000Z")).toBe("14 Oktober 2026 23.59 WIB");
  });

  it("returns '-' for empty or invalid values", () => {
    expect(formatDateTimeWib(null)).toBe("-");
    expect(formatDateTimeWib(undefined)).toBe("-");
    expect(formatDateTimeWib("")).toBe("-");
    expect(formatDateTimeWib("bukan tanggal")).toBe("-");
  });

  it("date-only values keep using formatDateShortId", () => {
    expect(formatDateShortId("2026-10-14T07:00:00.000Z")).toBe("14 Oktober 2026");
  });
});
