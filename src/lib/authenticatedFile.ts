import { toast } from "sonner";
import { getApiUrl } from "@/config/api";
import { getAuthTokens } from "@/services/auth.service";

export function resolveApiFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return getApiUrl(url.startsWith("/") ? url : `/${url}`);
}

const FILE_ERROR_MESSAGES: Record<number, string> = {
  403: "Anda tidak memiliki akses ke berkas ini.",
  404: "Berkas tidak ditemukan.",
};

/**
 * Fetch a protected upload with the Authorization header and return a blob URL (for an
 * in-page preview such as an iframe). The JWT is never put in the query string (browser
 * history, proxy logs, Referer, copied links). The caller revokes the URL when done.
 */
export async function fetchAuthenticatedBlobUrl(url: string | null | undefined): Promise<string> {
  const fullUrl = resolveApiFileUrl(url);
  if (!fullUrl) throw new Error(FILE_ERROR_MESSAGES[404]);

  const { accessToken } = getAuthTokens();
  const response = await fetch(fullUrl, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) {
    throw new Error(FILE_ERROR_MESSAGES[response.status] ?? "Gagal membuka berkas.");
  }
  return URL.createObjectURL(await response.blob());
}

/**
 * Open a protected upload in a new tab via Authorization header + blob URL.
 * The tab is opened synchronously (inside the click) so popup blockers allow it, then it
 * is pointed at the blob URL. On failure the tab is closed and the promise rejects with a
 * message for the user (403 / 404 / generic); the caller shows it.
 */
export async function openAuthenticatedFile(url: string | null | undefined): Promise<void> {
  if (!resolveApiFileUrl(url)) return;

  const tab = window.open("", "_blank");
  try {
    const blobUrl = await fetchAuthenticatedBlobUrl(url);
    if (tab) {
      tab.opener = null;
      tab.location.href = blobUrl;
    } else {
      // Popup blocked: fall back to opening the blob URL directly.
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

/** Same as `openAuthenticatedFile`, but shows the failure as a toast instead of rejecting. */
export async function openAuthenticatedFileOrToast(url: string | null | undefined): Promise<void> {
  try {
    await openAuthenticatedFile(url);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Gagal membuka berkas.");
  }
}

/** Download a protected upload under `fileName` (Authorization header + blob); failures become a toast. */
export async function downloadAuthenticatedFileOrToast(url: string | null | undefined, fileName: string): Promise<void> {
  try {
    const blobUrl = await fetchAuthenticatedBlobUrl(url);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "berkas";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Gagal mengunduh berkas.");
  }
}
