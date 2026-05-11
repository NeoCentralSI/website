import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { RubricGradingForm } from "@/components/metopen/RubricGradingForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { assessmentService, type ScoringQueueItem } from "@/services/assessment.service";

const METOPEN_TA03B_QUEUE_KEY = ["assessment-metopen-queue"];

export default function MetopenTa03BQueue() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Metode Penelitian", href: "/kelola/metopen" },
      { label: "Penilaian TA-03B" },
    ]);
    setTitle("Penilaian Proposal TA-03B");
  }, [setBreadcrumbs, setTitle]);

  const {
    data: queue = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: METOPEN_TA03B_QUEUE_KEY,
    queryFn: () => assessmentService.getMetopenScoringQueue(),
  });

  useEffect(() => {
    if (queue.length === 0) {
      setSelectedThesisId(null);
      return;
    }

    if (!selectedThesisId || !queue.some((item) => item.thesisId === selectedThesisId)) {
      setSelectedThesisId(queue[0].thesisId);
    }
  }, [queue, selectedThesisId]);

  const selectedItem = queue.find((item) => item.thesisId === selectedThesisId) ?? null;

  if (isLoading) {
    return (
      <div className="py-12">
        <Loading size="lg" text="Memuat antrean penilaian TA-03B..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Antrean TA-03B gagal dimuat</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : "Terjadi kesalahan."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-blue-200 bg-blue-50/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4 text-blue-700" />
            Penilaian Proposal TA-03B
          </CardTitle>
          <CardDescription className="text-blue-950/80">
            Queue ini terbuka setelah proposal final tersedia. TA-03A dan TA-03B dapat dinilai paralel,
            lalu SIMPTA melanjutkan antre KaDep setelah keduanya lengkap tanpa flow kelas Metopen.
          </CardDescription>
        </CardHeader>
      </Card>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Belum ada proposal yang menunggu penilaian TA-03B.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3">
            {queue.map((item) => (
              <QueueCard
                key={item.thesisId}
                item={item}
                isSelected={item.thesisId === selectedThesisId}
                onSelect={() => setSelectedThesisId(item.thesisId)}
              />
            ))}
          </div>

          <div className="space-y-4">
            {selectedItem ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ringkasan Proposal</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Mahasiswa</p>
                      <p className="font-medium">{selectedItem.studentName}</p>
                      <p className="text-xs text-muted-foreground">{selectedItem.studentNim}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pembimbing 1</p>
                      <p className="font-medium">{selectedItem.supervisorName || "-"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Judul Proposal</p>
                      <p className="font-medium">{selectedItem.proposedTitle}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nilai TA-03A</p>
                      <p className="font-medium">{selectedItem.supervisorScore ?? "-"}</p>
                    </div>
                  </CardContent>
                </Card>

                <RubricGradingForm
                  thesisId={selectedItem.thesisId}
                  formCode="TA-03B"
                  studentName={selectedItem.studentName}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: METOPEN_TA03B_QUEUE_KEY });
                  }}
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Pilih mahasiswa pada antrean untuk mulai mengisi TA-03B.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type QueueCardProps = {
  item: ScoringQueueItem;
  isSelected: boolean;
  onSelect: () => void;
};

function QueueCard({ item, isSelected, onSelect }: QueueCardProps) {
  return (
    <Card className={isSelected ? "border-primary shadow-sm" : undefined}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.studentName}</p>
            <p className="text-xs text-muted-foreground">{item.studentNim}</p>
          </div>
          <Badge variant="outline">TA-03B</Badge>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{item.proposedTitle}</span>
          </p>
          <p className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span>TA-03A: {item.supervisorScore ?? "-"}</span>
          </p>
        </div>

        <Button className="w-full" variant={isSelected ? "default" : "outline"} onClick={onSelect}>
          {isSelected ? "Sedang Dinilai" : "Pilih Proposal"}
        </Button>
      </CardContent>
    </Card>
  );
}
