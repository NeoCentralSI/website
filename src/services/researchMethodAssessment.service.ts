import { API_CONFIG, getApiUrl } from "@/config/api";
import { unwrapApiArray, unwrapApiValue } from "@/lib/apiResponse";
import { apiRequest } from "./auth.service";

export type ResearchMethodAssessor = "supervisor" | "coordinator";

export interface ResearchMethodAssessmentRubric {
  id: string;
  assessmentCriteriaId: string;
  minScore: number;
  maxScore: number;
  description: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchMethodAssessmentCriteria {
  id: string;
  researchMethodCpmkId: string;
  name: string;
  maxScore: number;
  displayOrder: number;
  assessor: ResearchMethodAssessor;
  assessmentRubrics: ResearchMethodAssessmentRubric[];
}

export interface ResearchMethodCpmk {
  id: string;
  academicYearId: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  criteriaCount?: number;
}

export interface ResearchMethodCpmkWithRubrics extends ResearchMethodCpmk {
  assessmentCriterias: ResearchMethodAssessmentCriteria[];
}

export interface CreateResearchMethodCpmkPayload {
  code: string;
  description: string;
  academicYearId: string;
}

export type UpdateResearchMethodCpmkPayload = Partial<
  Pick<CreateResearchMethodCpmkPayload, "code" | "description">
>;

export interface CreateResearchMethodCriteriaPayload {
  researchMethodCpmkId: string;
  name: string;
  maxScore: number;
  displayOrder?: number;
}

export type UpdateResearchMethodCriteriaPayload =
  Partial<CreateResearchMethodCriteriaPayload>;

export interface CreateResearchMethodRubricPayload {
  minScore: number;
  maxScore: number;
  description: string;
  displayOrder?: number;
}

export type UpdateResearchMethodRubricPayload =
  Partial<CreateResearchMethodRubricPayload>;

export interface ResearchMethodWeightSummaryDetail {
  cpmkId: string;
  cpmkCode: string;
  cpmkDescription: string;
  criteriaCount: number;
  criteriaScoreSum: number;
  rubricCount: number;
}

export interface ResearchMethodWeightSummary {
  supervisorTotal: number;
  coordinatorTotal: number;
  totalScore: number;
  isComplete: boolean;
  remainingScore: number;
  supervisor: ResearchMethodWeightSummaryDetail[];
  coordinator: ResearchMethodWeightSummaryDetail[];
}

async function parseValue<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: fallbackMessage }));
    throw new Error(error.message || fallbackMessage);
  }
  return unwrapApiValue<T>(await response.json());
}

async function parseArray<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T[]> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: fallbackMessage }));
    throw new Error(error.message || fallbackMessage);
  }
  return unwrapApiArray<T>(await response.json());
}

function assessorQuery(
  assessor: ResearchMethodAssessor,
  values: Record<string, string> = {},
) {
  return new URLSearchParams({ assessor, ...values }).toString();
}

export async function getResearchMethodCpmks(
  academicYearId: string,
): Promise<ResearchMethodCpmk[]> {
  const query = new URLSearchParams({ academicYearId });
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CPMKS)}?${query}`,
  );
  return parseArray(response, "Gagal mengambil CPMK Metode Penelitian");
}

export async function createResearchMethodCpmk(
  payload: CreateResearchMethodCpmkPayload,
): Promise<ResearchMethodCpmk> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CPMKS),
    { method: "POST", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal menambah CPMK Metode Penelitian");
}

export async function updateResearchMethodCpmk(
  id: string,
  payload: UpdateResearchMethodCpmkPayload,
): Promise<ResearchMethodCpmk> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CPMK_BY_ID(id)),
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal mengubah CPMK Metode Penelitian");
}

export async function deleteResearchMethodCpmk(id: string): Promise<void> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CPMK_BY_ID(id)),
    { method: "DELETE" },
  );
  await parseValue(response, "Gagal menghapus CPMK Metode Penelitian");
}

export async function getResearchMethodConfiguration(
  assessor: ResearchMethodAssessor,
  academicYearId: string,
): Promise<ResearchMethodCpmkWithRubrics[]> {
  const query = assessorQuery(assessor, { academicYearId });
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CONFIGURATION)}?${query}`,
  );
  return parseArray(response, "Gagal mengambil konfigurasi penilaian");
}

