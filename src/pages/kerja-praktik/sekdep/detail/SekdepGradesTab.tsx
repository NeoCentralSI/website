import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {  User, Building2, TrendingUp } from 'lucide-react';

interface SekdepGradesTabProps {
    assessment: {
        lecturerStatus: string;
        fieldStatus: string;
        finalScore: number | null;
        finalGrade: string | null;
    };
    lecturerScores: any[];
    fieldScores: any[];
}

export const SekdepGradesTab: React.FC<SekdepGradesTabProps> = ({ assessment, lecturerScores, fieldScores }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    const ScoresTable = ({ title, icon: Icon, scores, status, colorClass }: any) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                    </div>
                    <h3 className="font-bold text-slate-800">{title}</h3>
                </div>
                <Badge variant={status === 'SUBMITTED' ? 'default' : 'outline'} className={status === 'SUBMITTED' ? 'bg-green-600' : ''}>
                    {status === 'SUBMITTED' ? 'Selesai' : 'Belum Tersedia'}
                </Badge>
            </div>
            
            <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 text-[11px] uppercase tracking-wider">
                        <TableRow>
                            <TableHead className="font-bold">CPMK</TableHead>
                            <TableHead className="text-right font-bold w-[100px]">Skor</TableHead>
                            <TableHead className="font-bold">Kriteria Rubrik</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scores.length > 0 ? scores.map((score: any) => (
                            <TableRow key={score.id}>
                                <TableCell className="align-top py-4">
                                    <div className="font-bold text-slate-700">{score.cpmk?.code}</div>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{score.cpmk?.name}</p>
                                </TableCell>
                                <TableCell className="text-right font-black text-lg py-4">
                                    <span className={getScoreColor(score.score)}>{score.score}</span>
                                </TableCell>
                                <TableCell className="align-top py-4">
                                    <p className="text-xs text-slate-600 italic leading-relaxed">
                                        {score.rubricLevel?.rubricLevelDescription || "Tanpa deskripsi rubrik"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-slate-400 italic text-sm">
                                    Data penilaian belum diinput oleh assessor.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    return (
        <Card className="border-none shadow-none bg-transparent pt-0">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            Penilaian Akhir
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Breakdown nilai berdasarkan capaian CPMK dari Dosen Pembimbing dan Pembimbing Lapangan.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-12">
                {/* Summary Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 flex items-center justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <TrendingUp className="h-24 w-24 text-primary" />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Nilai Akhir Mahasiswa</p>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-5xl font-black text-slate-900">{assessment.finalScore || "0"}</h2>
                            <span className="text-2xl font-bold text-amber-600">{assessment.finalGrade || "-"}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-gray-200 relative z-10 ">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">
                            Status Kelulusan
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors">
                            {assessment.finalScore && assessment.finalScore >= 60 ? 'LULUS' : 'Status Pending'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* Lecturer Assessment */}
                    <ScoresTable 
                        title="Penilaian Dosen Pembimbing"
                        icon={User}
                        scores={lecturerScores}
                        status={assessment.lecturerStatus}
                        colorClass="text-purple-600"
                    />

                    {/* Field Assessment */}
                    <ScoresTable 
                        title="Penilaian Pembimbing Lapangan"
                        icon={Building2}
                        scores={fieldScores}
                        status={assessment.fieldStatus}
                        colorClass="text-blue-600"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
