import { useCallback, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  KeyRound,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { SearchField, STALE_RESULT_CLASS } from '@/components/shared/SearchField';
import { useDevToolsMutations, useDevToolsStudents } from '@/hooks/dev-tools/useDevTools';
import { SEARCH_DEBOUNCE_MS, useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { formatDateTimeWib } from '@/lib/text';
import type { DevToolsStudent } from '@/types/devTools.types';
import { DevToolsEditStudentDialog } from './DevToolsEditStudentDialog';
import { DevToolsPasswordDialog } from './DevToolsPasswordDialog';
import {
  BoolIcon,
  ResearchMethodFlagBadge,
  STUDENT_STATUSES,
  StudentStatusBadge,
  ThesisCourseFlagBadge,
  TruncatedText,
} from './DevToolsShared';
import { DevToolsThesisTable } from './DevToolsThesisTable';

const COLUMN_COUNT = 9;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

function StudentDetail({ student, mutations }: {
  student: DevToolsStudent; mutations: ReturnType<typeof useDevToolsMutations>;
}) {
  const { isSubmitting } = mutations;
  const flags = student.periodFlags;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 rounded-md border bg-background p-3">
        <Field label="Email"><TruncatedText text={student.email} /></Field>
        <Field label="MK Wajib"><BoolIcon value={student.mandatoryCoursesCompleted} /></Field>
        <Field label="MKWU"><BoolIcon value={student.mkwuCompleted} /></Field>
        <Field label="KP"><BoolIcon value={student.internshipCompleted} /></Field>
        <Field label="KKN"><BoolIcon value={student.kknCompleted} /></Field>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              Mengambil Metode Penelitian (semester berjalan)
            </div>
            <p className="text-xs text-muted-foreground">
              Penanda SIA yang membuka Pengajuan Pembimbing di Tugas Akhir &gt; Proposal.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Status"><ResearchMethodFlagBadge value={flags.eligibleResearchMethod} /></Field>
              <Field label="Sumber">{flags.eligibilitySource === 'devtools' ? 'DevTools' : flags.eligibilitySource === 'sia' ? 'SIA' : '-'}</Field>
              <Field label="Diperbarui">{formatDateTimeWib(flags.eligibilityCapturedAt)}</Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutations.setPeriodFlags(student.id, { eligibleResearchMethod: true })} disabled={isSubmitting}>
                Tandai Mengambil
              </Button>
              <Button size="sm" variant="outline" onClick={() => mutations.setPeriodFlags(student.id, { eligibleResearchMethod: false })} disabled={isSubmitting}>
                Tandai Tidak Mengambil
              </Button>
              <Button size="sm" variant="ghost" onClick={() => mutations.setPeriodFlags(student.id, { eligibleResearchMethod: null })} disabled={isSubmitting}>
                Kosongkan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-blue-700" />
              Mengambil Tugas Akhir (semester berjalan)
            </div>
            <p className="text-xs text-muted-foreground">
              KRS Tugas Akhir dari SIA. Dipakai saat Naik ke Penelitian setelah lulus Metode Penelitian.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Status"><ThesisCourseFlagBadge value={flags.takingThesisCourse} /></Field>
              <Field label="Sumber">{flags.thesisCourseSource === 'devtools' ? 'DevTools' : flags.thesisCourseSource === 'sia' ? 'SIA' : '-'}</Field>
              <Field label="Diperbarui">{formatDateTimeWib(flags.thesisCourseCapturedAt)}</Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutations.setPeriodFlags(student.id, { takingThesisCourse: true })} disabled={isSubmitting}>
                Tandai Mengambil
              </Button>
              <Button size="sm" variant="outline" onClick={() => mutations.setPeriodFlags(student.id, { takingThesisCourse: false })} disabled={isSubmitting}>
                Tandai Tidak Mengambil
              </Button>
              <Button size="sm" variant="ghost" onClick={() => mutations.setPeriodFlags(student.id, { takingThesisCourse: null })} disabled={isSubmitting}>
                Kosongkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Data Thesis — {student.fullName}</div>
      <DevToolsThesisTable studentId={student.id} studentName={student.fullName} onDeleteThesis={mutations.deleteThesis} isSubmitting={isSubmitting} />
    </div>
  );
}

