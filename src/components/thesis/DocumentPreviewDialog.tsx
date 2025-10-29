import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { getApiUrl } from "@/config/api";

export type DocumentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string | null;
  filePath?: string | null; // relative path served from /uploads
  mode?: "dialog" | "fullscreen"; // fullscreen provides an edge-to-edge viewer
};

export default function DocumentPreviewDialog({ open, onOpenChange, fileName, filePath, mode = "fullscreen" }: DocumentPreviewDialogProps) {
  const url = filePath ? getApiUrl(filePath.startsWith("/") ? filePath : `/${filePath}`) : undefined;
  // Basic preview via iframe; we rely on browser PDF viewer
  const contentClass =
    mode === "fullscreen"
      ? "max-w-[100vw] w-[100vw] sm:max-w-[100vw] sm:w-[100vw] h-[100vh] p-0 overflow-hidden rounded-none"
      : "max-w-[96vw] w-[96vw] h-[92vh] p-0 overflow-hidden";
  const headerClass =
    mode === "fullscreen"
      ? "px-4 sm:px-6 pt-3 pb-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10"
      : "px-6 pt-6 pb-4";
  const viewerClass = mode === "fullscreen" ? "w-full h-[calc(100vh-48px)]" : "w-full h-full";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
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
                    <a href={url} download>
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
        <div className="w-full border-t">
          {url ? (
            <iframe title="preview" src={url} className={viewerClass} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Dokumen tidak tersedia.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
