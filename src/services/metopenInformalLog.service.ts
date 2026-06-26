import { getApiUrl, API_CONFIG } from "@/config/api";
import { apiRequest } from "./auth.service";

const EP = API_CONFIG.ENDPOINTS.THESIS_STUDENT;

export interface InformalLogItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    fileName: string | null;
    url: string | null;
    fileSize: number | null;
    mimeType: string | null;
  } | null;
}

export interface InformalLogsResponse {
  thesisId: string | null;
  items: InformalLogItem[];
}

async function handleJson<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({ message: "Request gagal" }));
  if (!response.ok) {
    throw new Error((json as { message?: string }).message || `Request gagal (${response.status})`);
  }
  return json as T;
}

export async function listMetopenInformalLogs(): Promise<InformalLogsResponse> {
  const url = getApiUrl(EP.METOPEN_INFORMAL_LOGS);
  const res = await apiRequest(url);
  const json = await handleJson<{ success: boolean; data: InformalLogsResponse }>(res);
  return json.data;
}

export async function createMetopenInformalLog(body: {
  content: string;
  file?: File | null;
}): Promise<InformalLogItem> {
  const url = getApiUrl(EP.METOPEN_INFORMAL_LOGS);
  if (body.file) {
    const formData = new FormData();
    formData.append("content", body.content);
    formData.append("file", body.file);
    const res = await apiRequest(url, { method: "POST", body: formData });
    const json = await handleJson<{ success: boolean; data: InformalLogItem }>(res);
    return json.data;
  }
  const res = await apiRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: body.content }),
  });
  const json = await handleJson<{ success: boolean; data: InformalLogItem }>(res);
  return json.data;
}
