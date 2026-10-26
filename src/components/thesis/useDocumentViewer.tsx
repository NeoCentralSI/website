import { useCallback, useState } from "react";
import AuthenticatedDocumentPreviewDialog from "./AuthenticatedDocumentPreviewDialog";

type ViewedDocument = { filePath: string; fileName?: string | null };

/** A protected file path or API endpoint as a path on the API (`uploads/x.pdf` → `/uploads/x.pdf`). */
export const toApiFilePath = (filePath: string) => `/${filePath.replace(/\\/g, "/").replace(/^\/+/, "")}`;

/**
 * "Lihat" for a protected document: the full-screen viewer of the guidance documents, with
 * "Buka di tab baru" and "Unduh", instead of a new tab. Render `viewer` once in the component.
 */
export function useDocumentViewer() {
  const [document, setDocument] = useState<ViewedDocument | null>(null);

  const openDocument = useCallback((filePath?: string | null, fileName?: string | null) => {
    if (filePath) setDocument({ filePath, fileName });
  }, []);

  const viewer = (
    <AuthenticatedDocumentPreviewDialog
      open={!!document}
      onOpenChange={(open) => {
        if (!open) setDocument(null);
      }}
      fileName={document?.fileName || "Dokumen"}
      fileUrl={document ? toApiFilePath(document.filePath) : null}
    />
  );

  return { openDocument, viewer };
}
