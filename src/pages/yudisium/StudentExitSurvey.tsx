import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Link, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useStudentExitSurvey, useSubmitStudentExitSurvey } from '@/hooks/yudisium/useYudisiumExitSurvey';
import { DatePicker } from '@/components/ui/date-picker';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AnswerState = Record<string, { optionId?: string; optionIds?: string[]; answerText?: string }>;

const parseIndonesianNumber = (val: string): number => {
  const trimmed = (val ?? '').trim();
  if (!trimmed) return NaN;
  if (!isNaN(Number(trimmed))) return Number(trimmed);
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  return isNaN(num) ? NaN : num;
};

const mapInitialAnswersFromResponse = (
  data: any
): AnswerState => {
  if (!data?.response) return {};

  const result: AnswerState = {};
  const sessions = data?.form?.sessions || [];
  const allQuestions = Array.isArray(sessions)
    ? sessions.flatMap((s: any) => s.questions || [])
    : [];
  const questionTypeMap = new Map(allQuestions.map((q: any) => [q.id, q.questionType]));

  for (const answer of data.response.answers) {
    const questionType = questionTypeMap.get(answer.questionId);
    if (!questionType) continue;

    if (questionType === 'single_choice' && answer.optionId) {
      result[answer.questionId] = { optionId: answer.optionId };
      continue;
    }

    if (questionType === 'multiple_choice') {
      const optionIds = (answer.optionIds && answer.optionIds.length > 0)
        ? answer.optionIds
        : answer.optionId
        ? [answer.optionId]
        : [];
      if (optionIds.length > 0) {
        const existing = result[answer.questionId]?.optionIds ?? [];
        result[answer.questionId] = { optionIds: [...new Set([...existing, ...optionIds])] };
      }
      continue;
    }

    if (questionType === 'date') {
      const dateVal = answer.answerDate || answer.answerText;
      if (dateVal) {
        const formattedDate = typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
        if (formattedDate) {
          result[answer.questionId] = { answerText: formattedDate };
        }
      }
      continue;
    }

    if (['short_answer', 'paragraph', 'number'].includes(questionType as string) && (answer.answerText || answer.answerNumber !== undefined)) {
      result[answer.questionId] = { answerText: answer.answerText ?? String(answer.answerNumber) };
    }
  }

  return result;
};

