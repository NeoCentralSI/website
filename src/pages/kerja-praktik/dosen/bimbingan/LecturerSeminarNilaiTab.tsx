import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getLecturerGuidanceTimeline,
    approveSeminar,
    rejectSeminar,
    validateSeminarAudience,
    unvalidateSeminarAudience,
    bulkValidateSeminarAudience
} from '@/services/internship.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, GraduationCap, FileText, CalendarDays, MapPin, Clock, User, CheckCircle2, XCircle, Users } from 'lucide-react';
import { SeminarAudienceTable } from '@/components/seminar/SeminarAudienceTable';

export default function LecturerSeminarNilaiTab() {
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

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const finalScore = studentGuidance?.finalScore;
    const finalGrade = studentGuidance?.finalGrade;
    const seminars = studentGuidance?.seminars || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Disetujui</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" />Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">Menunggu ACC</Badge>;
            case 'REJECTED': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const d = new Date(timeStr);
        // Use UTC methods to match literal storage fix if applicable, or keep as is if standard display needed
        const h = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Nilai Akhir
                    </CardTitle>
                    <CardDescription>
                        Nilai akhir Kerja Praktik mahasiswa bimbingan Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {finalScore !== null && finalScore !== undefined ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Nilai Numerik</p>
                                    <p className="text-3xl font-bold text-primary">{finalScore.toFixed(2)}</p>
                                </div>
                                {finalGrade && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Nilai Huruf</p>
                                        <Badge variant="outline" className="text-lg px-4 py-2 bg-primary/10 text-primary border-primary/30">
                                            {finalGrade}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nilai akhir belum tersedia</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Seminar
                    </CardTitle>
                    <CardDescription>
                        Kelola pengajuan seminar Kerja Praktik mahasiswa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {seminars.length > 0 ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {seminars.map((seminar: any, index: number) => {
                                    const audienceRows = (seminar.audiences || []).map((a: any) => ({
                                        studentId: a.studentId,
                                        studentName: a.student?.user?.fullName || 'Unknown',
                                        nim: a.student?.user?.identityNumber || '-',
                                        registeredAt: a.createdAt,
                                        approvedAt: a.validatedAt,
                                        approvedByName: studentGuidance?.supervisorName
                                    }));

                                    return (
                                        <div key={seminar.id} className="p-5 rounded-lg border bg-card relative overflow-hidden group">
                                            <div className="flex items-start justify-between mb-4 border-b pb-4">
                                                <div>
                                                    <p className="font-semibold text-lg flex items-center gap-2">
                                                        Pengajuan Seminar {index === 0 && seminars.length > 1 ? "(Terbaru)" : ""}
                                                    </p>
                                                    {seminar.createdAt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Diajukan pada: {new Date(seminar.createdAt).toLocaleDateString('id-ID')}
                                                        </p>
                                                    )}
                                                </div>
                                                {getStatusBadge(seminar.status)}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">Tanggal Pelaksanaan</p>
                                                            <p className="text-muted-foreground">
                                                                {seminar.seminarDate ? new Date(seminar.seminarDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">Waktu</p>
                                                            <p className="text-muted-foreground">
                                                                {formatTime(seminar.startTime)} - {formatTime(seminar.endTime)} WIB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">Ruangan</p>
                                                            <p className="text-muted-foreground">
                                                                {seminar.room ? seminar.room.name : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">Moderator</p>
                                                            <p className="text-muted-foreground">
                                                                {seminar.moderatorStudent ? seminar.moderatorStudent.user.fullName : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {seminar.status === 'REQUESTED' && (
                                                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                                    <Button 
                                                        variant="outline" 
                                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleReject(seminar.id)}
                                                        disabled={!!isRejecting || !!isApproving}
                                                    >
                                                        {isRejecting === seminar.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                        Tolak Pengajuan
                                                    </Button>
                                                    <Button 
                                                        variant="default"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handleApprove(seminar.id)}
                                                        disabled={!!isApproving || !!isRejecting}
                                                    >
                                                        {isApproving === seminar.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                        Setujui Jadwal
                                                    </Button>
                                                </div>
                                            )}

                                            {seminar.status !== 'REJECTED' && (
                                                <div className="pt-6 border-t mt-4">
                                                    <div className="flex items-center gap-2 font-semibold mb-4 text-primary">
                                                        <Users className="h-5 w-5" />
                                                        Daftar Peserta (Penonton)
                                                    </div>
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
                                                        actions={
                                                            selectedParticipantIds.length > 0 && (
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
                                                                    Setujui Terpilih ({selectedParticipantIds.length})
                                                                </Button>
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground font-medium">Mahasiswa belum mengajukan jadwal seminar</p>
                            <p className="text-sm text-muted-foreground mt-1">Jadwal yang diajukan akan muncul di sini untuk Anda verifikasi.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
