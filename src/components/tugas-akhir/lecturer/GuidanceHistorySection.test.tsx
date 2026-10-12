import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUIDANCE_STATUS_LABELS } from "@/lib/thesisLabels";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { GuidanceHistorySection } from "./GuidanceHistorySection";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/services/auth.service", () => ({ getAuthTokens: () => ({ accessToken: "JWT-RAHASIA" }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/components/pdf/DocxViewer", () => ({ DocxViewer: () => null }));

const FILE_PATH = "uploads/thesis/t1/guidance/g1/bab-3.pdf";
const fetchMock = vi.fn();
const openMock = vi.fn();

const session = (overrides: Partial<GuidanceItem> = {}): GuidanceItem => ({
    id: "g1",
    status: "completed",
    approvedDate: "2026-09-14T07:00:00.000Z",
    milestoneTitles: ["Bab 3 Metodologi"],
    duration: 60,
    studentNotes: "Mohon periksa bab 3.",
    document: { fileName: "bab-3.pdf", filePath: FILE_PATH },
    ...overrides,
});

const renderSection = (items: GuidanceItem[]) =>
    render(<GuidanceHistorySection guidanceHistory={{ count: items.length, items }} />);

/** Every link the section put on the page. */
const hrefs = () => [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href") ?? "");

beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["%PDF"]) });
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/abc");
    URL.revokeObjectURL = vi.fn();
    openMock.mockReset().mockReturnValue({ close: vi.fn(), location: { href: "" }, opener: null });
    vi.stubGlobal("open", openMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("GuidanceHistorySection", () => {
    it("labels every session status with the shared guidance labels, never the raw value", () => {
        const statuses = ["requested", "accepted", "rescheduled", "rejected", "summary_pending", "summary_rejected", "completed", "cancelled"] as const;
        renderSection(statuses.map((status, index) => session({ id: `g${index}`, status, milestoneTitles: [`Sesi ${index}`] })));

        for (const status of statuses) {
            expect(screen.getAllByText(GUIDANCE_STATUS_LABELS[status]).length).toBeGreaterThan(0);
            expect(screen.queryByText(status)).not.toBeInTheDocument();
        }
        // The labels this card used to invent are gone.
        expect(screen.queryByText("Menunggu")).not.toBeInTheDocument();
        expect(screen.queryByText("Diterima")).not.toBeInTheDocument();
        expect(screen.queryByText("Menunggu Ringkasan")).not.toBeInTheDocument();
        expect(screen.getByText("1/8 selesai")).toBeInTheDocument();
    });

    it("shows the session time in WIB", () => {
        renderSection([session()]);
        expect(screen.getByText("14 September 2026 14.00 WIB")).toBeInTheDocument();
    });

    it("opens the session document with the Authorization header, without a link to /uploads", async () => {
        renderSection([session()]);
        fireEvent.click(screen.getByRole("button", { name: /Bab 3 Metodologi/ }));

        // A button, not a link: the server only reads the token from the header.
        expect(screen.queryByRole("link", { name: /bab-3\.pdf/ })).not.toBeInTheDocument();
        expect(hrefs().filter((href) => href.includes("/uploads"))).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /bab-3\.pdf/ }));

        const dialog = await screen.findByRole("dialog");
        expect(dialog).toHaveTextContent("bab-3.pdf");
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toMatch(/\/uploads\/thesis\/t1\/guidance\/g1\/bab-3\.pdf$/);
        expect(String(url)).not.toContain("token=");
        expect(init.headers).toEqual({ Authorization: "Bearer JWT-RAHASIA" });

        expect(await screen.findByTitle("preview")).toHaveAttribute("src", "blob:http://localhost/abc");
        expect(hrefs().filter((href) => href.includes("/uploads"))).toEqual([]);
        expect(document.body.innerHTML).not.toContain("JWT-RAHASIA");
    });

    it("keeps a link the student typed (outside the server) as a plain link", () => {
        renderSection([session({ document: null, documentUrl: "https://docs.google.com/document/d/abc" })]);
        fireEvent.click(screen.getByRole("button", { name: /Bab 3 Metodologi/ }));

        const link = screen.getByRole("link", { name: /Dokumen Eksternal/ });
        expect(link).toHaveAttribute("href", "https://docs.google.com/document/d/abc");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("never links to an upload even when it arrives in the external link field", async () => {
        renderSection([session({ document: null, documentUrl: "/uploads/thesis/t1/guidance/g1/draf.pdf" })]);
        fireEvent.click(screen.getByRole("button", { name: /Bab 3 Metodologi/ }));

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Dokumen Eksternal/ }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/uploads\/thesis\/t1\/guidance\/g1\/draf\.pdf$/);
        expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer JWT-RAHASIA" });
        expect(hrefs()).toEqual([]);
    });

    it("says so when a session has neither notes nor a document, and when there is no session at all", () => {
        const { unmount } = renderSection([session({ studentNotes: undefined, document: null })]);
        fireEvent.click(screen.getByRole("button", { name: /Bab 3 Metodologi/ }));
        expect(screen.getByText("Tidak ada catatan atau dokumen pada sesi ini.")).toBeInTheDocument();
        unmount();

        renderSection([]);
        expect(screen.getByText("Belum Ada Bimbingan")).toBeInTheDocument();
    });
});
