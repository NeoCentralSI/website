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
import { TableIconAction } from '@/components/shared/TableIconAction';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RefreshButton } from '@/components/ui/refresh-button';
import type { ExitSurveyForm, ExitSurveyResponse, ExitSurveyAnswer } from '@/types/exit-survey.types';
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

const formatAnswer = (answer: ExitSurveyAnswer): string => {
  if (answer.optionText != null) return answer.optionText;
  if (answer.answerText != null) return answer.answerText;
  if (answer.answerNumber != null) return String(answer.answerNumber);
  if (answer.answerDate) {
    const date = new Date(answer.answerDate);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  return '';
};

function ResponseField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium" title={value ? String(value) : undefined}>{value || '-'}</dd>
    </div>
  );
}

const ExitSurveyFormResponsePanel = ({ form }: ExitSurveyFormResponsePanelProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedYudisiumId, setSelectedYudisiumId] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [tempPdfYudisiumId, setTempPdfYudisiumId] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<ExitSurveyResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: responses = [], isLoading, isFetching, isError, refetch } = useQuery({
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

  const tableColumns = useMemo<Column<ExitSurveyResponse>[]>(
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
        width: 180,
        render: (item) => <div title={item.email} className="text-muted-foreground line-clamp-2 break-all whitespace-normal">{item.email}</div>,
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
        width: 64,
        className: 'text-right',
        render: (item) => (
          <div className="flex justify-end">
            <TableIconAction icon={Eye} label={`Lihat detail respons ${toTitleCaseName(item.name)}`}
              onClick={() => {
                setSelectedResponse(item);
                setIsDetailModalOpen(true);
              }}
            />
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
            <SelectTrigger className="w-full sm:w-[280px]" aria-label="Periode yudisium">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Pilih Periode Yudisium" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Semua Periode
              </SelectItem>
              {uniqueYudisiums.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Responden: <span className="font-medium text-foreground">{filteredByYudisium.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredByYudisium.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Unduh Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempPdfYudisiumId(selectedYudisiumId);
              setIsPdfModalOpen(true);
            }}
            disabled={filteredByYudisium.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      {chartQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chartQuestions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="text-base leading-snug">
                    {q.question}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {q.answeredCount} dari {q.respondentCount} responden menjawab
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate text-muted-foreground" title={item.name}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="font-semibold text-foreground">{item.value}</span>
                        <span className="min-w-12 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-right text-xs font-medium tabular-nums text-muted-foreground">
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
        <h3 className="text-base font-semibold text-foreground">Responden Individual</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 bg-card rounded-lg border border-gray-200">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-6 w-6 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Memuat data respons...</p>
            </div>
          </div>
        ) : (
          <CustomTable
            tableClassName="table-fixed"
            isRefreshing={isFetching}
            actions={<RefreshButton onClick={() => refetch()} isRefreshing={isFetching} />}
            columns={tableColumns}
            data={paginatedResponses}
            total={filteredResponses.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            enableColumnFilters
            emptyText={isError ? 'Gagal memuat respons. Silakan muat ulang.' : 'Belum ada responden untuk formulir ini'}
            className="border border-gray-200 rounded-lg overflow-hidden"
          />
        )}
      </div>

      {/* Export PDF Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unduh Laporan PDF</DialogTitle>
            <DialogDescription>Pilih periode yudisium yang disertakan dalam laporan exit survey</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="exit-survey-pdf-period">Periode yudisium</Label>
            <Select value={tempPdfYudisiumId} onValueChange={setTempPdfYudisiumId}>
              <SelectTrigger id="exit-survey-pdf-period" className="w-full">
                <SelectValue placeholder="Pilih periode yudisium" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">Semua Periode</SelectItem>
                {uniqueYudisiums.map((y) => (
                  <SelectItem key={y.id} value={y.id} className="max-w-full whitespace-normal">{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfModalOpen(false)}>Batal</Button>
            <Button onClick={() => handleExportPdf(tempPdfYudisiumId)}>Unduh Laporan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Detail Modal */}
      <RecordDetailDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        title="Detail Respons Exit Survey"
        description={`Jawaban lengkap dari ${toTitleCaseName(selectedResponse?.name)} (${selectedResponse?.nim ?? '-'})`}
        footer={<DetailDialogActions onClose={() => setIsDetailModalOpen(false)} />}
      >
        <dl className="grid gap-3 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-2">
          <ResponseField label="NIM" value={selectedResponse?.nim} />
          <ResponseField label="Angkatan" value={selectedResponse?.enrollmentYear} />
          <ResponseField label="Periode yudisium" value={selectedResponse?.yudisiumName} />
          <ResponseField label="Waktu kirim" value={selectedResponse ? formatSubmitTime(selectedResponse.submittedAt) : null} />
        </dl>

        {form.sessions?.map((session, sIdx) => (
          <section key={session.id} className="space-y-2">
            <p className="text-sm font-semibold">{sIdx + 1}. {session.name}</p>
            <dl className="space-y-3">
              {session.questions?.map((q, qIdx) => {
                const answers = selectedResponse?.answers.filter((a) => a.questionId === q.id) || [];
                const answerText = answers.map(formatAnswer).filter(Boolean).join(', ');
                return (
                  <div key={q.id} className="space-y-1 rounded-md border p-3 border-gray-200">
                    <dt className="text-sm text-muted-foreground">{qIdx + 1}. {q.question}</dt>
                    <dd className={answerText ? 'whitespace-pre-wrap break-words text-sm font-medium' : 'text-sm italic text-muted-foreground'}>
                      {answerText || 'Tidak memberikan jawaban'}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </RecordDetailDialog>
    </div>
  );
};

export default ExitSurveyFormResponsePanel;
