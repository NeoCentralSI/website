import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  User,
  Target,
  Download,
  CheckCircle2,
  History,
  FileDown,
  CheckCheck,
} from "lucide-react";
import { getCompletedGuidanceHistory, type CompletedGuidance } from "@/services/studentGuidance.service";
import { toTitleCaseName } from "@/lib/text";
import GuidanceExportDialog from "./GuidanceExportDialog";
import BatchExportDialog from "./BatchExportDialog";

export default function CompletedGuidanceHistory() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportGuidanceId, setExportGuidanceId] = useState<string | null>(null);
  const [showBatchExport, setShowBatchExport] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["completed-history"],
    queryFn: getCompletedGuidanceHistory,
  });

  const guidances = useMemo(() => data?.guidances || [], [data]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === guidances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(guidances.map((g) => g.id)));
    }
  };

  const isAllSelected = guidances.length > 0 && selectedIds.size === guidances.length;
  const isSomeSelected = selectedIds.size > 0;

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    setShowBatchExport(true);
  };

  if (isLoading) {
    return (
      <Loading text="Memuat riwayat bimbingan..." />
    );
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center text-muted-foreground">
          Gagal memuat riwayat bimbingan
        </CardContent>
      </Card>
    );
  }

  if (guidances.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <h3 className="font-medium text-lg mb-1">Belum Ada Riwayat</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Bimbingan yang sudah selesai akan muncul di sini sebagai dokumentasi
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Pilih semua"
            />
            <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
              {isAllSelected ? "Batal pilih" : "Pilih semua"}
            </label>
          </div>
          <Badge variant="secondary" className="text-xs">
            {guidances.length} sesi
          </Badge>
        </div>

        {isSomeSelected && (
          <Button
            size="sm"
            onClick={handleBatchExport}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Download PDF ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Guidance List - Article Style */}
      <div className="space-y-2">
        {guidances.map((guidance: CompletedGuidance, index: number) => (
          <article
            key={guidance.id}
            className={`
              group relative rounded-lg border bg-card p-4 transition-all
              hover:shadow-sm hover:border-primary/20
              ${selectedIds.has(guidance.id) ? "border-primary/40 bg-primary/5" : ""}
            `}
          >
            <div className="flex gap-3">
              {/* Checkbox */}
              <div className="shrink-0 pt-0.5">
                <Checkbox
                  checked={selectedIds.has(guidance.id)}
                  onCheckedChange={() => toggleSelect(guidance.id)}
                  aria-label={`Pilih bimbingan ${index + 1}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Header Line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{guidance.approvedDateFormatted || "-"}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{toTitleCaseName(guidance.supervisorName || "-")}</span>
                  </div>
                  {guidance.milestoneName && (
                    <>
                      <span className="text-muted-foreground hidden sm:inline">•</span>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{guidance.milestoneName}</span>
                      </div>
                    </>
                  )}
                  <Badge variant="outline" className="text-xs ml-auto sm:ml-0">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Selesai
                  </Badge>
                </div>

                {/* Summary - Always visible, truncated */}
                {guidance.sessionSummary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">Ringkasan:</span>{" "}
                    {guidance.sessionSummary}
                  </p>
                )}

                {/* Action Items - If available */}
                {guidance.actionItems && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    <span className="font-medium text-foreground">Arahan:</span>{" "}
                    {guidance.actionItems}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExportGuidanceId(guidance.id)}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Selected Count Footer */}
      {isSomeSelected && (
        <div className="sticky bottom-4 mt-4">
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-primary text-primary-foreground rounded-lg shadow-lg">
            <CheckCheck className="h-4 w-4" />
            <span className="text-sm font-medium">{selectedIds.size} sesi dipilih</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBatchExport}
              className="ml-2"
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Single export dialog */}
      <GuidanceExportDialog
        open={!!exportGuidanceId}
        onOpenChange={(open: boolean) => !open && setExportGuidanceId(null)}
        guidanceId={exportGuidanceId}
      />

      {/* Batch export dialog */}
      <BatchExportDialog
        open={showBatchExport}
        onOpenChange={(open: boolean) => {
          setShowBatchExport(open);
          if (!open) setSelectedIds(new Set()); // Clear selection after export
        }}
        guidanceIds={Array.from(selectedIds)}
      />
    </>
  );
}
