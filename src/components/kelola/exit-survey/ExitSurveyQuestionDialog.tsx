import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getQuestionTypeLabel } from '@/lib/exitSurvey';
import type { ExitSurveyQuestion, ExitSurveyQuestionType } from '@/types/exitSurvey.types';
import type {
  CreateExitSurveyQuestionPayload,
  UpdateExitSurveyQuestionPayload,
} from '@/types/exitSurvey.types';

const QUESTION_TYPES: ExitSurveyQuestionType[] = [
  'single_choice',
  'multiple_choice',
  'text',
  'textarea',
];

interface ExitSurveyQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  editData?: ExitSurveyQuestion | null;
  orderNumber: number;
  onSubmit: (
    formId: string,
    data: CreateExitSurveyQuestionPayload | UpdateExitSurveyQuestionPayload,
    questionId?: string
  ) => Promise<unknown>;
}

export function ExitSurveyQuestionDialog({
  open,
  onOpenChange,
  formId,
  editData,
  orderNumber,
  onSubmit,
}: ExitSurveyQuestionDialogProps) {
  const [question, setQuestion] = useState('');
  const [questionType, setQuestionType] = useState<ExitSurveyQuestionType>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!editData;
  const isChoiceType =
    questionType === 'single_choice' || questionType === 'multiple_choice';

  useEffect(() => {
    if (editData) {
      setQuestion(editData.question);
      setQuestionType(editData.questionType);
      setIsRequired(editData.isRequired);
      setOptions(
        editData.options?.length
          ? editData.options.map((o) => o.optionText)
          : ['']
      );
    } else {
      setQuestion('');
      setQuestionType('text');
      setIsRequired(false);
      setOptions(['']);
    }
  }, [editData, open]);

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (index: number) =>
    setOptions((prev) => prev.filter((_, i) => i !== index));
  const setOption = (index: number, value: string) =>
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (isChoiceType && options.every((o) => !o.trim())) return;

    setIsSubmitting(true);
    try {
      const payload: CreateExitSurveyQuestionPayload = {
        question: question.trim(),
        questionType,
        isRequired,
        orderNumber,
      };
      if (isChoiceType) {
        payload.options = options
          .filter((o) => o.trim())
          .map((opt, i) => ({ optionText: opt.trim(), orderNumber: i + 1 }));
      }
      if (isEdit && editData) {
        await onSubmit(formId, payload, editData.id);
      } else {
        await onSubmit(formId, payload);
      }
      onOpenChange(false);
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    question.trim().length > 0 &&
    (!isChoiceType || options.some((o) => o.trim().length > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exit-q-text">Pertanyaan</Label>
            <Textarea
              id="exit-q-text"
              placeholder="Tulis pertanyaan..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Jenis Pertanyaan</Label>
            <Select
              value={questionType}
              onValueChange={(v) => setQuestionType(v as ExitSurveyQuestionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {getQuestionTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exit-q-required"
              checked={isRequired}
              onCheckedChange={(c) => setIsRequired(c === true)}
            />
            <Label htmlFor="exit-q-required" className="font-normal cursor-pointer">
              Wajib diisi
            </Label>
          </div>
          {isChoiceType && (
            <div className="space-y-2">
              <Label>Opsi jawaban</Label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Opsi ${i + 1}`}
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 1}
                      title="Hapus opsi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Opsi
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Pertanyaan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
