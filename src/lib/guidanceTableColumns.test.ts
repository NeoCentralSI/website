import { describe, expect, it } from "vitest";

import { getGuidanceStatusContext } from "@/lib/guidanceTableColumns";
import type { GuidanceItem } from "@/services/studentGuidance.service";

const item = (extra: Partial<GuidanceItem>): GuidanceItem => ({ id: "g1", status: "requested", ...extra }) as GuidanceItem;

// What a student/lecturer sees under a session status
describe("getGuidanceStatusContext", () => {
  it("rejection shows the reason and the suggested time", () => {
    expect(
      // C5: formatted on the frontend from the ISO value, not from `*Formatted`
      getGuidanceStatusContext(item({ status: "rejected", rejectionReason: "Dinas luar", suggestedDate: "2026-10-12T03:00:00.000Z" })),
    ).toBe("Alasan: Dinas luar · Usulan waktu dosen: 12 Oktober 2026 10.00 WIB");
  });

  it("cancellation shows who cancelled and why", () => {
    expect(getGuidanceStatusContext(item({ status: "cancelled", cancelReason: "Sakit", cancelledBy: "lecturer" }))).toBe(
      "Dibatalkan oleh dosen: Sakit",
    );
    expect(getGuidanceStatusContext(item({ status: "cancelled", cancelReason: "TA dihentikan", cancelledBy: "system" }))).toBe(
      "Dibatalkan oleh sistem: TA dihentikan",
    );
  });

  it("summary revision notes and a lecturer reschedule reason", () => {
    expect(getGuidanceStatusContext(item({ status: "summary_rejected", supervisorFeedback: "Lengkapi bab 3" }))).toBe(
      "Perlu diperbaiki: Lengkapi bab 3",
    );
    expect(getGuidanceStatusContext(item({ status: "accepted", rescheduleReason: "Rapat fakultas" }))).toBe(
      "Jadwal diubah dosen: Rapat fakultas",
    );
    expect(getGuidanceStatusContext(item({ status: "requested" }))).toBeNull();
  });
});
