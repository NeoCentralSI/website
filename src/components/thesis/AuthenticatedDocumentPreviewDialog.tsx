import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLinkIcon, FileWarning, Loader2, XIcon } from "lucide-react";
import { DocxViewer } from "@/components/pdf/DocxViewer";
import { useAuthenticatedBlobUrl } from "@/hooks/useAuthenticatedBlobUrl";
import { downloadAuthenticatedFileOrToast, openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import type { DocumentPreviewDialogProps } from "./DocumentPreviewDialog";

/** Same path rules as DocumentPreviewDialog, without the token. */
function toUploadPath(filePath?: string | null): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("blob:")) return null;
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/uploads/")) return normalized;
  if (normalized.startsWith("uploads/")) return `/${normalized}`;
  return `/uploads/${normalized}`;
}

/**
 * DocumentPreviewDialog for protected thesis files, same props. A `blob:` path is a file chosen
 * on this device and not sent yet (e.g. a proposal under review before "Ajukan"); it is shown as
 * it is, without a request to the server.
 * The file is fetched with the Authorization header and shown from a blob URL, so the JWT
 * never appears in a URL (iframe, "Buka tab", "Unduh"). The blob URL is revoked when the
 * dialog closes.
 */
export default function AuthenticatedDocumentPreviewDialog({ open, onOpenChange, fileName, filePath, mode = "fullscreen" }: DocumentPreviewDialogProps) {
  const isDocx = fileName?.toLowerCase().endsWith(".docx") || filePath?.toLowerCase().endsWith(".docx");
  const localUrl = filePath?.startsWith("blob:") ? filePath : null;
  const url = toUploadPath(filePath);
  const remote = useAuthenticatedBlobUrl(url, open);
  const blobUrl = localUrl ?? remote.blobUrl;
  const error = localUrl ? null : remote.error;
  const isLoading = localUrl ? false : remote.isLoading;

  const contentClass =
    mode === "fullscreen"
      ? "max-w-[100vw] w-[100vw] sm:max-w-[100vw] sm:w-[100vw] h-[100vh] p-0 overflow-hidden rounded-none flex flex-col"
      : "max-w-[96vw] w-[96vw] h-[92vh] p-0 overflow-hidden flex flex-col";

  const headerClass =
    mode === "fullscreen"
      ? "px-4 sm:px-6 pt-3 pb-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10 flex-shrink-0"
      : "px-6 pt-6 pb-4 flex-shrink-0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogDescription className="hidden">Preview dokumen {fileName}</DialogDescription>
        <DialogHeader className={headerClass}>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="truncate" title={fileName || "Dokumen"}>{fileName || "Dokumen"}</DialogTitle>
            <div className="flex items-center gap-2">
              {url && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => openAuthenticatedFileOrToast(url)}>
                    <ExternalLinkIcon className="mr-2 size-4" /> Buka di tab baru
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => downloadAuthenticatedFileOrToast(url, fileName || "document")}>
                    <DownloadIcon className="mr-2 size-4" /> Unduh
                  </Button>
                </>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <XIcon className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 w-full border-t bg-gray-100 overflow-auto relative">
          {!url && !localUrl ? (
            <div className="p-6 text-sm text-muted-foreground">Dokumen tidak tersedia.</div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground" role="alert">
              <FileWarning className="size-8" />
              {error}
            </div>
          ) : isLoading || !blobUrl ? (
            <div className="flex h-full items-center justify-center gap-2 p-6 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" /> Memuat dokumen...
            </div>
          ) : isDocx ? (
            <DocxViewer url={blobUrl} className="h-full" />
          ) : (
            <iframe title="preview" src={blobUrl} className="w-full h-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
