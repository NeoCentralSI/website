import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { toTitleCaseName } from "@/lib/text";
import type { MonitoringEventAttention, ThesisEventKind } from "@/services/monitoring.service";
import { MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";
import { ATTENTION_SINCE_TEXT, THESIS_EVENT_COPY } from "./thesis-event-copy";

interface EventAttentionCardProps {
  kind: ThesisEventKind;
  events: MonitoringEventAttention[] | undefined;
  isLoading: boolean;
}

/**
 * "Perlu Perhatian": seminars or defences that have waited too long at one step. The reason
 * and the number of days come from the server; the longest wait is first.
 */
export function EventAttentionCard({ kind, events, isLoading }: EventAttentionCardProps) {
  const rows = events ?? [];
  const copy = THESIS_EVENT_COPY[kind];

  return (
    <MonitoringListCard
      icon={AlertTriangle}
      iconClassName="text-orange-500"
      title="Perlu Perhatian"
      description={`Proses ${copy.noun} yang tertahan lebih lama dari batasnya`}
      count={rows.length}
      isLoading={isLoading}
      emptyDescription={`Tidak ada ${copy.noun} yang perlu perhatian.`}
    >
      {rows.map((event) => (
        <MonitoringListRow
          key={event.id}
          name={toTitleCaseName(event.student.name)}
          identityNumber={event.student.nim}
          secondary={event.title ? <span title={event.title}>{event.title}</span> : undefined}
          trailing={
            <>
              <Badge className="whitespace-nowrap bg-orange-100 text-orange-800 hover:bg-orange-100">
                {event.attention.reasonLabel}
              </Badge>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {event.attention.days} hari {ATTENTION_SINCE_TEXT[event.attention.reason] ?? ""}
              </span>
            </>
          }
        />
      ))}
    </MonitoringListCard>
  );
}
