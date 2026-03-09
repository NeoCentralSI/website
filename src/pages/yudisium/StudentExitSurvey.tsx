import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useStudentExitSurveyDetail, useSubmitStudentExitSurvey } from '@/hooks/yudisium/useStudentExitSurvey';
import type { StudentExitSurveyDetailResponse } from '@/services/studentExitSurvey.service';
import { toast } from 'sonner';

type AnswerState = Record<string, { optionId?: string; optionIds?: string[]; answerText?: string }>;

const mapInitialAnswersFromResponse = (
  data: StudentExitSurveyDetailResponse | undefined
): AnswerState => {
  if (!data?.response) return {};

  const questionTypeMap = new Map(data.form.questions.map((q) => [q.id, q.questionType]));
  const result: AnswerState = {};

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

    if ((questionType === 'text' || questionType === 'textarea') && answer.answerText) {
      result[answer.questionId] = { answerText: answer.answerText };
    }
  }

  return result;
};

export default function StudentExitSurvey() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data, isLoading, isError, error } = useStudentExitSurveyDetail();
  const submitMutation = useSubmitStudentExitSurvey();

  const initialAnswers = useMemo(() => mapInitialAnswersFromResponse(data), [data]);
  const [answers, setAnswers] = useState<AnswerState>({});

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium/student' },
      { label: 'Exit Survey' },
    ]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const isSubmitted = !!data?.isSubmitted;

  const updateSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { optionId } }));
  };

  const toggleMultipleChoice = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.optionIds ?? [];
      const next = checked
        ? [...new Set([...current, optionId])]
        : current.filter((id) => id !== optionId);
      return { ...prev, [questionId]: { optionIds: next } };
    });
  };

  const updateTextAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answerText: value } }));
  };

  const getRequiredMissing = () => {
    if (!data) return [];

    return data.form.questions.filter((q) => {
      if (!q.isRequired) return false;
      const a = answers[q.id];

      if (!a) return true;

      if (q.questionType === 'single_choice') return !a.optionId;
      if (q.questionType === 'multiple_choice') return !(a.optionIds && a.optionIds.length > 0);
      return !(a.answerText && a.answerText.trim().length > 0);
    });
  };

  const handleSubmit = async () => {
    if (!data || isSubmitted) return;

    const missing = getRequiredMissing();
    if (missing.length > 0) {
      const first = missing[0];
      toast.error(`Pertanyaan wajib belum diisi: ${first.question}`);
      return;
    }

    const payloadAnswers = data.form.questions
      .map((q) => {
        const a = answers[q.id];
        if (!a) return null;

        if (q.questionType === 'single_choice') {
          if (!a.optionId) return null;
          return { questionId: q.id, optionId: a.optionId };
        }

        if (q.questionType === 'multiple_choice') {
          const optionIds = a.optionIds ?? [];
          if (optionIds.length === 0) return null;
          return { questionId: q.id, optionIds };
        }

        const answerText = (a.answerText ?? '').trim();
        if (!answerText) return null;
        return { questionId: q.id, answerText };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    await submitMutation.mutateAsync({ answers: payloadAnswers });
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exit Survey</h1>
        <p className="text-muted-foreground">Silakan lengkapi survei ini sebagai salah satu syarat pendaftaran yudisium.</p>
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat exit survey..." />
        </div>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal Memuat Exit Survey</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Data exit survey tidak tersedia.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{data.form.name}</CardTitle>
                  <CardDescription>
                    {data.form.description ??
                      'Survei ini bertujuan untuk evaluasi program studi dan peningkatan mutu pembelajaran.'}
                  </CardDescription>
                </div>
                {isSubmitted && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Sudah Dikirim</Badge>}
              </div>
            </CardHeader>
            {isSubmitted && data.response?.submittedAt && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Jawaban telah dikirim pada {new Date(data.response.submittedAt).toLocaleString('id-ID')}. Anda hanya dapat melihat kembali jawaban.
                </p>
              </CardContent>
            )}
          </Card>

          {data.form.questions.map((q, idx) => {
            const answer = answers[q.id] ?? {};
            return (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {idx + 1}. {q.question}
                    {q.isRequired && <span className="text-destructive">*</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {q.questionType === 'single_choice' && (
                    <RadioGroup
                      value={answer.optionId}
                      onValueChange={(value) => updateSingleChoice(q.id, value)}
                      disabled={isSubmitted}
                      className="grid grid-cols-1 gap-2 md:grid-cols-2"
                    >
                      {q.options.map((opt) => (
                        <Label key={opt.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                          <RadioGroupItem value={opt.id} />
                          <span className="text-sm">{opt.optionText}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}

                  {q.questionType === 'multiple_choice' && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {q.options.map((opt) => {
                        const checked = (answer.optionIds ?? []).includes(opt.id);
                        return (
                          <Label key={opt.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(state) => toggleMultipleChoice(q.id, opt.id, state === true)}
                              disabled={isSubmitted}
                            />
                            <span className="text-sm">{opt.optionText}</span>
                          </Label>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'text' && (
                    <Input
                      value={answer.answerText ?? ''}
                      onChange={(e) => updateTextAnswer(q.id, e.target.value)}
                      disabled={isSubmitted}
                      placeholder="Tulis jawaban Anda"
                    />
                  )}

                  {q.questionType === 'textarea' && (
                    <Textarea
                      value={answer.answerText ?? ''}
                      onChange={(e) => updateTextAnswer(q.id, e.target.value)}
                      disabled={isSubmitted}
                      rows={4}
                      placeholder="Tulis jawaban Anda"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}

          {!isSubmitted && (
            <div className="flex items-end justify-end gap-3">
              <Button
                onClick={() => {
                  handleSubmit().catch((e: Error) => {
                    toast.error(e.message || 'Gagal mengirim exit survey');
                  });
                }}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Mengirim...' : 'Submit Exit Survey'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
