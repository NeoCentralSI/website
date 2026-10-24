import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClearPeriodLimits, useSetGeneralLimits, useSetPeriodLimits } from '@/hooks/thesis-proposal/useSupervisionQuota';
import type { SupervisionLimits, SupervisionLoadOverview } from '@/types/thesis-proposal.types';

export function getLimitsError(quota: string, total?: string): string | null {
  const values = total == null ? [quota] : [quota, total];
  return values.some((value) => !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 100)
    ? 'Isi nilai dengan bilangan bulat 1–100.' : null;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  scope?: 'general' | 'period';
  description?: string;
  /** The values in force (the general limit when the semester has none of its own). */
  initial: SupervisionLimits;
  saving: boolean;
  onSave: (limits: SupervisionLimits) => void;
  /** Shown when the semester has its own limits. */
  onRestoreGeneral?: () => void;
}

export function SupervisionLimitDialog({ open, onOpenChange, title, scope = 'general', description, initial, saving, onSave, onRestoreGeneral }: DialogProps) {
  const [quota, setQuota] = useState(String(initial.semesterQuota));
  const [total, setTotal] = useState(String(initial.totalLimit));
  useEffect(() => {
    if (!open) return;
    setAttempted(false);
    setQuota(String(initial.semesterQuota));
    setTotal(String(initial.totalLimit));
  }, [open, initial.semesterQuota, initial.totalLimit]);
  const [attempted, setAttempted] = useState(false);
  const error = attempted ? getLimitsError(quota, scope === 'general' ? total : undefined) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="kuota-semester">{scope === 'general' ? 'Kuota semester bawaan' : 'Kuota semester'} <span className="text-destructive">*</span></Label>
            <Input id="kuota-semester" type="number" min={1} max={100} value={quota} onChange={(e) => setQuota(e.target.value)} />
          </div>
          {scope === 'general' && <div className="space-y-1">
            <Label htmlFor="batas-total">Batas total <span className="text-destructive">*</span></Label>
            <Input id="batas-total" type="number" min={1} max={100} value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter className="flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
          {onRestoreGeneral && (
            <Button size="sm" variant="outline" onClick={onRestoreGeneral} disabled={saving}>Ikuti Kuota Bawaan</Button>
          )}
          <Button size="sm" disabled={saving} onClick={() => { setAttempted(true); if (!getLimitsError(quota, scope === 'general' ? total : undefined)) onSave({ semesterQuota: Number(quota), totalLimit: Number(total) }); }}>
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

export function SupervisionLimitToolbar({ overview, scope, canEdit, disabledReason }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const setGeneral = useSetGeneralLimits();
  const setPeriod = useSetPeriodLimits();
  const clearPeriod = useClearPeriodLimits();
  const saving = setGeneral.isPending || setPeriod.isPending || clearPeriod.isPending;
  const shown = scope === 'general' ? (overview.general ?? overview.applicable) : overview.applicable;
  const periodId = overview.academicYear?.id ?? null;
  const reason = disabledReason ?? (scope === 'period' && !periodId ? 'Pilih semester terlebih dahulu.' : null);
  const label = scope === 'general' ? 'Ubah Batas' : 'Ubah Kuota Semester Ini';
  const done = { onSuccess: () => setOpen(false) };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {scope === 'general' && <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium">Batas total: {shown.totalLimit}</Badge>}
      <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium">{scope === 'general' ? 'Kuota semester bawaan' : 'Kuota semester'}: {shown.semesterQuota}</Badge>
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
          scope={scope}
          description={scope === 'period' ? overview.academicYear?.label : undefined}
          initial={shown}
          saving={saving}
          onSave={(limits) => {
            if (scope === 'general') setGeneral.mutate(limits, done);
            else if (periodId) setPeriod.mutate({ academicYearId: periodId, limits: { semesterQuota: limits.semesterQuota } }, done);
          }}
          onRestoreGeneral={scope === 'period' && overview.period && periodId ? () => clearPeriod.mutate(periodId, done) : undefined}
        />
      )}
    </div>
  );
}
