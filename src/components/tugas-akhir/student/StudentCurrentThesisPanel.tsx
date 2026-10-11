import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { DefenceReadinessStatusCard } from "@/components/milestone/student/DefenceReadinessStatusCard";
import { SeminarReadinessStatusCard } from "@/components/milestone/student/SeminarReadinessStatusCard";
import { StudentThesisChangeRequestCard } from "@/components/thesis-change-request/StudentThesisChangeRequestCard";
import { StudentThesisGuidanceEvaluationCard } from "@/components/thesis-guidance-evaluation/StudentThesisGuidanceEvaluationCard";
import { useDefenceReadinessStatus, useSeminarReadinessStatus } from "@/hooks/milestone";
import { OPEN_THESIS_STATUSES, getGuidanceActionBlockReason } from "@/lib/thesisLabels";
import { getMyThesisDetail } from "@/services/studentGuidance.service";
import { StudentThesisProgressCard } from "./StudentThesisProgressCard";
import { StudentThesisSummaryCard } from "./StudentThesisSummaryCard";

/**
 * Tab "Tugas Akhir Saat Ini": the running thesis (Proposal, Penelitian or Berhenti Studi
 * Sementara). A finished or stopped thesis belongs to the Riwayat tab.
 */
export function StudentCurrentThesisPanel() {
  const navigate = useNavigate();
  const { data: thesis, isLoading } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
    retry: false,
  });

  const current = thesis && OPEN_THESIS_STATUSES.includes(thesis.status) ? thesis : null;
  const thesisId = current?.id;
  const { data: seminarStatus } = useSeminarReadinessStatus(thesisId);
  const { data: defenceStatus } = useDefenceReadinessStatus(thesisId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat data tugas akhir..." />
      </div>
    );
  }

  if (!current) {
    const ended = !!thesis;
    return (
      <EmptyState
        title="Belum Ada Tugas Akhir yang Berjalan"
        description={
          ended
            ? "Tugas akhir Anda sebelumnya sudah berakhir. Rinciannya ada di tab Riwayat."
            : "Tugas akhir tampil di sini setelah judul dan pembimbing Anda ditetapkan lewat Metode Penelitian."
        }
        showButton={ended}
        buttonText="Lihat Riwayat"
        onButtonClick={() => navigate("/tugas-akhir/riwayat")}
      />
    );
  }

  // The seminar card gives way to the defence card once the results seminar is passed.
  const seminarPassed = defenceStatus?.requirementsMet === true;

  return (
    <div className="space-y-6">
      <StudentThesisSummaryCard thesis={current} />
      <StudentThesisProgressCard
        thesis={current}
        requiredGuidances={seminarStatus?.guidanceProgress?.required}
        guidanceBlockReason={getGuidanceActionBlockReason(current.status, "Anda", { repeatingProposal: current.repeatingProposal })}
      />
      {!seminarPassed && <SeminarReadinessStatusCard thesisId={current.id} />}
      <DefenceReadinessStatusCard thesisId={current.id} />
      <StudentThesisChangeRequestCard />
      <StudentThesisGuidanceEvaluationCard />
    </div>
  );
}
