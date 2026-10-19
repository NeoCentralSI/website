import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDefenceReadinessStatus,
  useRequestReadinessApproval,
  useSeminarReadinessStatus,
} from "@/hooks/milestone/useMilestone";
import { cn } from "@/lib/utils";
import {
  READINESS_COPY,
  ReadinessPassedView,
  ReadinessRequirementList,
  ReadinessStateBadge,
  ReadinessSupervisorList,
  WAITING_FOR_SEMINAR_TEXT,
  isReadinessFullyApproved,
  isWaitingForSeminar,
  type ReadinessKind,
} from "../ReadinessParts";

export interface StudentReadinessStatusCardProps {
  thesisId: string;
  className?: string;
}

/**
 * Student view of seminar/defence readiness: system requirements, every supervisor's
 * approval, and "Minta Persetujuan" (a notification only, nothing is uploaded). The two
 * kinds share this card so they stay symmetric; both always show, side by side with equal
 * height. A passed event turns the card read-only; the defence card
 * first waits for the results seminar (3.3).
 */
export function StudentReadinessStatusCard({ kind, thesisId, className }: StudentReadinessStatusCardProps & { kind: ReadinessKind }) {
  const seminar = useSeminarReadinessStatus(kind === "seminar" ? thesisId : undefined);
  const defence = useDefenceReadinessStatus(kind === "defence" ? thesisId : undefined);
  const { data: readinessStatus, isLoading } = kind === "seminar" ? seminar : defence;
  const requestMutation = useRequestReadinessApproval(kind);
  const copy = READINESS_COPY[kind];

  if (isLoading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!readinessStatus) return null;

  const fullyApproved = readinessStatus.requirementsMet && isReadinessFullyApproved(readinessStatus);
  const requestReason = readinessStatus.requestBlockedReason;
  const passed = !!readinessStatus.isPassed;
  const waiting = isWaitingForSeminar(kind, readinessStatus);
  // A finished thesis (Selesai) is read-only even without a passed event on record.
  const finished = readinessStatus.thesisStatus === "completed";

  return (
    <Card className={cn("flex h-full w-full flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{copy.title}</CardTitle>
            <CardDescription>
              {passed
                ? `Kesiapan ${copy.noun} sudah selesai.`
                : "Tidak ada dokumen yang perlu diunggah di sini. Pembimbing membaca draf dari lampiran sesi bimbingan."}
            </CardDescription>
          </div>
          <ReadinessStateBadge status={readinessStatus} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {passed ? (
          <ReadinessPassedView kind={kind} status={readinessStatus} />
        ) : waiting ? (
          <div className="space-y-2">
            <ReadinessRequirementList requirements={readinessStatus.requirements} />
            <p className="text-sm text-muted-foreground">{WAITING_FOR_SEMINAR_TEXT}.</p>
          </div>
        ) : (
          <>
            <ReadinessRequirementList requirements={readinessStatus.requirements} />
            <ReadinessSupervisorList supervisors={readinessStatus.supervisors} />
          </>
        )}

        {!passed && finished && (
          <p className="mt-auto border-t pt-4 text-xs text-muted-foreground">
            Tugas akhir sudah selesai; kesiapan {copy.noun} tidak dapat diubah lagi.
          </p>
        )}
        {!passed && !finished && (
          <div className="mt-auto space-y-2 border-t pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span title={requestReason ?? undefined}>
                <Button
                  disabled={!!requestReason || requestMutation.isPending}
                  onClick={() => requestMutation.mutate(thesisId)}
                >
                  {requestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Minta Persetujuan
                </Button>
              </span>
              <Button asChild variant={fullyApproved ? "default" : "outline"}>
                <Link to={copy.registerPath}>
                  {copy.registerLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {requestReason && (
              <p className="text-xs text-muted-foreground">
                Minta Persetujuan belum tersedia: {waiting ? WAITING_FOR_SEMINAR_TEXT : requestReason}
              </p>
            )}
            {fullyApproved && (
              <p className="text-xs text-green-700">
                Semua pembimbing sudah menyetujui. Lanjutkan pendaftaran {copy.noun} di halamannya.
              </p>
            )}
          </div>
        )}
        {passed && readinessStatus.requestBlockedReason && (
          <p className="mt-auto border-t pt-4 text-xs text-muted-foreground">{readinessStatus.requestBlockedReason}</p>
        )}
      </CardContent>
    </Card>
  );
}
