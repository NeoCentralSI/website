import type { ReactNode } from "react";
import { CheckCircle2, Circle, GraduationCap, Paperclip, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import { formatDateShortId, formatDateTimeWib, formatRoleName, formatLecturerName } from "@/lib/text";
import type {
  ReadinessAttachment,
  ReadinessRequirement,
  ReadinessStatusBase,
  ReadinessSupervisor,
} from "@/types/milestone.types";

export type ReadinessKind = "seminar" | "defence";

/** Texts that differ between the seminar card and the defence card. */
export const READINESS_COPY: Record<ReadinessKind, { title: string; noun: string; registerLabel: string; registerPath: string; passedText: string }> = {
  seminar: {
    title: "Kesiapan Seminar Hasil",
    noun: "seminar hasil",
    registerLabel: "Buka Halaman Seminar Hasil",
    registerPath: "/tugas-akhir/seminar-hasil",
    passedText: "Seminar hasil lulus pada",
  },
  defence: {
    title: "Kesiapan Sidang",
    noun: "sidang",
    registerLabel: "Buka Halaman Sidang",
    registerPath: "/tugas-akhir/sidang",
    passedText: "Sidang lulus pada",
  },
};

/** The defence card waits for the results seminar and shows only that requirement. */
export function isWaitingForSeminar(kind: ReadinessKind, status: ReadinessStatusBase & { seminarPassed?: boolean }): boolean {
  return kind === "defence" && status.seminarPassed === false && !status.isPassed;
}

/** Text shown on a defence card while the results seminar is not passed. */
export const WAITING_FOR_SEMINAR_TEXT = "Menunggu seminar hasil lulus";

/** Approval summary of a readiness status, whichever kind it is. */
export function isReadinessFullyApproved(status: ReadinessStatusBase): boolean {
  return status.supervisors.length > 0 && status.supervisors.every((supervisor) => supervisor.hasApproved);
}

export function ReadinessStateBadge({ status }: { status: ReadinessStatusBase }) {
  if (status.isPassed) return <Badge variant="success">Lulus</Badge>;
  if (!status.requirementsMet) return <Badge variant="outline">Syarat Belum Terpenuhi</Badge>;
  if (isReadinessFullyApproved(status)) return <Badge variant="success">Disetujui</Badge>;
  return <Badge variant="warning">Menunggu Persetujuan Pembimbing</Badge>;
}

/** System requirements with a met / not met mark each. */
export function ReadinessRequirementList({ requirements }: { requirements: ReadinessRequirement[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Syarat sistem</p>
      <ul className="space-y-2">
        {requirements.map((item) => (
          <li key={item.key} className="flex items-start gap-2 text-sm">
            {item.met ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="Terpenuhi" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-label="Belum terpenuhi" />
            )}
            <div>
              <p>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Approval of each active supervisor. */
export function ReadinessSupervisorList({ supervisors }: { supervisors: ReadinessSupervisor[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Persetujuan pembimbing</p>
      {supervisors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada pembimbing aktif.</p>
      ) : (
        <ul className="space-y-2">
          {supervisors.map((supervisor) => (
            <li key={supervisor.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                {supervisor.hasApproved ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="truncate" title={supervisor.name}>{formatLecturerName(supervisor.name) || "-"}</p>
                  <p className="text-xs text-muted-foreground">{formatRoleName(supervisor.role)}</p>
                </div>
              </div>
              <span className={supervisor.hasApproved ? "shrink-0 text-xs font-medium text-green-700" : "shrink-0 text-xs text-muted-foreground"}>
                {supervisor.hasApproved ? "Menyetujui" : "Belum menyetujui"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Link to the latest guidance attachment, the supervisor's reference for the draft. */
export function ReadinessAttachmentLink({ attachment }: { attachment: ReadinessAttachment | null }) {
  if (!attachment) {
    return <p className="text-xs text-muted-foreground">Belum ada lampiran pada sesi bimbingan.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button
        type="button"
        variant="link"
        className="h-auto p-0"
        onClick={() => void openAuthenticatedFileOrToast(attachment.filePath)}
      >
        <Paperclip className="mr-1 h-3.5 w-3.5" />
        Lampiran bimbingan terakhir
      </Button>
      <span className="text-xs text-muted-foreground">
        {attachment.fileName ?? "Berkas"} · diunggah {formatDateTimeWib(attachment.uploadedAt)}
      </span>
    </div>
  );
}

/**
 * After the seminar (or defence) is passed the card is read-only: when it was
 * passed and each supervisor's approval with its date. No buttons.
 */
export function ReadinessPassedView({ kind, status }: { kind: ReadinessKind; status: ReadinessStatusBase }) {
  const copy = READINESS_COPY[kind];
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
        <GraduationCap className="h-4 w-4 shrink-0" />
        {copy.passedText} {status.passedAt ? formatDateShortId(status.passedAt) : "-"}
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Persetujuan pembimbing</p>
        {status.supervisors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada pembimbing aktif.</p>
        ) : (
          <ul className="space-y-2">
            {status.supervisors.map((supervisor) => (
              <li key={supervisor.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  {supervisor.hasApproved ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate" title={supervisor.name}>{formatLecturerName(supervisor.name) || "-"}</p>
                    <p className="text-xs text-muted-foreground">{formatRoleName(supervisor.role)}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {supervisor.hasApproved
                    ? `Menyetujui${supervisor.approvedAt ? ` · ${formatDateShortId(supervisor.approvedAt)}` : ""}`
                    : "Tidak menyetujui"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Two readiness cards side by side (one column on narrow screens), equally tall. */
export function ReadinessCardsRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">{children}</div>;
}
