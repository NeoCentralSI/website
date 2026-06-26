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

    if (questionType === 'multiple_choice' && answer.optionId) {
      const existing = result[answer.questionId]?.optionIds ?? [];
      result[answer.questionId] = { optionIds: [...new Set([...existing, answer.optionId])] };
      continue;
    }

    if (['short_answer', 'paragraph', 'date'].includes(questionType as string) && answer.answerText) {
      result[answer.questionId] = { answerText: answer.answerText };
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
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
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
              <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-destructive uppercase tracking-wider">
                <span>* Wajib diisi</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Bagian {currentStep + 1} dari {totalSteps}</span>
            <span>{Math.round(progress)}% selesai</span>
          </div>
          <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Section Content */}
        <div
          className={cn(
            "transition-all duration-200",
            isAnimating
              ? direction === 'forward'
                ? 'opacity-0 translate-x-4'
                : 'opacity-0 -translate-x-4'
              : 'opacity-100 translate-x-0'
          )}
        >
          {/* Section header */}
          <div className="bg-primary rounded-t-2xl px-7 py-6">
            <h2 className="text-white font-bold text-lg leading-tight">
              {currentSession?.name || `Bagian ${currentStep + 1}`}
            </h2>
            {currentSession?.description && (
              <p className="text-white/80 text-xs mt-1.5 leading-relaxed font-medium">
                {currentSession.description}
              </p>
            )}
          </div>

          {/* Questions List */}
          <div className="bg-muted/20 border border-border/40 border-t-0 rounded-b-2xl p-4 space-y-3">
            {currentSession?.questions?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground/50 text-sm">
                Tidak ada pertanyaan di bagian ini.
              </div>
            ) : (
              currentSession?.questions?.map((question: any, qIdx: number) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  globalIndex={globalStartIndex + qIdx + 1}
                  answer={answers[question.id] ?? {}}
                  onUpdate={(val) => setAnswers(prev => ({ ...prev, [question.id]: val }))}
                  disabled={isSubmitted}
                />
              ))
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8">
          <Button
            variant="outline"
            onClick={() => navigateStep('back')}
            disabled={isFirstStep || isAnimating}
            className="gap-2 rounded-xl h-11 px-5 font-semibold border-border/60 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            {orderedSessions.map((_, idx) => (
              <button
                key={idx}
                disabled={isAnimating}
                onClick={() => {
                   if (idx === currentStep) return;
                   navigateStep(idx > currentStep ? 'forward' : 'back');
                   setTimeout(() => setCurrentStep(idx), 200);
                }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  idx === currentStep
                    ? "w-8 h-2.5 bg-primary"
                    : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isAnimating || isSubmitted || submitMutation.isPending}
              className={cn(
                "gap-2 rounded-xl h-11 px-6 font-bold text-sm shadow-sm",
                isSubmitted ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-primary hover:bg-primary/90 text-white"
              )}
            >
              {isSubmitted ? 'Telah Terkirim' : 'Kirim Respons'}
            </Button>
          ) : (
            <Button
              onClick={() => navigateStep('forward')}
              disabled={isAnimating}
              className="gap-2 rounded-xl h-11 px-6 font-bold bg-primary hover:bg-primary/90 text-white text-sm shadow-sm"
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isSubmitted && data.response?.submittedAt && (
           <p className="text-center text-[11px] text-muted-foreground font-medium pt-8">
             Jawaban Anda telah terkirim pada {new Date(data.response.submittedAt).toLocaleString('id-ID')}
           </p>
        )}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Submit Exit Survey</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah dikirim, jawaban tidak dapat diubah lagi. Pastikan semua data sudah benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              disabled={submitMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {submitMutation.isPending ? 'Mengirim...' : 'Ya, Kirim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
