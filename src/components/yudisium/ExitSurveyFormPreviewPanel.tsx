import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ExitSurveyForm, ExitSurveySession } from '@/types/exit-survey.types';

interface ExitSurveyFormPreviewPanelProps {
  form: ExitSurveyForm;
}

const QuestionPreview = ({ question, globalIndex }: { question: any; globalIndex: number }) => {
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
          <div className="space-y-1">
            <input
              type="text"
              disabled
              placeholder="Jawaban Anda"
              className="w-full bg-transparent border-0 border-b border-border/60 rounded-none px-0 py-1.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors cursor-default"
            />
          </div>
        )}

        {question.questionType === 'paragraph' && (
          <Textarea
            disabled
            placeholder="Jawaban Anda"
            className="min-h-[80px] bg-muted/30 border-border/40 text-sm placeholder:text-muted-foreground/40 resize-none rounded-lg"
          />
        )}

        {question.questionType === 'date' && (
          <div className="relative inline-flex items-center gap-2 border border-border/50 rounded-lg px-3 py-2 bg-muted/20 w-auto">
            <CalendarIcon className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground/50">gg/bb/tttt</span>
          </div>
        )}

        {question.questionType === 'single_choice' && (
          <RadioGroup disabled className="space-y-2 pt-1">
            {question.options?.map((option: any) => (
              <div key={option.id} className="flex items-center gap-3 group">
                <RadioGroupItem
                  value={option.id}
                  id={`prev-${option.id}`}
                  className="border-muted-foreground/40"
                />
                <Label
                  htmlFor={`prev-${option.id}`}
                  className="text-sm font-normal text-foreground/80 cursor-default"
                >
                  {option.optionText}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.questionType === 'multiple_choice' && (
          <div className="space-y-2 pt-1">
            {question.options?.map((option: any) => (
              <div key={option.id} className="flex items-center gap-3">
                <Checkbox
                  id={`prev-cb-${option.id}`}
                  disabled
                  className="border-muted-foreground/40 rounded-sm"
                />
                <Label
                  htmlFor={`prev-cb-${option.id}`}
                  className="text-sm font-normal text-foreground/80 cursor-default"
                >
                  {option.optionText}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ExitSurveyFormPreviewPanel = ({ form }: ExitSurveyFormPreviewPanelProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Sort sessions and questions
  const orderedSessions: ExitSurveySession[] = [...(form.sessions || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(session => ({
      ...session,
      questions: session.questions
        ? [...session.questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
        : [],
    }));

  const totalSteps = orderedSessions.length;
  const currentSession = orderedSessions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  // Compute global question start index for current session
  const globalStartIndex = orderedSessions
    .slice(0, currentStep)
    .reduce((acc, s) => acc + (s.questions?.length || 0), 0);

  const navigate = (dir: 'forward' | 'back') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      if (dir === 'forward') setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
      else setCurrentStep(s => Math.max(s - 1, 0));
      setIsAnimating(false);
    }, 200);
  };

  if (totalSteps === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Belum ada bagian di formulir ini.</p>
        <p className="text-xs text-muted-foreground/60">Tambahkan bagian dan pertanyaan di tab Editor.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-0 select-none">
      {/* Progress bar + step indicator */}
      <div className="space-y-2 mb-6">
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

      {/* Section Card */}
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
        <div className="bg-primary rounded-t-2xl px-7 py-5">
          <h2 className="text-white font-bold text-lg font-display leading-tight">
            {currentSession?.name || `Bagian ${currentStep + 1}`}
          </h2>
          {currentSession?.description && (
            <p className="text-white/80 text-xs mt-1 leading-relaxed font-medium">
              {currentSession.description}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="bg-muted/20 border border-border/40 border-t-0 rounded-b-2xl p-4 space-y-3">
          {currentSession?.questions?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground/50 text-sm">
              Belum ada pertanyaan di bagian ini.
            </div>
          ) : (
            currentSession?.questions?.map((question, qIdx) => (
              <QuestionPreview
                key={question.id}
                question={question}
                globalIndex={globalStartIndex + qIdx + 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => navigate('back')}
          disabled={isFirstStep || isAnimating}
          className="gap-2 rounded-xl h-10 px-5 font-semibold border-border/60 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Button>

        <div className="flex items-center gap-1.5">
          {orderedSessions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx === currentStep || isAnimating) return;
                setDirection(idx > currentStep ? 'forward' : 'back');
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentStep(idx);
                  setIsAnimating(false);
                }, 200);
              }}
              className={cn(
                "rounded-full transition-all duration-300",
                idx === currentStep
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-border hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button
            disabled
            className="gap-2 rounded-xl h-10 px-5 font-bold bg-primary/40 text-white text-sm cursor-not-allowed shadow-none"
          >
            Kirim Respons
          </Button>
        ) : (
          <Button
            onClick={() => navigate('forward')}
            disabled={isAnimating}
            className="gap-2 rounded-xl h-10 px-5 font-bold bg-primary hover:bg-primary/90 text-white text-sm shadow-sm"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview disclaimer */}
      <p className="text-center text-[10px] text-muted-foreground/50 font-medium pt-4">
        Mode pratinjau — respons tidak akan disimpan
      </p>
    </div>
  );
};

export default ExitSurveyFormPreviewPanel;
