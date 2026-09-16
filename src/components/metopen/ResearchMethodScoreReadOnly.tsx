import { useMemo } from "react";
import { AlertTriangle, Ban, CheckCircle2, ClipboardList, Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ResearchMethodScoreDetailItem,
  ResearchMethodScoreWithDetails,
} from "@/services/assessment.service";
import { formatDateId, toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";

interface ResearchMethodScoreReadOnlyProps {
  score: ResearchMethodScoreWithDetails | null | undefined;
  title?: string;
  description?: string;
  emptyText?: string;
}

export function ResearchMethodScoreReadOnly({
  score,
  title = "Riwayat Penilaian Proposal TA-03",
  description = "Ringkasan nilai dan detail rubrik TA-03A/TA-03B (hanya lihat).",
  emptyText = "Detail penilaian belum tersedia.",
}: ResearchMethodScoreReadOnlyProps) {
  const detailGroups = useMemo(() => {
    const details = [...(score?.researchMethodScoreDetails ?? [])].sort(
      (a, b) => (a.criteria?.displayOrder ?? 0) - (b.criteria?.displayOrder ?? 0),
    );
    return {
      ta03a: details.filter((item) => item.criteria?.role === "supervisor"),
      ta03b: details.filter((item) => item.criteria?.role === "default"),
    };
  }, [score?.researchMethodScoreDetails]);

  if (!score) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {emptyText}
        </CardContent>
      </Card>
    );
  }

  const finalScore =
    score.finalScore ??
    (score.supervisorScore != null && score.lecturerScore != null
      ? score.supervisorScore + score.lecturerScore
      : null);
  const isAutoZero = score.attendanceAutoZeroedAt != null;
  const ta03aCap = score.ta03aCap ?? 75;
  const ta03bCap = score.ta03bCap ?? 25;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "w-fit",
                score.isFinalized
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800",
              )}
            >
              {score.isFinalized ? (
                <>
                  <Lock className="mr-1 h-3 w-3" /> Final
                </>
              ) : (
                "Dalam Proses"
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <ScoreBox label="TA-03A Pembimbing" value={score.supervisorScore ?? null} max={ta03aCap} tone="blue" />
            <ScoreBox label="TA-03B Koordinator" value={score.lecturerScore ?? null} max={ta03bCap} tone="violet" />
            <ScoreBox label="Total Final" value={finalScore} max={100} tone="emerald" prominent />
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground">Status Persetujuan Pembimbing 2</p>
              {score.coSignedAt ? (
                <p className="mt-1 text-foreground">
                  <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                  Tercatat pada {formatDateId(score.coSignedAt)}
                  {score.coSigner?.user?.fullName
                    ? ` oleh ${toTitleCaseName(score.coSigner.user.fullName)}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">Belum ada / tidak diperlukan</p>
              )}
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground">Waktu Finalisasi</p>
              <p className="mt-1 text-foreground">
                {score.finalizedAt ? formatDateId(score.finalizedAt) : "Belum final"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAutoZero ? (
        <Alert className="border-destructive/30 bg-destructive/5">
          <Ban className="h-5 w-5 text-destructive" />
          <AlertTitle>Nilai TA-03 otomatis 0 karena presensi Metopel kurang dari 75%</AlertTitle>
          <AlertDescription>
            {score.attendanceAutoZeroReason ??
              "Mahasiswa tidak memenuhi syarat presensi Metopel minimal 75%."}
          </AlertDescription>
        </Alert>
      ) : null}

      <RubricDetailSection
        title="Detail Rubrik TA-03A"
        description="Diisi Pembimbing 1 sebagai master pengisi; Pembimbing 2 memberi co-sign bila ada."
        maxScore={ta03aCap}
        details={detailGroups.ta03a}
        emptyText="Detail rubrik TA-03A belum tersedia."
      />
      <RubricDetailSection
        title="Detail Rubrik TA-03B"
        description="Diisi Koordinator Matkul Metopen untuk sistematika/struktur proposal."
        maxScore={ta03bCap}
        details={detailGroups.ta03b}
        emptyText="Detail rubrik TA-03B belum tersedia."
      />
    </div>
  );
}

function ScoreBox({
  label,
  value,
  max,
  tone,
  prominent = false,
}: {
  label: string;
  value: number | null;
  max: number;
  tone: "blue" | "violet" | "emerald";
  prominent?: boolean;
}) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50/60",
    violet: "border-violet-200 bg-violet-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
  }[tone];

  return (
    <div className={cn("rounded-md border px-3 py-2", toneClass)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", prominent ? "text-2xl" : "text-base")}>
        {value ?? "—"} <span className="text-xs text-muted-foreground">/ {max}</span>
      </p>
    </div>
  );
}

function RubricDetailSection({
  title,
  description,
  maxScore,
  details,
  emptyText,
}: {
  title: string;
  description: string;
  maxScore: number;
  details: ResearchMethodScoreDetailItem[];
  emptyText: string;
}) {
  const total = details.reduce((sum, item) => sum + Number(item.score ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            {details.length > 0 ? `${total}/${maxScore}` : "-"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {details.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{emptyText}</span>
          </div>
        ) : (
          details.map((detail) => (
            <div
              key={`${detail.assessmentCriteriaId}-${detail.assessmentRubricId ?? "manual"}`}
              className="rounded-md border bg-card px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">
                    {detail.criteria?.metopenCpmk?.code ? `${detail.criteria.metopenCpmk.code} - ` : ""}
                    {detail.criteria?.name ?? "Kriteria"}
                  </p>
                  {detail.criteria?.metopenCpmk?.description ? (
                    <p className="text-[11px] text-muted-foreground">
                      {detail.criteria.metopenCpmk.description}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {detail.score}
                  <span className="ml-0.5 text-xs text-muted-foreground">
                    /{detail.criteria?.maxScore ?? "?"}
                  </span>
                </p>
              </div>
              {detail.assessmentRubric?.description ? (
                <p className="mt-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
                  {detail.assessmentRubric.description}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
