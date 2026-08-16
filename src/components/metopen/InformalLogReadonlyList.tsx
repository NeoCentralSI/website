import { useQuery } from "@tanstack/react-query";
import { AlertCircle, History, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import {
  getStudentInformalLogs,
  type InformalLogItem,
} from "@/services/lecturerGuidance.service";
import { openAuthenticatedFile } from "@/lib/authenticatedFile";
import { formatDateId } from "@/lib/text";
import { cn } from "@/lib/utils";

function openInformalAttachment(url: string | null) {
  void openAuthenticatedFile(url).catch(() => {
    toast.error("Gagal membuka lampiran.");
  });
}

interface InformalLogReadonlyListProps {
  thesisId: string;
  /** Compact card for embedding next to proposal versions */
  compact?: boolean;
  className?: string;
}

export function InformalLogReadonlyList({
  thesisId,
  compact = false,
  className,
}: InformalLogReadonlyListProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["lecturer-informal-logs", thesisId],
    queryFn: () => getStudentInformalLogs(thesisId),
    enabled: Boolean(thesisId),
  });

  const items = data?.items ?? [];
  const errorMessage = error instanceof Error ? error.message : "Gagal memuat catatan informal.";

  const body = (() => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-6">
          <Loading size="sm" text="Memuat catatan..." />
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak dapat memuat catatan</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      );
    }

    if (items.length === 0) {
      return (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada catatan bimbingan informal dari mahasiswa.
        </p>
      );
    }

    return (
      <ul className={cn("space-y-3", compact && "max-h-64 overflow-y-auto pr-1")}>
        {items.map((item) => (
          <InformalLogReadonlyItem key={item.id} item={item} />
        ))}
      </ul>
    );
  })();

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <History className="h-4 w-4 text-muted-foreground" />
          Catatan bimbingan informal (Metopel)
        </CardTitle>
        <CardDescription>
          Hanya lihat. Tersedia untuk Pembimbing 1/2 setelah TA-04 terbit.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function InformalLogReadonlyItem({ item }: { item: InformalLogItem }) {
  return (
    <li className="rounded-xl border bg-background/50 p-3">
      <p className="mb-2 whitespace-pre-wrap text-sm text-foreground">{item.content}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{formatDateId(item.createdAt)}</span>
        {item.document?.url ? (
          <button
            type="button"
            onClick={() => openInformalAttachment(item.document?.url ?? null)}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Paperclip className="h-3 w-3" />
            {item.document.fileName || "Lampiran"}
          </button>
        ) : null}
      </div>
    </li>
  );
}
