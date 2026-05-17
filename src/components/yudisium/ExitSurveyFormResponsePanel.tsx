import { useMemo, useState } from 'react';
import { 
  Eye,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Filter } from 'lucide-react';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import { useQuery } from '@tanstack/react-query';
import {
  downloadExitSurveyResponsesExcel,
  downloadExitSurveyResponsesPdf,
  getExitSurveyFormResponses,
} from '@/services/yudisium/exit-survey.service';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface ExitSurveyFormResponsePanelProps {
  form: ExitSurveyForm;
}

const COLORS = ['#F7931E', '#f59e0b', '#fb923c', '#fdba74', '#ea580c', '#8b5cf6', '#10b981'];
const QUESTION_TYPE_LABELS: Record<string, string> = {
  short_answer: 'Jawaban Singkat',
  paragraph: 'Paragraf',
  single_choice: 'Pilihan Ganda',
  multiple_choice: 'Kotak Centang',
  date: 'Tanggal',
};

const formatSubmitTime = (value?: string | Date | null) => {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  const dateText = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timeText = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(':', '.');
  return `${dateText}, ${timeText}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const ExitSurveyFormResponsePanel = ({ form }: ExitSurveyFormResponsePanelProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedYudisiumId, setSelectedYudisiumId] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [tempPdfYudisiumId, setTempPdfYudisiumId] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['exit-survey-responses', form.id],
    queryFn: () => getExitSurveyFormResponses(form.id),
  });

  const handleExportPdf = async (targetYudisiumId: string) => {
    try {
      const blob = await downloadExitSurveyResponsesPdf(form.id, targetYudisiumId);
      const periodLabel = targetYudisiumId === 'all'
        ? 'Semua_Periode'
        : uniqueYudisiums.find((y) => y.id === targetYudisiumId)?.name?.replace(/\s+/g, '_') || 'Periode';
      downloadBlob(blob, `Laporan_Exit_Survey_${form.name.replace(/\s+/g, '_')}_${periodLabel}.pdf`);
      setIsPdfModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await downloadExitSurveyResponsesExcel(form.id, selectedYudisiumId);
      const periodLabel = selectedYudisiumId === 'all'
        ? 'Semua_Periode'
        : uniqueYudisiums.find((y) => y.id === selectedYudisiumId)?.name?.replace(/\s+/g, '_') || 'Periode';
      downloadBlob(blob, `Laporan_Exit_Survey_${form.name.replace(/\s+/g, '_')}_${periodLabel}.xlsx`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan Excel');
    }
  };

  const uniqueYudisiums = useMemo(() => {
    const map = new Map<string, string>();
    responses.forEach(r => {
      if (r.yudisiumId && r.yudisiumName) {
        map.set(r.yudisiumId, r.yudisiumName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [responses]);

  const filteredByYudisium = useMemo(() => {
    if (selectedYudisiumId === 'all') return responses;
    return responses.filter(r => r.yudisiumId === selectedYudisiumId);
  }, [responses, selectedYudisiumId]);

  const chartQuestions = useMemo(() => {
    const questions: any[] = [];
    
    const responseCounts = new Map<string, Map<string, number>>();
    
    filteredByYudisium.forEach(resp => {
      resp.answers.forEach((ans: any) => {
        if (!ans.optionId) return;
        
        if (!responseCounts.has(ans.questionId)) {
          responseCounts.set(ans.questionId, new Map());
        }
        
        const optMap = responseCounts.get(ans.questionId)!;
        optMap.set(ans.optionId, (optMap.get(ans.optionId) || 0) + 1);
      });
    });

    form.sessions?.forEach(session => {
      session.questions?.forEach(q => {
        if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
          const optMap = responseCounts.get(q.id);
          const answeredRespondents = new Set(
            filteredByYudisium
              .filter((resp) => resp.answers.some((ans: any) => ans.questionId === q.id && ans.optionId))
              .map((resp) => resp.id)
          );
          
          const data = q.options?.map((opt) => ({
            name: opt.optionText,
            value: optMap?.get(opt.id) || 0,
          })) || [];
          
          // Only show if there's data or at least it's a choice question
          questions.push({
            ...q,
            data,
            answeredCount: answeredRespondents.size,
            respondentCount: filteredByYudisium.length,
            typeLabel: QUESTION_TYPE_LABELS[q.questionType] || q.questionType,
          });
        }
      });
    });
    return questions;
  }, [form, filteredByYudisium]);

  const filteredResponses = useMemo(() => {
    if (!search) return filteredByYudisium;
    const s = search.toLowerCase();
    return filteredByYudisium.filter(r => 
      r.name?.toLowerCase().includes(s) || 
      r.nim?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s)
    );
  }, [filteredByYudisium, search]);

  const paginatedResponses = useMemo(() => {
    return filteredResponses.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredResponses, page, pageSize]);

  const tableColumns = useMemo<Column<any>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 60,
        className: 'text-center',
        render: (_item, index) => <span>{(page - 1) * pageSize + index + 1}</span>,
      },
      {
        key: 'name',
        header: 'Nama Responden',
        render: (item) => <div className="font-medium">{item.name}</div>,
      },
      {
        key: 'nim',
        header: 'NIM',
        width: 130,
        render: (item) => <div className="text-muted-foreground">{item.nim}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        width: 220,
        render: (item) => <div className="text-muted-foreground">{item.email}</div>,
      },
      {
        key: 'phone',
        header: 'Nomor Telepon',
        width: 150,
        render: (item) => <div className="text-muted-foreground">{item.phone}</div>,
      },
      {
        key: 'submitTime',
        header: 'Waktu Submit',
        width: 180,
        render: (item) => <div className="text-muted-foreground">{formatSubmitTime(item.submittedAt)}</div>,
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 100,
        className: 'text-right',
        render: (item) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Lihat Detail"
              onClick={() => {
                setSelectedResponse(item);
                setIsDetailModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize]
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={selectedYudisiumId} onValueChange={setSelectedYudisiumId}>
            <SelectTrigger className="w-full sm:w-[280px] h-10 border-border/60 rounded-xl bg-white font-semibold text-foreground hover:border-primary transition-all">
               <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Pilih Periode Yudisium" />
               </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-xl p-1">
              <SelectItem value="all" className="rounded-lg font-bold text-xs py-2.5">
                Semua Periode
              </SelectItem>
              {uniqueYudisiums.map((y) => (
                <SelectItem key={y.id} value={y.id} className="rounded-lg font-medium text-xs py-2.5">
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filteredByYudisium.length}</span> responden mahasiswa
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-4 gap-2 border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-all disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={filteredByYudisium.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Unduh Excel
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-4 gap-2 border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-all disabled:opacity-50"
            onClick={() => {
              setTempPdfYudisiumId(selectedYudisiumId);
              setIsPdfModalOpen(true);
            }}
            disabled={filteredByYudisium.length === 0}
          >
            <FileText className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartQuestions.map((q) => (
          <Card key={q.id} className="border-border/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group">
            <CardHeader className="pb-2 bg-muted/10 border-b border-border/40">
              <div className="flex justify-between items-start gap-4">
                 <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {q.question}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                      <span>{q.answeredCount} dari {q.respondentCount} responden</span>
                    </div>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={q.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {q.data.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-2">
                {q.data.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-muted-foreground font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="font-semibold text-foreground">{item.value}</span>
                      <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {q.data.reduce((acc: number, cur: any) => acc + cur.value, 0) > 0 
                          ? Math.round((item.value / q.data.reduce((acc: number, cur: any) => acc + cur.value, 0)) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Responses Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground px-1">Responden Individual</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">Memuat data respons...</p>
            </div>
          </div>
        ) : (
          <CustomTable 
            columns={tableColumns}
            data={paginatedResponses}
            total={filteredResponses.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            enableColumnFilters
            emptyText="Belum ada responden untuk formulir ini"
            className="border-gray-200 shadow-sm rounded-2xl overflow-hidden"
          />
        )}
      </div>

      {/* Export PDF Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Ekspor Laporan PDF</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Pilih cakupan data yang ingin Anda sertakan dalam laporan formal PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Periode Yudisium</label>
                <Select value={tempPdfYudisiumId} onValueChange={setTempPdfYudisiumId}>
                  <SelectTrigger className="w-full h-12 border-gray-200 rounded-xl bg-white shadow-sm font-bold text-gray-700 hover:border-primary transition-all">
                     <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Pilih Periode Yudisium" />
                     </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-xl p-1">
                    <SelectItem value="all" className="rounded-lg font-bold text-xs py-2.5">
                      Semua Periode
                    </SelectItem>
                    {uniqueYudisiums.map((y) => (
                      <SelectItem key={y.id} value={y.id} className="rounded-lg font-medium text-xs py-2.5">
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPdfModalOpen(false)} className="rounded-xl font-bold">
              Batal
            </Button>
            <Button 
              className="rounded-xl font-bold px-8" 
              onClick={() => handleExportPdf(tempPdfYudisiumId)}
            >
              Unduh Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Response Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[860px] max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-7 pb-5 bg-white border-b shrink-0">
            <DialogTitle className="text-2xl font-bold text-foreground">Detail Respons Exit Survey</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Melihat jawaban lengkap dari <span className="text-primary font-bold">{selectedResponse?.name}</span> ({selectedResponse?.nim})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-7 pt-6 space-y-8 custom-scrollbar bg-muted/10">
            {/* Student Info Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-border/60 shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">NIM</p>
                <p className="text-sm font-semibold text-foreground">{selectedResponse?.nim}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Angkatan</p>
                <p className="text-sm font-semibold text-foreground">{selectedResponse?.enrollmentYear || '-'}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Periode</p>
                <p className="text-sm font-semibold text-foreground">{selectedResponse?.yudisiumName}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Waktu Submit</p>
                <p className="text-sm font-semibold text-foreground">{selectedResponse && formatSubmitTime(selectedResponse.submittedAt)}</p>
              </div>
            </div>

            {/* Questions by Session */}
            <div className="space-y-12">
              {form.sessions?.map((session, sIdx) => (
                <div key={session.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {sIdx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-lg font-semibold text-foreground tracking-tight">{session.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">Bagian {sIdx + 1}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-4 md:pl-12 border-l border-dashed border-border ml-4">
                    {session.questions?.map((q, qIdx) => {
                      const answers = selectedResponse?.answers.filter((a: any) => a.questionId === q.id) || [];
                      const answerText = answers.map((a: any) => a.optionText || a.answerText).filter(Boolean).join(', ');

                      return (
                        <div key={q.id} className="space-y-3 p-5 bg-white rounded-xl border border-border/60 transition-all group">
                          <div className="flex gap-3">
                            <span className="text-sm font-bold text-primary/70 transition-colors">{qIdx + 1}.</span>
                            <p className="text-sm font-semibold text-foreground leading-snug">
                              {q.question}
                            </p>
                          </div>
                          <div className="pt-1 ml-7">
                            {answerText ? (
                              <div className="text-sm text-foreground/80 bg-muted/40 p-4 rounded-xl border border-border/50 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                                {answerText}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                Tidak memberikan jawaban
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-5 border-t bg-white shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)} 
              className="rounded-xl font-semibold px-8 h-10 border-primary/30 text-primary hover:bg-primary/5"
            >
              Tutup Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExitSurveyFormResponsePanel;
