import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  getExitSurveyForms,
  createExitSurveyForm,
  updateExitSurveyForm,
  toggleExitSurveyForm,
  deleteExitSurveyForm,
  duplicateExitSurveyForm,
} from '@/services/yudisium/exit-survey.service';
import type {
  CreateExitSurveyFormPayload,
  UpdateExitSurveyFormPayload,
} from '@/types/exit-survey.types';
import { ExitSurveyFormTable } from './ExitSurveyFormTable';
import { ExitSurveyFormDialog } from './ExitSurveyFormDialog';

const FORMS_QUERY_KEY = ['exit-survey', 'forms'] as const;
const FORM_DETAIL_QUERY_KEY = (id: string) => ['exit-survey', 'form', id] as const;

export function ExitSurveyPanel() {
  const queryClient = useQueryClient();
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const { data: forms = [], isLoading: formsLoading, isFetching: formsFetching } = useQuery({
    queryKey: FORMS_QUERY_KEY,
    queryFn: getExitSurveyForms,
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
          onDelete={(id) => deleteFormMutation.mutate(id)}
          onUpdate={async (id, data) => {
            await updateFormMutation.mutateAsync({ id, data });
          }}
          onDuplicate={(id) => duplicateFormMutation.mutate(id)}
          onManageQuestions={() => {}} // Now handled by internal navigate in table
          onCreate={() => setFormDialogOpen(true)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY })}
          isUpdating={updateFormMutation.isPending || toggleFormMutation.isPending}
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
