import { CalendarClock } from "lucide-react";

import { formatDateShortId, toTitleCaseName, formatLecturerName } from "@/lib/text";
import { timeRangeText } from "@/lib/thesis-event-schedule";
import type { MonitoringEvent, ThesisEventKind } from "@/services/monitoring.service";
import { MonitoringListCard } from "./MonitoringListCard";
import { THESIS_EVENT_COPY } from "./thesis-event-copy";

interface UpcomingEventsCardProps {
  kind: ThesisEventKind;
  events: MonitoringEvent[] | undefined;
  /** Number of scheduled events ahead; the card lists the nearest ones only. */
  total: number | undefined;
  isLoading: boolean;
}

/** "Jadwal Mendatang": scheduled seminars or defences held today or later, nearest first. */
export function UpcomingEventsCard({ kind, events, total, isLoading }: UpcomingEventsCardProps) {
  const rows = events ?? [];
  const count = total ?? rows.length;
  const copy = THESIS_EVENT_COPY[kind];

  return (
    <MonitoringListCard
      icon={CalendarClock}
      iconClassName="text-blue-500"
      title="Jadwal Mendatang"
      description={`Jadwal ${copy.noun} hari ini dan sesudahnya, dari yang terdekat`}
      count={count}
      isLoading={isLoading}
      emptyDescription={`Belum ada ${copy.noun} yang terjadwal ke depan.`}
    >
      {rows.map((event) => {
        const examiners = event.examiners.map((examiner) => formatLecturerName(examiner.name)).join(", ");
        return (
          <li key={event.id} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:gap-4">
            <div className="shrink-0 sm:w-44">
              <p className="text-sm font-medium">{formatDateShortId(event.date)}</p>
              <p className="text-xs text-muted-foreground">{timeRangeText(event) ?? "Jam belum ditetapkan"}</p>
              <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{event.room || "Ruangan belum ditetapkan"}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium [overflow-wrap:anywhere]">
                {toTitleCaseName(event.student.name)}
                <span className="font-normal text-muted-foreground"> ({event.student.nim || "-"})</span>
              </p>
              <p className="truncate text-xs text-muted-foreground" title={event.title ?? undefined}>{event.title || "-"}</p>
              <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                Penguji: {examiners || "belum ditetapkan"}
              </p>
            </div>
          </li>
        );
      })}
      {count > rows.length && (
        <li className="py-2.5 text-xs text-muted-foreground">
          Menampilkan {rows.length} jadwal terdekat dari {count}. Sisanya ada di tabel di bawah.
        </li>
      )}
    </MonitoringListCard>
  );
}
