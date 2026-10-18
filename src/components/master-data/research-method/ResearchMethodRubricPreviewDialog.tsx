import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResearchMethodAssessor, ResearchMethodCpmkWithRubrics } from "@/services/researchMethodAssessment.service";

const PARTY_LABEL: Record<ResearchMethodAssessor, string> = {
  supervisor: "Dosen Pembimbing",
  coordinator: "Koordinator Metode Penelitian",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cpmks: ResearchMethodCpmkWithRubrics[];
  assessor: ResearchMethodAssessor;
  /** Both parties' maximum scores; the final score is their sum (K31). */
  supervisorTotal: number;
  coordinatorTotal: number;
  minimumPassingScore: number;
}

/**
 * Paket P8 (3.2): "Pratinjau Form Penilaian" of Kelola > Metode Penelitian, the pattern of the
 * defence rubric preview: the form one party fills in Penilaian Proposal, read-only.
 */
export function ResearchMethodRubricPreviewDialog({ open, onOpenChange, cpmks, assessor, supervisorTotal, coordinatorTotal, minimumPassingScore }: Props) {
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({});
  const configured = cpmks.filter((cpmk) => cpmk.assessmentCriterias.length > 0);
  const partyMax = configured.reduce((total, cpmk) => total + cpmk.assessmentCriterias.reduce((sum, c) => sum + Number(c.maxScore || 0), 0), 0);
  const label = PARTY_LABEL[assessor];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Pratinjau Form Penilaian Proposal ({label})</DialogTitle>
          <DialogDescription>Tampilan form yang diisi {label.toLowerCase()} di Penilaian Proposal.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-semibold">Form Penilaian Proposal ({label})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {configured.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Belum ada kriteria untuk {label.toLowerCase()} pada periode ini.</p>}
              {configured.map((cpmk, groupIndex) => {
                const groupMax = cpmk.assessmentCriterias.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
                return (
                  <div key={cpmk.id}>
                    <div className="bg-muted/20 px-4 py-3">
                      <h3 className="text-sm font-bold">
                        {String.fromCharCode(65 + groupIndex)} · {cpmk.code} <span className="text-xs font-normal text-muted-foreground">(maks. {groupMax})</span>
                      </h3>
                      {cpmk.description && <p className="mt-0.5 text-xs text-muted-foreground">{cpmk.description}</p>}
                    </div>
                    <div className="divide-y">
                      {cpmk.assessmentCriterias.map((criterion, index) => (
                        <div key={criterion.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <Label className="text-sm font-medium leading-relaxed">({String.fromCharCode(97 + index)}) {criterion.name}</Label>
                              {criterion.assessmentRubrics.length > 0 && (
                                <Collapsible
                                  open={openRubrics[criterion.id] ?? false}
                                  onOpenChange={(value) => setOpenRubrics((prev) => ({ ...prev, [criterion.id]: value }))}
                                  className="mt-1"
                                >
                                  <CollapsibleTrigger asChild>
                                    <button type="button" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                                      {openRubrics[criterion.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                      Lihat rubrik penilaian
                                    </button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="mt-2 overflow-hidden rounded-md border bg-muted/10">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b bg-muted/20">
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Rentang Skor</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Deskripsi</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {criterion.assessmentRubrics.map((rubric) => (
                                            <tr key={rubric.id} className="border-b last:border-0">
                                              <td className="whitespace-nowrap px-3 py-1.5 font-semibold">{rubric.minScore} - {rubric.maxScore}</td>
                                              <td className="px-3 py-1.5 text-muted-foreground">{rubric.description}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Input type="number" value={0} disabled aria-label={`Pratinjau nilai ${criterion.name}`} className="h-8 w-20 text-right text-sm font-semibold" />
                              <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="p-6 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Skor ({label})</span>
              <div className="mt-2 text-5xl font-black">0</div>
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">/ {partyMax}</span>
              <Badge variant="secondary" className="mt-4 font-semibold">Belum diisi</Badge>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4 text-xs">
                <p className="font-semibold">Nilai akhir</p>
                <p className="text-muted-foreground">
                  Pembimbing {supervisorTotal} + Koordinator {coordinatorTotal} = maks. {supervisorTotal + coordinatorTotal}
                </p>
                <p className="text-muted-foreground">
                  Lulus bila presensi minimal 75% dan nilai akhir minimal <span className="font-bold text-foreground">{minimumPassingScore}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
