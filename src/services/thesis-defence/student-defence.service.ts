import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  DefenceOverviewResponse,
  DefenceDocumentType,
  DefenceDocumentsResponse,
  DefenceDocumentUploadResponse,
  StudentDefenceHistoryItem,
  StudentDefenceDetailResponse,
  StudentDefenceAssessmentResponse,
  StudentDefenceRevisionResponse,
  StudentDefenceRevisionItem,
  CreateDefenceRevisionPayload,
  SaveDefenceRevisionActionPayload,
} from '@/types/defence.types';

const EP = API_CONFIG.ENDPOINTS.THESIS_DEFENCE_STUDENT;

export async function getStudentDefenceOverview(): Promise<DefenceOverviewResponse> {
  const res = await apiRequest(getApiUrl(EP.OVERVIEW));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data sidang');
  return json.data;
}

export async function getDefenceDocumentTypes(): Promise<DefenceDocumentType[]> {
  const res = await apiRequest(getApiUrl(EP.DOCUMENT_TYPES));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat tipe dokumen');
  return json.data;
}

export async function getStudentDefenceDocuments(): Promise<DefenceDocumentsResponse> {
  const res = await apiRequest(getApiUrl(EP.DOCUMENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat dokumen sidang');
  return json.data;
}

export async function uploadDefenceDocument(
  file: File,
  documentTypeName: string
): Promise<DefenceDocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const res = await apiRequest(getApiUrl(EP.DOCUMENT_UPLOAD), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengupload dokumen');
  return json.data;
}

export async function getStudentDefenceHistory(): Promise<StudentDefenceHistoryItem[]> {
  const res = await apiRequest(getApiUrl(EP.HISTORY));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat sidang');
  return json.data;
}

export async function getStudentDefenceDetail(defenceId?: string): Promise<StudentDefenceDetailResponse> {
  if (!defenceId) throw new Error('ID sidang tidak valid');
  const res = await apiRequest(getApiUrl(EP.DEFENCE_DETAIL(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail sidang');
  return json.data;
}

export async function getStudentDefenceAssessment(defenceId?: string): Promise<StudentDefenceAssessmentResponse> {
  if (!defenceId) throw new Error('ID sidang tidak valid');
  const res = await apiRequest(getApiUrl(EP.DEFENCE_ASSESSMENT(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat berita acara sidang');
  return json.data;
}

export async function getStudentDefenceRevisions(defenceId?: string): Promise<StudentDefenceRevisionItem[]> {
  if (!defenceId) throw new Error('ID sidang tidak valid');
  const res = await apiRequest(getApiUrl(EP.DEFENCE_REVISIONS(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data revisi sidang');
  return json.data;
}

export async function getCurrentStudentDefenceRevisions(): Promise<StudentDefenceRevisionResponse> {
  const res = await apiRequest(getApiUrl(EP.REVISIONS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data revisi sidang');
  return json.data;
}

export async function createDefenceRevision(
  defenceId: string,
  payload: CreateDefenceRevisionPayload
): Promise<StudentDefenceRevisionItem> {
  const res = await apiRequest(getApiUrl(EP.CREATE_REVISION(defenceId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menambahkan revisi');
  return json.data;
}

export async function createCurrentDefenceRevision(
  payload: CreateDefenceRevisionPayload
): Promise<StudentDefenceRevisionItem> {
  const res = await apiRequest(getApiUrl(EP.REVISIONS), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menambahkan revisi');
  return json.data;
}

export async function saveDefenceRevisionAction(
  revisionId: string,
  payload: SaveDefenceRevisionActionPayload
): Promise<StudentDefenceRevisionItem> {
  const res = await apiRequest(getApiUrl(EP.SAVE_REVISION_ACTION(revisionId)), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan aksi revisi');
  return json.data;
}

export async function submitDefenceRevisionAction(
  revisionId: string,
  payload: SaveDefenceRevisionActionPayload
): Promise<StudentDefenceRevisionItem> {
  const res = await apiRequest(getApiUrl(EP.SUBMIT_REVISION_ACTION(revisionId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal submit revisi');
  return json.data;
}

export async function cancelDefenceRevisionSubmit(revisionId: string): Promise<StudentDefenceRevisionItem> {
  const res = await apiRequest(getApiUrl(EP.CANCEL_REVISION_SUBMIT(revisionId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan submit revisi');
  return json.data;
}

export async function deleteDefenceRevision(revisionId: string): Promise<{ id: string }> {
  const res = await apiRequest(getApiUrl(EP.DELETE_REVISION(revisionId)), {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menghapus revisi');
  return json.data;
}