export async function createResearchMethodCriteria(
  assessor: ResearchMethodAssessor,
  payload: CreateResearchMethodCriteriaPayload,
): Promise<ResearchMethodAssessmentCriteria> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CRITERIA)}?${assessorQuery(assessor)}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal menambah kriteria penilaian");
}

export async function updateResearchMethodCriteria(
  assessor: ResearchMethodAssessor,
  id: string,
  payload: UpdateResearchMethodCriteriaPayload,
): Promise<ResearchMethodAssessmentCriteria> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CRITERIA_BY_ID(id))}?${assessorQuery(assessor)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal mengubah kriteria penilaian");
}

export async function deleteResearchMethodCriteria(
  assessor: ResearchMethodAssessor,
  id: string,
): Promise<void> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CRITERIA_BY_ID(id))}?${assessorQuery(assessor)}`,
    { method: "DELETE" },
  );
  await parseValue(response, "Gagal menghapus kriteria penilaian");
}

export async function removeResearchMethodCpmkConfiguration(
  assessor: ResearchMethodAssessor,
  cpmkId: string,
): Promise<void> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CPMK_CONFIG(cpmkId))}?${assessorQuery(assessor)}`,
    { method: "DELETE" },
  );
  await parseValue(response, "Gagal menghapus konfigurasi CPMK");
}

export async function createResearchMethodRubric(
  assessor: ResearchMethodAssessor,
  criteriaId: string,
  payload: CreateResearchMethodRubricPayload,
): Promise<ResearchMethodAssessmentRubric> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CRITERIA_RUBRICS(criteriaId))}?${assessorQuery(assessor)}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal menambah rubrik penilaian");
}

export async function updateResearchMethodRubric(
  assessor: ResearchMethodAssessor,
  rubricId: string,
  payload: UpdateResearchMethodRubricPayload,
): Promise<ResearchMethodAssessmentRubric> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.RUBRIC_BY_ID(rubricId))}?${assessorQuery(assessor)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return parseValue(response, "Gagal mengubah rubrik penilaian");
}

export async function deleteResearchMethodRubric(
  assessor: ResearchMethodAssessor,
  rubricId: string,
): Promise<void> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.RUBRIC_BY_ID(rubricId))}?${assessorQuery(assessor)}`,
    { method: "DELETE" },
  );
  await parseValue(response, "Gagal menghapus rubrik penilaian");
}

export async function getResearchMethodWeightSummary(
  academicYearId: string,
): Promise<ResearchMethodWeightSummary> {
  const query = new URLSearchParams({ academicYearId });
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.WEIGHT_SUMMARY)}?${query}`,
  );
  return parseValue(response, "Gagal mengambil ringkasan bobot penilaian");
}

export async function reorderResearchMethodCriteria(
  assessor: ResearchMethodAssessor,
  cpmkId: string,
  orderedIds: string[],
): Promise<void> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.CRITERIA_REORDER)}?${assessorQuery(assessor)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ cpmkId, orderedIds }),
    },
  );
  await parseValue(response, "Gagal menyimpan urutan kriteria");
}

export async function reorderResearchMethodRubrics(
  assessor: ResearchMethodAssessor,
  criteriaId: string,
  orderedIds: string[],
): Promise<void> {
  const response = await apiRequest(
    `${getApiUrl(API_CONFIG.ENDPOINTS.RESEARCH_METHOD.RUBRICS_REORDER)}?${assessorQuery(assessor)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ criteriaId, orderedIds }),
    },
  );
  await parseValue(response, "Gagal menyimpan urutan rubrik");
}
