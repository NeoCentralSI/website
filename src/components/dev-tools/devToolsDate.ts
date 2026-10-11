/**
 * DEV TOOLS — conversion between ISO timestamps and a `datetime-local` value read as WIB
 * (UTC+7), independent of the browser timezone.
 */
import type { DevToolsGuidance, UpdateGuidanceScheduleDto } from '@/types/devTools.types';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** ISO timestamp → `YYYY-MM-DDTHH:mm` in WIB. Empty/invalid input → `''`. */
export function isoToWibInput(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16);
}

/** `YYYY-MM-DDTHH:mm` typed as WIB → ISO timestamp. Empty → `null`; invalid → `undefined`. */
export function wibInputToIso(value: string): string | null | undefined {
  if (!value) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export const GUIDANCE_SCHEDULE_FIELDS = [
  ['requestedDate', 'Waktu diusulkan'],
  ['approvedDate', 'Waktu disetujui'],
  ['summarySubmittedAt', 'Ringkasan dikirim'],
  ['completedAt', 'Sesi selesai'],
] as const;

export type GuidanceScheduleForm = Record<(typeof GUIDANCE_SCHEDULE_FIELDS)[number][0], string>;

export const toGuidanceScheduleForm = (guidance: DevToolsGuidance): GuidanceScheduleForm => ({
  requestedDate: isoToWibInput(guidance.requestedDate),
  approvedDate: isoToWibInput(guidance.approvedDate),
  summarySubmittedAt: isoToWibInput(guidance.summarySubmittedAt),
  completedAt: isoToWibInput(guidance.completedAt),
});

/** Builds the PATCH body from the fields that changed; `null` when the form is invalid. */
export function buildGuidanceSchedulePatch(
  original: GuidanceScheduleForm,
  form: GuidanceScheduleForm,
): UpdateGuidanceScheduleDto | null {
  const patch: UpdateGuidanceScheduleDto = {};
  for (const [key] of GUIDANCE_SCHEDULE_FIELDS) {
    if (form[key] === original[key]) continue;
    const iso = wibInputToIso(form[key]);
    if (iso === undefined) return null;
    if (key === 'requestedDate') {
      if (iso === null) return null;
      patch.requestedDate = iso;
    } else {
      patch[key] = iso;
    }
  }
  return patch;
}
