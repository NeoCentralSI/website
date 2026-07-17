import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  muted: "border-border bg-background hover:border-primary/40 hover:bg-muted/30",
  blue: "border-blue-200/80 bg-blue-50/30 hover:border-blue-300 hover:bg-blue-50/60",
  violet: "border-violet-200/80 bg-violet-50/30 hover:border-violet-300 hover:bg-violet-50/60",
  amber: "border-amber-200/80 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/60",
  emerald: "border-emerald-200/80 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50/60",
  rose: "border-rose-200/80 bg-rose-50/30 hover:border-rose-300 hover:bg-rose-50/60",
} as const;

interface MetricActionProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES;
  active?: boolean;
  onClick: () => void;
  className?: string;
  actionLabel?: string;
}

export function MetricAction({
  label,
  value,
  hint,
  icon,
  tone = "muted",
  active = false,
  onClick,
  className,
  actionLabel = "Lihat data",
}: MetricActionProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "group min-h-24 w-full rounded-md border px-3 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        TONE_CLASSES[tone],
        active && "border-primary bg-primary/5 ring-1 ring-primary/30",
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {icon}
            <span>{label}</span>
          </span>
          <span className="mt-1 block text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </span>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
      <span className="mt-2 block text-[11px] font-medium text-primary">{actionLabel}</span>
    </button>
  );
}
