import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDefenceEligibleExaminers, useAssignDefenceExaminers } from '@/hooks/thesis-defence';
import { toTitleCaseName } from '@/lib/text';
import { toast } from 'sonner';
import { SearchIcon, Lock } from 'lucide-react';
import type { AssignmentDefenceItem } from '@/types/defence.types';

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

const toMinutes = (time?: string | null) => {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const toHHMM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

interface LecturerThesisDefenceAssignExaminerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defence: AssignmentDefenceItem | null;
  onSuccess: () => void;
}

export function LecturerThesisDefenceAssignExaminerDialog({
  open,
  onOpenChange,
  defence,
  onSuccess,
}: LecturerThesisDefenceAssignExaminerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: lecturers, isLoading: loadingLecturers } = useDefenceEligibleExaminers(
    open && defence ? defence.id : undefined
  );

  const assignMutation = useAssignDefenceExaminers();

  // Determine locked (accepted) examiners that cannot be changed
  const lockedExaminers = useMemo(
    () => (defence?.examiners ?? []).filter((e) => e.availabilityStatus === 'available'),
    [defence]
  );
  const lockedIds = useMemo(() => lockedExaminers.map((e) => e.lecturerId), [lockedExaminers]);
  const selectedNewCount = useMemo(() => selectedIds.length, [selectedIds]);
  const rejectedIds = useMemo(
    () => new Set((defence?.rejectedExaminers ?? []).map((e) => e.lecturerId)),
    [defence]
  );

  const [hasInitialized, setHasInitialized] = useState(false);

  // Pre-select: pre-select active ones or seminar examiners if first time
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }
    if (!defence || hasInitialized) return;

    // 1. If already assigned to defence, pre-select those
    if (defence.examiners.length > 0) {
      const initial = defence.examiners
        .filter((e) => e.availabilityStatus !== 'unavailable')
        .map((e) => e.lecturerId);
      setSelectedIds(initial);
      setHasInitialized(true);
      setSearch('');
    }
    // 2. If first time (no examiners), pre-select from seminar examiners once lecturers load
    else if (lecturers && lecturers.length > 0) {
      const seminarExaminerIds = lecturers
        .filter((l) => l.isPreviousExaminer)
        .map((l) => l.id);
      setSelectedIds(seminarExaminerIds);
      setHasInitialized(true);
      setSearch('');
    }
  }, [open, defence, lecturers, hasInitialized]);

  const filteredLecturers = useMemo(() => {
    if (!lecturers) return [];
    if (!search.trim()) return lecturers;
    const q = search.toLowerCase();
    return lecturers.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.identityNumber.toLowerCase().includes(q) ||
        l.scienceGroup.toLowerCase().includes(q)
    );
  }, [lecturers, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    if (!defence) return;
    if (selectedIds.length < 1) {
      toast.error('Harus memilih minimal 1 penguji');
      return;
    }

    assignMutation.mutate(
      { defenceId: defence.id, examinerIds: selectedIds },
      {
        onSuccess: () => {
          toast.success('Penguji berhasil ditetapkan');
          onSuccess();
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Gagal menetapkan penguji');
        },
      }
    );
  };

  const isEdit = defence && defence.examiners.length > 0;
  const isPartialReplace = lockedIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-4xl !max-w-full">
        <DialogHeader>
          <DialogTitle>
            {isPartialReplace ? 'Ganti Penguji' : isEdit ? 'Ubah Penguji' : 'Tetapkan Penguji'}
          </DialogTitle>
          <DialogDescription>
            {defence ? (
              <span>
                Mahasiswa: <strong>{toTitleCaseName(defence.studentName)}</strong> ({defence.studentNim})
              </span>
            ) : (
              'Pilih dosen penguji untuk sidang tugas akhir mahasiswa.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="md:grid-cols-1">
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  {isPartialReplace ? 'Pilih Dosen Penguji Pengganti' : 'Pilih Dosen Penguji'}
                </h4>
                <Badge variant={selectedIds.length >= 1 ? 'success' : 'secondary'}>
                  {selectedNewCount} dipilih
                </Badge>
              </div>

              {loadingLecturers ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <ScrollArea className="h-[360px] rounded-md border p-2">
                  {filteredLecturers.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {search ? 'Tidak ditemukan' : 'Tidak ada dosen tersedia'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredLecturers.map((l) => {
                        const isSelected = selectedIds.includes(l.id);
                        const isLocked = lockedIds.includes(l.id);
                        const isRejected = rejectedIds.has(l.id);
                        const isPreviousExaminer = l.isPreviousExaminer;
                        return (
                          <label
                            key={l.id}
                            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                              isLocked
                                ? 'bg-muted/60 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary/10 cursor-pointer'
                                : 'hover:bg-muted cursor-pointer'
                            }`}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(l.id)} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{toTitleCaseName(l.fullName)}</div>
                              <div className="text-xs text-muted-foreground">
                                {l.identityNumber} · {l.scienceGroup}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  Acara Mendatang: {l.upcomingCount ?? 0}
                                </Badge>
                              </div>
                            </div>
                            {isLocked && (
                              <Badge variant="success" className="text-xs shrink-0">
                                <Lock className="h-3 w-3 mr-1" />
                                Penguji {lockedExaminers.find((e) => e.lecturerId === l.id)?.order}
                              </Badge>
                            )}
                            {isPreviousExaminer && (
                              <Badge variant="outline" className="text-xs shrink-0 border-primary text-primary">
                                Penguji Seminar
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Pernah Menolak
                              </Badge>
                            )}
                            {isSelected && !isLocked && (
                              <Badge variant="default" className="text-xs shrink-0">
                                Penguji {selectedIds.indexOf(l.id) + 1}
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.length < 1 || assignMutation.isPending}>
            {assignMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Menyimpan...
              </>
            ) : isPartialReplace ? (
              'Simpan Pengganti'
            ) : isEdit ? (
              'Simpan Perubahan'
            ) : (
              'Tetapkan Penguji'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
