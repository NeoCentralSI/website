import { useMemo, useState } from 'react';
import {
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import { useQuery } from '@tanstack/react-query';
import {
  downloadExitSurveyResponsesExcel,
  downloadExitSurveyResponsesPdf,
  getExitSurveyFormResponses,
} from '@/services/yudisium/exit-survey.service';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { toTitleCaseName } from '@/lib/text';

interface ExitSurveyFormResponsePanelProps {
  form: ExitSurveyForm;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#64748b'];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  short_answer: 'Jawaban Singkat',
  paragraph: 'Paragraf',
  single_choice: 'Pilihan Ganda',
  multiple_choice: 'Kotak Centang',
  number: 'Angka',
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
        render: (item) => <div className="font-medium text-foreground">{toTitleCaseName(item.name)}</div>,
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
        render: (item) => <div className="text-muted-foreground">{item.phone || '-'}</div>,
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
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-gray-200 text-xs"
              title="Lihat Detail"
              onClick={() => {
                setSelectedResponse(item);
                setIsDetailModalOpen(true);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Lihat
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-200 bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={selectedYudisiumId} onValueChange={setSelectedYudisiumId}>
            <SelectTrigger className="w-full sm:w-[280px] h-9 border-gray-200 bg-card text-xs font-medium text-foreground">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Pilih Periode Yudisium" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-gray-200 p-1">
              <SelectItem value="all" className="rounded-md text-xs py-2">
                Semua Periode
              </SelectItem>
              {uniqueYudisiums.map((y) => (
                <SelectItem key={y.id} value={y.id} className="rounded-md text-xs py-2">
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Total: <strong className="text-foreground">{filteredByYudisium.length}</strong> responden
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-gray-200 text-xs font-medium text-foreground bg-card hover:bg-accent disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={filteredByYudisium.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            Unduh Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-gray-200 text-xs font-medium text-foreground bg-card hover:bg-accent disabled:opacity-50"
            onClick={() => {
              setTempPdfYudisiumId(selectedYudisiumId);
              setIsPdfModalOpen(true);
            }}
            disabled={filteredByYudisium.length === 0}
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      {chartQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chartQuestions.map((q) => (
            <Card key={q.id} className="border border-gray-200 bg-card rounded-lg overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-gray-100">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                    {q.question}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {q.answeredCount} dari {q.respondentCount} responden menjawab
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={q.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {q.data.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          borderColor: '#e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-1 border-t border-gray-100">
                  {q.data.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="font-semibold text-foreground">{item.value}</span>
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
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
      )}

      {/* Individual Responses Table Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground px-1">Responden Individual</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 bg-card rounded-lg border border-gray-200">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-6 w-6 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Memuat data respons...</p>
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
            className="border border-gray-200 rounded-lg overflow-hidden"
          />
        )}
      </div>

      {/* Export PDF Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-md border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Ekspor Laporan PDF</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih periode yudisium yang ingin disertakan dalam laporan exit survey.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exit-survey-pdf-period" className="text-xs text-muted-foreground font-medium">
                Periode Yudisium
              </Label>
              <Select value={tempPdfYudisiumId} onValueChange={setTempPdfYudisiumId}>
                <SelectTrigger id="exit-survey-pdf-period" className="w-full h-9 border-gray-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Pilih Periode Yudisium" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-xs">
                    Semua Periode
                  </SelectItem>
                  {uniqueYudisiums.map((y) => (
                    <SelectItem key={y.id} value={y.id} className="text-xs max-w-full whitespace-normal">
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" className="h-8 border-gray-200 text-xs" onClick={() => setIsPdfModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={() => handleExportPdf(tempPdfYudisiumId)}>
              Unduh Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[85vh] flex flex-col p-0 gap-0 rounded-lg overflow-hidden border border-gray-200 bg-card">
          <DialogHeader className="p-5 border-b border-gray-200 bg-card shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground">Detail Respons Exit Survey</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Jawaban lengkap dari <strong className="text-foreground font-semibold">{toTitleCaseName(selectedResponse?.name)}</strong> ({selectedResponse?.nim})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-card">
            {/* Student Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border border-gray-200 bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground font-medium">NIM</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{selectedResponse?.nim}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Angkatan</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{selectedResponse?.enrollmentYear || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Periode Yudisium</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate" title={selectedResponse?.yudisiumName}>
                  {selectedResponse?.yudisiumName || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Waktu Submit</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {selectedResponse && formatSubmitTime(selectedResponse.submittedAt)}
                </p>
              </div>
            </div>

            {/* Questions by Session */}
            <div className="space-y-6">
              {form.sessions?.map((session, sIdx) => (
                <div key={session.id} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground shrink-0">
                      {sIdx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{session.name}</h4>
                  </div>

                  <div className="space-y-3">
                    {session.questions?.map((q, qIdx) => {
                      const answers = selectedResponse?.answers.filter((a: any) => a.questionId === q.id) || [];
                      const answerText = answers.map((a: any) => a.optionText || a.answerText).filter(Boolean).join(', ');

                      return (
                        <div key={q.id} className="p-4 bg-card rounded-lg border border-gray-200 space-y-2">
                          <div className="flex gap-2 text-xs">
                            <span className="font-semibold text-muted-foreground">{qIdx + 1}.</span>
                            <p className="font-semibold text-foreground leading-snug">
                              {q.question}
                            </p>
                          </div>
                          <div className="pl-4">
                            {answerText ? (
                              <div className="text-xs text-foreground bg-muted/30 p-3 rounded-md border border-gray-100 font-medium leading-relaxed">
                                {answerText}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
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

          <DialogFooter className="p-4 border-t border-gray-200 bg-card shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailModalOpen(false)}
              className="h-8 px-4 border-gray-200 text-xs font-medium"
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
