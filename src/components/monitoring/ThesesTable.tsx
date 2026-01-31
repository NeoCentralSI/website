import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CustomTable } from "@/components/layout/CustomTable";
import type { Column } from "@/components/layout/CustomTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, RefreshCw, X, Eye } from "lucide-react";
import { useThesesList, useFilterOptions } from "@/hooks/monitoring";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import type { ThesisListItem } from "@/services/monitoring.service";

// Status badge color mapping
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Bimbingan": "default",
  "Acc Seminar": "secondary",
  "Selesai": "secondary",
  "Gagal": "destructive",
};

function getStatusBadge(status: string) {
  const variant = statusVariants[status] || "outline";
  
  if (status === "Acc Seminar") {
    return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
  }
  if (status === "Selesai") {
    return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
  }
  
  return <Badge variant={variant}>{status}</Badge>;
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 50) return "bg-amber-500";
  if (percent >= 25) return "bg-orange-500";
  return "bg-red-500";
}

interface ThesesTableProps {
  isSyncing?: boolean;
  academicYear?: string;
}

export function ThesesTable({ isSyncing = false, academicYear }: ThesesTableProps) {
  const navigate = useNavigate();
  // Filter state for dropdowns (backend filtering)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [lecturerFilter, setLecturerFilter] = useState<string | undefined>(undefined);
  
  // Frontend pagination & search state
  const [frontendSearch, setFrontendSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch ALL data with pageSize 1000 to disable backend pagination
  // Filters (status, lecturer, academicYear) are still applied on backend
  const apiFilters = useMemo(() => ({
    status: statusFilter,
    lecturerId: lecturerFilter,
    academicYear,
    page: 1,
    pageSize: 1000, // Fetch all data for frontend pagination & search
  }), [statusFilter, lecturerFilter, academicYear]);

  const { data, isLoading, refetch, isFetching } = useThesesList(apiFilters);
  const isLoadingAny = isLoading || isFetching || isSyncing;
  const { data: filterOptions } = useFilterOptions();

  // Frontend search filter applied to ALL data
  const searchFilteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!frontendSearch.trim()) return data.data;
    
    const searchLower = frontendSearch.toLowerCase();
    return data.data.filter((thesis) => 
      thesis.student.name.toLowerCase().includes(searchLower) ||
      thesis.student.nim.toLowerCase().includes(searchLower) ||
      thesis.title?.toLowerCase().includes(searchLower) ||
      thesis.supervisors.pembimbing1?.toLowerCase().includes(searchLower) ||
      thesis.supervisors.pembimbing2?.toLowerCase().includes(searchLower)
    );
  }, [data?.data, frontendSearch]);

  // Frontend pagination - slice the search-filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return searchFilteredData.slice(startIndex, startIndex + pageSize);
  }, [searchFilteredData, page, pageSize]);

  const handleFilterChange = useCallback((key: 'status' | 'lecturerId', value: string | undefined) => {
    if (key === 'status') {
      setStatusFilter(value === "all" ? undefined : value);
    } else {
      setLecturerFilter(value === "all" ? undefined : value);
    }
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFrontendSearch(value);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter(undefined);
    setLecturerFilter(undefined);
    setFrontendSearch("");
    setPage(1);
  }, []);

  const hasActiveFilters = statusFilter || lecturerFilter || frontendSearch;

  const columns: Column<ThesisListItem>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      render: (thesis) => (
        <div className="space-y-0.5">
          <p className="font-medium">{toTitleCaseName(thesis.student.name)}</p>
          <p className="text-sm text-muted-foreground">{thesis.student.nim}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Judul",
      render: (thesis) => (
        <p className="max-w-[250px] truncate" title={thesis.title}>
          {thesis.title}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (thesis) => getStatusBadge(thesis.status),
    },
    {
      key: "progress",
      header: "Progress",
      className: "text-center",
      render: (thesis) => (
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(thesis.progress.percent)}`}
              style={{ width: `${thesis.progress.percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {thesis.progress.completed}/{thesis.progress.total} ({thesis.progress.percent}%)
          </span>
        </div>
      ),
    },
    {
      key: "supervisors",
      header: "Pembimbing",
      render: (thesis) => (
        <div className="space-y-0.5 text-sm">
          {thesis.supervisors.pembimbing1 && (
            <p className="truncate max-w-[150px]" title={thesis.supervisors.pembimbing1}>
              1. {toTitleCaseName(thesis.supervisors.pembimbing1)}
            </p>
          )}
          {thesis.supervisors.pembimbing2 && (
            <p className="truncate max-w-[150px] text-muted-foreground" title={thesis.supervisors.pembimbing2}>
              2. {toTitleCaseName(thesis.supervisors.pembimbing2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "seminarApproval",
      header: "Acc Seminar",
      className: "text-center",
      render: (thesis) => (
        <div className="flex justify-center gap-1">
          <span title="Pembimbing 1">
            {thesis.seminarApproval.supervisor1 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/40" />
            )}
          </span>
          <span title="Pembimbing 2">
            {thesis.seminarApproval.supervisor2 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/40" />
            )}
          </span>
        </div>
      ),
    },
    {
      key: "lastActivity",
      header: "Aktivitas Terakhir",
      render: (thesis) => (
        <span className="text-sm text-muted-foreground">
          {formatDateId(thesis.lastActivity)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-center w-20",
      render: (thesis) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/tugas-akhir/monitoring/${thesis.id}`)}
          title="Lihat Detail"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const actions = (
    <>
      <Select
        value={statusFilter || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          {filterOptions?.statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label} ({status.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={lecturerFilter || "all"}
        onValueChange={(value) => handleFilterChange("lecturerId", value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Pembimbing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Pembimbing</SelectItem>
          {filterOptions?.supervisors.map((supervisor) => (
            <SelectItem key={supervisor.value} value={supervisor.value}>
              {toTitleCaseName(supervisor.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isFetching}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </>
  );

  return (
    <CustomTable<ThesisListItem>
      columns={columns}
      data={paginatedData}
      loading={isLoadingAny}
      total={searchFilteredData.length}
      page={page}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      searchValue={frontendSearch}
      onSearchChange={handleSearchChange}
      actions={actions}
      emptyText="Tidak ada data tugas akhir"
      rowKey={(row) => row.id}
    />
  );
}
