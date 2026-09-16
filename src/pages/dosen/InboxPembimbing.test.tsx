import type { ReactNode } from "react";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import InboxPembimbing from "./InboxPembimbing";
import { advisorRequestService } from "@/services/advisorRequest.service";
import type { AdvisorQuotaEntry, AdvisorRequest, DosenInboxPayload, LecturerQuotaSnapshot } from "@/services/advisorRequest.service";

vi.mock("@/services/advisorRequest.service", () => ({
  advisorRequestService: {
    getDosenInbox: vi.fn(),
    getDosenInboxHistory: vi.fn(),
    markUnderReview: vi.fn(),
    respondToRequest: vi.fn(),
  },
}));

vi.mock("@/components/ui/empty-state", () => ({
  default: ({ title, description }: { title?: string; description?: string }) => (
    <div>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/ui/alert-dialog", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    AlertDialog: ({
      open,
      children,
    }: {
      open?: boolean;
      children?: React.ReactNode;
      onOpenChange?: (open: boolean) => void;
    }) => (open ? <div data-testid="reject-alert-dialog">{children}</div> : null),
    AlertDialogContent: Passthrough,
    AlertDialogHeader: Passthrough,
    AlertDialogFooter: Passthrough,
    AlertDialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
    AlertDialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
    AlertDialogCancel: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    AlertDialogAction: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeRequest(overrides: Partial<AdvisorRequest> = {}): AdvisorRequest {
  return {
    id: "req-1",
    studentId: "student-1",
    lecturerId: "lecturer-1",
    topicId: "topic-1",
    status: "pending",
    requestType: "ta_01",
    routeType: "escalated",
    proposedTitle: "Judul Uji Path C",
    backgroundSummary: "Latar belakang singkat",
    problemStatement: "Tujuan singkat",
    proposedSolution: "Solusi singkat",
    researchObject: null,
    researchPermitStatus: null,
    studentJustification:
      "Mahasiswa membutuhkan dosen ini karena topik sangat spesifik dan sudah konsultasi awal.",
    justificationText: null,
    lecturerOverquotaReason: null,
    lecturerApprovalNote: null,
    rejectionReason: null,
    kadepNotes: null,
    createdAt: "2026-07-09T01:00:00.000Z",
    updatedAt: "2026-07-09T01:00:00.000Z",
    withdrawnAt: null,
    withdrawCount: 0,
    reviewedAt: null,
    lecturerRespondedAt: null,
    student: {
      id: "student-1",
      user: {
        id: "user-student-1",
        fullName: "Mahasiswa Uji",
        identityNumber: "2311523001",
        avatarUrl: undefined,
      },
    },
    lecturer: {
      id: "lecturer-1",
      user: {
        id: "user-lecturer-1",
        fullName: "Dosen Uji",
        identityNumber: "198001012000011001",
      },
    },
    topic: {
      id: "topic-1",
      name: "Machine Learning",
    },
    ...overrides,
  };
}

function makeSummary(overrides: Partial<LecturerQuotaSnapshot> = {}): LecturerQuotaSnapshot {
  return {
    lecturerId: "lecturer-1",
    fullName: "Dosen Uji",
    identityNumber: "198001012000011001",
    email: "dosen@example.com",
    avatarUrl: null,
    scienceGroup: { id: "sg-1", name: "KBK Uji" },
    quotaMax: 8,
    quotaSoftLimit: 8,
    currentCount: 8,
    activeCount: 8,
    bookingCount: 0,
    pendingKadepCount: 0,
    normalAvailable: 0,
    overquotaAmount: 0,
    trafficLight: "red",
    isNearLimit: true,
    isFull: true,
    ...overrides,
  };
}

function makeInbox(overrides: Partial<DosenInboxPayload> = {}): DosenInboxPayload {
  return {
    summary: makeSummary(),
    pendingRequests: [makeRequest()],
    activeOfficial: [],
    bookings: [],
    pendingKadep: [],
    ...overrides,
  };
}

function renderInbox(children: ReactNode = <InboxPembimbing />, initialEntry = "/dosen/inbox-pembimbing") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const layoutContext = {
    setBreadcrumbs: vi.fn(),
    setTitle: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Outlet context={layoutContext} />}>
            <Route path="/dosen/inbox-pembimbing" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InboxPembimbing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(advisorRequestService.getDosenInbox).mockResolvedValue({
      success: true,
      data: makeInbox(),
    });
    vi.mocked(advisorRequestService.getDosenInboxHistory).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(advisorRequestService.markUnderReview).mockResolvedValue({
      success: true,
      data: makeRequest({ status: "under_review" }),
    });
    vi.mocked(advisorRequestService.respondToRequest).mockResolvedValue({
      success: true,
      data: makeRequest({ status: "booking_approved" }),
    });
  });

  it("shows Di atas kuota badge and uses Tinjau as primary action without auto under_review", async () => {
    renderInbox();

    await waitFor(() => {
      expect(screen.getByText("Mahasiswa Uji")).toBeInTheDocument();
    });

    expect(screen.getByText("Di atas kuota")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tinjau$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sedang Ditinjau/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Tinjau$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Detail Pengajuan Pembimbing/i)).toBeInTheDocument();
    });
    expect(advisorRequestService.markUnderReview).not.toHaveBeenCalled();
  });

  it("keeps overquota accept CTA disabled until lecturer reason has 10 characters", async () => {
    renderInbox();

    await waitFor(() => {
      expect(screen.getByText("Mahasiswa Uji")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Tinjau$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Terima$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Terima$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Terima di Atas Kuota Normal/i)).toBeInTheDocument();
    });

    const submit = screen.getByRole("button", { name: /Terima & Kirim ke KaDep/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/proyeksi lulus/i), {
      target: { value: "123456789" },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/proyeksi lulus/i), {
      target: { value: "1234567890" },
    });
    expect(submit).toBeEnabled();
  });

  it("opens reject confirmation in AlertDialog", async () => {
    renderInbox();

    await waitFor(() => {
      expect(screen.getByText("Mahasiswa Uji")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Tinjau$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Tolak$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Tolak$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("reject-alert-dialog")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Jelaskan alasan penolakan/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tolak Pengajuan$/i })).toBeDisabled();
  });

  it("drills down overquota sah using acceptedOverNormal entries instead of arithmetic excess", async () => {
    const overquotaEntry: AdvisorQuotaEntry = {
      id: "booking-overquota-1",
      source: "request",
      requestId: "request-overquota-1",
      supervisorId: null,
      bucket: "booking",
      lecturerId: "lecturer-1",
      studentId: "student-overquota-1",
      studentName: "Mahasiswa Overquota",
      studentIdentityNumber: "2211520999",
      studentAvatarUrl: null,
      thesisId: "thesis-overquota-1",
      thesisTitle: "Topik Overquota",
      topicName: "Sistem Informasi",
      roleName: "Pembimbing 1",
      requestStatus: "booking_approved",
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
      acceptedOverNormal: true,
    };
    vi.mocked(advisorRequestService.getDosenInbox).mockResolvedValue({
      success: true,
      data: makeInbox({
        summary: makeSummary({ bookingCount: 1, overquotaAmount: 3, overquotaSahCount: 1 }),
        bookings: [overquotaEntry],
      }),
    });

    renderInbox();

    const metric = await screen.findByRole("button", { name: /Overquota sah.*1/i });
    expect(metric).not.toHaveTextContent("3");
    fireEvent.click(metric);

    expect(await screen.findByText("Mahasiswa Overquota")).toBeInTheDocument();
    expect(screen.getByText(/1 mahasiswa · Mahasiswa yang disetujui/i)).toBeInTheDocument();
  });

  it("renders academic record already present on the inbox payload", async () => {
    vi.mocked(advisorRequestService.getDosenInbox).mockResolvedValue({
      success: true,
      data: makeInbox({
        pendingRequests: [
          makeRequest({
            student: {
              id: "student-1",
              enrollmentYear: 2022,
              sksCompleted: 118,
              currentSemester: 8,
              eligibleMetopen: true,
              takingThesisCourse: false,
              user: {
                id: "user-student-1",
                fullName: "Mahasiswa Uji",
                identityNumber: "2311523001",
                avatarUrl: undefined,
              },
            },
          }),
        ],
      }),
    });

    renderInbox();

    await waitFor(() => {
      expect(screen.getByText(/118 SKS/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Angkatan 2022/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Tinjau$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Rekam jejak akademik/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Eligible Metopel")).toBeInTheDocument();
  });

  it("shows proposal status and period marker on the supervised student list", async () => {
    const bookingEntry: AdvisorQuotaEntry = {
      id: "booking-1",
      source: "request",
      requestId: "request-1",
      supervisorId: null,
      bucket: "booking",
      lecturerId: "lecturer-1",
      studentId: "student-2",
      studentName: "Mahasiswa Bimbingan",
      studentIdentityNumber: "2211520888",
      studentAvatarUrl: null,
      thesisId: "thesis-2",
      thesisTitle: "Sistem Informasi Proposal",
      topicName: "Data Mining",
      roleName: "Pembimbing 1",
      requestStatus: "booking_approved",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      proposalStatus: "submitted",
      proposalVersion: 2,
      hasFinalProposal: true,
      academicYearLabel: "2026/2027 ganjil",
      isCurrentPeriod: true,
    };
    vi.mocked(advisorRequestService.getDosenInbox).mockResolvedValue({
      success: true,
      data: makeInbox({
        academicYearLabel: "2026/2027 ganjil",
        summary: makeSummary({ bookingCount: 1, currentCount: 1, normalAvailable: 7, isFull: false }),
        bookings: [bookingEntry],
      }),
    });

    renderInbox();
    fireEvent.click(await screen.findByRole("button", { name: /Kuota Aktif/i }));

    expect(await screen.findByText("Mahasiswa Bimbingan")).toBeInTheDocument();
    expect(screen.getByText("Proposal final")).toBeInTheDocument();
    expect(screen.getByText(/Final v2/)).toBeInTheDocument();
    expect(screen.getByText("2026/2027 ganjil")).toBeInTheDocument();
  });
});
