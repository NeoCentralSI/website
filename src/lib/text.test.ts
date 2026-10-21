import { describe, expect, it } from "vitest";

import { formatDateShortId, formatDateTimeWib, formatLecturerName, toTitleCaseName } from "@/lib/text";

// "14 Oktober 2026 14.00 WIB", always Asia/Jakarta, 24-hour clock with a dot.
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

// A lecturer's degrees follow a comma and are written with their own capitals ("M.Sc").
describe("formatLecturerName", () => {
  it("title-cases the name and keeps the degree after the comma as written", () => {
    expect(formatLecturerName("HUSNIL KAMIL, M.T")).toBe("Husnil Kamil, M.T");
    expect(formatLecturerName("fajril akbar, M.Sc")).toBe("Fajril Akbar, M.Sc");
    expect(formatLecturerName("Aina Hubby Aziira, M.Eng")).toBe("Aina Hubby Aziira, M.Eng");
    expect(formatLecturerName("Ricky Akbar, M. Kom")).toBe("Ricky Akbar, M. Kom");
  });

  it("does what toTitleCaseName gets wrong for a degree", () => {
    expect(toTitleCaseName("Fajril Akbar, M.Sc")).toBe("Fajril Akbar, M.sc");
    expect(formatLecturerName("Fajril Akbar, M.Sc")).toBe("Fajril Akbar, M.Sc");
  });

  it("keeps every degree after the first comma, however many there are", () => {
    expect(formatLecturerName("HUSNIL KAMIL, S.Kom., M.T.")).toBe("Husnil Kamil, S.Kom., M.T.");
    expect(formatLecturerName("PROF. IR. SURYA AFNARIUS, PhD")).toBe("Prof. Ir. Surya Afnarius, PhD");
    expect(formatLecturerName("DR. ENG. ANDI SAPUTRA, S.T., M.T.")).toBe("Dr. Eng. Andi Saputra, S.T., M.T.");
  });

  it("tidies the spacing around the comma without touching the degree itself", () => {
    expect(formatLecturerName("  HUSNIL   KAMIL ,   M.T  ")).toBe("Husnil Kamil, M.T");
    expect(formatLecturerName("Husnil Kamil,M.T")).toBe("Husnil Kamil, M.T");
  });

  it("title-cases a name without a comma as a whole, like a student's name", () => {
    expect(formatLecturerName("MUHAMMAD ILHAM NOFALDI")).toBe("Muhammad Ilham Nofaldi");
    expect(formatLecturerName("husnil kamil")).toBe(toTitleCaseName("husnil kamil"));
  });

  it("handles a trailing comma, a missing name and empty values", () => {
    expect(formatLecturerName("HUSNIL KAMIL,")).toBe("Husnil Kamil");
    expect(formatLecturerName(", M.T")).toBe("M.T");
    expect(formatLecturerName("")).toBe("-");
    expect(formatLecturerName("   ")).toBe("-");
    expect(formatLecturerName(null)).toBe("-");
    expect(formatLecturerName(undefined)).toBe("-");
  });

  it("leaves toTitleCaseName as it was", () => {
    expect(toTitleCaseName("HUSNIL KAMIL")).toBe("Husnil Kamil");
    expect(toTitleCaseName(null)).toBe("-");
  });
});
