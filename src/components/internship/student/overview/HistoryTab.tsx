import { InternshipTable, type Column } from "@/components/internship/InternshipTable";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { getInternshipStatusBadge } from "@/lib/internship/status";
import { formatDateId } from "@/lib/text";
import type { InternshipAssessmentScoreItem, StudentInternshipHistoryItem } from "@/services/internship.service";
import {
    Award,
    BookOpen,
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    FileText,
    GraduationCap,
    MapPin,
    MessageSquareText,
    User,
} from "lucide-react";
import { useMemo, useState } from "react";

interface HistoryTabProps {
    items: StudentInternshipHistoryItem[];
    isLoading: boolean;
}

type PreviewDoc = {
    id: string;
    fileName: string;
    filePath: string;
};

type HistoryDocumentRow = {
    id: string;
    label: string;
    doc: PreviewDoc;
    status?: string | null;
};

function formatOptionalDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return formatDateId(date);
}

function getAcademicYear(item: StudentInternshipHistoryItem) {
    const academicYear = item.proposal?.academicYear;
    if (!academicYear?.year) return "-";
    const semester = academicYear.semester
        ? academicYear.semester.charAt(0).toUpperCase() + academicYear.semester.slice(1)
        : "";
    return `${academicYear.year}${semester ? ` ${semester}` : ""}`;
}

function getDocumentStatusBadge(status?: string | null) {
    if (status === "APPROVED") return <Badge className="bg-green-600">Disetujui</Badge>;
    if (status === "SUBMITTED") return <Badge variant="secondary">Diajukan</Badge>;
    if (status === "REVISION_NEEDED") return <Badge variant="destructive">Revisi</Badge>;
    return <Badge variant="outline">-</Badge>;
}

function getSupervisorName(item: StudentInternshipHistoryItem) {
    return item.supervisor?.user?.fullName
        || item.supLetter?.supervisor?.user?.fullName
        || "-";
}

function getGuidanceStatusBadge(status?: string | null) {
    if (status === "APPROVED") return <Badge className="bg-green-600">Disetujui</Badge>;
    if (status === "SUBMITTED") return <Badge variant="secondary">Diajukan</Badge>;
    if (status === "LATE") return <Badge variant="destructive">Terlambat</Badge>;
    return <Badge variant="outline">{status || "-"}</Badge>;
}

function formatScore(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    return value.toFixed(2);
}

function getAssessmentScoreSummary(scores?: InternshipAssessmentScoreItem[]) {
    const validScores = (scores || []).filter((score) => typeof score.score === "number");
    if (!validScores.length) {
        return {
            averageScore: null,
            weightedScore: null,
            totalWeight: 0,
            count: 0,
        };
    }

    const totalScore = validScores.reduce((sum, score) => sum + score.score, 0);
    const totalWeight = validScores.reduce((sum, score) => sum + (score.chosenRubric?.cpmk?.weight || 0), 0);
    const weightedScore = validScores.reduce((sum, score) => {
        const weight = score.chosenRubric?.cpmk?.weight || 0;
        return sum + (score.score * weight / 100);
    }, 0);

    return {
        averageScore: totalScore / validScores.length,
        weightedScore,
        totalWeight,
        count: validScores.length,
    };
}

