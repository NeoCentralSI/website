import { useMemo, useState } from 'react';
import { 
  Download, 
  Eye,
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
import { getExitSurveyFormResponses } from '@/services/yudisium/yudisium-exit-survey.service';
import { Spinner } from '@/components/ui/spinner';
import { formatDateId } from '@/lib/text';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExitSurveyFormResponsePanelProps {
  form: ExitSurveyForm;
}

const COLORS = ['#F7931E', '#f59e0b', '#fb923c', '#fdba74', '#ea580c', '#8b5cf6', '#10b981'];

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

  const handleExportPdf = (targetYudisiumId: string) => {
    const dataToExport = targetYudisiumId === 'all' 
      ? responses 
      : responses.filter(r => r.yudisiumId === targetYudisiumId);

    if (dataToExport.length === 0) return;

    const periodLabel = targetYudisiumId === 'all' 
      ? 'Semua Periode' 
      : (uniqueYudisiums.find(y => y.id === targetYudisiumId)?.name || 'Tertentu');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // --- Page 1: Cover ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN EXIT SURVEY', pageWidth / 2, 80, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`PERIODE YUDISIUM ${periodLabel.toUpperCase()}`, pageWidth / 2, 95, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`FORMULIR: ${form.name.toUpperCase()}`, pageWidth / 2, 110, { align: 'center' });

    doc.setFontSize(12);
    doc.text('DEPARTEMEN SISTEM INFORMASI', pageWidth / 2, 230, { align: 'center' });
    doc.text('FAKULTAS TEKNOLOGI INFORMASI', pageWidth / 2, 240, { align: 'center' });
    doc.text('UNIVERSITAS ANDALAS', pageWidth / 2, 250, { align: 'center' });
    doc.text(`TAHUN ${new Date().getFullYear()}`, pageWidth / 2, 260, { align: 'center' });

    // --- Page 2: Respondent Identity ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. IDENTITAS RESPONDEN', margin, 30);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Responden: ${dataToExport.length} orang`, margin, 40);

    // 1.1 Enrollment Year (Angkatan)
    doc.setFont('helvetica', 'bold');
    doc.text('1.1 TAHUN MASUK KULIAH (ANGKATAN)', margin, 55);
    const angkatanCounts = new Map<number, number>();
    dataToExport.forEach(r => {
      const year = r.enrollmentYear || 0;
      angkatanCounts.set(year, (angkatanCounts.get(year) || 0) + 1);
    });
    const angkatanData = Array.from(angkatanCounts.entries()).sort((a, b) => a[0] - b[0]);
    
    let currentY = 65;
    angkatanData.forEach(([year, count]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`- Angkatan ${year || 'Tidak Diketahui'}: ${count} orang`, margin + 5, currentY);
      currentY += 7;
    });

    // --- Page 3+: Question Results ---
    let qIndex = 1;
    form.sessions?.forEach(session => {
      session.questions?.forEach(q => {
        if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
          doc.addPage();
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${++qIndex}. ${q.question}`, margin, 30, { maxWidth: pageWidth - 2 * margin });

          const optMap = new Map<string, number>();
          dataToExport.forEach(resp => {
            resp.answers.filter((a: any) => a.questionId === q.id).forEach((ans: any) => {
              if (ans.optionId) {
                optMap.set(ans.optionId, (optMap.get(ans.optionId) || 0) + 1);
              }
            });
          });

          const tableData = q.options?.map((opt, idx) => {
            const count = optMap.get(opt.id) || 0;
            const percent = dataToExport.length > 0 ? Math.round((count / dataToExport.length) * 100) : 0;
            return [idx + 1, opt.optionText, count, `${percent}%`];
          }) || [];

          autoTable(doc, {
            startY: 45,
            head: [['No', 'Pilihan Jawaban', 'Jumlah', 'Persentase']],
            body: tableData,
            margin: { left: margin, right: margin },
            theme: 'striped',
            headStyles: { fillColor: [247, 147, 30] }, // Primary color
          });
        }
      });
    });

    doc.save(`Laporan_Exit_Survey_${form.name.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.pdf`);
    setIsPdfModalOpen(false);
  };

  const handleExportExcel = (scope: 'all' | 'filtered') => {
    const dataToExport = scope === 'all' ? responses : filteredByYudisium;
    if (dataToExport.length === 0) return;

    const questions: any[] = [];
    form.sessions?.forEach(s => {
      s.questions?.forEach(q => {
        questions.push({ id: q.id, question: q.question });
      });
    });

    const createSheetData = (data: any[]) => {
      const rows = data.map((r, idx) => {
        const rowData: any = {
          'No': idx + 1,
          'Nama': r.name,
          'NIM': r.nim,
          'Email': r.email,
          'No Telepon': r.phone,
          'Periode Yudisium': r.yudisiumName,
          'Waktu Submit': formatDateId(r.submittedAt),
        };

        questions.forEach(q => {
          const answers = r.answers.filter((a: any) => a.questionId === q.id);
          if (answers.length > 0) {
            const answerTexts = answers.map((a: any) => a.optionText || a.answerText).filter(Boolean);
            rowData[q.question] = answerTexts.join(', ');
          } else {
            rowData[q.question] = '-';
          }
        });

        return rowData;
      });
      return XLSX.utils.json_to_sheet(rows);
    };

    const wb = XLSX.utils.book_new();
    
    if (scope === 'all') {
      XLSX.utils.book_append_sheet(wb, createSheetData(responses), 'Semua');
      
      const yudisiumGroups = new Map<string, any[]>();
      responses.forEach(r => {
        if (!yudisiumGroups.has(r.yudisiumId)) yudisiumGroups.set(r.yudisiumId, []);
        yudisiumGroups.get(r.yudisiumId)!.push(r);
      });

      yudisiumGroups.forEach((data) => {
        const yName = data[0].yudisiumName;
        const safeName = yName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
        XLSX.utils.book_append_sheet(wb, createSheetData(data), safeName);
      });
    } else {
      const yName = dataToExport[0]?.yudisiumName || 'Filtered';
      const safeName = yName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
      XLSX.utils.book_append_sheet(wb, createSheetData(dataToExport), safeName);
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const periodSuffix = scope === 'all' ? 'Semua_Periode' : (dataToExport[0]?.yudisiumName.replace(/\s+/g, '_') || 'Filter');
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Laporan_Exit_Survey_${form.name.replace(/\s+/g, '_')}_${periodSuffix}.xlsx`);
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
          
          const data = q.options?.map((opt) => ({
            name: opt.optionText,
            value: optMap?.get(opt.id) || 0,
          })) || [];
          
          // Only show if there's data or at least it's a choice question
          questions.push({
            ...q,
            data
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
        render: (item) => <div className="text-muted-foreground">{formatDateId(item.submittedAt)}</div>,
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Select value={selectedYudisiumId} onValueChange={setSelectedYudisiumId}>
            <SelectTrigger className="w-[280px] h-10 border-gray-200 rounded-xl bg-white shadow-sm font-bold text-gray-700 hover:border-primary transition-all">
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

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-5 gap-2 border-gray-200 font-bold hover:bg-muted/30 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            onClick={() => handleExportExcel('all')}
            disabled={responses.length === 0}
          >
            <Download className="h-4 w-4" />
            Unduh Excel
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-5 gap-2 border-gray-200 font-bold hover:bg-muted/30 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            onClick={() => {
              setTempPdfYudisiumId(selectedYudisiumId);
              setIsPdfModalOpen(true);
            }}
            disabled={responses.length === 0}
          >
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartQuestions.map((q) => (
          <Card key={q.id} className="border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group">
            <CardHeader className="pb-2 bg-muted/5 border-b border-gray-100">
              <div className="flex justify-between items-start gap-4">
                 <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-gray-800 leading-tight group-hover:text-primary transition-colors">
                      {q.question}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>{q.data.reduce((acc: number, cur: any) => acc + cur.value, 0)} Respons</span>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{q.questionType.replace('_', ' ')}</span>
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
                      <span className="font-bold text-gray-900">{item.value}</span>
                      <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
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
        <h3 className="text-lg font-black text-gray-900 font-display px-1">Responden Individual</h3>
        
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
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col p-0 gap-0 rounded-3xl overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-8 pb-6 bg-white border-b shrink-0">
            <DialogTitle className="text-2xl font-black text-gray-900 font-display">Detail Respons Survey</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground mt-1">
              Melihat jawaban lengkap dari <span className="text-primary font-bold">{selectedResponse?.name}</span> ({selectedResponse?.nim})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 custom-scrollbar bg-muted/5">
            {/* Student Info Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NIM</p>
                <p className="text-sm font-bold text-gray-900">{selectedResponse?.nim}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-gray-100">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Angkatan</p>
                <p className="text-sm font-bold text-gray-900">{selectedResponse?.enrollmentYear || '-'}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-gray-100">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Periode</p>
                <p className="text-sm font-bold text-gray-900">{selectedResponse?.yudisiumName}</p>
              </div>
              <div className="space-y-1 border-l pl-4 border-gray-100">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Waktu Submit</p>
                <p className="text-sm font-bold text-gray-900">{selectedResponse && formatDateId(selectedResponse.submittedAt)}</p>
              </div>
            </div>

            {/* Questions by Session */}
            <div className="space-y-12">
              {form.sessions?.map((session, sIdx) => (
                <div key={session.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20 rotate-3">
                      {sIdx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xl font-black text-gray-900 tracking-tight">{session.name}</h4>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bagian {sIdx + 1}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-4 md:pl-14 border-l-2 border-dashed border-gray-100 ml-5">
                    {session.questions?.map((q, qIdx) => {
                      const answers = selectedResponse?.answers.filter((a: any) => a.questionId === q.id) || [];
                      const answerText = answers.map((a: any) => a.optionText || a.answerText).filter(Boolean).join(', ');

                      return (
                        <div key={q.id} className="space-y-2.5 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all hover:shadow-md group">
                          <div className="flex gap-3">
                            <span className="text-sm font-black text-primary/40 group-hover:text-primary transition-colors">{qIdx + 1}.</span>
                            <p className="text-sm font-black text-gray-800 leading-snug">
                              {q.question}
                            </p>
                          </div>
                          <div className="pt-1 ml-7">
                            {answerText ? (
                              <div className="text-sm font-semibold text-gray-600 bg-muted/30 p-4 rounded-xl border border-gray-100 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                                {answerText}
                              </div>
                            ) : (
                              <div className="text-sm font-bold text-muted-foreground/30 italic flex items-center gap-2">
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

          <DialogFooter className="p-6 border-t bg-white shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)} 
              className="rounded-2xl font-black px-10 h-12 border-gray-200 hover:bg-muted/50 transition-all active:scale-95 shadow-sm"
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
