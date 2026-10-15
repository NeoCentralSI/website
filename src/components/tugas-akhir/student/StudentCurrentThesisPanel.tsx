import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { ReadinessCardsRow } from "@/components/milestone/ReadinessParts";
import { DefenceReadinessStatusCard } from "@/components/milestone/student/DefenceReadinessStatusCard";
import { SeminarReadinessStatusCard } from "@/components/milestone/student/SeminarReadinessStatusCard";
import { ThesisChangeRequestFormDialog } from "@/components/thesis-change-request/ThesisChangeRequestFormDialog";
import {
  ThesisChangeRequestDetailDialog,
  ThesisChangeRequestHistoryLink,
  ThesisChangeRequestStatusLine,
  changesSupervisor,
  changesTitle,
} from "@/components/thesis-change-request/ThesisChangeRequestViews";
import {
  AcademicWarningAlert,
  ThesisGuidanceEvaluationHistoryLink,
  evaluationsOf,
} from "@/components/thesis-guidance-evaluation/ThesisGuidanceEvaluationViews";
import { useSeminarReadinessStatus } from "@/hooks/milestone";
import { useThesisChangeContext } from "@/hooks/thesis-change-request/useThesisChangeRequest";
import { useEvaluationContext } from "@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation";
import { getGuidanceActionBlockReason } from "@/lib/thesisLabels";
import { getMyThesisDetail } from "@/services/studentGuidance.service";
import type { ThesisChangeRequest } from "@/types/thesis-change-request.types";
import { StudentThesisProgressCard } from "./StudentThesisProgressCard";
import { StudentThesisSummaryCard } from "./StudentThesisSummaryCard";
import { isShownAsCurrentThesis } from "./studentThesisTabs";

/**
 * Tab "Tugas Akhir Saat Ini": the student's latest thesis while it is running, or finished
 * (Selesai, shown read-only without action buttons). A stopped thesis (Gagal) belongs to
 * the Riwayat tab; without a newer thesis this tab is empty and points there.
 *
 * Paket E4 (6): change requests and evaluations live in the Informasi Tugas Akhir card
 * ("Ajukan Perubahan", history links, one status line); a running warning is a ribbon on
 * top; Kesiapan Seminar and Kesiapan Sidang stand side by side.
 */
export function StudentCurrentThesisPanel() {
  const navigate = useNavigate();
  const { data: thesis, isLoading } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
    retry: false,
  });

  const current = thesis && isShownAsCurrentThesis(thesis.status) ? thesis : null;
  const isFinished = current?.status === "completed";
  const { data: seminarStatus } = useSeminarReadinessStatus(isFinished ? undefined : current?.id);
  const { data: changeContext } = useThesisChangeContext(undefined, !!current);
  const { data: evaluationContext } = useEvaluationContext(undefined, !!current);
  const [formOpen, setFormOpen] = useState(false);
  const [changeDetail, setChangeDetail] = useState<ThesisChangeRequest | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat data tugas akhir..." />
      </div>
    );
  }

  if (!current) {
    const stopped = !!thesis;
    return (
      <EmptyState
        title="Belum Ada Tugas Akhir yang Berjalan"
        description={
          stopped
            ? "Tugas akhir Anda sebelumnya dihentikan. Rincian dapat dilihat pada tab Riwayat."
            : "Tugas akhir tampil di sini setelah pengajuan pembimbing Anda disetujui di Tugas Akhir > Proposal."
        }
        showButton={stopped}
        buttonText="Lihat Riwayat"
        onButtonClick={() => navigate("/tugas-akhir/riwayat")}
      />
    );
  }

  const changeHistory = changeContext?.history ?? [];
  const runningChange = changeContext?.openRequest ?? null;
  const evaluations = evaluationsOf(evaluationContext);
  // The running warning: from the evaluations, else from the supervision clock's extension.
  const extensionUntil = current.supervisionClock?.extensionUntil;
  const warning = evaluationContext?.academicWarning ?? (!isFinished && extensionUntil ? { extensionUntil, followUpDue: false } : null);

  const summary = (
    <StudentThesisSummaryCard
      thesis={current}
      headerAction={!isFinished && changeContext ? (
        <span title={changeContext.blockReason ?? undefined}>
          <Button size="sm" variant="outline" disabled={!changeContext.canSubmit} onClick={() => setFormOpen(true)}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Ajukan Perubahan
          </Button>
        </span>
      ) : undefined}
      headerNote={!isFinished && changeContext?.blockReason ? (
        <p className="text-xs text-muted-foreground">Ajukan Perubahan belum tersedia: {changeContext.blockReason}</p>
      ) : undefined}
      titleExtras={
        <ThesisChangeRequestHistoryLink label="Riwayat perubahan judul" title="Riwayat Perubahan Judul" requests={changeHistory.filter(changesTitle)} />
      }
      supervisorExtras={
        <ThesisChangeRequestHistoryLink label="Riwayat pembimbing" title="Riwayat Pembimbing" requests={changeHistory.filter(changesSupervisor)} />
      }
      footer={runningChange || evaluations.length > 0 ? (
        <>
          {runningChange && <ThesisChangeRequestStatusLine request={runningChange} onDetail={() => setChangeDetail(runningChange)} />}
          <ThesisGuidanceEvaluationHistoryLink evaluations={evaluations} />
        </>
      ) : undefined}
    />
  );

  return (
    <div className="space-y-6">
      <AcademicWarningAlert warning={warning} />
      {summary}
      {isFinished ? (
        <StudentThesisProgressCard thesis={current} guidanceBlockReason={null} readOnly />
      ) : (
        <StudentThesisProgressCard
          thesis={current}
          requiredGuidances={seminarStatus?.guidanceProgress?.required}
          guidanceBlockReason={getGuidanceActionBlockReason(current.status, "Anda", {
            repeatingProposal: current.repeatingProposal,
            proposalPhaseOpen: current.proposalPhaseOpen,
          })}
        />
      )}
      {/* 3.1: both always shown, side by side and equally tall; a passed event is read-only (3.2). */}
      <ReadinessCardsRow>
        <SeminarReadinessStatusCard thesisId={current.id} />
        <DefenceReadinessStatusCard thesisId={current.id} />
      </ReadinessCardsRow>

      {changeContext && !isFinished && (
        <ThesisChangeRequestFormDialog open={formOpen} onOpenChange={setFormOpen} context={changeContext} />
      )}
      <ThesisChangeRequestDetailDialog request={changeDetail} onClose={() => setChangeDetail(null)} />
    </div>
  );
}
