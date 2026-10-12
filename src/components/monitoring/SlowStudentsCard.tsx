import { useMemo, useState } from "react";
import { AlertTriangle, Bell } from "lucide-react";
import { toast } from "sonner";

import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole } from "@/hooks/shared/useRole";
import { toTitleCaseName } from "@/lib/text";
import { sendBatchWarnings, type AtRiskStudent } from "@/services/monitoring.service";
import { InactiveDaysText, MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";

interface SlowStudentsCardProps {
  slowStudents: AtRiskStudent[] | undefined;
  atRiskStudents: AtRiskStudent[] | undefined;
  isLoading: boolean;
}

/**
 * "Progres Lambat & Berisiko": running theses whose activity level is Lambat or Berisiko,
 * Berisiko first, then the longest without activity. Ketua Departemen can warn them all,
 * after confirming how many students receive the warning.
 */
export function SlowStudentsCard({ slowStudents, atRiskStudents, isLoading }: SlowStudentsCardProps) {
  const { isKadep } = useRole();
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allStudents = useMemo(() => {
    const combined = [
      ...(atRiskStudents ?? []).map((student) => ({ ...student, level: "at_risk" as const })),
      ...(slowStudents ?? []).map((student) => ({ ...student, level: "slow" as const })),
    ];
    // The two lists are separate categories; a thesis in both keeps its Berisiko entry.
    const unique = combined.filter((student, index, list) => list.findIndex((other) => other.thesisId === student.thesisId) === index);
    return unique.sort((a, b) => {
      if (a.level !== b.level) return a.level === "at_risk" ? -1 : 1;
      return b.daysSinceActivity - a.daysSinceActivity;
    });
  }, [slowStudents, atRiskStudents]);

  const handleBatchWarning = async () => {
    if (allStudents.length === 0) return;

    setSending(true);
    try {
      const thesisIds = allStudents.map((student) => student.thesisId);
      // One batch for the whole list, sent with the baseline "slow" wording.
      await sendBatchWarnings(thesisIds, "slow");
      toast.success(`Berhasil mengirim peringatan ke ${thesisIds.length} mahasiswa`);
    } catch (error) {
      toast.error((error as Error)?.message || "Gagal mengirim peringatan batch");
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  const atRiskCount = allStudents.filter((student) => student.level === "at_risk").length;
  const slowCount = allStudents.length - atRiskCount;

  return (
    <>
      <MonitoringListCard
        icon={AlertTriangle}
        iconClassName="text-orange-500"
        title="Progres Lambat & Berisiko"
        description="Mahasiswa yang lama tanpa aktivitas dan perlu perhatian"
        count={allStudents.length}
        isLoading={isLoading}
        emptyDescription="Tidak ada mahasiswa dengan progres lambat atau berisiko."
        action={
          allStudents.length > 0 && isKadep() ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfirmOpen(true)} disabled={sending}>
                  <Bell className="h-4 w-4" />
                  {sending ? "Mengirim..." : "Peringatkan"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kirim peringatan ke semua mahasiswa pada daftar ini</TooltipContent>
            </Tooltip>
          ) : undefined
        }
      >
        {allStudents.map((student) => (
          <MonitoringListRow
            key={student.thesisId}
            name={toTitleCaseName(student.student.name)}
            identityNumber={student.student.nim}
            trailing={
              <>
                <ThesisActivityBadge level={student.level} className="text-[11px]" />
                <InactiveDaysText days={student.daysSinceActivity} />
              </>
            }
          />
        ))}
      </MonitoringListCard>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!sending) setConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Kirim Peringatan Massal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Peringatan akan dikirim ke <strong className="text-foreground">{allStudents.length} mahasiswa</strong> pada
                  daftar Progres Lambat &amp; Berisiko ({atRiskCount} Berisiko, {slowCount} Lambat).
                </p>
                <p className="text-sm">
                  Setiap mahasiswa menerima notifikasi push dan notifikasi di aplikasi. Peringatan yang sudah terkirim
                  tidak dapat ditarik kembali.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              // Stay open while sending; the dialog closes when the request settles.
              onClick={(event) => {
                event.preventDefault();
                void handleBatchWarning();
              }}
              disabled={sending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Bell className="mr-2 h-4 w-4" />
              {sending ? "Mengirim..." : `Kirim ke ${allStudents.length} Mahasiswa`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
