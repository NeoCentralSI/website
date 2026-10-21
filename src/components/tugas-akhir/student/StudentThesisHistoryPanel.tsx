import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileText, GraduationCap, Target } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { formatDateShortId, formatRoleName, formatLecturerName } from "@/lib/text";
import { getThesisTerminationReasonLabel } from "@/lib/thesisLabels";
import { getMyThesisDetail, getStudentThesisHistory, type ThesisHistoryItem } from "@/services/studentGuidance.service";
import { isShownAsCurrentThesis } from "./studentThesisTabs";

function Fact({ icon: Icon, label, children }: { icon: typeof Target; label: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}: <span className="font-medium text-foreground">{children}</span></span>
    </p>
  );
}

function HistoryCard({ thesis }: { thesis: ThesisHistoryItem }) {
  const endedAt = thesis.terminatedAt ?? thesis.statusChangedAt ?? null;
  const supervisors = thesis.supervisors ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg leading-relaxed [overflow-wrap:anywhere]">{thesis.title || "(tanpa judul)"}</CardTitle>
            <CardDescription>
              Dibuat {formatDateShortId(thesis.createdAt)}
              {endedAt ? ` · Berakhir ${formatDateShortId(endedAt)}` : ""}
            </CardDescription>
          </div>
          <ThesisStatusBadge status={thesis.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Fact icon={Target} label="Topik">{thesis.topic}</Fact>
          <Fact icon={Clock} label="Periode">{thesis.academicYear}</Fact>
          <Fact icon={FileText} label="Sesi bimbingan selesai">{thesis.stats.guidances} sesi</Fact>
          <Fact icon={CheckCircle2} label="Milestone selesai">{thesis.stats.completedMilestones}</Fact>
        </div>

        {thesis.status === "failed" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground">Alasan penghentian</p>
            <p className="text-sm font-medium">
              {thesis.terminationReason ? getThesisTerminationReasonLabel(thesis.terminationReason) : "Tidak dicatat"}
            </p>
            {thesis.terminationNote && (
              <p className="mt-1 text-sm whitespace-pre-line [overflow-wrap:anywhere]">{thesis.terminationNote}</p>
            )}
          </div>
        )}

        {supervisors.length > 0 && (
          <div className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
            <ul className="space-y-0.5">
              {supervisors.map((supervisor) => (
                <li key={`${supervisor.id}-${supervisor.role}`}>
                  {formatRoleName(supervisor.role)}: <span className="font-medium text-foreground">{formatLecturerName(supervisor.name) || "-"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tab "Riwayat": the student's other theses, i.e. every ended thesis (Selesai or Gagal)
 * except the one shown under "Tugas Akhir Saat Ini", with the reason a thesis was stopped.
 */
export function StudentThesisHistoryPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-thesis-history"],
    queryFn: getStudentThesisHistory,
    retry: false,
  });
  // The same query the first tab uses: its thesis is not history.
  const { data: latest, isLoading: isLoadingLatest } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: getMyThesisDetail,
    retry: false,
  });

  if (isLoading || isLoadingLatest) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat riwayat tugas akhir..." />
      </div>
    );
  }

  const currentId = latest && isShownAsCurrentThesis(latest.status) ? latest.id : null;
  const ended = (data?.theses ?? []).filter(
    (thesis) => thesis.id !== currentId && (thesis.status === "completed" || thesis.status === "failed"),
  );
  if (ended.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Riwayat"
        description="Tugas akhir Anda sebelum yang sekarang, baik yang selesai maupun yang dihentikan, akan tampil di sini."
      />
    );
  }

  return (
    <div className="space-y-6">
      {ended.map((thesis) => <HistoryCard key={thesis.id} thesis={thesis} />)}
    </div>
  );
}
