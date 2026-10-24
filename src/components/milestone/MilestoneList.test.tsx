import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getGuidanceActionBlockReason } from "@/lib/thesisLabels";
import { MilestoneList } from "./MilestoneList";

vi.mock("lottie-react", () => ({
  default: () => <div data-testid="lottie-mock" />,
}));

// Create actions stay visible but are disabled with a visible reason.
describe("MilestoneList create actions", () => {
  it("disables 'Buat dari Template' and 'Buat Manual' with the reason for a non-research thesis", () => {
    const reason = getGuidanceActionBlockReason("research", "Anda", { onLeave: true });
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
      // A disabled button gets no pointer events, so the reason is on its wrapper.
      expect(button.parentElement).toHaveAttribute("title", reason);
    }
    expect(screen.getByRole("button", { name: /Buat Manual/ })).toBeDisabled();
    expect(reason).toContain("selama cuti");
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

  it("The empty list says which templates the running phase offers", () => {
    const { rerender } = render(
      <MilestoneList milestones={[]} progress={null} isOwner currentPhase="proposal" onCreateNew={vi.fn()} onCreateFromTemplates={vi.fn()} />,
    );
    expect(screen.getByText(/template milestone fase proposal yang berlaku umum/)).toBeInTheDocument();

    rerender(<MilestoneList milestones={[]} progress={null} isOwner currentPhase="research" onCreateNew={vi.fn()} onCreateFromTemplates={vi.fn()} />);
    expect(screen.getByText(/fase penelitian sesuai topik tugas akhir Anda/)).toBeInTheDocument();
    expect(screen.getByText(/milestone fase proposal tidak menghalangi/)).toBeInTheDocument();
  });
});
