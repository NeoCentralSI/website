import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDateShortId } from "@/lib/text";
import { THESIS_PHASE_FILTER_LABELS, type ThesisPhase } from "@/lib/thesisLabels";
import type { Milestone } from "@/types/milestone.types";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";

type PhaseMilestone = Pick<Milestone, "id" | "title"> & { status: string; completedAt?: string | null };

interface OtherPhaseMilestonesProps {
  phase: ThesisPhase;
  milestones: PhaseMilestone[];
  /** From the backend: why this phase is read-only (e.g. "Fase proposal sudah selesai"). */
  reason?: string | null;
  defaultOpen?: boolean;
}

/**
 * Milestone fase lain (10.7, K27): di bawah daftar fase berjalan, bisa dibuka-tutup, baca-saja.
 * Milestone yang belum selesai ditampilkan "Tidak dilanjutkan" tanpa nilai status baru.
 */
export function OtherPhaseMilestones({ phase, milestones, reason, defaultOpen = false }: OtherPhaseMilestonesProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (milestones.length === 0) return null;
  const completed = milestones.filter((m) => m.status === "completed").length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex h-auto w-full items-center justify-between gap-3 px-4 py-3 text-left">
          <span>
            <span className="block font-medium">Milestone Fase {THESIS_PHASE_FILTER_LABELS[phase]}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {completed} dari {milestones.length} selesai · baca saja{reason ? ` · ${reason}` : ""}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="divide-y border-t">
          {milestones.map((milestone, index) => (
            <li key={milestone.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1 break-words">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {milestone.title}
              </span>
              <span className="flex items-center gap-2">
                {milestone.status === "completed" ? (
                  <>
                    {milestone.completedAt && <span className="text-xs text-muted-foreground">{formatDateShortId(milestone.completedAt)}</span>}
                    <MilestoneStatusBadge status="completed" />
                  </>
                ) : (
                  <Badge variant="outline">Tidak dilanjutkan</Badge>
                )}
              </span>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
