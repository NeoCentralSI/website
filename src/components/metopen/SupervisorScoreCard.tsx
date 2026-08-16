import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    FileSignature,
    Lock,
    ShieldCheck,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loading, Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { RubricGradingForm } from "@/components/metopen/RubricGradingForm";
import {
    assessmentService,
    type ResearchMethodScoreWithDetails,
    type ResearchMethodScoreDetailItem,
} from "@/services/assessment.service";
import type { StudentDetail } from "@/services/lecturerGuidance.service";
import { formatDateId, toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";

interface ComponentProps {
    thesisId: string;
    academicYearId?: string | null;
    scoreData?: StudentDetail["researchMethodScore"];
    lockMutations?: boolean;
}

/**
 * SupervisorScoreCard
 *
 * BR-20 (canon §5.7.1) + BR-21 (canon §5.7.2) + BR-28 (canon §5.7.3):
 * - Pembimbing 1 = master pengisi rubrik utuh (POST/PUT). Variant: form full edit.
 * - Pembimbing 2 = co-sign (read + audit-trail tombol). Variant: read-only score
 *   + tombol "Berikan Co-sign" yang membuka dialog konsensus.
 * - Lecturer lain (KaDep/Sekdep/penguji/dst) yang membuka detail mahasiswa →
 *   read-only ringkasan, tanpa interaksi.
 * - Setelah `isFinalized = true`: TIDAK ADA tombol Edit/Submit/Cosign apa pun.
 *   Banner finalitas + breakdown 4 bucket wajib tampil.
 */
export function SupervisorScoreCard({ thesisId, academicYearId, scoreData, lockMutations = false }: ComponentProps) {
    const queryClient = useQueryClient();
    const [coSignNote, setCoSignNote] = useState("");

    const {
        data: context,
        isLoading: isLoadingContext,
        isError: isContextError,
    } = useQuery({
        queryKey: ["assessment-supervisor-context", thesisId],
        queryFn: () => assessmentService.getSupervisorContext(thesisId),
        enabled: !!thesisId,
    });

    const { data: scoreDetail } = useQuery({
        queryKey: ["assessment-supervisor-score-detail", thesisId],
        queryFn: () => assessmentService.getSupervisorScoreDetail(thesisId),
        enabled: !!thesisId,
    });

    const coSignMutation = useMutation({
        mutationFn: (note: string | null) => assessmentService.coSignSupervisorScore(thesisId, note),
        onSuccess: () => {
            toast.success("Persetujuan Pembimbing 2 berhasil dicatat. Penilaian TA-03A finalisasi konsensus.");
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-score-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-history"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-queue"] });
            queryClient.invalidateQueries({ queryKey: ["assessment-metopen-history"] });
            queryClient.invalidateQueries({ queryKey: ["student-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["metopel-seminar-eligibility"] });
            queryClient.invalidateQueries({ queryKey: ["metopel-proposal-approval"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-kadep-title-reports"] });
            setCoSignNote("");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Gagal mencatat persetujuan");
        },
    });

    const summary = useMemo(() => buildScoreSummary(scoreDetail, scoreData), [scoreDetail, scoreData]);

    if (isLoadingContext) {
        return (
            <Card>
                <CardContent className="flex min-h-[120px] items-center justify-center">
                    <Loading text="Memuat konteks penilaian..." />
                </CardContent>
            </Card>
        );
    }

    if (isContextError) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                    Gagal memuat konteks penilaian TA-03A. Coba muat ulang halaman.
                </CardContent>
            </Card>
        );
    }

    const role = context?.role ?? null;
    const hasP2 = Boolean(context?.hasP2);
    const isFinalized = summary.isFinalized || lockMutations || Boolean(summary.periodClosedAt);
    const coSignedAt = summary.coSignedAt;
    const isP1Submitted = summary.supervisorScore != null;
    const needsCoSign = hasP2 && isP1Submitted && coSignedAt == null;

    const summarySection = (
        <SummaryCard
            summary={summary}
            hasP2={hasP2}
            isP1Submitted={isP1Submitted}
        />
    );

    const breakdownSection =
        summary.bucket.presentasi != null ||
        summary.bucket.konten != null ||
        summary.bucket.struktur != null ||
        summary.bucket.respon != null ? (
            <ScoreBreakdownCard summary={summary} />
        ) : null;

    // BR-20 (canon §5.7.1): Pembimbing 2 punya hak read penuh atas hasil TA-03B
    // walau tidak menilainya. Rincian rubrik per kriteria (role 'default').
    const ta03bDetailSection = (
        <Ta03bRubricDetailCard details={scoreDetail?.researchMethodScoreDetails} />
    );

    const immutableBanner = summary.isFinalized && !summary.periodClosedAt ? (
        <Alert className="border-emerald-200 bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-800">
                Penilaian sudah final dan tidak dapat direvisi
            </AlertTitle>
            <AlertDescription className="text-emerald-700">
                Nilai TA-03A {hasP2 ? "(termasuk persetujuan Pembimbing 2)" : ""} dan TA-03B sudah terkunci.
            </AlertDescription>
        </Alert>
    ) : null;

    const periodClosedBanner = summary.periodClosedAt ? (
        <Alert className="border-destructive/30 bg-destructive/5">
            <Ban className="h-5 w-5 text-destructive" />
            <AlertTitle>Periode Metode Penelitian ditutup</AlertTitle>
            <AlertDescription>
                Penilaian yang belum final pada periode ini diselesaikan dengan nilai 0. Form tidak dapat diubah.
            </AlertDescription>
        </Alert>
    ) : lockMutations ? (
        <Alert>
            <Lock className="h-5 w-5" />
            <AlertTitle>Riwayat tahun ajaran lama</AlertTitle>
            <AlertDescription>
                Penilaian hanya dapat diubah pada tahun ajaran operasional. Periode ini ditampilkan sebagai arsip.
            </AlertDescription>
        </Alert>
    ) : null;

    const attendanceAutoZeroBanner = summary.attendanceAutoZeroedAt ? (
        <Alert className="border-destructive/30 bg-destructive/5">
            <Ban className="h-5 w-5 text-destructive" />
            <AlertTitle>Nilai TA-03 otomatis 0 karena presensi Metopel kurang dari 75%</AlertTitle>
            <AlertDescription>
                {summary.attendanceAutoZeroReason ??
                    "Mahasiswa tidak memenuhi syarat presensi Metopel minimal 75%."}
                {summary.attendanceRecord ? (
                    <>
                        <br />
                        Presensi tercatat{" "}
                        {(summary.attendanceRecord.attendancePercentage * 100).toFixed(2)}% (
                        {summary.attendanceRecord.presentCount}/
                        {summary.attendanceRecord.totalMeetings} pertemuan), diproses pada{" "}
                        {formatDateId(summary.attendanceAutoZeroedAt)}.
                    </>
                ) : null}
            </AlertDescription>
        </Alert>
    ) : null;

    if (role === "P1") {
        return (
            <div className="space-y-4">
                {summarySection}
                {breakdownSection}
                {ta03bDetailSection}
                {periodClosedBanner}
                {attendanceAutoZeroBanner}
                {immutableBanner}
                {!isFinalized && !isP1Submitted && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <FileSignature className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="text-blue-800">
                            Anda Pembimbing 1 — pengisi utama TA-03A
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Isi rubrik TA-03A (maks {summary.ta03aCap} poin)
                            {hasP2
                                ? ". Setelah diserahkan, Pembimbing 2 memberi persetujuan."
                                : "."}{" "}
                            Finalisasi menunggu{hasP2 ? " persetujuan P2 dan" : ""} nilai TA-03B.
                        </AlertDescription>
                    </Alert>
                )}
                {!isFinalized && isP1Submitted && !summary.attendanceAutoZeroedAt && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <FileSignature className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="text-blue-800">
                            TA-03A sudah diserahkan oleh Pembimbing 1
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Rubrik TA-03A sudah diserahkan. Menunggu{" "}
                            {hasP2 && !coSignedAt ? "persetujuan Pembimbing 2" : "nilai TA-03B"}.
                        </AlertDescription>
                    </Alert>
                )}
                {!isFinalized && !isP1Submitted && !summary.attendanceAutoZeroedAt && (
                    <RubricGradingForm
                        thesisId={thesisId}
                        formCode="TA-03A"
                        academicYearId={academicYearId}
                        submitButtonLabel={
                            hasP2
                                ? "Serahkan penilaian (atas konsensus dengan P2)"
                                : "Serahkan penilaian TA-03A"
                        }
                        submitConfirmText={
                            hasP2
                                ? "Setelah diserahkan, Pembimbing 2 perlu memberi persetujuan. Nilai tidak dapat diubah setelah final."
                                : "Setelah TA-03B masuk, nilai tidak dapat diubah. Pastikan rubrik sudah benar."
                        }
                    />
                )}
            </div>
        );
    }

    if (role === "P2") {
        return (
            <div className="space-y-4">
                {summarySection}
                {breakdownSection}
                {ta03bDetailSection}
                {periodClosedBanner}
                {attendanceAutoZeroBanner}
                {immutableBanner}
                {!isFinalized && (
                    <Alert className="border-violet-200 bg-violet-50">
                        <FileSignature className="h-5 w-5 text-violet-600" />
                        <AlertTitle className="text-violet-800">
                            Anda Pembimbing 2 — persetujuan TA-03A
                        </AlertTitle>
                        <AlertDescription className="text-violet-700">
                            Pembimbing 1 mengisi rubrik; Anda memberi <strong>persetujuan</strong>. Persetujuan tidak mengubah nilai.
                        </AlertDescription>
                    </Alert>
                )}
                {!isFinalized && needsCoSign && (
                    <Card className="border-violet-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Berikan persetujuan konsensus</CardTitle>
                            <CardDescription>
                                Anda menyetujui penilaian TA-03A yang diisi Pembimbing 1. Catatan opsional,
                                misalnya ringkasan diskusi konsensus.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="cosign-note">Catatan persetujuan (opsional)</Label>
                                <Textarea
                                    id="cosign-note"
                                    placeholder="Mis. Saya setuju dengan penilaian rubrik ini setelah berdiskusi dengan Pembimbing 1."
                                    value={coSignNote}
                                    onChange={(e) => setCoSignNote(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={coSignMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {coSignMutation.isPending ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Mencatat persetujuan...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Berikan persetujuan
                                            </>
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi persetujuan Pembimbing 2</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Setelah persetujuan tercatat, nilai TA-03A tidak dapat diubah.
                                            Pastikan Anda sudah berdiskusi dengan Pembimbing 1.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => coSignMutation.mutate(coSignNote.trim() || null)}
                                        >
                                            Ya, berikan persetujuan
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                )}
                {!isFinalized && !isP1Submitted && (
                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <AlertDescription className="text-amber-700">
                            Pembimbing 1 belum mengisi rubrik TA-03A. Tombol persetujuan akan aktif setelah
                            Pembimbing 1 serahkan penilaian.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        );
    }

    // role === null → bukan pembimbing aktif → read-only ringkasan + breakdown
    return (
        <div className="space-y-4">
            {summarySection}
            {breakdownSection}
            {ta03bDetailSection}
            {periodClosedBanner}
            {attendanceAutoZeroBanner}
            {immutableBanner}
            <Alert className="border-border bg-muted/30">
                <FileSignature className="h-5 w-5 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                    Anda bukan pembimbing aktif untuk thesis ini. Hanya Pembimbing 1 (pengisi utama) dan
                    Pembimbing 2 (persetujuan) yang dapat berinteraksi dengan rubrik TA-03A.
                </AlertDescription>
            </Alert>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

interface ScoreSummary {
    supervisorScore: number | null;
    lecturerScore: number | null;
    finalScore: number | null;
    isFinalized: boolean;
    coSignedAt: string | null;
    coSignerName: string | null;
    coSignNote: string | null;
    attendanceAutoZeroedAt: string | null;
    attendanceAutoZeroReason: string | null;
    periodClosedAt: string | null;
    attendanceRecord: {
        attendancePercentage: number;
        presentCount: number;
        totalMeetings: number;
    } | null;
    ta03aCap: number;
    ta03bCap: number;
    bucket: {
        presentasi: number | null;
        konten: number | null;
        struktur: number | null;
        respon: number | null;
    };
}

function buildScoreSummary(
    scoreDetail: ResearchMethodScoreWithDetails | null | undefined,
    scoreData?: StudentDetail["researchMethodScore"],
): ScoreSummary {
    const detail = scoreDetail ?? null;
    const supervisorScore = detail?.supervisorScore ?? scoreData?.supervisorScore ?? null;
    const lecturerScore = detail?.lecturerScore ?? scoreData?.lecturerScore ?? null;
    const finalScore = detail?.finalScore ?? scoreData?.finalScore ?? null;
    const isFinalized = detail?.isFinalized ?? scoreData?.isFinalized ?? false;
    const coSignedAt = detail?.coSignedAt ?? null;
    const coSignerName = detail?.coSigner?.user?.fullName
        ? toTitleCaseName(detail.coSigner.user.fullName)
        : null;
    const coSignNote = detail?.coSignNote ?? null;
    const attendanceAutoZeroedAt =
        detail?.attendanceAutoZeroedAt ?? scoreData?.attendanceAutoZeroedAt ?? null;
    const attendanceAutoZeroReason =
        detail?.attendanceAutoZeroReason ?? scoreData?.attendanceAutoZeroReason ?? null;
    const periodClosedAt =
        detail?.periodClosedAt ?? scoreData?.periodClosedAt ?? null;
    const attendanceRecord = detail?.attendanceRecord ?? null;

    const details = detail?.researchMethodScoreDetails ?? [];
    const bucket = details.reduce<ScoreSummary["bucket"]>(
        (acc, item) => {
            const name = (item.criteria?.name ?? "").toLowerCase();
            const maxScore = item.criteria?.maxScore ?? null;
            if (name.includes("presentasi")) acc.presentasi = item.score;
            else if (name.includes("konten") && maxScore === 40) acc.konten = item.score;
            else if (name.includes("struktur") && maxScore === 25) acc.struktur = item.score;
            else if (name.includes("respon") || name.includes("merespon")) acc.respon = item.score;
            return acc;
        },
        { presentasi: null, konten: null, struktur: null, respon: null },
    );

    return {
        supervisorScore,
        lecturerScore,
        finalScore,
        isFinalized,
        coSignedAt,
        coSignerName,
        coSignNote,
        attendanceAutoZeroedAt,
        attendanceAutoZeroReason,
        periodClosedAt,
        attendanceRecord,
        ta03aCap: detail?.ta03aCap ?? 75,
        ta03bCap: detail?.ta03bCap ?? 25,
        bucket,
    };
}

function SummaryCard({
    summary,
    hasP2,
    isP1Submitted,
}: {
    summary: ScoreSummary;
    hasP2: boolean;
    isP1Submitted: boolean;
}) {
    const statusBadge = summary.isFinalized ? (
        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
            <Lock className="mr-1 h-3 w-3" /> Final
        </Badge>
    ) : isP1Submitted ? (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Dalam Proses
        </Badge>
    ) : (
        <Badge variant="outline">Belum dimulai</Badge>
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-base">Ringkasan Penilaian Proposal</CardTitle>
                        <CardDescription>
                            TA-03A Pembimbing maks {summary.ta03aCap} · TA-03B Koordinator Metopen maks{" "}
                            {summary.ta03bCap} · Total maks 100
                        </CardDescription>
                    </div>
                    {statusBadge}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <ScoreStatBlock
                        label={`TA-03A · Pembimbing${hasP2 ? " + persetujuan" : ""}`}
                        score={summary.supervisorScore}
                        max={summary.ta03aCap}
                        accent="blue"
                    />
                    <ScoreStatBlock
                        label="TA-03B · Koordinator"
                        score={summary.lecturerScore}
                        max={summary.ta03bCap}
                        accent="violet"
                    />
                    <ScoreStatBlock
                        label="Total Final"
                        score={summary.finalScore}
                        max={100}
                        accent="emerald"
                        prominent
                    />
                </div>

                {hasP2 ? (
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs">
                        {summary.coSignedAt ? (
                            <p>
                                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                                Persetujuan Pembimbing 2{summary.coSignerName ? ` · ${summary.coSignerName}` : ""}{" "}
                                pada {formatDateId(summary.coSignedAt)}.
                                {summary.coSignNote ? (
                                    <span className="ml-1 text-muted-foreground">
                                        Catatan: {summary.coSignNote}
                                    </span>
                                ) : null}
                            </p>
                        ) : isP1Submitted ? (
                            <p className="text-amber-700">
                                Pembimbing 2 belum memberi persetujuan. Penilaian TA-03A baru dianggap final
                                konsensus setelah persetujuan tercatat.
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                Pembimbing 2 akan dapat memberi persetujuan setelah Pembimbing 1 serahkan penilaian.
                            </p>
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

const STAT_ACCENTS: Record<"blue" | "violet" | "emerald", string> = {
    blue: "border-blue-200 bg-blue-50/60",
    violet: "border-violet-200 bg-violet-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
};

function ScoreStatBlock({
    label,
    score,
    max,
    accent,
    prominent = false,
}: {
    label: string;
    score: number | null;
    max: number;
    accent: keyof typeof STAT_ACCENTS;
    prominent?: boolean;
}) {
    const percentage = score != null ? Math.round((score / max) * 100) : 0;
    return (
        <div className={cn("rounded-md border px-3 py-2", STAT_ACCENTS[accent])}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span
                    className={cn(
                        "font-semibold tabular-nums",
                        prominent ? "text-2xl" : "text-base",
                    )}
                >
                    {score != null ? score : "—"}
                </span>
                <span className="text-xs text-muted-foreground">/ {max}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background">
                <div
                    className={cn(
                        "h-full transition-all",
                        accent === "blue" && "bg-blue-500",
                        accent === "violet" && "bg-violet-500",
                        accent === "emerald" && "bg-emerald-500",
                    )}
                    style={{ width: `${score != null ? percentage : 0}%` }}
                />
            </div>
        </div>
    );
}

function ScoreBreakdownCard({ summary }: { summary: ScoreSummary }) {
    const buckets: Array<{
        label: string;
        sub: string;
        score: number | null;
        max: number;
        cpmk: string;
    }> = [
        {
            label: "Presentasi lisan",
            sub: "TA-03A · CPMK-01",
            cpmk: "CPMK-01",
            score: summary.bucket.presentasi,
            max: 20,
        },
        {
            label: "Penulisan proposal (konten)",
            sub: "TA-03A · CPMK-02 — 4 sub",
            cpmk: "CPMK-02",
            score: summary.bucket.konten,
            max: 40,
        },
        {
            label: "Penulisan proposal (struktur)",
            sub: "TA-03B · CPMK-02 default",
            cpmk: "CPMK-02",
            score: summary.bucket.struktur,
            max: 25,
        },
        {
            label: "Kemampuan merespons",
            sub: "TA-03A · CPMK-03",
            cpmk: "CPMK-03",
            score: summary.bucket.respon,
            max: 15,
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rincian Skor per CPMK</CardTitle>
                <CardDescription>
                    Ringkasan skor per komponen penilaian.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                    {buckets.map((bucket) => {
                        const filled = bucket.score != null;
                        const percentage = filled ? Math.round((bucket.score! / bucket.max) * 100) : 0;
                        return (
                            <div
                                key={bucket.label}
                                className="rounded-md border bg-card px-3 py-2.5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{bucket.label}</p>
                                        <p className="text-[11px] text-muted-foreground">{bucket.sub}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold tabular-nums">
                                            {filled ? bucket.score : "—"}
                                            <span className="ml-0.5 text-xs text-muted-foreground">
                                                /{bucket.max}
                                            </span>
                                        </p>
                                        <Badge variant="outline" className="mt-0.5 text-[10px]">
                                            {bucket.cpmk}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary/70 transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Rincian rubrik TA-03B per kriteria (read-only). Memfilter detail kriteria
 * dengan role 'default' (TA-03B) dari payload yang sudah dikirim backend.
 * Dipakai oleh Pembimbing 1 & 2 (hak read penuh, canon §5.7.1) dan reviewer lain.
 */
function Ta03bRubricDetailCard({
    details,
}: {
    details?: ResearchMethodScoreDetailItem[] | null;
}) {
    const rows = useMemo(() => {
        const list = (details ?? []).filter(
            (d) => (d.criteria?.role ?? null) === "default",
        );
        return [...list].sort(
            (a, b) => (a.criteria?.displayOrder ?? 0) - (b.criteria?.displayOrder ?? 0),
        );
    }, [details]);

    if (rows.length === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                    Rincian Rubrik TA-03B (Koordinator Metopen)
                </CardTitle>
                <CardDescription>
                    Penilaian TA-03B oleh Koordinator Metopen (hanya lihat).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.map((row) => (
                    <div
                        key={row.assessmentCriteriaId}
                        className="rounded-md border bg-card px-3 py-2.5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    {row.criteria?.name ?? "Kriteria"}
                                </p>
                                {row.criteria?.metopenCpmk?.code ? (
                                    <p className="text-[11px] text-muted-foreground">
                                        {row.criteria.metopenCpmk.code}
                                    </p>
                                ) : null}
                            </div>
                            <p className="shrink-0 text-sm font-semibold tabular-nums">
                                {row.score}
                                <span className="ml-0.5 text-xs text-muted-foreground">
                                    /{row.criteria?.maxScore ?? "—"}
                                </span>
                            </p>
                        </div>
                        {row.assessmentRubric?.description ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {row.assessmentRubric.description}
                            </p>
                        ) : null}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
