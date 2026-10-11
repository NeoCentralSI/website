import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getGuidanceActionBlockReason } from "@/lib/thesisLabels";
import { MilestoneList } from "./MilestoneList";

vi.mock("lottie-react", () => ({
  default: () => <div data-testid="lottie-mock" />,
}));

// K14: create actions stay visible but are disabled with a visible reason.
describe("MilestoneList create actions", () => {
  it("disables 'Buat dari Template' and 'Buat Manual' with the reason for a non-research thesis", () => {
    const reason = getGuidanceActionBlockReason("on_leave");
    render(
      <MilestoneList
        milestones={[]}
        progress={null}
        isOwner
        onCreateNew={vi.fn()}
        onCreateFromTemplates={vi.fn()}
        createDisabledReason={reason}
      />,
    );

    const fromTemplate = screen.getAllByRole("button", { name: /Buat dari Template/ });
    expect(fromTemplate.length).toBeGreaterThan(0);
    for (const button of fromTemplate) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("title", reason);
    }
    expect(screen.getByRole("button", { name: /Buat Manual/ })).toBeDisabled();
    expect(reason).toContain("Berhenti Studi Sementara (BSS)");
  });

  it("keeps create actions enabled for a research thesis", () => {
    render(
      <MilestoneList
        milestones={[]}
        progress={null}
        isOwner
        onCreateNew={vi.fn()}
        onCreateFromTemplates={vi.fn()}
        createDisabledReason={getGuidanceActionBlockReason("research")}
      />,
    );

    for (const button of screen.getAllByRole("button", { name: /Buat dari Template/ })) {
      expect(button).toBeEnabled();
    }
    expect(screen.getByRole("button", { name: /Buat Manual/ })).toBeEnabled();
  });
});
