import { useEffect, useState } from "react";
import { fetchAuthenticatedBlobUrl } from "@/lib/authenticatedFile";

/**
 * Blob URL of a protected upload for an in-page preview (e.g. PdfViewer).
 * The file is fetched with the Authorization header (never `?token=` in the URL) only
 * while `enabled`, and the blob URL is revoked when the URL changes or the view closes.
 */
export function useAuthenticatedBlobUrl(url: string | null | undefined, enabled = true) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    let created: string | null = null;
    setError(null);
    fetchAuthenticatedBlobUrl(url)
      .then((result) => {
        if (cancelled) {
          URL.revokeObjectURL(result);
          return;
        }
        created = result;
        setBlobUrl(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal membuka berkas.");
      });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setBlobUrl(null);
    };
  }, [url, enabled]);

  return { blobUrl, error, isLoading: !!url && enabled && !blobUrl && !error };
}
