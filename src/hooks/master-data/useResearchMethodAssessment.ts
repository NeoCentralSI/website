import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createResearchMethodCpmk,
  createResearchMethodCriteria,
  createResearchMethodRubric,
  deleteResearchMethodCpmk,
  deleteResearchMethodCriteria,
  deleteResearchMethodRubric,
  getResearchMethodConfiguration,
  getResearchMethodCpmks,
  getResearchMethodWeightSummary,
  removeResearchMethodCpmkConfiguration,
  reorderResearchMethodCriteria,
  reorderResearchMethodRubrics,
  updateResearchMethodCpmk,
  updateResearchMethodCriteria,
  updateResearchMethodRubric,
  type CreateResearchMethodCpmkPayload,
  type CreateResearchMethodCriteriaPayload,
  type CreateResearchMethodRubricPayload,
  type ResearchMethodAssessor,
  type UpdateResearchMethodCpmkPayload,
  type UpdateResearchMethodCriteriaPayload,
  type UpdateResearchMethodRubricPayload,
} from "@/services/researchMethodAssessment.service";

const ROOT_KEY = "research-method-assessment-master";

export function useResearchMethodAssessment(
  assessor: ResearchMethodAssessor,
  academicYearId?: string | null,
) {
  const queryClient = useQueryClient();
  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: [ROOT_KEY, academicYearId] });

  const configuration = useQuery({
    queryKey: [ROOT_KEY, academicYearId, "configuration", assessor],
    queryFn: () =>
      getResearchMethodConfiguration(assessor, academicYearId as string),
    enabled: Boolean(academicYearId),
  });

  const cpmks = useQuery({
    queryKey: [ROOT_KEY, academicYearId, "cpmks"],
    queryFn: () => getResearchMethodCpmks(academicYearId as string),
    enabled: Boolean(academicYearId),
  });

  const summary = useQuery({
    queryKey: [ROOT_KEY, academicYearId, "summary"],
    queryFn: () => getResearchMethodWeightSummary(academicYearId as string),
    enabled: Boolean(academicYearId),
  });

  const createCpmkMutation = useMutation({
    mutationFn: createResearchMethodCpmk,
    onSuccess: () => {
      invalidateAll();
      toast.success("CPMK Metode Penelitian berhasil ditambahkan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCpmkMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateResearchMethodCpmkPayload;
    }) => updateResearchMethodCpmk(id, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("CPMK Metode Penelitian berhasil diubah");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCpmkMutation = useMutation({
    mutationFn: deleteResearchMethodCpmk,
    onSuccess: () => {
      invalidateAll();
      toast.success("CPMK Metode Penelitian berhasil dihapus");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createCriteriaMutation = useMutation({
    mutationFn: (payload: CreateResearchMethodCriteriaPayload) =>
      createResearchMethodCriteria(assessor, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("Kriteria penilaian berhasil ditambahkan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateResearchMethodCriteriaPayload;
    }) => updateResearchMethodCriteria(assessor, id, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("Kriteria penilaian berhasil diubah");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: (id: string) => deleteResearchMethodCriteria(assessor, id),
    onSuccess: () => {
      invalidateAll();
      toast.success("Kriteria penilaian berhasil dihapus");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeConfigurationMutation = useMutation({
    mutationFn: (cpmkId: string) =>
      removeResearchMethodCpmkConfiguration(assessor, cpmkId),
    onSuccess: () => {
      invalidateAll();
      toast.success("Konfigurasi CPMK berhasil dilepas");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createRubricMutation = useMutation({
    mutationFn: ({
      criteriaId,
      payload,
    }: {
      criteriaId: string;
      payload: CreateResearchMethodRubricPayload;
    }) => createResearchMethodRubric(assessor, criteriaId, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("Rubrik penilaian berhasil ditambahkan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRubricMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateResearchMethodRubricPayload;
    }) => updateResearchMethodRubric(assessor, id, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("Rubrik penilaian berhasil diubah");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRubricMutation = useMutation({
    mutationFn: (id: string) => deleteResearchMethodRubric(assessor, id),
    onSuccess: () => {
      invalidateAll();
      toast.success("Rubrik penilaian berhasil dihapus");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reorderCriteriaMutation = useMutation({
    mutationFn: ({
      cpmkId,
      orderedIds,
    }: {
      cpmkId: string;
      orderedIds: string[];
    }) => reorderResearchMethodCriteria(assessor, cpmkId, orderedIds),
    onSuccess: invalidateAll,
    onError: (error: Error) => toast.error(error.message),
  });

  const reorderRubricsMutation = useMutation({
    mutationFn: ({
      criteriaId,
      orderedIds,
    }: {
      criteriaId: string;
      orderedIds: string[];
    }) => reorderResearchMethodRubrics(assessor, criteriaId, orderedIds),
    onSuccess: invalidateAll,
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    cpmks: configuration.data ?? [],
    allCpmks: cpmks.data ?? [],
    weightSummary: summary.data ?? null,
    isLoading: configuration.isLoading,
    isFetching: configuration.isFetching,
    refetch: configuration.refetch,
    isCpmkLoading: cpmks.isLoading,
    isCpmkFetching: cpmks.isFetching,
    refetchCpmks: cpmks.refetch,
    createCpmk: (
      payload: Omit<CreateResearchMethodCpmkPayload, "academicYearId">,
    ) => {
      if (!academicYearId) {
        return Promise.reject(
          new Error("Pilih tahun ajaran terlebih dahulu"),
        );
      }
      return createCpmkMutation.mutateAsync({
        ...payload,
        academicYearId,
      });
    },
    updateCpmk: (id: string, payload: UpdateResearchMethodCpmkPayload) =>
      updateCpmkMutation.mutateAsync({ id, payload }),
    deleteCpmk: deleteCpmkMutation.mutateAsync,
    createCriteria: createCriteriaMutation.mutateAsync,
    updateCriteria: (
      id: string,
      payload: UpdateResearchMethodCriteriaPayload,
    ) => updateCriteriaMutation.mutateAsync({ id, payload }),
    deleteCriteria: deleteCriteriaMutation.mutate,
    removeConfiguration: removeConfigurationMutation.mutateAsync,
    createRubric: (
      criteriaId: string,
      payload: CreateResearchMethodRubricPayload,
    ) => createRubricMutation.mutateAsync({ criteriaId, payload }),
    updateRubric: (
      id: string,
      payload: UpdateResearchMethodRubricPayload,
    ) => updateRubricMutation.mutateAsync({ id, payload }),
    deleteRubric: deleteRubricMutation.mutate,
    reorderCriteria: (cpmkId: string, orderedIds: string[]) =>
      reorderCriteriaMutation.mutateAsync({ cpmkId, orderedIds }),
    reorderRubrics: (criteriaId: string, orderedIds: string[]) =>
      reorderRubricsMutation.mutateAsync({ criteriaId, orderedIds }),
    isCreatingCpmk: createCpmkMutation.isPending,
    isUpdatingCpmk: updateCpmkMutation.isPending,
    isDeletingCpmk: deleteCpmkMutation.isPending,
    isDeletingCriteria: deleteCriteriaMutation.isPending,
    isRemovingConfiguration: removeConfigurationMutation.isPending,
    isDeletingRubric: deleteRubricMutation.isPending,
  };
}
