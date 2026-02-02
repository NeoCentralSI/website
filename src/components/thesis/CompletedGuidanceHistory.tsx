import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  FileDown,
} from "lucide-react";
import { getCompletedGuidanceHistory, type CompletedGuidance } from "@/services/studentGuidance.service";
import { toTitleCaseName } from "@/lib/text";
import GuidanceExportDialog from "./GuidanceExportDialog";
import BatchExportDialog from "./BatchExportDialog";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { RefreshButton } from "@/components/ui/refresh-button";

export default function CompletedGuidanceHistory() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportGuidanceId, setExportGuidanceId] = useState<string | null>(null);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["completed-history"],
    queryFn: getCompletedGuidanceHistory,
  });

  const guidances = useMemo(() => data?.guidances || [], [data]);

  // Client-side filtering
  const filteredGuidances = useMemo(() => {
    if (!searchQuery.trim()) return guidances;
    const query = searchQuery.toLowerCase();
    return guidances.filter((g) => 
      (g.supervisorName?.toLowerCase().includes(query)) ||
      (g.sessionSummary?.toLowerCase().includes(query)) ||
      (g.actionItems?.toLowerCase().includes(query)) ||
      (g.milestoneName?.toLowerCase().includes(query)) ||
      (g.completedAtFormatted?.toLowerCase().includes(query))
    );
  }, [guidances, searchQuery]);

  // Pagination
  const paginatedGuidances = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredGuidances.slice(start, start + pageSize);
  }, [filteredGuidances, page, pageSize]);

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
    if (selectedIds.size === paginatedGuidances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedGuidances.map((g) => g.id)));
    }
  };

  const isAllSelected = paginatedGuidances.length > 0 && selectedIds.size === paginatedGuidances.length;
  const isSomeSelected = selectedIds.size > 0;

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    setShowBatchExport(true);
  };

  const columns: Column<CompletedGuidance>[] = useMemo(() => [
    {
      key: "select",
      header: (
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={toggleSelectAll}
          aria-label="Pilih semua"
        />
      ),
      width: 40,
      render: (row) => (
        <Checkbox
          checked={selectedIds.has(row.id)}
          onCheckedChange={() => toggleSelect(row.id)}
          aria-label={`Pilih bimbingan`}
        />
      ),
    },
    {
      key: "completedAtFormatted",
      header: "Tanggal",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.completedAtFormatted || row.approvedDateFormatted || "-"}
        </span>
      ),
    },
    {
      key: "supervisorName",
      header: "Pembimbing",
      render: (row) => (
        <span className="text-sm">
          {toTitleCaseName(row.supervisorName || "-")}
        </span>
      ),
    },
    {
      key: "milestoneName",
      header: "Milestone",
      render: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-40 block">
          {row.milestoneName || "-"}
        </span>
      ),
    },
    {
      key: "sessionSummary",
      header: "Ringkasan",
      render: (row) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-80">
          {row.sessionSummary || "-"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "",
      width: 50,
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExportGuidanceId(row.id)}
          className="h-8 w-8"
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ], [selectedIds, isAllSelected]);

  return (
    <>
      <CustomTable
        columns={columns}
        data={paginatedGuidances}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredGuidances.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setPage(1);
        }}
        emptyText={searchQuery ? "Tidak ditemukan" : "Belum ada riwayat bimbingan"}
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton 
              onClick={() => refetch()} 
              isRefreshing={isFetching && !isLoading} 
            />
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
        }
      />

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
          if (!open) setSelectedIds(new Set());
        }}
        guidanceIds={Array.from(selectedIds)}
      />
    </>
  );
}
