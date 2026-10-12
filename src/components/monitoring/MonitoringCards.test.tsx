import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendBatchWarnings, type AtRiskStudent, type ThesisDetailDefence, type ThesisDetailSeminar } from "@/services/monitoring.service";
import { ReadyForSeminarCard } from "./ReadyForSeminarCard";
import { SlowStudentsCard } from "./SlowStudentsCard";
import { SupervisorLoadCard } from "./SupervisorLoadCard";
import { ThesisEventCard } from "./ThesisEventCard";

vi.mock("lottie-react", () => ({ default: () => null }));
vi.mock("@/hooks/shared/useRole", () => ({ useRole: () => ({ isKadep: () => true }) }));
vi.mock("@/services/monitoring.service", () => ({ sendBatchWarnings: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

const seminar = (overrides: Partial<ThesisDetailSeminar> = {}): ThesisDetailSeminar => ({
  id: "sem-1",
  status: "passed_with_revision",
  date: "2026-10-14T00:00:00.000Z",
  startTime: "1970-01-01T09:00:00.000Z",
  endTime: "1970-01-01T11:30:00.000Z",
  room: "Ruang Seminar 1",
  examiners: [{ order: 1, name: "HUSNIL KAMIL" }, { order: 2, name: "RICKY AKBAR" }],
  finalScore: 81.5,
  resultFinalizedAt: "2026-10-14T05:00:00.000Z",
  revisionFinalizedAt: null,
  revisions: { total: 3, completed: 2 },
  examinerCount: 2,
  scoredCount: 2,
  averageScore: 82,
  ...overrides,
});

const defence = (overrides: Partial<ThesisDetailDefence> = {}): ThesisDetailDefence => ({
  ...seminar({ id: "def-1", status: "passed", finalScore: 84, revisions: { total: 0, completed: 0 } }),
  grade: "A",
  examinerAverageScore: 83,
  supervisorScore: 85,
  ...overrides,
});

describe("ThesisEventCard", () => {
  it("shows a seminar with the label of the seminar module, schedule, room, examiners, score and revision progress", () => {
    wrap(<ThesisEventCard kind="seminar" events={[seminar()]} canOpenDetail />);

    expect(screen.getByText("Seminar Hasil")).toBeInTheDocument();
    expect(screen.getByText("Lulus dengan Revisi")).toBeInTheDocument();
    expect(screen.queryByText("passed_with_revision")).not.toBeInTheDocument();
    expect(screen.getByText("14 Oktober 2026, 09.00 – 11.30 WIB")).toBeInTheDocument();
    expect(screen.getByText("Ruang Seminar 1")).toBeInTheDocument();
    expect(screen.getByText("Husnil Kamil")).toBeInTheDocument();
    expect(screen.getByText("Ricky Akbar")).toBeInTheDocument();
    expect(screen.getByText("81,5")).toBeInTheDocument();
    expect(screen.getByText(/2 dari 3 selesai/)).toBeInTheDocument();
    expect(screen.getByText("Belum difinalkan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat detail/ })).toHaveAttribute("href", "/tugas-akhir/seminar-hasil/sem-1");
  });

  it("shows when the revisions were finalised", () => {
    wrap(<ThesisEventCard kind="seminar" events={[seminar({ revisions: { total: 3, completed: 3 }, revisionFinalizedAt: "2026-10-20T03:00:00.000Z" })]} canOpenDetail />);
    expect(screen.getByText(/3 dari 3 selesai/)).toBeInTheDocument();
    expect(screen.getByText("Difinalkan 20 Oktober 2026 10.00 WIB")).toBeInTheDocument();
  });

  it("shows a defence with its grade, without a revision line when it passed without revision", () => {
    wrap(<ThesisEventCard kind="defence" events={[defence()]} canOpenDetail />);

    expect(screen.getByText("Sidang")).toBeInTheDocument();
    expect(screen.getByText("Lulus")).toBeInTheDocument();
    expect(screen.queryByText("passed")).not.toBeInTheDocument();
    expect(screen.getByText("84 (A)")).toBeInTheDocument();
    expect(screen.queryByText("Revisi")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat detail/ })).toHaveAttribute("href", "/tugas-akhir/sidang/def-1");
  });

  it("labels a registration that has no schedule, room, examiner or score yet", () => {
    wrap(
      <ThesisEventCard
        kind="seminar"
        canOpenDetail={false}
        events={[seminar({ status: "registered", date: null, startTime: null, endTime: null, room: null, examiners: [], finalScore: null })]}
      />,
    );
    expect(screen.getByText("Menunggu Verifikasi")).toBeInTheDocument();
    expect(screen.getByText("Belum dijadwalkan")).toBeInTheDocument();
    expect(screen.getByText("Belum ditetapkan")).toBeInTheDocument();
    expect(screen.queryByText("Nilai akhir")).not.toBeInTheDocument();
    // No access to the detail page: no link.
    expect(screen.queryByRole("link", { name: /Lihat detail/ })).not.toBeInTheDocument();
  });

  it("uses the same empty state for both cards", () => {
    wrap(
      <>
        <ThesisEventCard kind="seminar" events={[]} canOpenDetail />
        <ThesisEventCard kind="defence" events={[]} canOpenDetail />
      </>,
    );
    expect(screen.getByText("Belum Ada Seminar")).toBeInTheDocument();
    expect(screen.getByText("Belum Ada Sidang")).toBeInTheDocument();
    expect(screen.getByText("Mahasiswa belum mendaftar seminar hasil.")).toBeInTheDocument();
    expect(screen.getByText("Mahasiswa belum mendaftar sidang.")).toBeInTheDocument();
  });
});

const atRisk = (overrides: Partial<AtRiskStudent> = {}): AtRiskStudent => ({
  thesisId: "t1",
  title: "Judul TA",
  student: { name: "MUHAMMAD ILHAM NOFALDI PRATAMA", nim: "2211522028", email: "ilham.nofaldi@student.example.test" },
  status: "research",
  lastActivity: "2026-03-01T00:00:00.000Z",
  daysSinceActivity: 222,
  supervisors: [],
  ...overrides,
});

describe("monitoring list cards", () => {
  it("lists slow and at-risk students with the full name, NIM, the activity badge and days without activity", () => {
    wrap(
      <SlowStudentsCard
        isLoading={false}
        atRiskStudents={[atRisk()]}
        slowStudents={[atRisk({ thesisId: "t2", student: { name: "NABIL RIZKI", nim: "2211523030", email: "nabil@example.test" }, daysSinceActivity: 75 })]}
      />,
    );

    expect(screen.getByText("Progres Lambat & Berisiko")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    // Berisiko first; the name is whole, the level is a label, never "AT RISK".
    expect(within(rows[0]).getByText("Muhammad Ilham Nofaldi Pratama")).toBeInTheDocument();
    expect(within(rows[0]).getByText("2211522028")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Berisiko")).toBeInTheDocument();
    expect(within(rows[0]).getByText("222 hari tanpa aktivitas")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Lambat")).toBeInTheDocument();
    expect(within(rows[1]).getByText("75 hari tanpa aktivitas")).toBeInTheDocument();
    expect(screen.queryByText(/at risk/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hari lalu/)).not.toBeInTheDocument();

    // No email on the card: name, NIM, activity badge and days only.
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getByRole("button", { name: /Peringatkan/ })).toBeInTheDocument();
  });

  describe("mass warning", () => {
    const renderCard = () =>
      wrap(
        <SlowStudentsCard
          isLoading={false}
          atRiskStudents={[atRisk(), atRisk({ thesisId: "t3", student: { name: "FATHUR RAHMAN", nim: "2011522001", email: "" } })]}
          slowStudents={[atRisk({ thesisId: "t2", student: { name: "NABIL RIZKI", nim: "2211523030", email: "" }, daysSinceActivity: 75 })]}
        />,
      );

    beforeEach(() => {
      vi.mocked(sendBatchWarnings).mockReset().mockResolvedValue({ success: true, message: "ok" });
    });

    it("asks for confirmation with the number of recipients before anything is sent", async () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /Peringatkan/ }));

      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Kirim Peringatan Massal")).toBeInTheDocument();
      expect(within(dialog).getByText("3 mahasiswa")).toBeInTheDocument();
      expect(dialog).toHaveTextContent("(2 Berisiko, 1 Lambat)");
      expect(within(dialog).getByRole("button", { name: "Kirim ke 3 Mahasiswa" })).toBeInTheDocument();
      expect(sendBatchWarnings).not.toHaveBeenCalled();
    });

    it("sends nothing when the confirmation is cancelled", async () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /Peringatkan/ }));
      fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Batal" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(sendBatchWarnings).not.toHaveBeenCalled();
    });

    it("sends one batch to every listed thesis after confirming, then closes", async () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /Peringatkan/ }));
      fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Kirim ke 3 Mahasiswa" }));

      await waitFor(() => expect(sendBatchWarnings).toHaveBeenCalledTimes(1));
      // Berisiko first (same order as the list), one batch.
      expect(sendBatchWarnings).toHaveBeenCalledWith(["t1", "t3", "t2"], "slow");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("stays open while the batch is being sent, so it cannot be sent twice", async () => {
      let finish: (value: { success: boolean; message: string }) => void = () => {};
      vi.mocked(sendBatchWarnings).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /Peringatkan/ }));
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "Kirim ke 3 Mahasiswa" }));

      const sendingButton = await within(dialog).findByRole("button", { name: "Mengirim..." });
      expect(sendingButton).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Batal" })).toBeDisabled();
      fireEvent.click(sendingButton);
      expect(sendBatchWarnings).toHaveBeenCalledTimes(1);

      finish({ success: true, message: "ok" });
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });
  });

  it("shows every lecturer of the load list and every student ready for seminar", () => {
    wrap(
      <>
        <SupervisorLoadCard
          isLoading={false}
          loads={Array.from({ length: 10 }, (_, i) => ({
            lecturerId: `l${i}`, lecturerName: `DOSEN NOMOR ${i}`, lecturerNip: `19800101200${i}`, lecturerEmail: null, studentCount: 10 - i, students: [],
          }))}
        />
        <ReadyForSeminarCard
          isLoading={false}
          students={Array.from({ length: 5 }, (_, i) => ({
            thesisId: `t${i}`, title: `Judul ${i}`, student: { name: `MAHASISWA KE ${i}`, nim: `221152200${i}`, email: "" }, supervisors: [], approvedAt: "2026-10-14T07:00:00.000Z",
          }))}
        />
      </>,
    );

    expect(screen.getByText("Beban Bimbingan")).toBeInTheDocument();
    expect(screen.getByText("Dosen Nomor 9")).toBeInTheDocument();
    expect(screen.getByText("10 mahasiswa")).toBeInTheDocument();
    expect(screen.getByText("Siap Seminar")).toBeInTheDocument();
    expect(screen.getByText("Mahasiswa Ke 4")).toBeInTheDocument();
    expect(screen.getAllByText("14 Oktober 2026 14.00 WIB")).toHaveLength(5);
    expect(screen.queryByText("Lihat Semua")).not.toBeInTheDocument();
  });

  it("uses the same empty state in every card", () => {
    wrap(
      <>
        <SlowStudentsCard isLoading={false} atRiskStudents={[]} slowStudents={[]} />
        <SupervisorLoadCard isLoading={false} loads={[]} />
        <ReadyForSeminarCard isLoading={false} students={[]} />
      </>,
    );
    expect(screen.getAllByText("Tidak Ada Data")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Peringatkan/ })).not.toBeInTheDocument();
  });
});
