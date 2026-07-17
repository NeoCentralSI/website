import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/spinner";
import { formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import {
  createMetopenInformalLog,
  listMetopenInformalLogs,
  type InformalLogItem,
} from "@/services/metopenInformalLog.service";
import { AlertCircle, FileText, History, Info, Paperclip } from "lucide-react";
import { toast } from "sonner";

const QK_METOPEN_INFORMAL_LOGS = ["metopen-informal-logs"] as const;

function getFileUrl(url: string | null): string {
  if (!url) return "#";
  const fullUrl = url.startsWith("http") ? url : getApiUrl(url);
  const token = localStorage.getItem("accessToken");
  if (token && url.includes("thesis/")) {
    return fullUrl + (fullUrl.includes("?") ? "&" : "?") + `token=${token}`;
  }
  return fullUrl;
}

interface MetopenInformalLogbookTabProps {
  readOnly: boolean;
}

export function MetopenInformalLogbookTab({ readOnly }: MetopenInformalLogbookTabProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QK_METOPEN_INFORMAL_LOGS,
    queryFn: listMetopenInformalLogs,
  });

  const createMutation = useMutation({
    mutationFn: () => createMetopenInformalLog({ content, file }),
    onSuccess: () => {
      toast.success("Catatan tersimpan.");
      setContent("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: [...QK_METOPEN_INFORMAL_LOGS] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Gagal menyimpan catatan.");
    },
  });

  const thesisId = data?.thesisId ?? null;
  const items = data?.items ?? [];
  const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan.";
  const isThesisCourseRestriction =
    isError && /mata kuliah Tugas Akhir|modul Bimbingan/i.test(errorMessage);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Memuat catatan..." />
      </div>
    );
  }

  if (isThesisCourseRestriction) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Catatan informal sudah ditutup</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Snapshot SIA mencatat Anda sudah mengambil mata kuliah Tugas Akhir. Catatan informal
            Metopen hanya dipakai pada fase proposal sebelum MK Tugas Akhir aktif.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/tugas-akhir/bimbingan">Buka Bimbingan Tugas Akhir</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal memuat data</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  if (!thesisId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Catatan belum tersedia</AlertTitle>
        <AlertDescription>
          Catatan informal terikat pada tugas akhir aktif Anda. Setelah TA-04 difinalisasi KaDep,
          Anda dapat menambahkan catatan di sini. Pembimbing dapat membaca catatan ini (tanpa
          persetujuan). Bukan pengganti logbook bimbingan formal setelah MK Tugas Akhir.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Catatan bimbingan informal</CardTitle>
          <CardDescription>
            Catatan progres proposal dan lampiran ringan (PDF, DOC, DOCX). Pembimbing Anda dapat
            membaca catatan ini setelah TA-04 terbit; tidak memerlukan persetujuan. Untuk bimbingan
            formal gunakan modul Tugas Akhir setelah MK Tugas Akhir tercatat.
          </CardDescription>
        </CardHeader>
        {!readOnly && (
          <CardContent className="space-y-3 border-t pt-4">
            <Textarea
              placeholder="Tulis catatan (wajib)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={12000}
              className="min-h-[100px]"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="max-w-md cursor-pointer text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                disabled={!content.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Menyimpan…" : "Simpan catatan"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Riwayat Catatan
        </h3>
        {items.length === 0 ? (
          <div className="text-center py-12 rounded-xl border bg-muted/20">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground/80 text-sm">Belum ada catatan</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Catatan informal yang Anda tambahkan akan tampil di sini.
            </p>
          </div>
        ) : (
          <div className="relative ml-2 border-l-2 border-muted pl-4 space-y-4">
            {items.map((entry: InformalLogItem) => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full border-2 border-muted bg-background" />
                <Card>
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDateId(entry.createdAt)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-sm whitespace-pre-wrap">{entry.content}</CardContent>
                  {entry.document?.url && (
                    <CardContent className="pt-0">
                      <a
                        href={getFileUrl(entry.document.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        <Paperclip className="h-4 w-4 shrink-0" />
                        {entry.document.fileName || "Lampiran"}
                      </a>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
