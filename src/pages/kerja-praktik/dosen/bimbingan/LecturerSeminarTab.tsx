import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getLecturerGuidanceTimeline,
    approveSeminar,
    rejectSeminar,
    completeSeminar,
    validateSeminarAudience,
    unvalidateSeminarAudience,
    bulkValidateSeminarAudience,
    updateSeminarNotes
} from '@/services/internship';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    AlertCircle
} from 'lucide-react';
import { SeminarAudienceTable } from '@/components/seminar/SeminarAudienceTable';


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
    const [isSavingNotes, setIsSavingNotes] = useState<string | null>(null);
    const [isEditingNotesMap, setIsEditingNotesMap] = useState<Record<string, boolean>>({});
    const [isCompleting, setIsCompleting] = useState<string | null>(null);

    const handleStartEdit = (id: string, notes: string) => {
        setEditingNotes(prev => ({ ...prev, [id]: notes || "" }));
        setIsEditingNotesMap(prev => ({ ...prev, [id]: true }));
    };

    const handleCancelEdit = (id: string) => {
        setIsEditingNotesMap(prev => ({ ...prev, [id]: false }));
        setEditingNotes(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleApprove = async (seminarId: string) => {
        setIsApproving(seminarId);
        try {
            await approveSeminar(seminarId);
            toast.success('Pengajuan seminar berhasil disetujui');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyetujui seminar');
        } finally {
            setIsApproving(null);
        }
    };


    const handleReject = async (seminarId: string) => {
        setIsRejecting(seminarId);
        try {
            await rejectSeminar(seminarId, "Ditolak oleh Dosen Pembimbing");
            toast.success('Pengajuan seminar ditolak');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menolak seminar');
        } finally {
            setIsRejecting(null);
        }
    };

    const handleCompleteSeminar = async (seminarId: string) => {
        setIsCompleting(seminarId);
        try {
            await completeSeminar(seminarId);
            toast.success('Seminar berhasil diselesaikan');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyelesaikan seminar');
        } finally {
            setIsCompleting(null);
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

    const handleSaveNotes = async (seminarId: string) => {
        const notes = editingNotes[seminarId];
        if (notes === undefined) return;

        setIsSavingNotes(seminarId);
        try {
            await updateSeminarNotes(seminarId, notes);
            toast.success('Catatan seminar berhasil disimpan');
            setIsEditingNotesMap(prev => ({ ...prev, [seminarId]: false }));
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
        } catch (error: any) {

            toast.error(error.message || 'Gagal menyimpan catatan');
        } finally {
            setIsSavingNotes(null);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1.5" />Disetujui</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-medium px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1.5" />Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 font-medium px-3 py-1">Menunggu ACC</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="font-medium px-3 py-1"><XCircle className="w-4 h-4 mr-1.5" />Ditolak</Badge>;
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
            {seminars.map((seminar: any, index: number) => {
                const audienceRows = (seminar.audiences || []).map((a: any) => ({
                    studentId: a.studentId,
                    studentName: a.student?.user?.fullName || 'Unknown',
                    nim: a.student?.user?.identityNumber || '-',
                    registeredAt: a.createdAt,
                    approvedAt: a.validatedAt,
                    approvedByName: studentGuidance?.supervisorName
                }));

                const isCompleted = seminar.status === 'COMPLETED';

                return (
                    <div key={seminar.id} className="space-y-6">
                        {/* 1. Pengajuan Seminar Card */}
                        <Card className="overflow-hidden border-gray-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                        Informasi Pengajuan Seminar {seminars.length > 1 && (index === 0 ? "(Terbaru)" : `(#${seminars.length - index})`)}
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

                                {seminar.status === 'APPROVED' && (
                                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                        <Button 
                                            variant="default"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                                            onClick={() => handleCompleteSeminar(seminar.id)}
                                            disabled={!!isCompleting}
                                        >
                                            {isCompleting === seminar.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            Selesaikan Seminar
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Catatan Seminar Card */}
                        <Card className={cn("border-gray-200 transition-all shadow-sm", isEditingNotesMap[seminar.id] && "ring-1 ring-primary/20")}>
                            <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Catatan Seminar / Berita Acara</CardTitle>
                                    </div>
                                    <CardDescription>Poin-poin penting dan hasil evaluasi selama seminar berlangsung</CardDescription>
                                </div>
                                {!isCompleted && (
                                    <div className="flex items-center gap-2">
                                        {!isEditingNotesMap[seminar.id] ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 gap-2"
                                                onClick={() => handleStartEdit(seminar.id, seminar.supervisorNotes)}
                                            >
                                                Edit Catatan
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-2 text-muted-foreground"
                                                onClick={() => handleCancelEdit(seminar.id)}
                                            >
                                                Batal
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {isEditingNotesMap[seminar.id] ? (
                                    <Textarea 
                                        placeholder="Tuliskan poin-poin penting, pertanyaan, atau catatan selama seminar berlangsung untuk berita acara..."
                                        className="min-h-[140px] bg-white resize-none focus-visible:ring-primary leading-relaxed"
                                        value={editingNotes[seminar.id] ?? seminar.supervisorNotes ?? ''}
                                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [seminar.id]: e.target.value }))}
                                        disabled={isSavingNotes === seminar.id}
                                        autoFocus
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

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground italic">
                                        {isCompleted ? (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span>Catatan telah dikunci karena seminar telah selesai.</span>
                                            </div>
                                        ) : (
                                            isEditingNotesMap[seminar.id] ? "* Mahasiswa dapat melihat update catatan secara real-time setelah disimpan." : ""
                                        )}
                                    </div>
                                    {isEditingNotesMap[seminar.id] && (
                                        <Button 
                                            size="sm"
                                            onClick={() => handleSaveNotes(seminar.id)}
                                            disabled={isSavingNotes === seminar.id || editingNotes[seminar.id] === undefined || editingNotes[seminar.id] === seminar.supervisorNotes}
                                            className="px-6 shadow-sm"
                                        >
                                            {isSavingNotes === seminar.id ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                                            Simpan Perubahan
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>


                        {/* 3. Peserta Seminar Card */}
                        {seminar.status !== 'REJECTED' && (
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
                                    <SeminarAudienceTable 
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
        </div>
    );
}
