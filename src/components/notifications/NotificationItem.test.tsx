import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import NotificationItem from "./NotificationItem";
import type { NotificationItem as NotificationRecord } from "@/services/notification.service";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function record(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: "n1",
    title: "Pengajuan Pembimbing Ditolak Dosen",
    message: "Dosen pembimbing menolak pengajuan Anda.",
    isRead: false,
    createdAt: "2026-08-13T00:00:00.000Z",
    type: "advisor_request_rejected_by_dosen",
    data: { route: "/metopel" },
    ...overrides,
  };
}

describe("NotificationItem", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("navigates to data.route when the item is clicked", async () => {
    const onMarkRead = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onNavigate = vi.fn();

    render(
      <NotificationItem
        notification={record()}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
        onNavigate={onNavigate}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole("button", { name: /Pengajuan Pembimbing Ditolak Dosen/i }));

    await waitFor(() => {
      expect(onMarkRead).toHaveBeenCalledWith("n1");
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith("/metopel");
    });
  });

  it("does not navigate when data.route is absent", async () => {
    const onMarkRead = vi.fn().mockResolvedValue(undefined);

    render(
      <NotificationItem
        notification={record({ data: { type: "advisor_request_rejected_by_dosen" } })}
        onMarkRead={onMarkRead}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByText("Pengajuan Pembimbing Ditolak Dosen"));

    await waitFor(() => {
      expect(navigateMock).not.toHaveBeenCalled();
    });
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("does not navigate when the delete action is clicked", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <NotificationItem
        notification={record()}
        onMarkRead={vi.fn().mockResolvedValue(undefined)}
        onDelete={onDelete}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByTitle("Hapus notifikasi"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("n1");
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
