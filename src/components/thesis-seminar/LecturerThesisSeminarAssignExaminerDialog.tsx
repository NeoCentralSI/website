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
import { useEligibleExaminers, useAssignExaminers } from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';
import { toast } from 'sonner';
import { SearchIcon, Lock } from 'lucide-react';
import type { AssignmentSeminarItem } from '@/types/seminar.types';

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

interface LecturerThesisSeminarAssignExaminerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seminar: AssignmentSeminarItem | null;
  onSuccess: () => void;
}

export function LecturerThesisSeminarAssignExaminerDialog({
  open,
  onOpenChange,
  seminar,
  onSuccess,
}: LecturerThesisSeminarAssignExaminerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: lecturers, isLoading: loadingLecturers } = useEligibleExaminers(
    open && seminar ? seminar.id : undefined
  );

  const assignMutation = useAssignExaminers();

  // Determine locked (accepted) examiners that cannot be changed
  const lockedExaminers = useMemo(
    () => (seminar?.examiners ?? []).filter((e) => e.availabilityStatus === 'available'),
    [seminar]
  );
  const lockedIds = useMemo(() => lockedExaminers.map((e) => e.lecturerId), [lockedExaminers]);
  const selectedNewCount = useMemo(() => selectedIds.length, [selectedIds]);
  const rejectedIds = useMemo(
    () => new Set((seminar?.rejectedExaminers ?? []).map((e) => e.lecturerId)),
    [seminar]
  );

  // Pre-select: pre-select active ones
  useEffect(() => {
    if (open && seminar) {
      const initial = seminar.examiners
        .filter((e) => e.availabilityStatus !== 'unavailable')
        .map((e) => e.lecturerId);
      setSelectedIds(initial);
      setSearch('');
    }
  }, [open, seminar]);

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
    if (!seminar) return;
    if (selectedIds.length < 1) {
      toast.error('Harus memilih minimal 1 penguji');
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
  const showDashboard = !isPartialReplace && lockedIds.length === 0;
  const selectedLecturers = useMemo(
    () => (lecturers ?? []).filter((lecturer) => selectedIds.includes(lecturer.id)),
    [lecturers, selectedIds]
  );
  const scheduleDashboard = useMemo(() => {
    const base = {
      sharedSlots: [] as Array<{
        day: string;
        dayLabel: string;
        startTime: string;
        endTime: string;
        validFrom: string;
        validUntil: string;
      }>,
      combinedIntervals: [] as Array<{
        day: string;
        dayLabel: string;
        startTime: string;
        endTime: string;
        lecturerName: string;
        validFrom: string;
        validUntil: string;
      }>,
      conflictingSelectedCount: selectedLecturers.filter((lecturer) => lecturer.hasScheduleConflict).length,
    };

    if (selectedLecturers.length === 0) return base;

    const byDay = new Map<
      string,
      Array<{
        dayLabel: string;
        start: number;
        end: number;
        validFrom: string;
        validUntil: string;
      }>
    >();

    for (const lecturer of selectedLecturers) {
      const slots = lecturer.availabilityRanges ?? [];
      for (const slot of slots) {
        const start = toMinutes(slot.startTime);
        const end = toMinutes(slot.endTime);
        if (start === null || end === null || start >= end) continue;
        if (!byDay.has(slot.day)) byDay.set(slot.day, []);
        byDay.get(slot.day)?.push({
          dayLabel: slot.dayLabel,
          start,
          end,
          validFrom: slot.validFrom,
          validUntil: slot.validUntil,
        });
      }
    }

    const sharedSlots = [...byDay.entries()]
      .map(([day, slots]) => {
        if (slots.length < selectedLecturers.length) return null;
        const start = Math.max(...slots.map((slot) => slot.start));
        const end = Math.min(...slots.map((slot) => slot.end));
        if (start >= end) return null;

        const validFromMs = Math.max(...slots.map((slot) => new Date(slot.validFrom).getTime()));
        const validUntilMs = Math.min(...slots.map((slot) => new Date(slot.validUntil).getTime()));
        if (Number.isNaN(validFromMs) || Number.isNaN(validUntilMs) || validFromMs > validUntilMs) return null;

        return {
          day,
          dayLabel: slots[0].dayLabel,
          startTime: toHHMM(start),
          endTime: toHHMM(end),
          validFrom: new Date(validFromMs).toISOString(),
          validUntil: new Date(validUntilMs).toISOString(),
        };
      })
      .filter((slot): slot is NonNullable<typeof slot> => !!slot)
      .sort((a, b) => (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99));

    const combinedEvents = selectedLecturers
      .flatMap((lecturer: any) =>
        (lecturer.events ?? []).map((ev: any) => ({
          ...ev,
          lecturerName: lecturer.fullName,
        }))
      )
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { ...base, sharedSlots, combinedEvents };
  }, [selectedLecturers]);

  const workloadCountVariant = (count?: number): 'success' | 'warning' | 'destructive' | 'secondary' => {
    if (typeof count !== 'number') return 'secondary';
    if (count <= 2) return 'success';
    if (count <= 5) return 'warning';
    return 'destructive';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-4xl !max-w-full">
        <DialogHeader>
          <DialogTitle>
            {isPartialReplace ? 'Ganti Penguji' : isEdit ? 'Ubah Penguji' : 'Tetapkan Penguji'}
          </DialogTitle>
          <DialogDescription>
            {seminar ? (
              <span>
                Mahasiswa: <strong>{toTitleCaseName(seminar.studentName)}</strong> ({seminar.studentNim})
              </span>
            ) : (
              'Pilih dosen penguji untuk seminar hasil mahasiswa.'
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

          <div className={`grid gap-4 ${showDashboard ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
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
                      const recommendationVariant = l.hasScheduleConflict ? 'destructive' : 'info';
                      return (
                        <label
                          key={l.id}
                          className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isLocked
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
                              {l.isPreviousExaminer && (
                                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                  Penguji Sebelumnya
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isLocked && (
                            <Badge variant="success" className="text-xs shrink-0">
                              <Lock className="h-3 w-3 mr-1" />
                              Penguji {lockedExaminers.find((e) => e.lecturerId === l.id)?.order}
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

          {showDashboard && (
            <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Dashboard Rekomendasi Jadwal</h4>
              <Badge variant={scheduleDashboard.sharedSlots.length > 0 ? 'success' : 'secondary'}>
                {scheduleDashboard.sharedSlots.length} irisan
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Irisan ketersediaan bersama:</p>
              <ScrollArea className="h-[140px] rounded-md border p-2">
                {scheduleDashboard.sharedSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Belum ada irisan jadwal yang valid di antara profil terpilih.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scheduleDashboard.sharedSlots.map((slot) => (
                      <div key={`${slot.day}-${slot.startTime}-${slot.endTime}`} className="rounded border p-2">
                        <div className="text-sm font-medium">
                          {slot.dayLabel}: {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Berlaku: {new Date(slot.validFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} -{' '}
                          {new Date(slot.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Jadwal Kesibukan:</p>
              <ScrollArea className="h-[140px] rounded-md border p-2">
                {(scheduleDashboard.combinedEvents ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada acara terjadwal untuk profil terpilih.</p>
                ) : (
                  <div className="space-y-2">
                    {(scheduleDashboard.combinedEvents ?? []).map((ev: any, idx: number) => (
                      <div key={`${ev.type}-${ev.date}-${ev.lecturerName}-${idx}`} className="rounded border p-2">
                        <div className="text-sm font-medium">
                          {ev.title} · {toTitleCaseName(ev.studentName)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Penguji: {toTitleCaseName(ev.lecturerName)}
                        </div>
                        <div className="text-[11px] font-semibold text-primary mt-0.5">
                          {new Date(ev.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.startTime} - {ev.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            </div>
          )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length < 1 || assignMutation.isPending}
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