export function DevToolsStudentPanel() {
  const mutations = useDevToolsMutations();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<DevToolsStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DevToolsStudent | null>(null);
  const [resetSnapshotTarget, setResetSnapshotTarget] = useState<DevToolsStudent | null>(null);
  const [resetProgressTarget, setResetProgressTarget] = useState<DevToolsStudent | null>(null);
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string } | null>(null);

  const effectiveStatus = statusFilter === 'all' ? '' : statusFilter;
  const { data: students, isLoading, isFetching, isPlaceholderData } = useDevToolsStudents(debouncedSearch, effectiveStatus);
  const toggleExpand = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), []);

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, NIM, atau email..."
            isSearching={isFetching && !isLoading}
          />
          <div className="flex-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter status mahasiswa"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua Status</SelectItem>
              {STUDENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-black/10">
          {isLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          : !students?.length ? <EmptyState title="Tidak Ada Data" description="Tidak ada mahasiswa ditemukan." size="sm" className="py-8" />
          : <Table className={cn('table-fixed', isPlaceholderData && STALE_RESULT_CLASS)}><TableHeader><TableRow>
            <TableHead className="w-10" /><TableHead>Nama / NIM</TableHead><TableHead className="w-32">Status</TableHead>
            <TableHead className="w-14 text-center">SKS</TableHead><TableHead className="w-14 text-center">Sem</TableHead>
            <TableHead className="w-36">Metode Penelitian</TableHead><TableHead className="w-36">Tugas Akhir (KRS)</TableHead><TableHead className="w-40">Tugas Akhir</TableHead>
            <TableHead className="w-44 text-right">Aksi</TableHead>
          </TableRow></TableHeader><TableBody>
            {students.map((s) => {
              const isExpanded = expandedId === s.id;
              return [
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(s.id)}>
                  <TableCell className="text-center">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                  <TableCell>
                    <TruncatedText text={s.fullName} className="font-medium text-sm" />
                    <div className="text-xs text-muted-foreground">{s.identityNumber}</div>
                  </TableCell>
                  <TableCell><StudentStatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-center text-sm">{s.sksCompleted}</TableCell>
                  <TableCell className="text-center text-sm">{s.currentSemester ?? '-'}</TableCell>
                  <TableCell><ResearchMethodFlagBadge value={s.periodFlags.eligibleResearchMethod} /></TableCell>
                  <TableCell><ThesisCourseFlagBadge value={s.periodFlags.takingThesisCourse} /></TableCell>
                  <TableCell>
                    {s.latestThesis ? <ThesisStatusBadge status={s.latestThesis.status} /> : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditStudent(s)} title="Edit" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPwTarget({ id: s.id, name: `${s.fullName} (${s.identityNumber})` })} title="Ubah Password" aria-label="Ubah Password"><KeyRound className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setResetSnapshotTarget(s)} title="Reset Snapshot Akademik" aria-label="Reset Snapshot Akademik"><RotateCcw className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700" onClick={() => setResetProgressTarget(s)} title="Reset Progress SIMPTA" aria-label="Reset Progress SIMPTA"><AlertTriangle className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)} title="Hapus" aria-label="Hapus"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>,
                isExpanded && (
                  <TableRow key={`${s.id}-detail`}><TableCell colSpan={COLUMN_COUNT} className="bg-muted/30 px-6 py-4 whitespace-normal">
                    <StudentDetail student={s} mutations={mutations} />
                  </TableCell></TableRow>
                ),
              ];
            })}
          </TableBody></Table>}
        </div>
        {!isLoading && !!students?.length && (
          <p className="text-xs text-muted-foreground">Menampilkan {students.length} mahasiswa (maksimal 100; gunakan pencarian untuk mempersempit). Klik baris untuk melihat rincian.</p>
        )}
      </CardContent>

      <DevToolsEditStudentDialog student={editStudent} open={!!editStudent} onOpenChange={(o) => { if (!o) setEditStudent(null); }}
        onSave={mutations.updateStudent} isSubmitting={mutations.isSubmitting} />
      <DevToolsPasswordDialog userId={pwTarget?.id ?? null} userName={pwTarget?.name ?? ''} open={!!pwTarget}
        onOpenChange={(o) => { if (!o) setPwTarget(null); }} onSave={mutations.changePassword} isSubmitting={mutations.isSubmitting} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle>
          <AlertDialogDescription>User <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.identityNumber}) akan dihapus. Untuk mahasiswa, backend akan membersihkan progress SIMPTA dan resync kuota terlebih dahulu. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={mutations.isSubmitting}
              onClick={async () => { if (deleteTarget) { await mutations.deleteUser(deleteTarget.id); setDeleteTarget(null); if (expandedId === deleteTarget.id) setExpandedId(null); } }}>
              {mutations.isSubmitting ? 'Menghapus...' : 'Hapus Permanen'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetSnapshotTarget} onOpenChange={() => setResetSnapshotTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset Snapshot Akademik?</AlertDialogTitle>
          <AlertDialogDescription>Data <strong>{resetSnapshotTarget?.fullName}</strong> akan direset ke kondisi awal: SKS=0, Semester=1, semua flag=false, status=active, dan flag SIA per semester (Metode Penelitian/Tugas Akhir) dikosongkan. Riwayat pengajuan, thesis, nilai, dan kuota tidak dihapus.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={mutations.isSubmitting} onClick={async () => { if (resetSnapshotTarget) { await mutations.resetStudent(resetSnapshotTarget.id); setResetSnapshotTarget(null); } }}>
              {mutations.isSubmitting ? 'Mereset...' : 'Reset Snapshot'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetProgressTarget} onOpenChange={() => setResetProgressTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset Progress SIMPTA?</AlertDialogTitle>
          <AlertDialogDescription>Progress SIMPTA <strong>{resetProgressTarget?.fullName}</strong> akan dihapus: draf dan riwayat Pengajuan Pembimbing, tugas akhir beserta proposal dan bimbingannya, pembimbing, keanggotaan Penetapan Pembimbing, Penilaian Proposal, serta tautan presensi. Snapshot akademik juga direset dan kuota dosen akan dihitung ulang. User tetap ada. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={mutations.isSubmitting} onClick={async () => { if (resetProgressTarget) { await mutations.resetStudentProgress(resetProgressTarget.id); setResetProgressTarget(null); if (expandedId === resetProgressTarget.id) setExpandedId(null); } }}>
              {mutations.isSubmitting ? 'Mereset...' : 'Reset Progress'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
