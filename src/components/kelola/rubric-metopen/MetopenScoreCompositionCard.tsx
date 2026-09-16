import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Lock, Save } from "lucide-react";

import { getAcademicYearsAPI, getActiveAcademicYearAPI } from "@/services/admin.service";
import {
  getScoreComposition,
  updateScoreComposition,
  type MetopenScoreComposition,
} from "@/services/rubricMetopen.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface AcademicYearOption {
  id: string;
  year: string | number;
  semester: string;
  isActive: boolean;
}

function formatAyLabel(ay: AcademicYearOption) {
  const semester = ay.semester === "ganjil" ? "Ganjil" : "Genap";
  return `${ay.year} · ${semester}${ay.isActive ? " (aktif)" : ""}`;
}

interface MetopenScoreCompositionCardProps {
  onCompositionChange?: (composition: MetopenScoreComposition | null) => void;
}

export function MetopenScoreCompositionCard({
  onCompositionChange,
}: MetopenScoreCompositionCardProps) {
  const queryClient = useQueryClient();
  const [selectedAyId, setSelectedAyId] = useState("");
  const [ta03aCap, setTa03aCap] = useState("75");
  const [ta03bCap, setTa03bCap] = useState("25");

  const { data: ayData } = useQuery({
    queryKey: ["academic-years", { pageSize: 100 }],
    queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
  });
  const { data: operationalYear } = useQuery({
    queryKey: ["active-academic-year"],
    queryFn: getActiveAcademicYearAPI,
  });

  const academicYears: AcademicYearOption[] = useMemo(() => {
    if (!ayData?.academicYears) return [];
    return ayData.academicYears.map((item) => ({
      id: item.id,
      year: item.year ?? "-",
      semester: item.semester,
      isActive: Boolean(item.isActive),
    }));
  }, [ayData]);

  useEffect(() => {
    if (academicYears.length === 0 || selectedAyId) return;
    const active = academicYears.find((ay) => ay.isActive);
    const operational =
      operationalYear?.academicYear?.id != null
        ? academicYears.find((ay) => ay.id === operationalYear.academicYear?.id)
        : undefined;
    setSelectedAyId(active?.id || operational?.id || academicYears[0].id);
  }, [academicYears, operationalYear, selectedAyId]);

  const {
    data: composition,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["metopen-score-composition", selectedAyId],
    queryFn: () => getScoreComposition(selectedAyId),
    enabled: Boolean(selectedAyId),
  });

  useEffect(() => {
    if (!composition) {
      onCompositionChange?.(null);
      return;
    }
    setTa03aCap(String(composition.ta03aCap));
    setTa03bCap(String(composition.ta03bCap));
    onCompositionChange?.(composition);
  }, [composition, onCompositionChange]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateScoreComposition(selectedAyId, {
        ta03aCap: Number(ta03aCap),
        ta03bCap: Number(ta03bCap),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["metopen-score-composition", selectedAyId], data);
      queryClient.invalidateQueries({ queryKey: ["rubric-metopen-weight"] });
      onCompositionChange?.(data);
      toast.success("Komposisi penilaian TA-03 berhasil disimpan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const aNum = Number(ta03aCap);
  const bNum = Number(ta03bCap);
  const sum = (Number.isFinite(aNum) ? aNum : 0) + (Number.isFinite(bNum) ? bNum : 0);
  const sumOk = sum === 100;
  const isLocked = composition?.isLocked === true;
  const dirty =
    composition != null &&
    (Number(ta03aCap) !== composition.ta03aCap || Number(ta03bCap) !== composition.ta03bCap);
  const canSave =
    !isLocked &&
    dirty &&
    Number.isInteger(aNum) &&
    Number.isInteger(bNum) &&
    aNum >= 1 &&
    aNum <= 99 &&
    bNum >= 1 &&
    bNum <= 99 &&
    sumOk &&
    !saveMutation.isPending;

  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Komposisi penilaian TA-03</p>
          <p className="text-xs text-muted-foreground max-w-xl">
            Atur batas poin TA-03A (pembimbing) dan TA-03B (koordinator) per tahun akademik.
            Jumlah wajib 100. Formula tetap penjumlahan, bukan bobot persen.
          </p>
        </div>
        {isLocked ? (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Lock className="h-3 w-3" />
            Terkunci
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Tahun akademik</Label>
          <Select value={selectedAyId} onValueChange={setSelectedAyId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun akademik" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((ay) => (
                <SelectItem key={ay.id} value={ay.id}>
                  {formatAyLabel(ay)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ta03aCap" className="text-xs">
            TA-03A (pembimbing)
          </Label>
          <Input
            id="ta03aCap"
            type="number"
            min={1}
            max={99}
            value={ta03aCap}
            disabled={isLocked || isLoading}
            onChange={(e) => {
              setTa03aCap(e.target.value);
              const nextA = Number(e.target.value);
              if (Number.isInteger(nextA) && nextA >= 1 && nextA <= 99) {
                setTa03bCap(String(100 - nextA));
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ta03bCap" className="text-xs">
            TA-03B (koordinator)
          </Label>
          <Input
            id="ta03bCap"
            type="number"
            min={1}
            max={99}
            value={ta03bCap}
            disabled={isLocked || isLoading}
            onChange={(e) => {
              setTa03bCap(e.target.value);
              const nextB = Number(e.target.value);
              if (Number.isInteger(nextB) && nextB >= 1 && nextB <= 99) {
                setTa03aCap(String(100 - nextB));
              }
            }}
          />
        </div>

        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={!canSave}
          className="w-full sm:w-auto"
        >
          {saveMutation.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "tabular-nums font-medium",
            sumOk ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
          )}
        >
          Total {sum} / 100
        </span>
        {isFetching && !isLoading ? (
          <span className="text-muted-foreground">Memuat ulang...</span>
        ) : null}
        {isLocked ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tidak dapat diubah: sudah ada {composition?.finalizedScoreCount ?? 0} nilai TA-03
            final pada tahun akademik ini.
          </span>
        ) : !sumOk ? (
          <span className="text-destructive">Jumlah TA-03A + TA-03B harus tepat 100.</span>
        ) : null}
      </div>
    </div>
  );
}
