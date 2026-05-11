import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, FileSignature, Lock, ShieldCheck, AlertTriangle } from "lucide-react";

import { assessmentService } from "@/services/assessment.service";
import type { StudentDetail } from "@/services/lecturerGuidance.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loading, Spinner } from "@/components/ui/spinner";
import { RubricGradingForm } from "@/components/metopen/RubricGradingForm";
import { formatDateId, toTitleCaseName } from "@/lib/text";

interface ComponentProps {
    thesisId: string;
    scoreData?: StudentDetail["researchMethodScore"];
}

/**
 * SupervisorScoreCard
 *
 * BR-20 (canon §5.7.1) + BR-21 (canon §5.7.2) + audit P0-07/P0-08/P1-10:
 * - Pembimbing 1 = master pengisi rubrik utuh (POST/PUT). Variant: form full edit.
 * - Pembimbing 2 = co-sign (read + audit-trail tombol). Variant: read-only score
 *   + tombol "Berikan Co-sign" yang membuka dialog konsensus.
 * - Lecturer lain (KaDep/Sekdep/penguji/dst) yang membuka detail mahasiswa →
 *   read-only ringkasan, tanpa interaksi.
 * - Setelah `isFinalized = true`: TIDAK ADA tombol Edit/Submit/Cosign apa pun
 *   (immutable post-submit). Banner finalitas wajib tampil.
 */
