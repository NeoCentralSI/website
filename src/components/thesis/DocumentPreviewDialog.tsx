import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { DocxViewer } from "@/components/pdf/DocxViewer";

export type DocumentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string | null;
  filePath?: string | null; // relative path served from /uploads
  mode?: "dialog" | "fullscreen"; // fullscreen provides an edge-to-edge viewer
};

export default function DocumentPreviewDialog({ open, onOpenChange, fileName, filePath, mode = "fullscreen" }: DocumentPreviewDialogProps) {
  const isDocx = fileName?.toLowerCase().endsWith(".docx") || filePath?.toLowerCase().endsWith(".docx");

  let url: string | undefined;
  if (filePath) {
    const normalizedPath = filePath.replace(/\\/g, "/");
    if (normalizedPath.startsWith("http")) {
      url = normalizedPath;
    } else if (normalizedPath.startsWith("/uploads/") || normalizedPath.startsWith("uploads/")) {
      url = getApiUrl(normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`);
    } else {
      url = getApiUrl(`/uploads/${normalizedPath}`);
    }

    // Add token for protected thesis files so backend can authenticate via query param
    const isThesisFile = normalizedPath.includes("thesis/");
    if (url && isThesisFile) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        url += (url.includes("?") ? "&" : "?") + `token=${token}`;
      }
    }
  }

  // Basic preview via iframe; we rely on browser PDF viewer
  const contentClass =
    mode === "fullscreen"
      ? "max-w-[100vw] w-[100vw] sm:max-w-[100vw] sm:w-[100vw] h-[100vh] p-0 overflow-hidden rounded-none flex flex-col"
      : "max-w-[96vw] w-[96vw] h-[92vh] p-0 overflow-hidden flex flex-col";

  const headerClass =
    mode === "fullscreen"
      ? "px-4 sm:px-6 pt-3 pb-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10 flex-shrink-0"
      : "px-6 pt-6 pb-4 flex-shrink-0";

  const viewerClass = mode === "fullscreen" ? "w-full h-full" : "w-full h-full";

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
                  <Button asChild variant="secondary" size="sm">
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon className="mr-2 size-4" /> Buka tab
                    </a>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <a href={url} download={fileName || "document"}>
                      <DownloadIcon className="mr-2 size-4" /> Unduh
                    </a>
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
          {url ? (
            isDocx ? (
              <DocxViewer url={url} className="h-full" />
            ) : (
              <iframe title="preview" src={url} className={viewerClass} />
            )
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Dokumen tidak tersedia.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
