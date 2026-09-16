import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateId } from '@/lib/text';
import { Users, CheckCircle2, Clock, MessageSquare, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SekdepGuidanceTabProps {
    sessions: any[];
    totalWeeks?: number;
}

export const SekdepGuidanceTab: React.FC<SekdepGuidanceTabProps> = ({ sessions = [], totalWeeks }) => {
    const [selectedSession, setSelectedSession] = useState<any | null>(null);

    const finalTotalWeeks = totalWeeks && totalWeeks > 0 ? totalWeeks : 8;

    const allWeeks = Array.from({ length: finalTotalWeeks }, (_, i) => {
        const weekNum = i + 1;
        const session = sessions?.find((s: any) => s.weekNumber === weekNum);
        return {
            weekNumber: weekNum,
            session: session || null,
        };
    });

    return (
        <Card className="border-none shadow-none bg-transparent pt-0">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            Bimbingan Mingguan
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Detail interaksi, jawaban mahasiswa, dan evaluasi dosen pembimbing setiap minggunya.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-1">
                    {allWeeks.map(({ weekNumber, session }) => {
                        const isSubmitted = !!session;
                        const isApproved = session?.status === 'APPROVED';
                        
                        return (
                            <div 
                                key={weekNumber}
                                className="flex flex-col justify-between rounded-xl border bg-card p-5 transition-all shadow-none border-gray-200 hover:shadow-sm cursor-pointer hover:border-primary/50"
                                onClick={() => {
                                    if (isSubmitted) {
                                        setSelectedSession(session);
                                    } else {
                                        setSelectedSession({
                                            weekNumber: weekNumber,
                                            status: 'NOT_SUBMITTED',
                                            studentAnswers: [],
                                            lecturerAnswers: []
                                        });
                                    }
                                }}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg leading-none">
                                                Minggu {weekNumber}
                                            </h3>
                                        </div>
                                        {isSubmitted ? (
                                            <Badge 
                                                className={cn(
                                                    "capitalize flex items-center gap-1 shadow-none font-semibold",
                                                    isApproved 
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' 
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                                                )}
                                                variant="outline"
                                            >
                                                {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                {isApproved ? 'Disetujui' : 'Menunggu'}
                                            </Badge>
                                        ) : (
                                            <Badge 
                                                className="capitalize flex items-center gap-1 shadow-none font-semibold text-slate-400 border-slate-200 bg-slate-50 hover:bg-slate-50"
                                                variant="outline"
                                            >
                                                <Clock className="w-3.5 h-3.5" />
                                                Belum Ada
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>
                                                {isSubmitted 
                                                    ? `Diserahkan: ${session.submissionDate ? formatDateId(session.submissionDate) : '-'}`
                                                    : 'Belum diserahkan mahasiswa'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t">
                                    <Button 
                                        variant="outline"
                                        className={cn(
                                            "w-full text-xs font-semibold",
                                            isSubmitted 
                                                ? (isApproved 
                                                    ? "border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:text-green-800 hover:border-green-400" 
                                                    : "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-400")
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        Lihat Detail
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>

            {selectedSession && (
                <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                    <DialogContent className="sm:max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        Detail Bimbingan Minggu Ke-{selectedSession.weekNumber}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-500">
                                        Detail laporan mahasiswa dan evaluasi dari dosen pembimbing.
                                    </DialogDescription>
                                </div>
                                <Badge 
                                    className={cn(
                                        "capitalize flex items-center gap-1.5 px-3 py-1 shadow-none font-semibold text-xs shrink-0",
                                        selectedSession.status === 'APPROVED' 
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' 
                                            : selectedSession.status === 'NOT_SUBMITTED'
                                                ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50'
                                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                                    )}
                                    variant="outline"
                                >
                                    {selectedSession.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                    {selectedSession.status === 'APPROVED' 
                                        ? 'Disetujui' 
                                        : selectedSession.status === 'NOT_SUBMITTED'
                                            ? 'Belum Ada Laporan'
                                            : 'Menunggu Persetujuan'}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            {/* Student Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b">
                                    <MessageSquare className="h-4.5 w-4.5" />
                                    Laporan Mahasiswa
                                </div>
                                <div className="space-y-5">
                                    {selectedSession.status === 'NOT_SUBMITTED' ? (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 opacity-60">
                                            <MessageSquare className="h-8 w-8 text-slate-400 mb-2" />
                                            <p className="text-sm italic text-slate-500">Mahasiswa belum mengumpulkan laporan bimbingan minggu ini</p>
                                        </div>
                                    ) : (
                                        (selectedSession.studentAnswers || []).map((ans: any, idx: number) => (
                                            <div key={idx}>
                                                <p className="text-sm font-semibold text-slate-700 mb-2 leading-snug">
                                                    {ans.question?.questionText || "Pertanyaan dihapus"}
                                                </p>
                                                <p className="text-sm leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                                    {ans.answerText || "Tidak ada jawaban"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Lecturer Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b">
                                    <Users className="h-4.5 w-4.5" />
                                    Evaluasi Dosen Pembimbing
                                </div>
                                <div className="space-y-5">
                                    {selectedSession.status === 'NOT_SUBMITTED' ? (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 opacity-60">
                                            <Clock className="h-8 w-8 text-slate-400 mb-2" />
                                            <p className="text-sm italic text-slate-500">Belum ada evaluasi dari dosen pembimbing</p>
                                        </div>
                                    ) : (
                                        <>
                                            {(selectedSession.lecturerAnswers || []).map((evalItem: any, idx: number) => (
                                                <div key={idx}>
                                                    <p className="text-sm font-semibold text-slate-700 mb-2 leading-snug">
                                                        {evalItem.criteria?.criteriaName || "Kriteria dihapus"}
                                                    </p>
                                                        {evalItem.criteria?.inputType === 'EVALUATION' ? (
                                                            <div className="flex flex-wrap gap-2 text-sm leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                                                {evalItem.criteria?.options?.map((opt: any) => (
                                                                    <Badge 
                                                                        key={opt.id}
                                                                        variant={evalItem.evaluationValue === opt.optionText ? "default" : "outline"}
                                                                        className={evalItem.evaluationValue === opt.optionText ? "" : "border-slate-200"}
                                                                    >
                                                                        {opt.optionText}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                                                {evalItem.answerText || "Tidak ada feedback tekstual"}
                                                            </p>
                                                        )}
                                                    </div>
                                            ))}
                                            {(!selectedSession.lecturerAnswers || selectedSession.lecturerAnswers.length === 0) && (
                                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 opacity-60">
                                                    <Clock className="h-8 w-8 text-slate-400 mb-2" />
                                                    <p className="text-sm italic text-slate-500">Menunggu evaluasi dosen pembimbing</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {selectedSession.approvedAt && (
                                    <div className="mt-4 p-3.5 bg-green-50/50 rounded-xl border border-green-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-green-700">Tanggal Persetujuan</span>
                                        <span className="text-xs font-bold text-green-800">{formatDateId(selectedSession.approvedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
};
