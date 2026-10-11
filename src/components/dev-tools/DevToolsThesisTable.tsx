import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import {
  useDevToolsAcademicYears,
  useDevToolsMutations,
  useDevToolsTheses,
} from '@/hooks/dev-tools/useDevTools';
import { TruncatedText } from './DevToolsShared';

/** Thesis records of one student, shown inside the expanded student row. */
export function DevToolsThesisTable({ studentId, studentName, onDeleteThesis, isSubmitting }: {
  studentId: string; studentName: string; onDeleteThesis: (id: string) => Promise<unknown>; isSubmitting: boolean;
}) {
  const { data: theses, isLoading } = useDevToolsTheses(studentId);
  const { data: years } = useDevToolsAcademicYears();
  const mutations = useDevToolsMutations();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  if (isLoading) return <div className="flex justify-center py-4"><Spinner className="h-5 w-5" /></div>;
  if (!theses?.length) return <p className="text-sm text-muted-foreground py-2">Tidak ada data thesis.</p>;
  return (
    <>
      <Table className="table-fixed">
        <TableHeader><TableRow>
          <TableHead>Judul</TableHead><TableHead className="w-36">Status</TableHead>
          <TableHead className="w-52">Tahun ajaran</TableHead><TableHead>Pembimbing</TableHead>
          <TableHead className="w-16">Aksi</TableHead>
        </TableRow></TableHeader>
        <TableBody>{theses.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm"><TruncatedText text={t.title || '(tanpa judul)'} /></TableCell>
            <TableCell><ThesisStatusBadge status={t.status} /></TableCell>
            <TableCell>
              <Select
                value={t.academicYearId ?? ''}
                onValueChange={(id) => { void mutations.setThesisAcademicYear(t.id, id); }}
                disabled={isSubmitting || mutations.isSubmitting}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t.academicYearLabel || 'Pilih tahun'} /></SelectTrigger>
                <SelectContent>
                  {(years ?? []).map((year) => (
                    <SelectItem key={year.id} value={year.id}>{year.label}{year.isActive ? ' (Aktif)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-muted-foreground">Rakit skenario. Bukan perbaikan data hidup.</p>
            </TableCell>
            <TableCell className="text-sm">
              <TruncatedText text={t.supervisors.map((s) => `${s.lecturer.user.fullName} (${s.role.name})`).join(', ')} />
            </TableCell>
            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Hapus thesis" onClick={() => setConfirmId(t.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Thesis?</AlertDialogTitle>
          <AlertDialogDescription>Thesis milik {studentName} akan dihapus. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}
              onClick={async () => { if (confirmId) { await onDeleteThesis(confirmId); setConfirmId(null); } }}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
