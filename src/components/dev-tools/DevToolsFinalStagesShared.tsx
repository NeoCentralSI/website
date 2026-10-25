/**
 * DEV TOOLS — pieces shared by the Seminar & Sidang and Yudisium tabs: the student picker,
 * the preview of what an action does, and the status labels.
 * ⚠️ DELETE THIS DIRECTORY (components/dev-tools/) when dev tools are no longer needed.
 */
import { useEffect, useState } from 'react';
import { ChevronsUpDown, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchField } from '@/components/shared/SearchField';
import { useDevToolsStudents } from '@/hooks/dev-tools/useDevTools';
import { SEARCH_DEBOUNCE_MS, useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { DevToolsEffects, DevToolsEventTarget, DevToolsParticipantStatus } from '@/types/devTools.types';

export const EVENT_TARGET_LABELS: Record<DevToolsEventTarget, string> = {
  registered: 'Terdaftar',
  verified: 'Terverifikasi',
  examiner_assigned: 'Penguji Ditetapkan',
  scheduled: 'Terjadwal',
  passed: 'Lulus',
  passed_with_revision: 'Lulus dengan Revisi',
  failed: 'Tidak Lulus',
};
export const EVENT_TARGETS = Object.keys(EVENT_TARGET_LABELS) as DevToolsEventTarget[];

export const PARTICIPANT_STATUS_LABELS: Record<DevToolsParticipantStatus, string> = {
  registered: 'Terdaftar',
  eligible: 'Memenuhi Syarat',
  appointed: 'Ditetapkan',
  rejected: 'Ditolak',
  finalized: 'Final',
};

export interface PickedStudent {
  id: string;
  fullName: string;
  identityNumber: string;
}

/** Search a student by name or NIM and pick one. */
export function DevToolsStudentPicker({ value, onChange }: { value: PickedStudent | null; onChange: (student: PickedStudent) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const { data, isFetching } = useDevToolsStudents(debounced, '');
  const students = data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal sm:w-[360px]">
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value ? `${value.fullName} (${value.identityNumber})` : 'Pilih mahasiswa'}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" align="start">
        <SearchField value={search} onChange={setSearch} placeholder="Cari nama atau NIM" isSearching={isFetching} className="sm:max-w-none" />
        <div className="mt-2 max-h-72 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
          {students.length === 0 && !isFetching && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Mahasiswa tidak ditemukan</p>}
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className={cn(
                'flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                value?.id === student.id && 'bg-muted',
              )}
              onClick={() => {
                onChange({ id: student.id, fullName: student.fullName, identityNumber: student.identityNumber });
                setOpen(false);
              }}
            >
              <span className="w-full truncate font-medium">{student.fullName}</span>
              <span className="text-xs text-muted-foreground">{student.identityNumber}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface PendingAction {
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  preview: () => Promise<DevToolsEffects>;
  run: () => Promise<unknown>;
}

/** The effects of an action, loaded from the server, before the Admin confirms it. */
export function DevToolsEffectsDialog({ action, onClose, isSubmitting }: { action: PendingAction | null; onClose: () => void; isSubmitting: boolean }) {
  const [effects, setEffects] = useState<DevToolsEffects | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setEffects(null);
    setError(null);
    if (!action) return;
    action
      .preview()
      .then((result) => active && setEffects(result))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : 'Pratinjau gagal dimuat'));
    return () => {
      active = false;
    };
  }, [action]);

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{action?.title}</DialogTitle>
          {action?.description && <DialogDescription>{action.description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm">
          {!effects && !error && (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner className="h-4 w-4" />Memuat pratinjau</div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {effects && effects.prerequisites.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Syarat yang dipenuhi otomatis</p>
              <EffectList items={effects.prerequisites} />
            </div>
          )}
          {effects && (
            <div>
              <p className="mb-1 font-medium">Yang akan terjadi</p>
              <EffectList items={effects.effects} />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Tidak ada notifikasi atau email yang dikirim. Perubahan tercatat di Log Aktivitas.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button
            variant={action?.destructive ? 'destructive' : 'default'}
            disabled={isSubmitting || !effects}
            onClick={async () => {
              if (!action) return;
              const result = await action.run();
              if (result !== null) onClose();
            }}
          >
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Memproses</> : action?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EffectList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className={cn('flex gap-2', item.startsWith('  ') && 'pl-4 text-muted-foreground')}>
          <span aria-hidden>•</span>
          <span>{item.trim()}</span>
        </li>
      ))}
    </ul>
  );
}
