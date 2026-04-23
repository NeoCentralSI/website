import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  getExitSurveyForms,
  getExitSurveyQuestions,
  createExitSurveyForm,
  updateExitSurveyForm,
  toggleExitSurveyForm,
  deleteExitSurveyForm,
  duplicateExitSurveyForm,
  createExitSurveyQuestion,
  updateExitSurveyQuestion,
  deleteExitSurveyQuestion,
} from '@/services/exitSurvey.service';
import type { ExitSurveyForm, ExitSurveyQuestion } from '@/types/exit-survey.types';
import type {
  CreateExitSurveyFormPayload,
  UpdateExitSurveyFormPayload,
  CreateExitSurveyQuestionPayload,
  UpdateExitSurveyQuestionPayload,
} from '@/types/exit-survey.types';
import { ExitSurveyFormTable } from './ExitSurveyFormTable';
import { ExitSurveyFormDialog } from './ExitSurveyFormDialog';
import { ExitSurveyQuestionTable } from './ExitSurveyQuestionTable';

const FORMS_QUERY_KEY = ['exit-survey', 'forms'] as const;
const FORM_DETAIL_QUERY_KEY = (id: string) => ['exit-survey', 'form', id] as const;
const QUESTIONS_QUERY_KEY = (formId: string) => ['exit-survey', 'questions', formId] as const;

export function ExitSurveyManagementPanel() {
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState<ExitSurveyForm | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<ExitSurveyQuestion | null>(null);

  const { data: forms = [], isLoading: formsLoading, isFetching: formsFetching } = useQuery({
    queryKey: FORMS_QUERY_KEY,
    queryFn: getExitSurveyForms,
  });

  const formId = selectedForm?.id ?? '';
  const { data: questions = [], isLoading: questionsLoading, isFetching: questionsFetching } = useQuery({
    queryKey: QUESTIONS_QUERY_KEY(formId),
    queryFn: () => getExitSurveyQuestions(formId),
    enabled: !!formId,
  });

  const createFormMutation = useMutation({
    mutationFn: (payload: CreateExitSurveyFormPayload) => createExitSurveyForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Form exit survey berhasil ditambahkan');
      setFormDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExitSurveyFormPayload }) =>
      updateExitSurveyForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Form berhasil diubah');
      setFormDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFormMutation = useMutation({
    mutationFn: (id: string) => toggleExitSurveyForm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FORM_DETAIL_QUERY_KEY(id) });
      toast.success('Status form berhasil diubah');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id: string) => deleteExitSurveyForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Form berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateFormMutation = useMutation({
    mutationFn: (id: string) => duplicateExitSurveyForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Form berhasil diduplikasi');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createQuestionMutation = useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: CreateExitSurveyQuestionPayload }) =>
      createExitSurveyQuestion(formId, data),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY(formId) });
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Pertanyaan berhasil ditambahkan');
      setQuestionDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({
      formId,
      questionId,
      data,
    }: {
      formId: string;
      questionId: string;
      data: UpdateExitSurveyQuestionPayload;
    }) => updateExitSurveyQuestion(formId, questionId, data),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY(formId) });
      toast.success('Pertanyaan berhasil diubah');
      setQuestionDialogOpen(false);
      setEditQuestion(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: ({ formId, questionId }: { formId: string; questionId: string }) =>
      deleteExitSurveyQuestion(formId, questionId),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY(formId) });
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success('Pertanyaan berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmitQuestion = async (
    fId: string,
    data: CreateExitSurveyQuestionPayload | UpdateExitSurveyQuestionPayload,
    questionId?: string
  ) => {
    if (questionId) {
      await updateQuestionMutation.mutateAsync({
        formId: fId,
        questionId,
        data: data as UpdateExitSurveyQuestionPayload,
      });
    } else {
      await createQuestionMutation.mutateAsync({
        formId: fId,
        data: data as CreateExitSurveyQuestionPayload,
      });
    }
  };

  if (selectedForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedForm(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
        <div className="border rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{selectedForm.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {questions.length} pertanyaan telah dibuat
          </p>
        </div>
        {questionsLoading && questions.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Loading size="lg" text="Memuat pertanyaan..." />
          </div>
        ) : (
          <ExitSurveyQuestionTable
            formId={formId}
            formName={selectedForm.name}
            data={questions}
            isLoading={questionsLoading}
            isFetching={questionsFetching}
            onEdit={(q) => {
              setEditQuestion(q);
              setQuestionDialogOpen(true);
            }}
            onDelete={(fId, qId) =>
              deleteQuestionMutation.mutate({ formId: fId, questionId: qId })
            }
            onAddQuestion={() => {
              setEditQuestion(null);
              setQuestionDialogOpen(true);
            }}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY(formId) })
            }
            isDeleting={deleteQuestionMutation.isPending}
            editQuestion={editQuestion}
            setEditQuestion={setEditQuestion}
            questionDialogOpen={questionDialogOpen}
            setQuestionDialogOpen={setQuestionDialogOpen}
            onSubmitQuestion={handleSubmitQuestion}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {formsLoading && forms.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loading size="lg" text="Memuat form..." />
        </div>
      ) : (
        <ExitSurveyFormTable
          data={forms}
          isLoading={formsLoading}
          isFetching={formsFetching}
          onToggle={(id) => toggleFormMutation.mutate(id)}
          onDelete={(id) => deleteFormMutation.mutate(id)}
          onUpdate={async (id, data) => {
            await updateFormMutation.mutateAsync({ id, data });
          }}
          onDuplicate={(id) => duplicateFormMutation.mutate(id)}
          onManageQuestions={(form) => setSelectedForm(form)}
          onCreate={() => setFormDialogOpen(true)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY })}
          isToggling={toggleFormMutation.isPending}
          isDeleting={deleteFormMutation.isPending}
          isDuplicating={duplicateFormMutation.isPending}
        />
      )}
      <ExitSurveyFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={(data: CreateExitSurveyFormPayload) => createFormMutation.mutateAsync(data)}
      />
    </div>
  );
}
