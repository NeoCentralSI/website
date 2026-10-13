import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Award, ExternalLink, GraduationCap } from "lucide-react";

import { ThesisEventStatusBadge, type ThesisEventStatus } from "@/components/shared/ThesisEventStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatDateTimeWib, formatLecturerName } from "@/lib/text";
import { THESIS_EVENT_DETAIL_PATH, scheduleText } from "@/lib/thesis-event-schedule";
import type { ThesisDetailDefence, ThesisDetailEvent } from "@/services/monitoring.service";

type EventKind = "seminar" | "defence";

const EVENT_COPY: Record<EventKind, { title: string; icon: typeof Award; detailPath: string; emptyTitle: string; emptyDescription: string }> = {
  seminar: {
    title: "Seminar Hasil",
    icon: GraduationCap,
    detailPath: THESIS_EVENT_DETAIL_PATH.seminar,
    emptyTitle: "Belum Ada Seminar",
    emptyDescription: "Mahasiswa belum mendaftar seminar hasil.",
  },
  defence: {
    title: "Sidang",
    icon: Award,
    detailPath: THESIS_EVENT_DETAIL_PATH.defence,
    emptyTitle: "Belum Ada Sidang",
    emptyDescription: "Mahasiswa belum mendaftar sidang.",
  },
};

const scoreFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function EventBlock({ kind, event, canOpenDetail }: { kind: EventKind; event: ThesisDetailEvent; canOpenDetail: boolean }) {
  const grade = kind === "defence" ? (event as ThesisDetailDefence).grade : null;
  return (
    <div className="space-y-3 rounded-lg bg-muted/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ThesisEventStatusBadge
          status={event.status as ThesisEventStatus}
          scheduledDate={event.date}
          startTime={event.startTime}
        />
        {canOpenDetail && (
          <Link
            to={`${EVENT_COPY[kind].detailPath}/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Lihat detail
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <Fact label="Jadwal">{scheduleText(event)}</Fact>
        <Fact label="Ruangan">{event.room || "-"}</Fact>
        <div className="sm:col-span-2">
          <Fact label="Penguji">
            {event.examiners.length === 0 ? "Belum ditetapkan" : (
              <ul className="space-y-0.5">
                {event.examiners.map((examiner, index) => (
                  <li key={`${examiner.order}-${examiner.name}`}>
                    <span className="font-normal text-muted-foreground">Penguji {examiner.order ?? index + 1}: </span>
                    {formatLecturerName(examiner.name) || "-"}
                  </li>
                ))}
              </ul>
            )}
          </Fact>
        </div>
        {event.finalScore != null && (
          <Fact label="Nilai akhir">
            {scoreFormat.format(event.finalScore)}
            {grade ? ` (${grade})` : ""}
          </Fact>
        )}
        {event.status === "passed_with_revision" && (
          <Fact label="Revisi">
            {event.revisions.completed} dari {event.revisions.total} selesai
            <span className="block text-xs font-normal text-muted-foreground">
              {event.revisionFinalizedAt ? `Difinalkan ${formatDateTimeWib(event.revisionFinalizedAt)}` : "Belum difinalkan"}
            </span>
          </Fact>
        )}
      </dl>
    </div>
  );
}

interface ThesisEventCardProps {
  kind: EventKind;
  events: ThesisDetailEvent[];
  /** The viewer's role may open the seminar/defence detail page. */
  canOpenDetail: boolean;
}

/**
 * Seminar Hasil / Sidang of one thesis on the monitoring detail (read-only). The status
 * uses the badge and labels of the seminar and defence modules.
 */
export function ThesisEventCard({ kind, events, canOpenDetail }: ThesisEventCardProps) {
  const copy = EVENT_COPY[kind];
  const Icon = copy.icon;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState size="sm" title={copy.emptyTitle} description={copy.emptyDescription} className="py-6" />
        ) : (
          <div className="space-y-3">
            {events.map((event) => <EventBlock key={event.id} kind={kind} event={event} canOpenDetail={canOpenDetail} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
