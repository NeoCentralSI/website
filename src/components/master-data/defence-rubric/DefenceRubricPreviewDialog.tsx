import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CpmkWithRubrics, DefenceRole } from '@/services/master-data/defence-rubric.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cpmks: CpmkWithRubrics[];
  role: DefenceRole;
  minimumPassingScore: number;
}

export function DefenceRubricPreviewDialog({
  open,
  onOpenChange,
  cpmks,
  role,
  minimumPassingScore,
}: Props) {
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({});
  const configuredCpmks = cpmks.filter((cpmk) => cpmk.assessmentCriterias.length > 0);
  const totalMaxScore = configuredCpmks.reduce(
    (total, cpmk) =>
      total +
      cpmk.assessmentCriterias.reduce(
        (subtotal, criterion) => subtotal + Number(criterion.maxScore || 0),
        0
      ),
    0
  );

  const roleLabel = role === 'examiner' ? 'Penguji' : 'Pembimbing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Preview Form Penilaian Sidang ({roleLabel})</DialogTitle>
          <DialogDescription>
            Tampilan berikut menggambarkan form yang akan digunakan oleh dosen {roleLabel.toLowerCase()} saat sidang tugas akhir.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3">
              <CardTitle className="text-base font-semibold">Form Penilaian Sidang TA ({roleLabel})</CardTitle>
              <span className="text-xs text-muted-foreground">Penilai: Nama Dosen {roleLabel}</span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {configuredCpmks.map((cpmk, groupIndex) => {
                const groupMaxScore = cpmk.assessmentCriterias.reduce(
                  (sum, criterion) => sum + Number(criterion.maxScore || 0),
                  0
                );

                return (
                  <div key={cpmk.id}>
                    <div className="bg-muted/20 px-4 py-3">
                      <h3 className="text-sm font-bold">
                        {String.fromCharCode(65 + groupIndex)} · {cpmk.code}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          (maks. {groupMaxScore})
                        </span>
                      </h3>
                      {cpmk.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{cpmk.description}</p>
                      )}
                    </div>

                    <div className="divide-y">
                      {cpmk.assessmentCriterias.map((criterion, criterionIndex) => (
                        <div key={criterion.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <Label className="text-sm font-medium leading-relaxed">
                                ({String.fromCharCode(97 + criterionIndex)}) {criterion.name}
                              </Label>
                              {criterion.assessmentRubrics.length > 0 && (
                                <Collapsible
                                  open={openRubrics[criterion.id] ?? false}
                                  onOpenChange={(rubricOpen) =>
                                    setOpenRubrics((previous) => ({
                                      ...previous,
                                      [criterion.id]: rubricOpen,
                                    }))
                                  }
                                  className="mt-1"
                                >
                                  <CollapsibleTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                    >
                                      {openRubrics[criterion.id] ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      Lihat rubrik penilaian
                                    </button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="mt-2 overflow-hidden rounded-md border bg-muted/10">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b bg-muted/20">
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">
                                              Range Skor
                                            </th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">
                                              Deskripsi
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {criterion.assessmentRubrics.map((rubric) => (
                                            <tr key={rubric.id} className="border-b last:border-0">
                                              <td className="whitespace-nowrap px-3 py-1.5 font-semibold">
                                                {rubric.minScore} - {rubric.maxScore}
                                              </td>
                                              <td className="px-3 py-1.5 text-muted-foreground">
                                                {rubric.description}
                                              </td>
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
                              <Input
                                type="number"
                                value={0}
                                disabled
                                aria-label={`Preview nilai ${criterion.name}`}
                                className="h-8 w-20 text-right text-sm font-semibold"
                              />
                              <span className="text-xs text-muted-foreground">
                                / {criterion.maxScore}
                              </span>
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
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Total Skor ({roleLabel})
              </span>
              <div className="mt-2 text-5xl font-black">0</div>
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                / {totalMaxScore}
              </span>
              <Badge variant="secondary" className="mt-4 font-semibold">
                Belum diisi
              </Badge>
            </Card>
            <Card>
              <CardContent className="p-4 text-xs">
                <p className="font-semibold">Batas kelulusan akhir</p>
                <p className="mt-1 text-muted-foreground">
                  Minimum nilai akhir:{' '}
                  <span className="font-bold text-foreground">{minimumPassingScore}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
