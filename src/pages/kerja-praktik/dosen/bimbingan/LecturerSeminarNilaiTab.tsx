import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLecturerGuidanceTimeline } from '@/services/internship.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, GraduationCap, FileText } from 'lucide-react';

export default function LecturerSeminarNilaiTab() {
    const { internshipId } = useParams<{ internshipId: string }>();

    const { data: studentGuidance, isLoading } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Get seminar and grade data - this will need to be added to the API response
    const finalScore = (studentGuidance as any)?.finalScore;
    const finalGrade = (studentGuidance as any)?.finalGrade;
    const seminars = (studentGuidance as any)?.seminars || [];

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
                        Informasi seminar Kerja Praktik
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {seminars.length > 0 ? (
                        <div className="space-y-4">
                            {seminars.map((seminar: any, index: number) => (
                                <div key={index} className="p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium">Seminar {index + 1}</p>
                                        <Badge variant="outline">{seminar.status || 'Tersedia'}</Badge>
                                    </div>
                                    {seminar.date && (
                                        <p className="text-sm text-muted-foreground">
                                            Tanggal: {new Date(seminar.date).toLocaleDateString('id-ID')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Belum ada informasi seminar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

