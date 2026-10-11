import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MilestoneNotes } from "./MilestoneNotes";

// Paket C (C9): decision notes and supervisor feedback are two labelled blocks.
describe("MilestoneNotes", () => {
  it("shows 'Catatan Persetujuan' and 'Feedback Pembimbing' side by side for a completed milestone", () => {
    render(
      <MilestoneNotes
        status="completed"
        supervisorNotes="Disetujui, lanjut bab 4"
        feedback="Rapikan daftar pustaka"
        feedbackByName="AFRIYANTI DWI KARTIKA"
        feedbackAt="2026-10-14T07:00:00.000Z"
      />,
    );
    expect(screen.getByText("Catatan Persetujuan")).toBeInTheDocument();
    expect(screen.getByText("Disetujui, lanjut bab 4")).toBeInTheDocument();
    expect(screen.getByText("Feedback Pembimbing")).toBeInTheDocument();
    expect(screen.getByText("Rapikan daftar pustaka")).toBeInTheDocument();
    expect(screen.getByText(/Afriyanti Dwi Kartika · 14 Oktober 2026 14\.00 WIB/)).toBeInTheDocument();
  });

  it("labels the decision notes 'Catatan Revisi' while the milestone is not completed", () => {
    render(<MilestoneNotes status="revision_needed" supervisorNotes="Lengkapi data uji" />);
    expect(screen.getByText("Catatan Revisi")).toBeInTheDocument();
    expect(screen.queryByText("Feedback Pembimbing")).not.toBeInTheDocument();
  });

  it("renders nothing without notes or feedback", () => {
    const { container } = render(<MilestoneNotes status="in_progress" />);
    expect(container).toBeEmptyDOMElement();
  });
});
