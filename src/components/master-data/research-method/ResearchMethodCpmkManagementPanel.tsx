import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useResearchMethodAssessment } from "@/hooks/master-data/useResearchMethodAssessment";
import { academicYearOptionLabel, useResearchMethodPeriod } from "./useResearchMethodPeriod";
import { ResearchMethodCpmkCatalog } from "./ResearchMethodCpmkCatalog";

/**
 * Tab "CPMK" di Kelola > Metode Penelitian, meniru CPMK Tugas Akhir: pilihan
 * periode di dalam panel (di toolbar tabel) dan "Salin Template" dari periode lain selama periode
 * ini belum punya CPMK. Salinan memuat CPMK beserta kriteria dan rubrik kedua pihak.
 */
export function ResearchMethodCpmkManagementPanel() {
  const period = useResearchMethodPeriod();
  const academicYearId = period.academicYearId;
  const hook = useResearchMethodAssessment("supervisor", academicYearId);
  const [copyOpen, setCopyOpen] = useState(false);
  const [source, setSource] = useState("");
  const sources = period.years.filter((year) => year.id !== academicYearId);

  const copy = async () => {
    if (!source) return;
    try {
      await hook.copyTemplate(source);
      setCopyOpen(false);
      setSource("");
    } catch {
      // The hook shows the error.
    }
  };

  const periodSelect = (
    <Select value={academicYearId ?? ""} onValueChange={period.setAcademicYearId}>
      <SelectTrigger className="w-full sm:w-56" aria-label="Tahun ajaran">
        <SelectValue placeholder="Pilih tahun ajaran" />
      </SelectTrigger>
      <SelectContent>
        {period.years.map((year) => (
          <SelectItem key={year.id} value={year.id}>{academicYearOptionLabel(year)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <ResearchMethodCpmkCatalog
        items={hook.allCpmks}
        isLoading={hook.isCpmkLoading || period.isLoading}
        isFetching={hook.isCpmkFetching}
        onCreate={hook.createCpmk}
        onUpdate={hook.updateCpmk}
        onDelete={hook.deleteCpmk}
        onRefresh={() => void hook.refetchCpmks()}
        isCreating={hook.isCreatingCpmk}
        isUpdating={hook.isUpdatingCpmk}
        isDeleting={hook.isDeletingCpmk}
        extraActions={
          <>
            {periodSelect}
            {academicYearId && !hook.isCpmkLoading && hook.allCpmks.length === 0 && (
              <Button type="button" variant="outline" size="sm" disabled={hook.isCopyingTemplate} onClick={() => setCopyOpen(true)}>
                {hook.isCopyingTemplate ? <Spinner className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}Salin Template
              </Button>
            )}
          </>
        }
      />

      <Dialog open={copyOpen} onOpenChange={(open) => { setCopyOpen(open); if (!open) setSource(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salin Template CPMK</DialogTitle>
            <DialogDescription>
              CPMK, kriteria, dan rubrik penilaian pembimbing dan koordinator dari periode sumber disalin ke periode ini. Nilai minimum lulus diatur
              di tab Rubrik Penilaian.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="research-method-copy-source">Tahun ajaran sumber</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="research-method-copy-source">
                <SelectValue placeholder="Pilih tahun ajaran sumber" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((year) => (
                  <SelectItem key={year.id} value={year.id}>{academicYearOptionLabel(year)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!source && <p className="text-xs text-muted-foreground">Pilih tahun ajaran sumber terlebih dahulu.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>Batal</Button>
            <Button onClick={() => void copy()} disabled={!source || hook.isCopyingTemplate}>
              {hook.isCopyingTemplate ? "Menyalin..." : "Salin Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
