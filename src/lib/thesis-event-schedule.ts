import { formatDateShortId } from "@/lib/text";

/** Detail pages of the seminar and defence modules; a row links to `<path>/<id>`. */
export const THESIS_EVENT_DETAIL_PATH = {
  seminar: "/tugas-akhir/seminar-hasil",
  defence: "/tugas-akhir/sidang",
} as const;

/** What the schedule helpers read from a seminar or a defence. */
export interface ThesisEventSchedule {
  /** Calendar date (ISO, midnight UTC). */
  date: string | null;
  /** Time of day (ISO on 1970-01-01, read in UTC), as stored by the seminar and defence modules. */
  startTime: string | null;
  endTime: string | null;
}

/** The seminar and defence modules store the time of day on 1970-01-01 and read it in UTC. */
export function timeOfDay(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return `${String(date.getUTCHours()).padStart(2, "0")}.${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

/** "09.00 – 11.00 WIB"; null when the event has no start time. */
export function timeRangeText(event: ThesisEventSchedule): string | null {
  const start = timeOfDay(event.startTime);
  if (!start) return null;
  const end = timeOfDay(event.endTime);
  return `${start}${end ? ` – ${end}` : ""} WIB`;
}

/** "14 Oktober 2026, 09.00 – 11.00 WIB", or "Belum dijadwalkan". */
export function scheduleText(event: ThesisEventSchedule): string {
  if (!event.date) return "Belum dijadwalkan";
  const day = formatDateShortId(event.date);
  const time = timeRangeText(event);
  return time ? `${day}, ${time}` : day;
}
