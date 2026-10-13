import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";

import { CustomTable, type Column } from "@/components/layout/CustomTable";
import {
  ThesisEventStatusBadge,
  getThesisEventStatusLabel,
  type ThesisEventStatus,
} from "@/components/shared/ThesisEventStatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateShortId, toTitleCaseName } from "@/lib/text";
import { THESIS_EVENT_DETAIL_PATH, timeRangeText } from "@/lib/thesis-event-schedule";
import type { MonitoringEvent, ThesisEventKind } from "@/services/monitoring.service";
import { THESIS_EVENT_COPY } from "./thesis-event-copy";

/** Stored statuses of a seminar or defence, in the order of the process. */
const EVENT_STATUSES: ThesisEventStatus[] = [
  "registered",
  "verified",
  "examiner_assigned",
  "scheduled",
  "passed",
  "passed_with_revision",
  "failed",
  "cancelled",
];
const ALL_STATUSES = "all";

const scoreFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

interface ThesisEventsTableProps {
  kind: ThesisEventKind;
  events: MonitoringEvent[] | undefined;
  isLoading: boolean;
  /** The viewer's role may open the seminar/defence detail page. */
  canOpenDetail: boolean;
}

/**
 * Every seminar or defence of the semester (read-only). The status is the stored one, shown
 * with the badge of the seminar and defence modules; search and the status filter run in
 * the browser.
 */
export function ThesisEventsTable({ kind, events, isLoading, canOpenDetail }: ThesisEventsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const copy = THESIS_EVENT_COPY[kind];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (events ?? []).filter((event) => {
      if (status !== ALL_STATUSES && event.status !== status) return false;
      if (!query) return true;
      return [event.student.name, event.student.nim].some((value) => value?.toLowerCase().includes(query));
    });
  }, [events, search, status]);

  // The rows change with the semester; never stay on a page that no longer exists.
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = search !== "" || status !== ALL_STATUSES;

  const columns: Column<MonitoringEvent>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      render: (event) => (
        <div className="space-y-0.5">
          <p className="font-medium">{toTitleCaseName(event.student.name)}</p>
          <p className="text-sm text-muted-foreground">{event.student.nim || "-"}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Judul",
      render: (event) => (
        <span className="block max-w-72 truncate text-sm" title={event.title ?? undefined}>{event.title || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (event) => <ThesisEventStatusBadge status={event.status as ThesisEventStatus} className="whitespace-nowrap" />,
    },
    {
      key: "date",
      header: "Tanggal Pelaksanaan",
      render: (event) =>
        event.date ? (
          <div className="whitespace-nowrap text-sm">
            <p>{formatDateShortId(event.date)}</p>
            {timeRangeText(event) && <p className="text-xs text-muted-foreground">{timeRangeText(event)}</p>}
          </div>
        ) : (
          <span className="whitespace-nowrap text-sm text-muted-foreground">Belum dijadwalkan</span>
        ),
    },
    {
      key: "finalScore",
      header: "Nilai Akhir",
      className: "text-center",
      render: (event) => (
        <span className="whitespace-nowrap text-sm">
          {event.finalScore != null ? `${scoreFormat.format(event.finalScore)}${event.grade ? ` (${event.grade})` : ""}` : "-"}
        </span>
      ),
    },
    ...(canOpenDetail
      ? [{
          key: "actions",
          header: "Aksi",
          className: "text-center",
          render: (event: MonitoringEvent) => (
            <Link
              to={`${THESIS_EVENT_DETAIL_PATH[kind]}/${event.id}`}
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"
            >
              Lihat detail
              <ExternalLink className="h-3 w-3" />
            </Link>
          ),
        }]
      : []),
  ];

  const actions = (
    <>
      <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
        <SelectTrigger className="w-60" aria-label="Filter status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>Semua Status</SelectItem>
          {EVENT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>{getThesisEventStatusLabel(value)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => { setSearch(""); setStatus(ALL_STATUSES); setPage(1); }}
        >
          <X className="mr-1 h-4 w-4" />
          Reset
        </Button>
      )}
    </>
  );

  return (
    <CustomTable<MonitoringEvent>
      columns={columns}
      data={rows}
      loading={isLoading}
      total={filtered.length}
      page={currentPage}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      searchValue={search}
      onSearchChange={(value) => { setSearch(value); setPage(1); }}
      searchPlaceholder="Cari nama atau NIM..."
      actions={actions}
      emptyText={hasFilters ? `Tidak ada ${copy.noun} yang cocok dengan pencarian atau filter.` : `Belum ada ${copy.noun} pada semester ini.`}
      rowKey={(event) => event.id}
    />
  );
}
