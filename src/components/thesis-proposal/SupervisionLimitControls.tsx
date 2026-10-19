import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClearPeriodLimits, useSetGeneralLimits, useSetPeriodLimits } from '@/hooks/thesis-proposal/useSupervisionQuota';
import type { SupervisionLimits, SupervisionLoadOverview } from '@/types/thesis-proposal.types';

/** Why the soft and hard limit cannot be saved, or null. */
export function getLimitsError(soft: string, hard: string): string | null {
  const softNumber = Number(soft);
  const hardNumber = Number(hard);
  if (!Number.isInteger(softNumber) || !Number.isInteger(hardNumber) || softNumber < 1 || hardNumber < 1) return 'Isi batas lunak dan batas keras (bilangan bulat).';
  if (softNumber > hardNumber) return 'Batas lunak tidak boleh lebih besar dari batas keras.';
  return null;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The values in force (the general limit when the semester has none of its own). */
  initial: SupervisionLimits;
  saving: boolean;
  onSave: (limits: SupervisionLimits) => void;
  /** Shown when the semester has its own limits. */
  onRestoreGeneral?: () => void;
}

export function SupervisionLimitDialog({ open, onOpenChange, title, description, initial, saving, onSave, onRestoreGeneral }: DialogProps) {
  const [soft, setSoft] = useState(String(initial.softLimit));
  const [hard, setHard] = useState(String(initial.hardLimit));
  useEffect(() => {
    if (!open) return;
    setSoft(String(initial.softLimit));
    setHard(String(initial.hardLimit));
  }, [open, initial.softLimit, initial.hardLimit]);
  const error = getLimitsError(soft, hard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="batas-lunak">Batas lunak</Label>
            <Input id="batas-lunak" type="number" min={1} max={100} value={soft} onChange={(e) => setSoft(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="batas-keras">Batas keras</Label>
            <Input id="batas-keras" type="number" min={1} max={100} value={hard} onChange={(e) => setHard(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter className="flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
          {onRestoreGeneral && (
            <Button size="sm" variant="outline" onClick={onRestoreGeneral} disabled={saving}>Kembalikan ke Batas Umum</Button>
          )}
          <Button size="sm" disabled={Boolean(error) || saving} onClick={() => onSave({ softLimit: Number(soft), hardLimit: Number(hard) })}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ToolbarProps {
  overview: SupervisionLoadOverview;
  /** `general`: Kelola → Batas Bimbingan. `period`: Penetapan → Beban Dosen, the chosen semester. */
  scope: 'general' | 'period';
  canEdit: boolean;
  /** Why the button is disabled (e.g. a past semester), shown as its tooltip. */
  disabledReason?: string | null;
}

export const PAST_SEMESTER_LIMIT_REASON = 'Batas hanya bisa diubah untuk semester aktif.';

/**
 * "Batas lunak: n", "Batas keras: n" and one button above the Beban Dosen table.
 * General scope shows and edits the general limit; period scope shows the limits in force for the
 * semester and edits that semester's own limits (prefilled with the values in force).
 */
export function SupervisionLimitToolbar({ overview, scope, canEdit, disabledReason }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const setGeneral = useSetGeneralLimits();
  const setPeriod = useSetPeriodLimits();
  const clearPeriod = useClearPeriodLimits();
  const saving = setGeneral.isPending || setPeriod.isPending || clearPeriod.isPending;
  const shown = scope === 'general' ? (overview.general ?? overview.applicable) : overview.applicable;
  const periodId = overview.academicYear?.id ?? null;
  const reason = disabledReason ?? (scope === 'period' && !periodId ? 'Pilih semester terlebih dahulu.' : null);
  const label = scope === 'general' ? 'Ubah Batas Umum' : 'Ubah Batas Semester Ini';
  const done = { onSuccess: () => setOpen(false) };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium">Batas lunak: {shown.softLimit}</Badge>
      <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium">Batas keras: {shown.hardLimit}</Badge>
      {canEdit && (
        <span title={reason ?? undefined} className="inline-flex">
          <Button size="sm" variant="outline" disabled={Boolean(reason)} onClick={() => setOpen(true)}>{label}</Button>
        </span>
      )}
      {canEdit && (
        <SupervisionLimitDialog
          open={open}
          onOpenChange={setOpen}
          title={label}
          description={scope === 'period' ? overview.academicYear?.label : undefined}
          initial={shown}
          saving={saving}
          onSave={(limits) => {
            if (scope === 'general') setGeneral.mutate(limits, done);
            else if (periodId) setPeriod.mutate({ academicYearId: periodId, limits }, done);
          }}
          onRestoreGeneral={scope === 'period' && overview.period && periodId ? () => clearPeriod.mutate(periodId, done) : undefined}
        />
      )}
    </div>
  );
}
