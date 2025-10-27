import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress as ProgressBar } from "@/components/ui/progress";
import type { ProgressDetailItem } from "@/services/studentGuidance.service";

type StatusFilter = "all" | "pending" | "completed" | "validated";

export interface ProgressChecklistProps {
  items: ProgressDetailItem[];
  loading?: boolean;
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onCompleteSelected: () => void;
  onCompleteOne?: (id: string) => void;
}

function statusOf(item: ProgressDetailItem): StatusFilter {
  if (item.validatedBySupervisor) return "validated";
  if (item.completedAt) return "completed";
  return "pending";
}

export default function ProgressChecklist({ items, loading, selected, onToggle, onCompleteSelected, onCompleteOne }: ProgressChecklistProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => !!i.completedAt).length;
    const validated = items.filter((i) => !!i.validatedBySupervisor).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, validated, pct };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((i) => {
      if (status !== "all" && statusOf(i) !== status) return false;
      if (!needle) return true;
      return i.name?.toLowerCase().includes(needle) || i.description?.toLowerCase().includes(needle);
    });
  }, [items, query, status]);

  const anySelected = Object.keys(selected).some((k) => selected[k]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <ProgressBar value={stats.pct} className="w-48" />
              <div className="text-sm text-muted-foreground">
                {stats.completed}/{stats.total} selesai • {stats.validated} tervalidasi
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Input
                placeholder="Cari komponen..."
                value={query}
                onChange={(e) => (setQuery(e.target.value))}
              />
            </div>
            <select
              className="border rounded px-2 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">Semua</option>
              <option value="pending">Belum</option>
              <option value="completed">Selesai</option>
              <option value="validated">Tervalidasi</option>
            </select>
            <Button size="sm" onClick={onCompleteSelected} disabled={!anySelected}>Tandai Selesai</Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-accent animate-pulse rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Tidak ada komponen</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const s = statusOf(c);
              const disabled = !!c.completedAt || !!c.validatedBySupervisor;
              return (
                <li key={c.componentId} className="flex items-center gap-3 p-3">
                  <Checkbox checked={!!selected[c.componentId]} onCheckedChange={() => onToggle(c.componentId)} disabled={disabled} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{c.name}</div>
                      <span className={`px-2 py-0.5 text-[11px] rounded-full ${s === 'validated' ? 'bg-green-100 text-green-700' : s === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s === 'validated' ? 'Tervalidasi' : s === 'completed' ? 'Selesai' : 'Belum'}
                      </span>
                    </div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.completedAt && (
                      <div className="text-xs text-muted-foreground">{new Date(c.completedAt as string).toLocaleString()}</div>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => onCompleteOne?.(c.componentId)} disabled={disabled}>Selesai</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
