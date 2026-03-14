import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle } from 'lucide-react';

interface GradesTabProps {
    internship: any;
}

export const GradesTab: React.FC<GradesTabProps> = ({ internship }) => {
    const hasScore = internship?.finalNumericScore !== null && internship?.finalNumericScore !== undefined;

    if (!hasScore) {
        return (
            <Card>
                <CardHeader className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Award className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle>Nilai Belum Tersedia</CardTitle>
                    <CardDescription>
                        Nilai akhir akan diproses dan ditampilkan setelah seluruh proses bimbingan, pelaksanaan KP, dan seminar selesai dinilai.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader className="text-center">
                    <CardTitle>Nilai Akhir</CardTitle>
                    <CardDescription>Hasil Penilaian Kerja Praktik</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="relative flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                            <span className="text-4xl font-bold text-primary">{internship?.finalGrade || '-'}</span>
                        </div>
                        <div className="absolute -bottom-2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full">
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

                    <div className="p-4 bg-muted/20 rounded-xl border border-dashed text-center">
                        <p className="text-xs text-muted-foreground">
                            Sertifikat nilai dapat diunduh melalui Dashboard setelah status KP berubah menjadi "Selesai".
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
