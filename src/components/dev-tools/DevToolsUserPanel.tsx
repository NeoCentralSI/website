import { useState } from 'react';
import { KeyRound, Trash2, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
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
import { SearchField, STALE_RESULT_CLASS } from '@/components/shared/SearchField';
import { useDevToolsMutations, useDevToolsUsers } from '@/hooks/dev-tools/useDevTools';
import { SEARCH_DEBOUNCE_MS, useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { DevToolsCreateUserDialog } from './DevToolsCreateUserDialog';
import { DevToolsPasswordDialog } from './DevToolsPasswordDialog';
import { BoolIcon, TruncatedText } from './DevToolsShared';

export function DevToolsUserPanel() {
  const mutations = useDevToolsMutations();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: allUsers, isLoading: usersLoading, isFetching, isPlaceholderData } = useDevToolsUsers(debounced);

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Cari semua user (nama, NIM/NIP, email)..."
            isSearching={isFetching && !usersLoading}
          />
          <div className="flex-1" />
          <Button onClick={() => setCreateOpen(true)} size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Buat User Baru</Button>
        </div>

        <div className="rounded-md border border-black/10">
          {usersLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          : !allUsers?.length ? <EmptyState title="Tidak Ada Data" description="Tidak ada user ditemukan." size="sm" className="py-8" />
          : <Table className={cn('table-fixed', isPlaceholderData && STALE_RESULT_CLASS)}><TableHeader><TableRow>
            <TableHead>Nama</TableHead><TableHead className="w-40">NIM/NIP</TableHead><TableHead className="w-20">Tipe</TableHead><TableHead>Email</TableHead>
            <TableHead>Roles</TableHead><TableHead className="w-20 text-center">Verified</TableHead><TableHead className="w-24 text-right">Aksi</TableHead>
          </TableRow></TableHeader><TableBody>
            {allUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-sm"><TruncatedText text={u.fullName} /></TableCell>
                <TableCell className="text-sm"><TruncatedText text={u.identityNumber} /></TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{u.identityType}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground"><TruncatedText text={u.email} /></TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{u.roles.map((r, i) => <Badge key={i} variant="secondary" className="text-xs">{r.name}</Badge>)}</div></TableCell>
                <TableCell><div className="flex justify-center"><BoolIcon value={u.isVerified} /></div></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Ubah Password" aria-label="Ubah Password" onClick={() => setPwTarget({ id: u.id, name: `${u.fullName} (${u.identityNumber})` })}><KeyRound className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Hapus" aria-label="Hapus"
                      onClick={() => setDeleteId({ id: u.id, name: u.fullName })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>}
        </div>
        {!usersLoading && !!allUsers?.length && (
          <p className="text-xs text-muted-foreground">Menampilkan {allUsers.length} user (maksimal 100; gunakan pencarian untuk mempersempit).</p>
        )}
      </CardContent>

      <DevToolsPasswordDialog userId={pwTarget?.id ?? null} userName={pwTarget?.name ?? ''} open={!!pwTarget}
        onOpenChange={(o) => { if (!o) setPwTarget(null); }} onSave={mutations.changePassword} isSubmitting={mutations.isSubmitting} />
      <DevToolsCreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onSave={mutations.createUser} isSubmitting={mutations.isSubmitting} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle>
          <AlertDialogDescription>User <strong>{deleteId?.name}</strong> akan dihapus. Jika user ini mahasiswa, progress SIMPTA akan dibersihkan otomatis sebelum user dihapus.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={mutations.isSubmitting}
              onClick={async () => { if (deleteId) { await mutations.deleteUser(deleteId.id); setDeleteId(null); } }}>
              {mutations.isSubmitting ? 'Menghapus...' : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
