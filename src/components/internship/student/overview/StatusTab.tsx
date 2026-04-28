import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen, User, Target, Building2, CheckCircle2, Clock, MapPin,
    FileText, GraduationCap, Plus, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateId } from "@/lib/text";

// Helper to count working days (Monday-Friday)
const countWorkingDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Normalize to midnight
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

export function StatusTab({ internship, logbooks }: { internship: any; logbooks: any[] }) {
    const navigate = useNavigate();

    if (!internship) {
        return (
            <Card className="w-full border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Kerja Praktik</CardTitle>
                            <CardDescription>Anda belum terdaftar atau sedang tidak menjalankan Kerja Praktik</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 border p-4">
                        <p className="text-sm text-muted-foreground">
                            Mulai dengan mendaftarkan proposal Kerja Praktik Anda. Pilih perusahaan tujuan dan ajukan proposal ke Sekretaris Departemen.
                        </p>
                    </div>
                    <Button onClick={() => navigate("/kerja-praktik/pendaftaran")} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Mulai Pendaftaran
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { proposal, supervisor, seminars } = internship;
    const isCompleted = internship.status === "COMPLETED";

    // Progress stepper logic
    const steps = [
        { label: "Pendaftaran", active: proposal?.status === 'APPROVED_PROPOSAL' || proposal?.status === 'WAITING_FOR_VERIFICATION' || proposal?.status === 'ACCEPTED_BY_COMPANY' || internship?.status === 'ONGOING' || isCompleted },
        { label: "Persiapan", active: proposal?.status === 'ACCEPTED_BY_COMPANY' || internship?.status === 'ONGOING' || isCompleted },
        { label: "Pelaksanaan", active: internship?.status === 'ONGOING' || isCompleted },
        { label: "Seminar", active: (seminars && seminars.length > 0) || isCompleted },
        { label: "Selesai", active: isCompleted },
    ];
    const reversedSteps = [...steps].reverse();
    const reversedIndex = reversedSteps.findIndex(s => s.active);
    const currentStepIndex = reversedIndex === -1 ? 0 : steps.length - 1 - reversedIndex;
    const progressPercent = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));

    // Calculate dates
    const startDate = internship.actualStartDate ? new Date(internship.actualStartDate) : null;
    const endDate = internship.actualEndDate ? new Date(internship.actualEndDate) : null;
    
    const daysTotal = (startDate && endDate) ? countWorkingDays(startDate, endDate) : 0;
    const daysFilled = logbooks?.filter(lb => lb.activityDescription && lb.activityDescription.trim().length > 0).length || 0;

    // Document statuses
    const docsInfo = [
        { id: "logbook", label: "Laporan Kegiatan", status: internship.logbookDocumentStatus },
        { id: "receipt", label: "Tanda Terima", status: internship.companyReceiptStatus },
        { id: "certificate", label: "Sertifikat Selesai", status: internship.completionCertificateStatus },
        { id: "report", label: "Laporan Akhir", status: internship.reportStatus },
    ];

    const getStatusBadge = (status: string | null | undefined) => {
        if (status === 'APPROVED') return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Disetujui</Badge>;
        if (status === 'SUBMITTED') return <Badge variant="secondary">Menunggu Verifikasi</Badge>;
        if (status === 'REVISION_NEEDED') return <Badge variant="destructive">Revisi</Badge>;
        return <Badge variant="outline">Belum Diunggah</Badge>;
    };

    return (
        <>
            {/* 1. INFO CARD KERJA PRAKTIK — matches TA Overview main card */}
            <Card className="w-full border-slate-200">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Informasi Kerja Praktik</CardTitle>
                                <CardDescription>Detail status pelaksanaan Kerja Praktik Anda</CardDescription>
                            </div>
                        </div>
                        {isCompleted ? (
                            <Badge variant="default" className="bg-green-600">SELESAI</Badge>
                        ) : (
                            <Badge variant="secondary">BERLANGSUNG</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Company & Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold leading-relaxed mb-3">
                            {proposal?.targetCompany?.companyName || "Perusahaan belum ditentukan"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Alamat: <span className="text-foreground font-medium">{proposal?.targetCompany?.companyAddress || "-"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Periode: <span className="text-foreground font-medium">
                                    {startDate ? formatDateId(startDate) : "-"}{endDate ? ` — ${formatDateId(endDate)}` : ""}
                                </span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Pembimbing Lapangan: <span className="text-foreground font-medium">{internship.fieldSupervisorName || "-"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4 w-4" />
                                <span>Unit/Bagian: <span className="text-foreground font-medium">{internship.unitSection || "-"}</span></span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Dosen Pembimbing */}
                    <div className="pt-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                            <GraduationCap className="h-4 w-4" /> Dosen Pembimbing
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {supervisor ? (
                                <div className="p-3 rounded-xl bg-background/50 border hover:bg-background/80 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                                            Pembimbing KP
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="font-medium text-sm leading-tight text-foreground/90">
                                            {supervisor.user?.fullName || "-"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-3 rounded-xl border border-dashed min-h-20">
                                    <p className="text-xs text-muted-foreground">Belum ditentukan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Progress Stepper */}
                    <div className="pt-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                            <Calendar className="h-4 w-4" /> Progres Kerja Praktik
                        </span>
                        <div className="relative">
                            <div className="absolute left-0 top-3.5 w-full -translate-y-1/2 px-8">
                                <Progress value={progressPercent} className="h-1" />
                            </div>
                            <div className="relative flex justify-between">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors ${step.active ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                                            {step.active ? <CheckCircle2 className="h-5 w-5 fill-primary text-primary-foreground" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                                        </div>
                                        <span className={`text-xs font-medium ${step.active ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Nilai Akhir — integrated like TA readiness cards */}
                    {isCompleted && internship.finalNumericScore && (
                        <>
                            <Separator />
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
                                <div className="flex items-center justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-2">Nilai Angka</p>
                                        <p className="text-4xl font-bold text-primary">{internship.finalNumericScore}</p>
                                    </div>
                                    <Separator orientation="vertical" className="h-16" />
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-2">Huruf Mutu</p>
                                        <p className="text-4xl font-black">{internship.finalGrade}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 2. QUICK ACCESS & STATS — matches TA Overview grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="md:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                            onClick={() => navigate('/kerja-praktik/kegiatan/logbook')}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <span>Isi Logbook</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                            onClick={() => navigate('/kerja-praktik/kegiatan/bimbingan')}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                <Target className="h-4 w-4 text-primary" />
                            </div>
                            <span>Lihat Bimbingan</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                            onClick={() => navigate('/kerja-praktik/seminar/pelaporan')}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span>Upload Pelaporan</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                            onClick={() => navigate('/kerja-praktik/seminar/jadwal')}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <span>Jadwal Seminar</span>
                        </Button>
                    </CardContent>
                </Card>

                {/* Progress Summary */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Ringkasan Aktivitas</CardTitle>
                        <CardDescription>Progres logbook dan kelengkapan dokumen</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Logbook Progress */}
                        <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Logbook Terisi</span>
                                <span className="text-sm font-bold text-primary">
                                    {daysTotal > 0 ? Math.round((daysFilled / daysTotal) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={daysTotal > 0 ? (daysFilled / daysTotal) * 100 : 0} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {daysFilled} dari {daysTotal > 0 ? daysTotal : '?'} hari kerja terisi
                            </p>
                        </div>

                        {/* Document Checklist */}
                        <div className="space-y-4">
                            <span className="text-sm font-medium text-muted-foreground">Checklist Dokumen Pelaporan</span>
                            <div className="space-y-3">
                                {docsInfo.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 rounded-full ${doc.status === 'APPROVED' ? 'bg-green-500' : doc.status === 'SUBMITTED' ? 'bg-yellow-500' : doc.status === 'REVISION_NEEDED' ? 'bg-red-500' : 'bg-muted'}`} />
                                            <span className="text-sm font-medium">{doc.label}</span>
                                        </div>
                                        {getStatusBadge(doc.status)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seminar Info */}
                        {seminars?.length > 0 && (
                            <div className="mt-6 pt-4 border-t space-y-3">
                                <span className="text-sm font-medium text-muted-foreground">Seminar</span>
                                {seminars.map((seminar: any) => (
                                    <div key={seminar.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {seminar.seminarDate ? formatDateId(new Date(seminar.seminarDate)) : "-"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {seminar.startTime?.slice(0, 5)} - {seminar.endTime?.slice(0, 5)}
                                                </p>
                                            </div>
                                        </div>
                                        {seminar.status === 'APPROVED' ? (
                                            <Badge className="bg-green-600">Disetujui</Badge>
                                        ) : seminar.status === 'COMPLETED' ? (
                                            <Badge className="bg-green-600">Selesai</Badge>
                                        ) : seminar.status === 'REQUESTED' ? (
                                            <Badge variant="secondary">Menunggu</Badge>
                                        ) : (
                                            <Badge variant="outline">{seminar.status}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
