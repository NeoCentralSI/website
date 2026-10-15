import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDefenceReadinessManagement, useSeminarReadinessManagement } from "@/hooks/milestone/useMilestone";
import { toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";
import {
  READINESS_COPY,
  ReadinessAttachmentLink,
  ReadinessPassedView,
  ReadinessRequirementList,
  ReadinessStateBadge,
  ReadinessSupervisorList,
  WAITING_FOR_SEMINAR_TEXT,
  isWaitingForSeminar,
  type ReadinessKind,
} from "../ReadinessParts";

export interface LecturerReadinessCardProps {
  thesisId: string;
  studentName: string;
  className?: string;
}

/**
 * Supervisor view of seminar/defence readiness: system requirements, every supervisor's
 * approval, the latest guidance attachment, and Setujui / Batalkan Persetujuan. The two
 * kinds share this card so they stay symmetric; they stand side by side with equal height,
 * the actions at the bottom (Paket E4, 3.1). Once the event is passed the card is read-only
 * (3.2); the defence card first waits for the results seminar (3.3).
 */
export function LecturerReadinessCard({ kind, thesisId, studentName, className }: LecturerReadinessCardProps & { kind: ReadinessKind }) {
  const seminar = useSeminarReadinessManagement(kind === "seminar" ? thesisId : undefined);
  const defence = useDefenceReadinessManagement(kind === "defence" ? thesisId : undefined);
  const { readinessStatus, isLoading, approve, revoke, isApproving, isRevoking } = kind === "seminar" ? seminar : defence;

  const [dialog, setDialog] = useState<"approve" | "revoke" | null>(null);
  const [notes, setNotes] = useState("");
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

  const isOwnSupervisor = !!readinessStatus.currentUserRole;
  const hasApproved = readinessStatus.currentUserHasApproved;
  const approveReason = readinessStatus.approveBlockedReason;
  const revokeReason = readinessStatus.revokeBlockedReason ?? null;
  const isPending = isApproving || isRevoking;
  const passed = !!readinessStatus.isPassed;
  const waiting = isWaitingForSeminar(kind, readinessStatus);

  const closeDialog = () => { setDialog(null); setNotes(""); };
  const submit = () => {
    const value = notes.trim() || undefined;
    if (dialog === "approve") approve(value);
    else revoke(value);
    closeDialog();
  };

  return (
    <Card className={cn("flex h-full w-full flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{copy.title}</CardTitle>
            <CardDescription>
              {passed
                ? `Kesiapan ${copy.noun} sudah selesai; persetujuan tidak dapat diubah lagi.`
                : "Persetujuan diberikan berdasarkan syarat sistem; mahasiswa tidak mengunggah dokumen untuk meminta persetujuan."}
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
            <ReadinessAttachmentLink attachment={readinessStatus.latestGuidanceAttachment} />
          </>
        )}

        <div className="mt-auto border-t pt-4">
          {passed ? (
            <p className="text-xs text-muted-foreground">{approveReason ?? revokeReason}</p>
          ) : isOwnSupervisor ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {hasApproved ? (
                  <span title={revokeReason ?? undefined}>
                    <Button variant="outline" disabled={isPending || !!revokeReason} onClick={() => setDialog("revoke")}>
                      Batalkan Persetujuan
                    </Button>
                  </span>
                ) : (
                  <span title={approveReason ?? undefined}>
                    <Button disabled={isPending || !!approveReason} onClick={() => setDialog("approve")}>
                      Setujui
                    </Button>
                  </span>
                )}
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {!hasApproved && approveReason && (
                <p className="text-xs text-muted-foreground">
                  Belum dapat disetujui: {waiting ? WAITING_FOR_SEMINAR_TEXT : approveReason}
                </p>
              )}
              {hasApproved && (
                <p className="text-xs text-muted-foreground">
                  {revokeReason ?? `Anda sudah menyetujui kesiapan ${copy.noun} mahasiswa ini.`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Hanya pembimbing aktif tugas akhir ini yang dapat menyetujui atau membatalkan persetujuan.
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "revoke" ? `Batalkan persetujuan ${copy.noun}?` : `Setujui kesiapan ${copy.noun}?`}
            </DialogTitle>
            <DialogDescription>
              {dialog === "revoke"
                ? `Persetujuan Anda untuk ${toTitleCaseName(studentName)} akan dibatalkan dan mahasiswa diberi tahu.`
                : `Anda menyatakan ${toTitleCaseName(studentName)} siap mendaftar ${copy.noun}. Mahasiswa akan diberi tahu.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-readiness-notes`}>{dialog === "revoke" ? "Alasan (opsional)" : "Catatan (opsional)"}</Label>
            <Textarea
              id={`${kind}-readiness-notes`}
              value={notes}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dialog === "revoke" ? "Alasan pembatalan untuk mahasiswa" : "Catatan untuk mahasiswa"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button variant={dialog === "revoke" ? "destructive" : "default"} onClick={submit}>
              {dialog === "revoke" ? "Batalkan Persetujuan" : "Setujui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