function QuestionCard({
  question,
  globalIndex,
  answer,
  onUpdate,
  disabled
}: {
  question: any;
  globalIndex: number;
  answer: any;
  onUpdate: (val: any) => void;
  disabled?: boolean;
}) {
  const parseLocalDate = (dateStr: any) => {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? undefined : dateStr;
    const str = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
    if (!str) return undefined;
    const parts = str.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return undefined;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return isNaN(d.getTime()) ? undefined : d;
  };

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground leading-snug">
          {globalIndex}. {question.question}
          {question.isRequired && <span className="text-destructive ml-1">*</span>}
        </p>
        {question.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {question.description}
          </p>
        )}
      </div>

      <div>
        {question.questionType === 'short_answer' && (
          <Input
            value={answer.answerText ?? ''}
            onChange={(e) => onUpdate({ answerText: e.target.value })}
            disabled={disabled}
            placeholder="Jawaban Anda"
            className="w-full bg-transparent border-0 border-b border-border/60 rounded-none px-0 py-1.5 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-primary transition-colors h-auto"
          />
        )}

        {question.questionType === 'paragraph' && (
          <Textarea
            value={answer.answerText ?? ''}
            onChange={(e) => onUpdate({ answerText: e.target.value })}
            disabled={disabled}
            placeholder="Jawaban Anda"
            className="min-h-[80px] bg-muted/30 border-border/40 text-sm placeholder:text-muted-foreground/40 resize-none rounded-lg"
          />
        )}

        {question.questionType === 'number' && (
          <Input
            type="text"
            inputMode="numeric"
            value={answer.answerText ?? ''}
            onChange={(e) => onUpdate({ answerText: e.target.value })}
            disabled={disabled}
            placeholder="Jawaban angka (contoh: 5.000.000 atau 5000000)"
            className="w-full bg-transparent border-0 border-b border-border/60 rounded-none px-0 py-1.5 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-primary transition-colors h-auto"
          />
        )}

        {question.questionType === 'date' && (
          <DatePicker
            value={parseLocalDate(answer.answerText)}
            onChange={(date) => onUpdate({ answerText: date ? format(date, 'yyyy-MM-dd') : '' })}
            disabled={disabled}
            showPastDates={true}
            className="w-full"
            placeholder="Pilih tanggal"
          />
        )}

        {question.questionType === 'single_choice' && (
          <RadioGroup
            value={answer.optionId}
            onValueChange={(val) => onUpdate({ optionId: val })}
            disabled={disabled}
            className="space-y-2 pt-1"
          >
            {question.options?.map((option: any) => (
              <div key={option.id} className="flex items-center gap-3 group">
                <RadioGroupItem
                  value={option.id}
                  id={`q-${question.id}-opt-${option.id}`}
                  className="border-muted-foreground/40"
                />
                <Label
                  htmlFor={`q-${question.id}-opt-${option.id}`}
                  className="text-sm font-normal text-foreground/80 cursor-pointer flex-1"
                >
                  {option.optionText}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.questionType === 'multiple_choice' && (
          <div className="space-y-2 pt-1">
            {question.options?.map((option: any) => {
              const checked = (answer.optionIds ?? []).includes(option.id);
              return (
                <div key={option.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`q-${question.id}-cb-${option.id}`}
                    checked={checked}
                    onCheckedChange={(isOk) => {
                       const current = answer.optionIds ?? [];
                       const next = isOk
                         ? [...new Set([...current, option.id])]
                         : current.filter((id: string) => id !== option.id);
                       onUpdate({ optionIds: next });
                    }}
                    disabled={disabled}
                    className="border-muted-foreground/40 rounded-sm"
                  />
                  <Label
                    htmlFor={`q-${question.id}-cb-${option.id}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer flex-1"
                  >
                    {option.optionText}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentExitSurvey() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data, isLoading, isError, error } = useStudentExitSurvey();
  const submitMutation = useSubmitStudentExitSurvey();

  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answers, setAnswers] = useState<AnswerState>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const initialAnswers = useMemo(() => mapInitialAnswersFromResponse(data), [data]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Exit Survey' },
    ]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const orderedSessions = useMemo(() => {
    if (!data?.form?.sessions) return [];
    return [...data.form.sessions].sort((a: any, b: any) => a.order - b.order);
  }, [data]);

  const totalSteps = orderedSessions.length;
  const currentSession = orderedSessions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const isSubmitted = !!data?.isSubmitted;

  const globalStartIndex = orderedSessions
    .slice(0, currentStep)
    .reduce((acc, s) => acc + (s.questions?.length || 0), 0);

  const navigateStep = (dir: 'forward' | 'back') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      if (dir === 'forward') setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
      else setCurrentStep(s => Math.max(s - 1, 0));
      setIsAnimating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleSubmit = () => {
    // Check missing in ALL sessions
    const allQuestions = orderedSessions.flatMap(s => s.questions);
    const missing = allQuestions.filter((q: any) => {
        if (!q.isRequired) return false;
        const a = answers[q.id];
        if (!a) return true;
        if (q.questionType === 'single_choice') return !a.optionId;
        if (q.questionType === 'multiple_choice') return !(a.optionIds && a.optionIds.length > 0);
        return !(a.answerText && a.answerText.trim().length > 0);
    });

    if (missing.length > 0) {
      toast.error(`Masih ada pertanyaan wajib yang belum diisi.`);
      return;
    }

    // Validate numeric questions
    for (const q of allQuestions) {
      if (q.questionType === 'number') {
        const val = (answers[q.id]?.answerText ?? '').trim();
        if (val.length > 0) {
          const num = parseIndonesianNumber(val);
          if (isNaN(num) || !isFinite(num)) {
            toast.error(`Jawaban untuk pertanyaan "${q.question}" harus berupa angka yang valid.`);
            return;
          }
        }
      }
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!data) return;
    const allQuestions = orderedSessions.flatMap(s => s.questions);
    const payloadAnswers = allQuestions
      .map((q: any) => {
        const a = answers[q.id];
        if (!a) return null;
        if (q.questionType === 'single_choice') {
          return a.optionId ? { questionId: q.id, optionId: a.optionId } : null;
        }
        if (q.questionType === 'multiple_choice') {
          return (a.optionIds?.length ?? 0) > 0 ? { questionId: q.id, optionIds: a.optionIds } : null;
        }
        if (q.questionType === 'number') {
          const txt = (a.answerText ?? '').trim();
          if (!txt) return null;
          const num = parseIndonesianNumber(txt);
          return !isNaN(num) ? { questionId: q.id, answerNumber: num, answerText: txt } : null;
        }
        if (q.questionType === 'date') {
          const txt = (a.answerText ?? '').trim();
          if (!txt) return null;
          return { questionId: q.id, answerDate: txt, answerText: txt };
        }
        const txt = (a.answerText ?? '').trim();
        return txt ? { questionId: q.id, answerText: txt } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    try {
      await submitMutation.mutateAsync({ answers: payloadAnswers });
      setShowConfirm(false);
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengirim exit survey');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat exit survey..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
          <h2 className="text-red-800 font-bold mb-2">Gagal Memuat Data</h2>
          <p className="text-red-600 text-sm">
            {error instanceof Error ? error.message : 'Silakan kembali ke dashboard.'}
          </p>
          <Button asChild variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">
            <Link to="/yudisium">Kembali</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/yudisium">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Exit Survey</h1>
              {isSubmitted && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-5 px-1.5 text-[10px]">
                  <PartyPopper className="mr-1 h-2.5 w-2.5" />
                  Selesai
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* Form Header Card - Only shown on first step */}
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl border-t-[10px] border-t-primary border-x border-b border-border/60 shadow-sm overflow-hidden">
            <div className="p-7 space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {data.form.name}
              </h1>
              {data.form.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.form.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar & Session Header */}
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Bagian {currentStep + 1} dari {totalSteps}: {currentSession?.name || 'Tanpa Bagian'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {currentSession?.description && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1">
              {currentSession.description}
            </p>
          )}
        </div>

        {/* Question Cards with Slide Animation */}
        <div
          className={cn(
            "space-y-4 transition-all duration-200",
            isAnimating && direction === 'forward' && "opacity-0 translate-x-4",
            isAnimating && direction === 'back' && "opacity-0 -translate-x-4"
          )}
        >
          {currentSession?.questions?.map((question: any, idx: number) => {
            const globalIndex = globalStartIndex + idx + 1;
            const answer = answers[question.id] || {};
            return (
              <QuestionCard
                key={question.id}
                question={question}
                globalIndex={globalIndex}
                answer={answer}
                onUpdate={(val) => {
                  if (isSubmitted) return;
                  setAnswers(prev => ({
                    ...prev,
                    [question.id]: { ...prev[question.id], ...val }
                  }));
                }}
                disabled={isSubmitted}
              />
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => navigateStep('back')}
            disabled={isFirstStep || isAnimating}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Button>

          {isLastStep ? (
            !isSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Kirim Exit Survey
              </Button>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 p-2 text-xs">
                Exit survey telah diselesaikan
              </Badge>
            )
          ) : (
            <Button
              onClick={() => navigateStep('forward')}
              disabled={isAnimating}
              className="gap-1.5"
            >
              Lanjut
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Exit Survey?</AlertDialogTitle>
            <AlertDialogDescription>
              Jawaban yang telah dikirim tidak dapat diubah kembali. Pastikan seluruh jawaban Anda sudah benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              disabled={submitMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitMutation.isPending ? 'Mengirim...' : 'Ya, Kirim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
