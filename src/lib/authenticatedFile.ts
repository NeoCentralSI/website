import { getApiUrl } from "@/config/api";
import { getAuthTokens } from "@/services/auth.service";

export function resolveApiFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : getApiUrl(url);
}

/**
 * Open a protected upload (e.g. informal-log attachment) via Authorization
 * header + blob URL. Do not put JWT in the query string (history, proxy logs,
 * Referer).
 */
export async function openAuthenticatedFile(url: string | null | undefined): Promise<void> {
  const fullUrl = resolveApiFileUrl(url);
  if (!fullUrl) return;

  const { accessToken } = getAuthTokens();
  const response = await fetch(fullUrl, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) {
    throw new Error("Gagal membuka lampiran.");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
}