export function SupervisorScoreCard({ thesisId, scoreData }: ComponentProps) {
    const queryClient = useQueryClient();
    const [coSignNote, setCoSignNote] = useState("");

    // Fetch supervisor context untuk menentukan role caller (P1/P2/null)
    const {
        data: context,
        isLoading: isLoadingContext,
        isError: isContextError,
    } = useQuery({
        queryKey: ["assessment-supervisor-context", thesisId],
        queryFn: () => assessmentService.getSupervisorContext(thesisId),
        enabled: !!thesisId,
    });

    // Fetch score detail (termasuk co-sign info + detail rubrik)
    const { data: scoreDetail } = useQuery({
        queryKey: ["assessment-supervisor-score-detail", thesisId],
        queryFn: () => assessmentService.getSupervisorScoreDetail(thesisId),
        enabled: !!thesisId,
    });

    const coSignMutation = useMutation({
        mutationFn: (note: string | null) => assessmentService.coSignSupervisorScore(thesisId, note),
        onSuccess: () => {
            toast.success("Co-sign Pembimbing 2 berhasil dicatat. Penilaian TA-03A finalisasi konsensus.");
            queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-score-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["student-detail", thesisId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-kadep-title-reports"] });
            setCoSignNote("");
        },
        onError: (err: Error) => {
            toast.error(err.message || "Gagal melakukan co-sign");
        },
    });

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
    const supervisorScore = scoreDetail?.supervisorScore ?? scoreData?.supervisorScore ?? null;
    const lecturerScore = scoreDetail?.lecturerScore ?? scoreData?.lecturerScore ?? null;
    const finalScore = scoreDetail?.finalScore ?? scoreData?.finalScore ?? null;
    const isFinalized = scoreDetail?.isFinalized ?? scoreData?.isFinalized ?? false;
    const coSignedAt = scoreDetail?.coSignedAt ?? null;
    const coSignerName = scoreDetail?.coSigner?.user?.fullName
        ? toTitleCaseName(scoreDetail.coSigner.user.fullName)
        : null;
    const coSignNoteValue = scoreDetail?.coSignNote ?? null;
    const isP1Submitted = supervisorScore != null;
    const needsCoSign = hasP2 && isP1Submitted && coSignedAt == null;

    /** Section ringkasan status TA-03A + TA-03B + finalScore.
     *  Selalu tampil supaya semua aktor (P1, P2, dan read-only viewer)
     *  melihat snapshot konsensus yang sama. */
    const summarySection = (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">Ringkasan Penilaian Proposal</CardTitle>
                        <CardDescription>
                            TA-03A (Pembimbing) maks 75 — TA-03B (Koordinator Metopen) maks 25 — Total maks 100
                        </CardDescription>
                    </div>
                    {isFinalized ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            <Lock className="mr-1 h-3 w-3" /> Final
                        </Badge>
                    ) : isP1Submitted ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            Dalam Proses
                        </Badge>
                    ) : (
                        <Badge variant="outline">Belum dimulai</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">TA-03A (P1{hasP2 ? " + P2 cosign" : ""})</p>
                        <p className="text-base font-semibold">
                            {supervisorScore != null ? `${supervisorScore} / 75` : "-"}
                        </p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">TA-03B (Koordinator)</p>
                        <p className="text-base font-semibold">
                            {lecturerScore != null ? `${lecturerScore} / 25` : "-"}
                        </p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Total Final</p>
                        <p className="text-base font-semibold">
                            {finalScore != null ? `${finalScore} / 100` : "-"}
                        </p>
                    </div>
                </div>
                {hasP2 && (
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs">
                        {coSignedAt ? (
                            <p>
                                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                                Co-sign Pembimbing 2{coSignerName ? ` (${coSignerName})` : ""} pada {formatDateId(coSignedAt)}.
                                {coSignNoteValue ? <span className="ml-1 text-muted-foreground">Catatan: {coSignNoteValue}</span> : null}
                            </p>
                        ) : isP1Submitted ? (
                            <p className="text-amber-700">
                                Pembimbing 2 belum melakukan co-sign. Penilaian TA-03A baru dianggap final konsensus setelah co-sign tercatat.
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                Pembimbing 2 akan dapat co-sign setelah Pembimbing 1 submit penilaian.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    /** Banner immutable post-submit (BR-21).
     *  Tampil ketika isFinalized = true. Pesan eksplisit agar tidak ambigu. */
    const immutableBanner = isFinalized ? (
        <Alert className="border-emerald-200 bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-800">Penilaian sudah final dan tidak dapat direvisi</AlertTitle>
            <AlertDescription className="text-emerald-700">
                Sesuai canon §5.7.2, nilai TA-03A {hasP2 ? "(termasuk co-sign Pembimbing 2)" : ""} dan TA-03B kunci permanen pasca submit. Ini menjaga integritas state pendaftaran (Beban Aktif vs Booking) sebelum TA-04 disahkan KaDep.
                <br />
                Revisi konten proposal hanya berlaku di fase bimbingan informal pra-submit final.
            </AlertDescription>
        </Alert>
    ) : null;

    /** Variant render per role */
    if (role === "P1") {
        // P1: master pengisi. Form full edit ketika belum final.
        return (
            <div className="space-y-4">
                {summarySection}
                {immutableBanner}
                {!isFinalized && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <FileSignature className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="text-blue-800">
                            Anda Pembimbing 1 (master pengisi TA-03A)
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Anda mengisi rubrik penilaian utuh (maks 75 poin) atas <strong>konsensus</strong> dengan {hasP2 ? "Pembimbing 2 (akan co-sign setelah Anda submit)" : "diri sendiri (thesis hanya 1 pembimbing)"}. Setelah submit, sistem akan menunggu {hasP2 ? "co-sign P2 + " : ""}TA-03B Koordinator Metopen untuk auto-finalisasi dan memicu antrean TA-04 ke KaDep.
                        </AlertDescription>
                    </Alert>
                )}
                {!isFinalized && (
                    <RubricGradingForm
                        thesisId={thesisId}
                        formCode="TA-03A"
                        submitButtonLabel={hasP2 ? "Submit Penilaian (atas konsensus dengan P2)" : "Submit Penilaian TA-03A"}
                        submitConfirmText={
                            hasP2
                                ? "Setelah submit, Pembimbing 2 perlu co-sign untuk finalisasi. Pasca finalisasi, nilai akan dikunci permanen dan memicu antrean TA-04 ke KaDep otomatis."
                                : "Setelah submit + TA-03B masuk, nilai akan dikunci permanen dan memicu antrean TA-04 ke KaDep otomatis. Pastikan rubrik sudah benar."
                        }
                    />
                )}
            </div>
        );
    }

    if (role === "P2") {
        // P2: read + co-sign. Tidak boleh edit nilai.
        return (
            <div className="space-y-4">
                {summarySection}
                {immutableBanner}
                {!isFinalized && (
                    <Alert className="border-purple-200 bg-purple-50">
                        <FileSignature className="h-5 w-5 text-purple-600" />
                        <AlertTitle className="text-purple-800">
                            Anda Pembimbing 2 (co-sign TA-03A)
                        </AlertTitle>
                        <AlertDescription className="text-purple-700">
                            Pembimbing 1 yang mengisi rubrik utuh; Anda berperan sebagai <strong>co-sign</strong> persetujuan konsensus. Co-sign tidak mengubah nilai — hanya menambah audit trail bahwa kedua pembimbing setuju. Selaras formulir TA-03A cetak yang punya satu blok tanda tangan tunggal &ldquo;Dosen Pembimbing&rdquo;.
                        </AlertDescription>
                    </Alert>
                )}
                {!isFinalized && needsCoSign && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Berikan Co-sign Konsensus</CardTitle>
                            <CardDescription>
                                Anda menyetujui penilaian TA-03A yang diisi Pembimbing 1. Catatan opsional, mis. ringkasan diskusi konsensus.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="cosign-note">Catatan Co-sign (opsional)</Label>
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
                                    <Button disabled={coSignMutation.isPending} className="w-full sm:w-auto">
                                        {coSignMutation.isPending ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" /> Mencatat co-sign...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Saya menyetujui penilaian ini (Co-sign)
                                            </>
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi Co-sign Pembimbing 2</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Setelah co-sign tercatat, nilai TA-03A tidak dapat direvisi (canon §5.7.2). Bila TA-03B juga sudah masuk, sistem akan auto-finalisasi dan memicu antrean TA-04 ke KaDep. Pastikan Anda sudah berdiskusi konsensus dengan Pembimbing 1.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => coSignMutation.mutate(coSignNote.trim() || null)}
                                        >
                                            Ya, Berikan Co-sign
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
                            Pembimbing 1 belum mengisi rubrik TA-03A. Tombol co-sign akan aktif setelah Pembimbing 1 submit.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        );
    }

    // role === null → bukan pembimbing aktif → read-only ringkasan saja.
    return (
        <div className="space-y-4">
            {summarySection}
            {immutableBanner}
            <Alert className="border-border bg-muted/30">
                <FileSignature className="h-5 w-5 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                    Anda bukan pembimbing aktif untuk thesis ini. Hanya Pembimbing 1 (master pengisi) dan Pembimbing 2 (co-sign) yang dapat berinteraksi dengan rubrik TA-03A.
                </AlertDescription>
            </Alert>
        </div>
    );
}