export function HistoryTab({ items, isLoading }: HistoryTabProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
    const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

    const sortedItems = useMemo(() => items ?? [], [items]);

    const toggleExpanded = (id: string) => {
        setExpandedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const openPreview = (doc?: PreviewDoc | null) => {
        if (!doc?.fileName || !doc?.filePath) return;
        setPreviewDoc(doc);
    };

    const documentColumns: Column<HistoryDocumentRow>[] = [
        {
            key: "label",
            header: "Dokumen",
            render: (row) => (
                <div className="min-w-0">
                    <p className="text-sm font-medium">{row.label}</p>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            className: "w-40",
            render: (row) => row.status ? getDocumentStatusBadge(row.status) : <Badge variant="outline">Arsip</Badge>,
        },
        {
            key: "action",
            header: "",
            className: "w-28 text-right",
            render: (row) => (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openPreview(row.doc)}
                >
                    <FileText className="h-4 w-4" />
                    Lihat
                </Button>
            ),
        },
    ];

    const logbookColumns: Column<NonNullable<StudentInternshipHistoryItem["logbooks"]>[number]>[] = [
        {
            key: "activityDate",
            header: "Tanggal",
            className: "w-44",
            render: (row) => <span className="text-sm font-medium">{formatOptionalDate(row.activityDate)}</span>,
        },
        {
            key: "activityDescription",
            header: "Aktivitas",
            render: (row) => (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {row.activityDescription?.trim() || "-"}
                </p>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="flex h-80 items-center justify-center">
                <Loading size="lg" text="Memuat riwayat Kerja Praktik..." />
            </div>
        );
    }

    if (!sortedItems.length) {
        return (
            <EmptyState
                title="Belum Ada Riwayat KP"
                description="Riwayat akan tersedia setelah Kerja Praktik dinyatakan selesai atau gagal."
            />
        );
    }

    return (
        <div className="space-y-4">
            {sortedItems.map((item) => {
                const isExpanded = expandedIds.has(item.id);
                const isFailed = item.status === "FAILED";
                const company = item.proposal?.targetCompany;
                const completedSeminars = (item.seminars ?? []).filter((seminar: any) => seminar.status === "COMPLETED");
                const guidanceSessions = item.guidanceSessions ?? [];
                const filledGuidanceSessions = guidanceSessions.filter((session) => (session.studentAnswers?.length || 0) > 0);
                const logbooks = item.logbooks ?? [];
                const filledLogbooks = logbooks.filter((logbook) => logbook.activityDescription?.trim()).length;
                const supervisorName = getSupervisorName(item);
                const fieldSupervisorName = item.fieldSupervisorName?.trim() || "-";
                const fieldSupervisorEmail = item.fieldSupervisorEmail?.trim();
                const lecturerScoreSummary = getAssessmentScoreSummary(item.lecturerScores);
                const fieldScoreSummary = getAssessmentScoreSummary(item.fieldScores);
                const reportingDocuments = [
                    { id: "proposal", label: "Proposal", doc: item.proposal?.proposalDocument },
                    { id: "application-letter", label: "Surat Permohonan", doc: item.proposal?.appLetterDoc },
                    { id: "company-response", label: "Surat Balasan", doc: item.proposal?.companyResponseDoc },
                    { id: "assignment-letter", label: "Surat Tugas", doc: item.proposal?.assignLetterDoc },
                    { id: "company-report", label: "Laporan Instansi", doc: item.companyReportDoc, status: item.companyReportStatus },
                    { id: "logbook-doc", label: "Logbook", doc: item.logbookDocument, status: item.logbookDocumentStatus },
                    { id: "receipt", label: "Tanda Terima", doc: item.companyReceiptDoc, status: item.companyReceiptStatus },
                    { id: "certificate", label: "Sertifikat", doc: item.completionCertificateDoc, status: item.completionCertificateStatus },
                    { id: "final-report", label: "Laporan Akhir", doc: item.reportDocument, status: item.reportStatus },
                ].filter((entry): entry is HistoryDocumentRow => Boolean(entry.doc));

                return (
                    <Card key={item.id} className={isFailed ? "border-red-200" : ""}>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-lg">
                                            {company?.companyName || "Perusahaan tidak tersedia"}
                                        </CardTitle>
                                        {getInternshipStatusBadge(item.status)}
                                    </div>
                                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatOptionalDate(item.actualStartDate)} - {formatOptionalDate(item.actualEndDate)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4" />
                                            {getAcademicYear(item)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Dosen: <span className="font-medium text-foreground">{supervisorName}</span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Lapangan: <span className="font-medium text-foreground">{fieldSupervisorName}</span>
                                            {fieldSupervisorEmail ? <span className="text-xs">({fieldSupervisorEmail})</span> : null}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {company?.companyAddress || "-"}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 self-start"
                                    onClick={() => toggleExpanded(item.id)}
                                >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    Rincian
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-4">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Nilai Akhir</p>
                                    <div className="mt-2 flex items-end gap-2">
                                        <span className={isFailed ? "text-2xl font-black text-red-600" : "text-2xl font-black text-primary"}>
                                            {item.finalGrade || "-"}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {item.finalNumericScore !== null && item.finalNumericScore !== undefined
                                                ? item.finalNumericScore.toFixed(2)
                                                : "-"}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Seminar</p>
                                    <p className="mt-2 text-2xl font-black">{completedSeminars.length}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Logbook Terisi</p>
                                    <p className="mt-2 text-2xl font-black">{filledLogbooks}/{logbooks.length}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Dokumen</p>
                                    <p className="mt-2 text-2xl font-black">{reportingDocuments.length}</p>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="space-y-5 pt-2">
                                    <Separator />

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <FileText className="h-4 w-4" />
                                            Dokumen
                                        </h3>
                                        <InternshipTable
                                            columns={documentColumns}
                                            data={reportingDocuments}
                                            total={reportingDocuments.length}
                                            page={1}
                                            pageSize={reportingDocuments.length || 1}
                                            onPageChange={() => {}}
                                            rowKey={(row) => row.id}
                                            hidePagination
                                            unstyled
                                            emptyText="Belum ada dokumen tercatat."
                                        />
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <BookOpen className="h-4 w-4" />
                                            Bimbingan
                                        </h3>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-xs text-muted-foreground">Dosen Pembimbing</p>
                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                    {getSupervisorName(item)}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border bg-background p-3">
                                                <p className="text-xs text-muted-foreground">Bimbingan Terisi</p>
                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                    {guidanceSessions.length > 0 ? `${filledGuidanceSessions.length}/${guidanceSessions.length} minggu` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        {guidanceSessions.length > 0 ? (
                                            <div className="rounded-lg border bg-background p-3">
                                                <div className="grid gap-2 text-sm">
                                                    {guidanceSessions.map((session) => (
                                                        <div key={session.id} className="rounded-md border p-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="font-medium">Minggu {session.weekNumber}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {session.studentAnswers?.length || 0} jawaban, {session.lecturerAnswers?.length || 0} evaluasi dosen
                                                                    </p>
                                                                </div>
                                                                {getGuidanceStatusBadge(session.status)}
                                                            </div>
                                                            {(session.studentAnswers?.length || 0) > 0 && (
                                                                <div className="mt-3 space-y-2 border-t pt-3">
                                                                    {session.studentAnswers?.slice(0, 2).map((answer, index) => (
                                                                        <div key={`${session.id}-${answer.questionId}-${index}`} className="text-xs">
                                                                            <p className="font-medium text-foreground">
                                                                                {answer.question?.questionText || `Jawaban ${index + 1}`}
                                                                            </p>
                                                                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                                                                {answer.answerText || "-"}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                    {(session.studentAnswers?.length || 0) > 2 && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            +{(session.studentAnswers?.length || 0) - 2} jawaban lainnya
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada data bimbingan.</p>
                                        )}
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <Award className="h-4 w-4" />
                                            Penilaian
                                        </h3>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-lg border bg-background p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium">Dosen Pembimbing</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {lecturerScoreSummary.count > 0
                                                                ? `${lecturerScoreSummary.count} komponen, bobot ${formatScore(lecturerScoreSummary.totalWeight)}%`
                                                                : "Nilai belum tersedia"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-primary">
                                                            {formatScore(lecturerScoreSummary.averageScore)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Kontribusi {formatScore(lecturerScoreSummary.weightedScore)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border bg-background p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium">Pembimbing Lapangan</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {fieldScoreSummary.count > 0
                                                                ? `${fieldScoreSummary.count} komponen, bobot ${formatScore(fieldScoreSummary.totalWeight)}%`
                                                                : "Nilai belum tersedia"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-primary">
                                                            {formatScore(fieldScoreSummary.averageScore)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Kontribusi {formatScore(fieldScoreSummary.weightedScore)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.fieldAssessmentNotes && (
                                                    <div className="mt-3 flex gap-2 text-sm text-muted-foreground">
                                                        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
                                                        <p className="whitespace-pre-wrap leading-relaxed">{item.fieldAssessmentNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <Calendar className="h-4 w-4" />
                                            Seminar
                                        </h3>
                                        {completedSeminars.length > 0 ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {completedSeminars.map((seminar: any) => (
                                                    <div key={seminar.id} className="rounded-lg border bg-background p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-medium">{formatOptionalDate(seminar.seminarDate)}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {seminar.startTime?.slice(11, 16) || "-"} - {seminar.endTime?.slice(11, 16) || "-"}
                                                                    {seminar.room?.name ? `, ${seminar.room.name}` : ""}
                                                                </p>
                                                            </div>
                                                            {getInternshipStatusBadge(seminar.status)}
                                                        </div>
                                                        {seminar.beritaAcaraDocument && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-3 gap-2"
                                                                onClick={() => openPreview(seminar.beritaAcaraDocument)}
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                                Berita Acara
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada seminar selesai tercatat.</p>
                                        )}
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <ClipboardList className="h-4 w-4" />
                                            Logbook
                                        </h3>
                                        <div className="max-h-96 overflow-y-auto">
                                            <InternshipTable
                                                columns={logbookColumns}
                                                data={logbooks}
                                                total={logbooks.length}
                                                page={1}
                                                pageSize={logbooks.length || 1}
                                                onPageChange={() => {}}
                                                rowKey={(row) => row.id}
                                                hidePagination
                                                unstyled
                                                emptyText="Belum ada logbook tercatat."
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                                            <Building2 className="h-4 w-4" />
                                            Laporan Akhir
                                        </h3>
                                        <div className="rounded-lg border bg-background p-3">
                                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">{item.reportTitle || "Judul laporan belum tersedia"}</p>
                                                    <p className="text-xs text-muted-foreground">Diunggah: {formatOptionalDate(item.reportUploadedAt)}</p>
                                                </div>
                                                {getDocumentStatusBadge(item.reportStatus)}
                                            </div>
                                            {item.reportNotes && (
                                                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{item.reportNotes}</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            <DocumentPreviewDialog
                open={!!previewDoc}
                onOpenChange={(open) => {
                    if (!open) setPreviewDoc(null);
                }}
                fileName={previewDoc?.fileName}
                filePath={previewDoc?.filePath}
            />
        </div>
    );
}
