import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Search, FileText } from 'lucide-react';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

interface SekdepGradesTabProps {
    assessment: {
        lecturerStatus: string;
        fieldStatus: string;
        finalScore: number | null;
        finalGrade: string | null;
        isLogbookLocked: boolean;
    };
    lecturerScores: any[];
    fieldScores: any[];
    reportingDocuments?: any;
}

export const SekdepGradesTab: React.FC<SekdepGradesTabProps> = ({ 
    assessment, 
    lecturerScores, 
    fieldScores,
    reportingDocuments 
}) => {
    const [typeFilter, setTypeFilter] = useState<'all' | 'LECTURER' | 'FIELD'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    const combinedScores = useMemo(() => {
        const lecturer = (lecturerScores || []).map(s => ({ ...s, type: 'LECTURER' }));
        const field = (fieldScores || []).map(s => ({ ...s, type: 'FIELD' }));
        return [...lecturer, ...field].sort((a, b) => {
            return (a.cpmk?.code || '').localeCompare(b.cpmk?.code || '', undefined, { numeric: true });
        });
    }, [lecturerScores, fieldScores]);

    const filteredScores = useMemo(() => {
        return combinedScores.filter(s => {
            const matchType = typeFilter === 'all' || s.type === typeFilter;
            const matchSearch = !searchQuery || 
                s.cpmk?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.cpmk?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchType && matchSearch;
        });
    }, [combinedScores, typeFilter, searchQuery]);

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'cpmk',
            header: 'CPMK',
            render: (item) => (
                <div className="py-1">
                    <div className="font-bold text-slate-700 tracking-tight">{item.cpmk?.code}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed max-w-[250px]">{item.cpmk?.name}</p>
                </div>
            ),
            className: 'w-[280px]',
        },
        {
            key: 'level',
            header: 'Level Penilaian',
            render: (item) => (
                <div className="font-medium text-slate-700">
                    {item.rubricLevel?.levelName || "-"}
                </div>
            ),
            className: 'w-[150px]',
        },
        {
            key: 'rubric',
            header: 'Kriteria Rubrik',
            render: (item) => (
                <div 
                    className="text-[13px] text-slate-600 italic leading-relaxed py-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.rubricLevel?.rubricLevelDescription || "Tanpa deskripsi rubrik" }}
                />
            ),
        },
        {
            key: 'score',
            header: 'Skor',
            render: (item) => (
                <div className="text-center">
                    <div className="font-black">
                        {item.score}
                    </div>
                </div>
            ),
            className: 'w-[80px] text-center',
        },
        {
            key: 'type',
            header: 'Penilai',
            render: (item) => (
                <Badge variant="outline" className={cn(
                    "font-medium px-2.5 py-0.5 rounded-full border text-[10px]",
                    item.type === 'LECTURER' 
                        ? 'text-purple-700 border-purple-200 bg-purple-50' 
                        : 'text-blue-700 border-blue-200 bg-blue-50'
                )}>
                    {item.type === 'LECTURER' ? (
                        <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            Dosen
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" />
                            Lapangan
                        </div>
                    )}
                </Badge>
            ),
            className: 'w-[130px] items-center text-center',
        },
    ], []);

    const getGradeColor = (grade: string | null) => {
        if (!grade || grade === '-') return 'text-slate-400';
        const g = grade.toUpperCase();
        if (['A', 'A-', 'B+', 'B', 'B-'].includes(g)) return 'text-emerald-600';
        if (['C+', 'C'].includes(g)) return 'text-amber-600';
        if (['D', 'E'].includes(g)) return 'text-red-600';
        return 'text-slate-600';
    };

    const isGraded = assessment.finalGrade && assessment.finalGrade !== '-';
    const isPassing = isGraded && !['D', 'E'].includes(assessment.finalGrade!);

    const TotalRow = (
        <div className="bg-slate-50/50 border-t border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div>
                    <p className="font-bold uppercase tracking-wide">Nilai Akhir</p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-center sm:text-right">
                    <div className="flex items-baseline gap-2 justify-center sm:justify-end">
                        <span className="text-2xl font-black text-slate-900 leading-none">{assessment.finalScore || "0"}</span>
                        <span className={cn("text-xl font-black self-center leading-none", getGradeColor(assessment.finalGrade))}>
                            {assessment.finalGrade || "-"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Card className="border-none shadow-none bg-transparent pt-0">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 tracking-tight">
                            Penilaian Akhir
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Detail komponen penilaian dari Dosen Pembimbing dan Pembimbing Lapangan.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {reportingDocuments?.fieldAssessmentDocument?.document && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-2 font-bold text-[11px] uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-colors"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                Preview Penilaian Lapangan
                            </Button>
                        )}
                        <Badge className={cn(
                            "px-4 py-1.5 rounded-full font-bold text-[11px] tracking-wide",
                            !isGraded 
                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                : isPassing
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                    : "bg-red-100 text-red-700 border-red-200"
                        )}>
                            {!isGraded ? 'PENDING' : isPassing ? 'LULUS' : 'TIDAK LULUS'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <InternshipTable 
                            columns={columns}
                            data={filteredScores}
                            total={filteredScores.length}
                            page={1}
                            pageSize={100}
                            onPageChange={() => {}}
                            hidePagination={true}
                            emptyText="Tidak ada data penilaian yang ditemukan."
                            appendRow={TotalRow}
                            actions={                                                   
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative w-full sm:w-[280px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Cari CPMK..." 
                                            className="pl-9 h-10 rounded-xl border-slate-200 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                                            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-slate-200 bg-white shadow-sm hover:border-primary/50 transition-all text-sm">
                                                <SelectValue placeholder="Semua Tipe" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                <SelectItem value="all" className="text-sm">Semua Tipe</SelectItem>
                                                <SelectItem value="LECTURER" className="text-sm">Dosen Pembimbing</SelectItem>
                                                <SelectItem value="FIELD" className="text-sm">Pembimbing Lapangan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </CardContent>

            {reportingDocuments?.fieldAssessmentDocument?.document && (
                <DocumentPreviewDialog 
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    fileName={reportingDocuments.fieldAssessmentDocument.document.fileName}
                    filePath={reportingDocuments.fieldAssessmentDocument.document.filePath}
                />
            )}
        </Card>
    );
};


