import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateId } from '@/lib/text';
import { Users, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SekdepGuidanceTabProps {
    sessions: any[];
}

export const SekdepGuidanceTab: React.FC<SekdepGuidanceTabProps> = ({ sessions }) => {
    if (!sessions || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-slate-50/50 rounded-xl border-2 border-dashed">
                <Users className="h-12 w-12 mb-2 opacity-20" />
                <p>Belum ada sesi bimbingan yang tercatat</p>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
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
                <div className="space-y-4">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {sessions.map((session) => (
                            <AccordionItem 
                                key={session.id} 
                                value={session.id}
                                className="border rounded-xl bg-white px-4 hover:border-purple-200 transition-all shadow-sm overflow-hidden"
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-4 text-left w-full">
                                        <div className={`p-2 rounded-lg ${session.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {session.status === 'APPROVED' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800">Minggu {session.weekNumber}</h4>
                                                <Badge 
                                                    className={session.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'} 
                                                    variant="outline"
                                                >
                                                    {session.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Persetujuan'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Diserahkan pada: {session.submissionDate ? formatDateId(session.submissionDate) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2 border-t mt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                        {/* Student Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                                                <MessageSquare className="h-4 w-4" />
                                                Laporan Mahasiswa
                                            </div>
                                            <div className="space-y-5">
                                                {(session.studentAnswers || []).map((ans: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                            Pertanyaan {idx + 1}
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-700 mb-2 leading-snug">
                                                            {ans.question?.questionText || "Pertanyaan dihapus"}
                                                        </p>
                                                        <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg shadow-sm border border-slate-50">
                                                            {ans.answerText || "Tidak ada jawaban"}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Lecturer Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                                                <Users className="h-4 w-4" />
                                                Evaluasi Dosen Pembimbing
                                            </div>
                                            <div className="space-y-5">
                                                {(session.lecturerAnswers || []).map((evalItem: any, idx: number) => (
                                                    <div key={idx} className="bg-purple-50/20 p-4 rounded-xl border border-purple-50">
                                                        <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                                                            Kriteria {idx + 1}
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-700 mb-2 leading-snug">
                                                            {evalItem.criteria?.criteriaName || "Kriteria dihapus"}
                                                        </p>
                                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-50/50">
                                                            {evalItem.criteria?.inputType === 'EVALUATION' ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {evalItem.criteria?.options?.map((opt: any) => (
                                                                        <Badge 
                                                                            key={opt.id}
                                                                            variant={evalItem.evaluationValue === opt.optionText ? "default" : "outline"}
                                                                            className={evalItem.evaluationValue === opt.optionText ? "bg-purple-600" : "text-slate-400 border-slate-200"}
                                                                        >
                                                                            {opt.optionText}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                                    {evalItem.answerText || "Tidak ada feedback tekstual"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!session.lecturerAnswers || session.lecturerAnswers.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 opacity-60">
                                                        <Clock className="h-8 w-8 text-slate-400 mb-2" />
                                                        <p className="text-sm italic text-slate-500">Menunggu evaluasi dosen pembimbing</p>
                                                    </div>
                                                )}
                                            </div>
                                            {session.approvedAt && (
                                                <div className="mt-4 p-3 bg-green-50/50 rounded-lg border border-green-100 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-green-700">Tanggal Persetujuan</span>
                                                    <span className="text-xs font-bold text-green-800">{formatDateId(session.approvedAt)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    );
};
