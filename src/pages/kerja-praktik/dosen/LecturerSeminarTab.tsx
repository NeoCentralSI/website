import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getLecturerGuidanceTimeline,
    approveSeminar,
    rejectSeminar,
    validateSeminarAudience,
    unvalidateSeminarAudience,
    bulkValidateSeminarAudience,
    updateSeminarNotes,
    completeSeminar,
    failSeminar,
} from '@/services/internship';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

import {
    Loader2,
    FileText,
    CalendarDays,
    MapPin,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Users,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import { ThesisSeminarAudienceTable } from '@/components/thesis-seminar/ThesisSeminarDetailAudienceTable';


export default function LecturerSeminarTab() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const queryClient = useQueryClient();

    const { data: studentGuidance, isLoading } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [isRejecting, setIsRejecting] = useState<string | null>(null);
    const [approvingParticipantId, setApprovingParticipantId] = useState<string | null>(null);
    const [unapprovingParticipantId, setUnapprovingParticipantId] = useState<string | null>(null);
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
    const [isBulkValidating, setIsBulkValidating] = useState(false);


    const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
    const [isCompleting, setIsCompleting] = useState<string | null>(null);
    const [isFailing, setIsFailing] = useState<string | null>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
    const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [showRejectedSubmissions, setShowRejectedSubmissions] = useState(false);
    const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
    const [confirmFailId, setConfirmFailId] = useState<string | null>(null);
    const [failNotes, setFailNotes] = useState('');
    const [previewDocument, setPreviewDocument] = useState<{
        open: boolean;
        fileName: string;
        filePath: string;
    }>({
        open: false,
        fileName: '',
        filePath: ''
    });

    const handleApprove = (seminarId: string) => {
        setConfirmApproveId(seminarId);
    };

    const processApprove = async (seminarId: string) => {
        setIsApproving(seminarId);
        try {
            await approveSeminar(seminarId);
            toast.success('Pengajuan seminar berhasil disetujui');
            setConfirmApproveId(null);
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyetujui seminar');
        } finally {
            setIsApproving(null);
        }
    };


    const handleReject = (seminarId: string) => {
        setRejectNotes('');
        setConfirmRejectId(seminarId);
    };

    const processReject = async (seminarId: string) => {
        setIsRejecting(seminarId);
        try {
            await rejectSeminar(seminarId, rejectNotes.trim() || "Ditolak oleh Dosen Pembimbing");
            toast.success('Pengajuan seminar ditolak');
            setConfirmRejectId(null);
            setRejectNotes('');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menolak seminar');
        } finally {
            setIsRejecting(null);
        }
    };

    const handleValidateParticipant = async (seminarId: string, participantId: string) => {
        setApprovingParticipantId(participantId);
        try {
            await validateSeminarAudience(seminarId, participantId);
            toast.success('Kehadiran peserta berhasil divalidasi');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal memvalidasi kehadiran');
        } finally {
            setApprovingParticipantId(null);
        }
    };

    const handleUnvalidateParticipant = async (seminarId: string, participantId: string) => {
        setUnapprovingParticipantId(participantId);
        try {
            await unvalidateSeminarAudience(seminarId, participantId);
            toast.success('Validasi kehadiran dibatalkan');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal membatalkan validasi');
        } finally {
            setUnapprovingParticipantId(null);
        }
    };

    const handleBulkValidateParticipants = async (seminarId: string) => {
        if (selectedParticipantIds.length === 0) return;

        setIsBulkValidating(true);
        try {
            await bulkValidateSeminarAudience(seminarId, selectedParticipantIds);
            toast.success(`${selectedParticipantIds.length} peserta berhasil divalidasi`);
            setSelectedParticipantIds([]);
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal memvalidasi secara massal');
        } finally {
            setIsBulkValidating(false);
        }
    };

    const handleCompleteSeminar = (seminarId: string) => {
        setConfirmCompleteId(seminarId);
    };

    const processCompleteSeminar = async (seminarId: string) => {

        setIsCompleting(seminarId);
        try {
            if (editingNotes[seminarId] !== undefined) {
                await updateSeminarNotes(seminarId, editingNotes[seminarId]);
            }
            await completeSeminar(seminarId);
            toast.success('Seminar berhasil diselesaikan');
            setConfirmCompleteId(null);
            setEditingNotes(prev => {
                const next = { ...prev };
                delete next[seminarId];
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyelesaikan seminar');
        } finally {
            setIsCompleting(null);
        }
    };

    const handleFailSeminar = (seminarId: string, currentNotes?: string) => {
        setFailNotes(currentNotes || '');
        setConfirmFailId(seminarId);
    };

    const processFailSeminar = async (seminarId: string) => {
        setIsFailing(seminarId);
        try {
            await failSeminar(seminarId, failNotes.trim() || undefined);
            toast.success('Seminar berhasil dinyatakan gagal');
            setConfirmFailId(null);
            setFailNotes('');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menggagalkan seminar');
        } finally {
            setIsFailing(null);
        }
    };



    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const seminars = studentGuidance?.seminars || [];
    const hiddenRejectedCount = seminars.filter((seminar: any, index: number) => seminar.status === 'REJECTED' && index > 0).length;
    const visibleSeminars = seminars
        .map((seminar: any, index: number) => ({ seminar, originalIndex: index }))
        .filter(({ seminar, originalIndex }: any) => showRejectedSubmissions || seminar.status !== 'REJECTED' || originalIndex === 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1.5" />Disetujui</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-medium px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1.5" />Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 font-medium px-3 py-1">Menunggu ACC</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="font-medium px-3 py-1"><XCircle className="w-4 h-4 mr-1.5" />Ditolak</Badge>;
            case 'FAILED': return <Badge variant="destructive" className="font-medium px-3 py-1 bg-red-700 hover:bg-red-800"><XCircle className="w-4 h-4 mr-1.5" />Gagal</Badge>;
            default: return <Badge variant="secondary" className="font-medium px-3 py-1">{status}</Badge>;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const d = new Date(timeStr);
        const h = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    if (seminars.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">Mahasiswa belum mengajukan jadwal seminar</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">Jadwal yang diajukan akan muncul di sini untuk Anda verifikasi dan Anda kelola.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {hiddenRejectedCount > 0 && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowRejectedSubmissions(prev => !prev)}
                    >
                        {showRejectedSubmissions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showRejectedSubmissions
                            ? 'Sembunyikan pengajuan ditolak'
                            : `Tampilkan ${hiddenRejectedCount} pengajuan ditolak`}
                    </Button>
                </div>
            )}

            {visibleSeminars.map(({ seminar, originalIndex }: any) => {
                const audienceRows = (seminar.audiences || []).map((a: any) => ({
                    studentId: a.studentId,
                    studentName: a.student?.user?.fullName || 'Unknown',
                    nim: a.student?.user?.identityNumber || '-',
                    registeredAt: a.createdAt,
                    approvedAt: a.validatedAt,
                    approvedByName: studentGuidance?.supervisorName
                }));

                const isCompleted = seminar.status === 'COMPLETED';
                const isFailed = seminar.status === 'FAILED';
                const isFinal = isCompleted || isFailed;
                const canFinalize = seminar.status === 'APPROVED';
                const notesDraft = editingNotes[seminar.id] ?? seminar.supervisorNotes ?? '';

                return (
                    <div key={seminar.id} className="space-y-6">
                        {/* 1. Pengajuan Seminar Card */}
                        <Card className="overflow-hidden border-gray-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between border-b">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                        Informasi Pengajuan Seminar {seminars.length > 1 && (originalIndex === 0 ? "(Terbaru)" : `(#${seminars.length - originalIndex})`)}
                                    </CardTitle>
                                    {seminar.createdAt && (
                                        <CardDescription className="flex items-center gap-1.5">
                                            Diajukan pada: {new Date(seminar.createdAt).toLocaleDateString('id-ID')}
                                        </CardDescription>
                                    )}
                                </div>
                                {getStatusBadge(seminar.status)}
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tanggal Pelaksanaan</p>
                                                <p className="font-medium text-slate-800">
                                                    {seminar.seminarDate ? new Date(seminar.seminarDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Waktu Seminar</p>
                                                <p className="font-medium text-slate-800">
                                                    {formatTime(seminar.startTime)} - {formatTime(seminar.endTime)} WIB
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Lokasi / Ruangan</p>
                                                <p className="font-medium text-slate-800">
                                                    {seminar.room ? seminar.room.name : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Moderator</p>
                                                <p className="font-medium text-slate-800">
                                                    {seminar.moderatorStudent ? seminar.moderatorStudent.user.fullName : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {seminar.status === 'REQUESTED' && (
                                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-6"
                                            onClick={() => handleReject(seminar.id)}
                                            disabled={!!isRejecting || !!isApproving}
                                        >
                                            {isRejecting === seminar.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                            Tolak Pengajuan
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                                            onClick={() => handleApprove(seminar.id)}
                                            disabled={!!isApproving || !!isRejecting}
                                        >
                                            {isApproving === seminar.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            Setujui Jadwal
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {canFinalize && (
                            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                                <Button
                                    variant="outline"
                                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleFailSeminar(seminar.id, notesDraft)}
                                    disabled={isFailing === seminar.id || isCompleting === seminar.id}
                                >
                                    {isFailing === seminar.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Gagalkan Seminar
                                </Button>
                                <Button
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleCompleteSeminar(seminar.id)}
                                    disabled={isCompleting === seminar.id || isFailing === seminar.id}
                                >
                                    {isCompleting === seminar.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Selesaikan Seminar
                                </Button>
                            </div>
                        )}

                        {/* 2. Catatan Seminar Card */}
                        <Card className="border-gray-200 transition-all">
                            <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Catatan Seminar / Berita Acara</CardTitle>
                                    </div>
                                    <CardDescription>Poin-poin penting dan hasil evaluasi selama seminar berlangsung</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {seminar.beritaAcaraDocument && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => setPreviewDocument({
                                                open: true,
                                                fileName: seminar.beritaAcaraDocument.fileName,
                                                filePath: seminar.beritaAcaraDocument.filePath
                                            })}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Lihat Berita Acara
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {!isFinal ? (
                                    <Textarea
                                        placeholder="Tuliskan poin-poin penting, pertanyaan, atau catatan selama seminar berlangsung untuk berita acara..."
                                        className="min-h-[140px] bg-white resize-none focus-visible:ring-primary leading-relaxed"
                                        value={notesDraft}
                                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [seminar.id]: e.target.value }))}
                                    />
                                ) : (
                                    <div className="min-h-[100px] p-4 rounded-lg bg-gray-50/50 border border-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                                        {seminar.supervisorNotes ? (
                                            seminar.supervisorNotes
                                        ) : (
                                            <span className="italic text-muted-foreground">Belum ada catatan seminar.</span>
                                        )}
                                    </div>
                                )}

                                {isFinal && (
                                    <div className="text-xs text-muted-foreground italic">
                                        <div className={cn("flex items-center gap-1.5 font-medium", isFailed ? "text-red-600" : "text-rose-500")}>
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Catatan telah dikunci karena seminar telah {isFailed ? 'dinyatakan gagal' : 'selesai'}.</span>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>


                        {/* 3. Peserta Seminar Card */}
                        {!['REJECTED', 'FAILED'].includes(seminar.status) && (
                            <Card className="border-gray-200">
                                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Presensi Peserta Seminar
                                        </CardTitle>
                                        <CardDescription>Daftar hadir penonton seminar untuk validasi keaktifan</CardDescription>
                                    </div>
                                    {selectedParticipantIds.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                            onClick={() => handleBulkValidateParticipants(seminar.id)}
                                            disabled={isBulkValidating}
                                        >
                                            {isBulkValidating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            Validasi Terpilih ({selectedParticipantIds.length})
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <ThesisSeminarAudienceTable
                                        rows={audienceRows}
                                        showAction={seminar.status === 'APPROVED' || seminar.status === 'COMPLETED'}
                                        approvingStudentId={approvingParticipantId}
                                        unapprovingStudentId={unapprovingParticipantId}
                                        onApprove={(row) => handleValidateParticipant(seminar.id, row.studentId!)}
                                        onUnapprove={(row) => handleUnvalidateParticipant(seminar.id, row.studentId!)}
                                        selectedIds={selectedParticipantIds}
                                        onSelectionChange={setSelectedParticipantIds}
                                        isRowSelectable={(row) => !row.approvedAt}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            })}
            <DocumentPreviewDialog
                open={previewDocument.open}
                onOpenChange={(open) => setPreviewDocument(prev => ({ ...prev, open }))}
                fileName={previewDocument.fileName}
                filePath={previewDocument.filePath}
            />
            <AlertDialog open={!!confirmApproveId} onOpenChange={(open) => !open && !isApproving && setConfirmApproveId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Setujui Jadwal Seminar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Jadwal seminar akan disetujui dan mahasiswa dapat melanjutkan proses seminar sesuai tanggal, waktu, dan ruangan yang diajukan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!isApproving}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmApproveId && processApprove(confirmApproveId)}
                            disabled={!!isApproving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Ya, Setujui
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!confirmRejectId} onOpenChange={(open) => {
                if (!open && !isRejecting) {
                    setConfirmRejectId(null);
                    setRejectNotes('');
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tolak Pengajuan Seminar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pengajuan jadwal seminar akan ditolak dan mahasiswa perlu mengajukan jadwal baru. Catatan penolakan akan terlihat oleh mahasiswa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Tuliskan alasan penolakan jadwal seminar..."
                        className="min-h-[120px] resize-none"
                        disabled={!!isRejecting}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!isRejecting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmRejectId && processReject(confirmRejectId)}
                            disabled={!!isRejecting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isRejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Ya, Tolak
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!confirmCompleteId} onOpenChange={(open) => !open && setConfirmCompleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selesaikan Seminar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menyelesaikan seminar ini? Setelah diselesaikan, catatan seminar akan dikunci dan tidak dapat diubah lagi untuk keperluan Berita Acara.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => confirmCompleteId && processCompleteSeminar(confirmCompleteId)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Ya, Selesaikan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!confirmFailId} onOpenChange={(open) => {
                if (!open) {
                    setConfirmFailId(null);
                    setFailNotes('');
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gagalkan Seminar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seminar akan ditandai gagal dan mahasiswa perlu mengajukan jadwal seminar baru. Catatan di bawah akan terlihat oleh mahasiswa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={failNotes}
                        onChange={(e) => setFailNotes(e.target.value)}
                        placeholder="Tuliskan alasan atau catatan hasil seminar..."
                        className="min-h-[120px] resize-none"
                        disabled={!!isFailing}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!isFailing}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmFailId && processFailSeminar(confirmFailId)}
                            disabled={!!isFailing}
                            className="bg-red-700 hover:bg-red-800"
                        >
                            {isFailing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Ya, Gagalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
