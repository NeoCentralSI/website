import { describe, expect, it } from "vitest";
import { isMetopenArchiveMode, isPromotedToActiveOfficial } from "./metopelArchive";

describe("isPromotedToActiveOfficial", () => {
  it("is false for proposal accepted without promotion", () => {
    expect(
      isPromotedToActiveOfficial({
        requestStatus: "booking_approved",
        latestRequestStatus: "booking_approved",
      }),
    ).toBe(false);
  });

  it("is true when requestStatus is active_official", () => {
    expect(isPromotedToActiveOfficial({ requestStatus: "active_official" })).toBe(true);
  });
});

describe("isMetopenArchiveMode", () => {
  it("does not archive merely because Metopel was taken and KRS TA is true", () => {
    expect(
      isMetopenArchiveMode({
        hasTakenMetopen: true,
        takingThesisCourse: true,
        requestStatus: "released",
      }),
    ).toBe(false);
  });

  it("is false when Metopel was taken but KRS TA is not confirmed", () => {
    expect(
      isMetopenArchiveMode({
        hasTakenMetopen: true,
        takingThesisCourse: false,
        requestStatus: "released",
      }),
    ).toBe(false);
  });

  it("uses backend isMetopenArchive when present", () => {
    expect(
      isMetopenArchiveMode({
        isMetopenArchive: true,
        hasTakenMetopen: false,
        takingThesisCourse: false,
      }),
    ).toBe(true);
  });

  it("falls back to active_official promotion", () => {
    expect(isMetopenArchiveMode({ requestStatus: "active_official" })).toBe(true);
  });
});
