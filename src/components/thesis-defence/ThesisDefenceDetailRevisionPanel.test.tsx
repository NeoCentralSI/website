import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThesisDefenceDetailRevisionPanel } from "./ThesisDefenceDetailRevisionPanel";

const { board, mutation } = vi.hoisted(() => ({
  board: { value: { isFinalized: false, revisions: [] as unknown[] } },
  mutation: () => ({ mutateAsync: () => Promise.resolve(), isPending: false }),
}));

vi.mock("lottie-react", () => ({ default: () => <div data-testid="lottie-mock" /> }));
vi.mock("@/hooks/shared", () => ({
  useAuth: () => ({ user: { id: "user-p1", lecturer: { id: "lec-p1" } } }),
  useRole: () => ({ isStudent: () => false }),
}));
vi.mock("@/hooks/thesis-defence", () => ({
  useDefenceRevisionBoard: () => ({ data: board.value, isLoading: false, refetch: vi.fn(), isFetching: false }),
  useCancelDefenceRevisionSubmit: mutation,
  useCreateDefenceRevision: mutation,
  useDeleteDefenceRevision: mutation,
  useSaveDefenceRevisionAction: mutation,
  useSubmitDefenceRevision: mutation,
  useApproveDefenceRevision: mutation,
  useUnapproveDefenceRevision: mutation,
  useFinalizeDefenceRevisions: mutation,
  useUnfinalizeDefenceRevisions: mutation,
}));

const approvedItem = {
  id: "rev-1", examinerId: "ex-1", examinerName: "Penguji Satu", examinerOrder: 1,
  description: "Perbaiki bab pembahasan", revisionAction: "Sudah diperbaiki", studentSubmittedAt: "2026-10-10T02:00:00.000Z", isFinished: true,
};
const detail = (revisionFinalizedAt: string | null) => ({
  id: "def-1", status: "passed_with_revision", revisionFinalizedAt, supervisors: [{ lecturerId: "lec-p1" }], student: { id: "stu-1" }, examiners: [],
});

describe("papan revisi sidang: Batalkan Persetujuan (Lanjutan Paket E7)", () => {
  beforeEach(() => { board.value = { isFinalized: false, revisions: [approvedItem] }; });

  it("after the finalization the icon is disabled, with the reason in its tooltip", () => {
    board.value = { isFinalized: true, revisions: [approvedItem] };
    render(<ThesisDefenceDetailRevisionPanel defenceId="def-1" detail={detail("2026-10-12T02:00:00.000Z")} />);
    const button = screen.getByRole("button", { name: "Batalkan Persetujuan" });
    expect(button).toBeDisabled();
    expect(button.parentElement).toHaveAttribute("title", "Batalkan Persetujuan: Revisi sudah difinalkan. Batalkan finalisasi lebih dulu.");
  });

  it("before the finalization the icon is active", () => {
    render(<ThesisDefenceDetailRevisionPanel defenceId="def-1" detail={detail(null)} />);
    const button = screen.getByTitle("Batalkan Persetujuan");
    expect(button).toBeEnabled();
  });
});
