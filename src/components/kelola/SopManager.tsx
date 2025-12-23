import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import * as sopService from "@/services/sop.service";
import type { SopFile, SopType } from "@/types/sop.types";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";

const TYPE_OPTIONS: { label: string; value: SopType }[] = [
  { label: "Tugas Akhir", value: "tugas-akhir" },
  { label: "Kerja Praktek", value: "kerja-praktik" },
];

function formatSize(size: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let s = size;
  let idx = 0;
  while (s >= 1024 && idx < units.length - 1) {
    s /= 1024;
    idx += 1;
  }
  return `${s.toFixed(1)} ${units[idx]}`;
}

export function SopManager() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<SopType>("tugas-akhir");
  const [file, setFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ name?: string; path?: string }>({});

  const sopQuery = useQuery({
    queryKey: ["sop-files"],
    queryFn: () => sopService.getSopFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: { type: SopType; file: File }) => sopService.uploadSop(payload),
    onSuccess: (data) => {
      toast.success(`Panduan ${data.type === "tugas-akhir" ? "Tugas Akhir" : "Kerja Praktek"} berhasil diunggah`);
      qc.invalidateQueries({ queryKey: ["sop-files"] });
      setFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengunggah panduan");
    },
  });

  const currentMap = useMemo(() => {
    const map = new Map<SopType, SopFile>();
    (sopQuery.data || []).forEach((item) => map.set(item.type, item));
    return map;
  }, [sopQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file panduan (PDF)");
      return;
    }
    uploadMutation.mutate({ type: selectedType, file });
  };

  useEffect(() => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("File harus berupa PDF");
      setFile(null);
    }
  }, [file]);

  const busy = sopQuery.isLoading || uploadMutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Kelola Panduan</CardTitle>
          <CardDescription>
            Unggah file panduan (PDF) untuk Tugas Akhir atau Kerja Praktek. File lama akan ditimpa dengan versi terbaru.
            
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori Panduan</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as SopType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="panduan-file-input">File Panduan (PDF)</Label>
                <div
                  className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center bg-gray-50/50 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped && (dropped.type === "application/pdf" || dropped.name.toLowerCase().endsWith(".pdf"))) {
                      setFile(dropped);
                    } else {
                      toast.error("File harus PDF");
                    }
                  }}
                  onClick={() => document.getElementById("panduan-file-input")?.click()}
                >
                  <UploadCloud className="h-6 w-6 text-primary" />
                  <p className="text-sm text-gray-700 font-medium">
                    Seret & lepas file PDF di sini atau klik untuk pilih
                  </p>
                  <p className="text-xs text-muted-foreground">Maks 50MB</p>
                  <Input
                    id="panduan-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                {file ? (
                  <p className="text-sm text-muted-foreground">
                    Dipilih: <span className="font-medium text-foreground">{file.name}</span>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || !file}>
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UploadCloud className="mr-2 h-4 w-4" />
                Unggah & Timpa
              </Button>
              {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Panduan Aktif</CardTitle>
          <CardDescription>File terbaru untuk tiap kategori.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sopQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat data panduan...
            </div>
          ) : (
            TYPE_OPTIONS.map((opt) => {
              const data = currentMap.get(opt.value);
              return (
                <div
                  key={opt.value}
                  className="flex flex-col gap-1 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    {data ? (
                      <>
                        <p className="text-sm text-muted-foreground">{data.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(data.size)} • Diperbarui {new Date(data.updatedAt).toLocaleString("id-ID")}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada file SOP</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {data ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setPreviewData({ name: data.fileName, path: data.url });
                            setPreviewOpen(true);
                          }}
                        >
                          Preview
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a href={sopService.getSopDownloadUrl(data.url)} download>
                            Unduh
                          </a>
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Catatan: Panduan yang diunggah akan menimpa file sebelumnya. Pastikan file dalam format PDF.
      </p>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileName={previewData.name}
        filePath={previewData.path}
        mode="fullscreen"
      />
    </div>
  );
}
