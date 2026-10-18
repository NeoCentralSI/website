import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateId } from '@/lib/text';
import { followSiaPeriodFlagsAPI, setStudentPeriodFlagsAPI, type StudentSemesterFlags } from '@/services/admin.service';

const SOURCE_LABELS: Record<string, string> = { sia: 'SIA', admin: 'Admin', devtools: 'DevTools' };
type FlagValue = 'yes' | 'no' | 'unknown';
const toValue = (flag: boolean | null): FlagValue => (flag === null ? 'unknown' : flag ? 'yes' : 'no');
const fromValue = (value: FlagValue): boolean | null => (value === 'unknown' ? null : value === 'yes');
const FLAG_LABELS: Record<FlagValue, string> = { yes: 'Ya', no: 'Tidak', unknown: 'Belum diketahui' };

function sourceOf(flags: StudentSemesterFlags, field: 'researchMethodSource' | 'thesisCourseSource') {
  const source = flags[field] ?? null;
  return source ? SOURCE_LABELS[source] ?? source : '-';
}

function FlagSelect({ id, label, value, onChange }: { id: string; label: string; value: FlagValue; onChange: (value: FlagValue) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as FlagValue)}>
        <SelectTrigger id={id} aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(FLAG_LABELS) as FlagValue[]).map((key) => <SelectItem key={key} value={key}>{FLAG_LABELS[key]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Paket P9 (8, K36): Data Master → Mahasiswa → Keikutsertaan per Semester. The Admin sets
 * "Mengambil Metode Penelitian" and "Mengambil Tugas Akhir" of a semester (source Admin, kept by
 * the SIA sync) or hands them back to SIA with "Ikuti Data SIA".
 */
export function StudentSemesterFlagsCard({ studentId, semesterFlags, canEdit }: { studentId: string; semesterFlags: StudentSemesterFlags[]; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<StudentSemesterFlags | null>(null);
  const [researchMethod, setResearchMethod] = useState<FlagValue>('unknown');
  const [thesisCourse, setThesisCourse] = useState<FlagValue>('unknown');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });

  const save = useMutation({
    mutationFn: (flags: StudentSemesterFlags) => setStudentPeriodFlagsAPI(studentId, flags.academicYearId, {
      eligibleResearchMethod: fromValue(researchMethod),
      takingThesisCourse: fromValue(thesisCourse),
    }),
    onSuccess: (result) => { toast.success(result.message ?? 'Keikutsertaan semester disimpan.'); setEditing(null); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const follow = useMutation({
    mutationFn: (flags: StudentSemesterFlags) => followSiaPeriodFlagsAPI(studentId, flags.academicYearId),
    onSuccess: (result) => { toast.success(result.message ?? 'Keikutsertaan semester mengikuti data SIA.'); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const open = (flags: StudentSemesterFlags) => {
    setResearchMethod(toValue(flags.takingResearchMethod));
    setThesisCourse(toValue(flags.takingThesisCourse));
    setEditing(flags);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Keikutsertaan per Semester
        </CardTitle>
      </CardHeader>
      <CardContent>
        {semesterFlags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada semester.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm" aria-label="Keikutsertaan per semester">
            {semesterFlags.map((flags) => {
              const isAdmin = flags.researchMethodSource === 'admin' || flags.thesisCourseSource === 'admin';
              return (
                <li key={flags.academicYearId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="font-medium">{flags.academicYearLabel}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={flags.takingResearchMethod ? 'default' : 'outline'} title={`Sumber: ${sourceOf(flags, 'researchMethodSource')}`}>
                      Metode Penelitian: {FLAG_LABELS[toValue(flags.takingResearchMethod)]} · {sourceOf(flags, 'researchMethodSource')}
                    </Badge>
                    <Badge variant={flags.takingThesisCourse ? 'default' : 'outline'} title={`Sumber: ${sourceOf(flags, 'thesisCourseSource')}`}>
                      Tugas Akhir: {FLAG_LABELS[toValue(flags.takingThesisCourse)]} · {sourceOf(flags, 'thesisCourseSource')}
                    </Badge>
                    {flags.capturedAt && <span className="text-xs text-muted-foreground">{formatDateId(flags.capturedAt)}</span>}
                    {canEdit && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => open(flags)}>Ubah</Button>
                        <span title={isAdmin ? undefined : 'Penanda semester ini sudah mengikuti data SIA.'} className="inline-flex">
                          <Button size="sm" variant="outline" disabled={!isAdmin || follow.isPending} onClick={() => follow.mutate(flags)}>
                            {follow.isPending && follow.variables?.academicYearId === flags.academicYearId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ikuti Data SIA
                          </Button>
                        </span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(value) => { if (!value) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Keikutsertaan Semester</DialogTitle>
            <DialogDescription>{editing?.academicYearLabel}. Isian Admin tidak ditimpa sinkronisasi SIA.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FlagSelect id="flag-research-method" label="Mengambil Metode Penelitian" value={researchMethod} onChange={setResearchMethod} />
            <FlagSelect id="flag-thesis-course" label="Mengambil Tugas Akhir" value={thesisCourse} onChange={setThesisCourse} />
          </div>
          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>Batal</Button>
            <Button size="sm" disabled={save.isPending} onClick={() => editing && save.mutate(editing)}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
