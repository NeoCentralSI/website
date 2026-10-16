import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

import { CustomTable, type Column } from "@/components/layout/CustomTable";
import { TableIconAction } from "@/components/shared/TableIconAction";
import {
  ThesisEventStatusBadge,
  getThesisEventStatusLabel,
  type ThesisEventStatus,
} from "@/components/shared/ThesisEventStatusBadge";
import { ThesisStudentInfoCell } from "@/components/shared/ThesisTableCells";
import { BADGE_COLUMN_WIDTH, CLIP_CELL } from "@/lib/tableColumnWidths";
import { formatDateShortId } from "@/lib/text";
import { cn } from "@/lib/utils";
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
const STATUS_OPTIONS = [
  { label: "Semua", value: "" },
  ...EVENT_STATUSES.map((value) => ({ label: getThesisEventStatusLabel(value), value })),
];

const scoreFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

interface ThesisEventsTableProps {
  kind: ThesisEventKind;
  events: MonitoringEvent[] | undefined;
  isLoading: boolean;
  /** The viewer's role may open the seminar/defence detail page. */
  canOpenDetail: boolean;
}

/**
 * Every seminar or defence of the semester (read-only). The Status column shows what the
 * seminar and defence modules show: their badge is given the schedule, so it derives the
 * display status itself (a scheduled event whose start has passed reads "Sedang
 * Berlangsung"). The status filter, like the summary cards, goes by the stored status.
 * Search and the filter run in the browser. Paket E5: the rows come in the order of the
 * seminar and defence modules (status priority, then the latest); the status filter sits in
 * the column header and the detail is an icon.
 */
export function ThesisEventsTable({ kind, events, isLoading, canOpenDetail }: ThesisEventsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const copy = THESIS_EVENT_COPY[kind];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (events ?? []).filter((event) => {
      if (status && event.status !== status) return false;
      if (!query) return true;
      return [event.student.name, event.student.nim].some((value) => value?.toLowerCase().includes(query));
    });
  }, [events, search, status]);

  // The rows change with the semester; never stay on a page that no longer exists.
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = search !== "" || status !== "";

  const columns: Column<MonitoringEvent>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      width: 200,
      className: CLIP_CELL,
      render: (event) => <ThesisStudentInfoCell name={event.student.name ?? ""} nim={event.student.nim ?? ""} />,
    },
    {
      key: "title",
      header: "Judul",
      className: CLIP_CELL,
      render: (event) => (
        <span className="block whitespace-normal break-words text-sm line-clamp-2" title={event.title ?? undefined}>{event.title || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: BADGE_COLUMN_WIDTH.thesisEventStatus,
      className: CLIP_CELL,
      filter: {
        type: "select",
        value: status,
        onChange: (value) => { setStatus(value); setPage(1); },
        options: STATUS_OPTIONS,
      },
      render: (event) => (
        <ThesisEventStatusBadge
          status={event.status as ThesisEventStatus}
          scheduledDate={event.date}
          startTime={event.startTime}
          className="whitespace-nowrap"
        />
      ),
    },
    {
      key: "date",
      header: "Tanggal Pelaksanaan",
      // The header itself needs 168 px; a date needs 157 px.
      width: 170,
      className: CLIP_CELL,
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
      width: 110,
      className: cn("text-center", CLIP_CELL),
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
          width: 80,
          className: "text-center",
          render: (event: MonitoringEvent) => (
            <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => navigate(`${THESIS_EVENT_DETAIL_PATH[kind]}/${event.id}`)} />
          ),
        }]
      : []),
  ];

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
      enableColumnFilters
      tableClassName="table-fixed min-w-[900px]"
      emptyText={hasFilters ? `Tidak ada ${copy.noun} yang cocok dengan pencarian atau filter.` : `Belum ada ${copy.noun} pada semester ini.`}
      rowKey={(event) => event.id}
    />
  );
}
