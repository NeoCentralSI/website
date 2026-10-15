import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Every card of the Monitoring pages (all three tabs and the detail): the subtitle and the
 * first list item sit close but not touching, the same in every card (Paket E4, 8).
 */
export const MONITORING_CARD_CLASS = "gap-3";

interface MonitoringListCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  /** Number of rows, shown beside the title once loaded. */
  count?: number;
  /** Button(s) at the right of the header. */
  action?: ReactNode;
  isLoading: boolean;
  emptyDescription: string;
  /** `<MonitoringListRow>` elements. */
  children?: ReactNode;
}

/**
 * Shell shared by the list cards of the monitoring dashboard, so that they line up: an icon
 * and a one-line title, the description, the action at the right, and a list that scrolls
 * vertically at the same maximum height in every card.
 */
export function MonitoringListCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  count,
  action,
  isLoading,
  emptyDescription,
  children,
}: MonitoringListCardProps) {
  const isEmpty = !isLoading && count === 0;

  return (
    <Card className={cn("flex h-full min-w-0 flex-col", MONITORING_CARD_CLASS)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} />
              <span className="whitespace-nowrap">{title}</span>
              {!isLoading && typeof count === "number" && <Badge variant="secondary">{count}</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="min-w-0 flex-1">
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : isEmpty ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={emptyDescription} className="py-6" />
        ) : (
          <ul className="max-h-96 divide-y overflow-x-hidden overflow-y-auto pr-1">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

interface MonitoringListRowProps {
  /** Full name; it wraps instead of being cut. */
  name: string;
  /** NIM or NIP. */
  identityNumber?: string | null;
  /** One truncated line of secondary text under the name. */
  secondary?: ReactNode;
  /** Badges at the right, stacked. */
  trailing?: ReactNode;
}

export function MonitoringListRow({ name, identityNumber, secondary, trailing }: MonitoringListRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium [overflow-wrap:anywhere]">{name}</p>
        <p className="text-xs text-muted-foreground">{identityNumber || "-"}</p>
        {secondary && <div className="truncate text-xs text-muted-foreground">{secondary}</div>}
      </div>
      {trailing && <div className="flex shrink-0 flex-col items-end gap-1">{trailing}</div>}
    </li>
  );
}

/** "222 hari tanpa aktivitas"; nothing when the number of days is unknown. */
export function InactiveDaysText({ days }: { days: number | null | undefined }) {
  if (days == null) return null;
  return <span className="whitespace-nowrap text-xs text-muted-foreground">{days} hari tanpa aktivitas</span>;
}
