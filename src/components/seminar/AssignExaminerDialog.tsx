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
import { useEligibleExaminers, useAssignExaminers } from '@/hooks/thesis-seminar/useLecturerSeminar';
import { toTitleCaseName } from '@/lib/text';
import { toast } from 'sonner';
import { SearchIcon, Lock } from 'lucide-react';
import type { AssignmentSeminarItem } from '@/types/seminar.types';

interface AssignExaminerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seminar: AssignmentSeminarItem | null;
  onSuccess: () => void;
}

export function AssignExaminerDialog({
  open,
  onOpenChange,
  seminar,
  onSuccess,
}: AssignExaminerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: lecturers, isLoading: loadingLecturers } = useEligibleExaminers(
    open && seminar ? seminar.id : undefined
  );

  const assignMutation = useAssignExaminers();

  // Determine locked (accepted) examiners that cannot be changed
  const lockedExaminers = useMemo(() => {
    if (!seminar) return [];
    return seminar.examiners.filter((e) => e.availabilityStatus === 'available');
  }, [seminar]);

  const lockedIds = useMemo(() => lockedExaminers.map((e) => e.lecturerId), [lockedExaminers]);
  const slotsToFill = 2 - lockedIds.length;

  // Pre-select: locked examiners always selected + for edit mode pre-select pending ones
  useEffect(() => {
    if (open && seminar) {
      const initial = [
        ...lockedIds,
        ...seminar.examiners
          .filter((e) => e.availabilityStatus !== 'available' && e.availabilityStatus !== 'unavailable')
          .map((e) => e.lecturerId),
      ];
      setSelectedIds(initial);
      setSearch('');
    }
  }, [open, seminar, lockedIds]);

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
    // Cannot toggle locked examiners
    if (lockedIds.includes(id)) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        toast.error('Maksimal 2 penguji');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    if (!seminar) return;
    if (selectedIds.length !== 2) {
      toast.error('Harus memilih tepat 2 penguji');
      return;
    }

    assignMutation.mutate(
      { seminarId: seminar.id, examinerIds: selectedIds },
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

  const isEdit = seminar && seminar.examiners.length > 0;
  const isPartialReplace = lockedIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isPartialReplace ? 'Ganti Penguji' : isEdit ? 'Ubah Penguji' : 'Tetapkan Penguji'}
          </DialogTitle>
          <DialogDescription>
            {seminar && (
              <span>
                Mahasiswa: <strong>{toTitleCaseName(seminar.studentName)}</strong> ({seminar.studentNim})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Locked examiners info */}
          {isPartialReplace && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Penguji yang sudah menyetujui (tidak dapat diubah):
              </div>
              {lockedExaminers.map((e) => (
                <div key={e.id} className="text-sm flex items-center gap-2">
                  <Badge variant="success" className="text-xs shrink-0">
                    Penguji {e.order}
                  </Badge>
                  <span className="font-medium">{toTitleCaseName(e.lecturerName)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected count indicator */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isPartialReplace
                ? `Pilih ${slotsToFill} penguji pengganti`
                : 'Pilih 2 dosen penguji'}
            </span>
            <Badge variant={selectedIds.length === 2 ? 'success' : 'secondary'}>
              {selectedIds.length - lockedIds.length}/{slotsToFill} dipilih
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Lecturer list */}
          {loadingLecturers ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {filteredLecturers.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {search ? 'Tidak ditemukan' : 'Tidak ada dosen tersedia'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLecturers.map((l) => {
                    const isSelected = selectedIds.includes(l.id);
                    const isLocked = lockedIds.includes(l.id);
                    return (
                      <label
                        key={l.id}
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isLocked
                            ? 'bg-primary/5 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary/10 cursor-pointer'
                              : 'hover:bg-muted cursor-pointer'
                          }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(l.id)}
                          disabled={isLocked}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {toTitleCaseName(l.fullName)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {l.identityNumber} · {l.scienceGroup}
                          </div>
                        </div>
                        {isLocked && (
                          <Badge variant="success" className="text-xs shrink-0">
                            <Lock className="h-3 w-3 mr-1" />
                            Penguji {lockedExaminers.find((e) => e.lecturerId === l.id)?.order}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length !== 2 || assignMutation.isPending}
          >
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
