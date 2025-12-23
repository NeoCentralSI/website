import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";
import type { SopFile, SopType } from "@/types/sop.types";

const resolveFileUrl = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_CONFIG.BASE_URL || "";
  if (/^https?:\/\//i.test(base)) {
    return new URL(path, base).toString();
  }
  // base might be relative (e.g., "/api"); fall back to window origin
  return new URL(path, `${window.location.origin}${base || ""}`).toString();
};

export async function getSopFiles(type?: SopType): Promise<SopFile[]> {
  const url = new URL(getApiUrl("/sop"));
  if (type) url.searchParams.set("type", type);
  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil SOP");
  }
  const result = await response.json();
  return (result.data || []).map((item: SopFile) => ({
    ...item,
    url: resolveFileUrl(item.url),
  }));
}

// Public fetch (no auth handling) for landing page
export async function getSopFilesPublic(type?: SopType): Promise<SopFile[]> {
  const url = new URL(getApiUrl("/sop"));
  if (type) url.searchParams.set("type", type);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Gagal mengambil SOP");
  }
  const result = await response.json();
  return (result.data || []).map((item: SopFile) => ({
    ...item,
    url: resolveFileUrl(item.url),
  }));
}

export function getSopDownloadUrl(fileUrl: string): string {
  const pathName = new URL(fileUrl).pathname;
  return getApiUrl(`/sop/download?path=${encodeURIComponent(pathName)}`);
}

export async function uploadSop(params: { type: SopType; file: File }): Promise<SopFile> {
  const formData = new FormData();
  formData.append("type", params.type);
  formData.append("file", params.file);

  const response = await apiRequest(getApiUrl("/sop"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengunggah SOP");
  }

  const result = await response.json();
  return result.data;
}
