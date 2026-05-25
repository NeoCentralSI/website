import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Award, CheckCircle, MessageSquareText, RotateCcw } from 'lucide-react';

interface GradesTabProps {
    internship: any;
}

export const GradesTab: React.FC<GradesTabProps> = ({ internship }) => {
    const navigate = useNavigate();
    const isCompleted = internship?.status === 'COMPLETED';
    const isFailed = internship?.status === 'FAILED';
    const hasScore = (isCompleted || isFailed) && internship?.finalNumericScore !== null && internship?.finalNumericScore !== undefined;

    if (!hasScore) {
        return (
            <Card>
                <CardHeader className="text-center py-12">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isFailed ? 'bg-red-50' : 'bg-muted'}`}>
                        {isFailed ? (
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        ) : (
                            <Award className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <CardTitle>{isFailed ? 'Kerja Praktik Gagal' : 'Nilai Belum Tersedia'}</CardTitle>
                    <CardDescription>
                        {isFailed
                            ? "Status KP Anda gagal sebelum nilai akhir tersedia. Silakan lakukan pendaftaran ulang jika sudah siap."
                            : isCompleted
                                ? "Data nilai Anda sedang diproses oleh sistem."
                                : "Nilai akhir akan ditampilkan setelah status Kerja Praktik Anda dinyatakan 'SELESAI'."}
                    </CardDescription>
                    {isFailed && (
                        <div className="pt-4">
                            <Button onClick={() => navigate('/kerja-praktik/pendaftaran')} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Daftar Ulang KP
                            </Button>
                        </div>
                    )}
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isFailed && (
                <Card className="md:col-span-3 border-red-200 bg-red-50">
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-900">Kerja Praktik dinyatakan gagal</p>
                                <p className="text-xs text-red-700 mt-1">
                                    Nilai akhir tetap ditampilkan sebagai riwayat. Anda dapat melakukan pendaftaran KP kembali.
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => navigate('/kerja-praktik/pendaftaran')} className="gap-2 self-start sm:self-center">
                            <RotateCcw className="h-4 w-4" />
                            Daftar Ulang KP
                        </Button>
                    </CardContent>
                </Card>
            )}
            <Card className="md:col-span-1">
                <CardHeader className="text-center">
                    <CardTitle>Nilai Akhir</CardTitle>
                    <CardDescription>Hasil Penilaian Kerja Praktik</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="relative flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${isFailed ? 'border-red-200' : 'border-primary/20'}`}>
                            <span className={`text-4xl font-bold ${isFailed ? 'text-red-600' : 'text-primary'}`}>{internship?.finalGrade || '-'}</span>
                        </div>
                        <div className={`absolute -bottom-2 px-4 py-1 text-white text-xs font-bold rounded-full ${isFailed ? 'bg-red-600' : 'bg-primary'}`}>
                            SKOR: {internship?.finalNumericScore?.toFixed(2) || '0'}
                        </div>
                    </div>
                    <span className="text-sm text-center text-muted-foreground max-w-[200px]">
                        Nilai akhir merupakan gabungan dari nilai pembimbing lapangan dan dosen pembimbing.
                    </span>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Rincian Penilaian</CardTitle>
                    <CardDescription>Status penilaian dari setiap komponen</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <CheckCircle className={`h-5 w-5 ${internship?.fieldAssessmentStatus === 'COMPLETED' ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Penilaian Pembimbing Lapangan</span>
                                <span className="text-xs text-muted-foreground">Berdasarkan performa di instansi</span>
                            </div>
                        </div>
                        <Badge variant={internship?.fieldAssessmentStatus === 'COMPLETED' ? 'default' : 'secondary'} className={internship?.fieldAssessmentStatus === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {internship?.fieldAssessmentStatus === 'COMPLETED' ? 'Sudah Dinilai' : 'Belum Dinilai'}
                        </Badge>
                    </div>

                    {internship?.fieldAssessmentStatus === 'COMPLETED' && internship?.fieldAssessmentNotes && (
                        <div className="rounded-xl border bg-white p-4">
                            <div className="flex items-start gap-3">
                                <MessageSquareText className="h-5 w-5 text-primary mt-0.5" />
                                <div className="space-y-1">
                                    <span className="text-sm font-semibold">Catatan Pembimbing Lapangan</span>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {internship.fieldAssessmentNotes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <CheckCircle className={`h-5 w-5 ${internship?.lecturerAssessmentStatus === 'COMPLETED' ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Penilaian Dosen Pembimbing</span>
                                <span className="text-xs text-muted-foreground">Berdasarkan bimbingan dan seminar</span>
                            </div>
                        </div>
                        <Badge variant={internship?.lecturerAssessmentStatus === 'COMPLETED' ? 'default' : 'secondary'} className={internship?.lecturerAssessmentStatus === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {internship?.lecturerAssessmentStatus === 'COMPLETED' ? 'Sudah Dinilai' : 'Belum Dinilai'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
