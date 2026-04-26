import { useMemo, useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  Send,
  Undo2,
  Plus,
  MessageSquareText,
  Pencil,
  Trash2,
} from 'lucide-react';

import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateRevision,
  useSaveRevisionAction,
  useSubmitRevision,
  useCancelRevisionSubmission,
  useDeleteRevision,
} from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';
import type {
  StudentSeminarDetailResponse,
  StudentRevisionItem,
} from '@/types/seminar.types';

interface StudentRevisiTabProps {
  detail: StudentSeminarDetailResponse;
  onRefresh: () => Promise<unknown> | unknown;
  isRefreshing?: boolean;
}

type RevisionStatus = 'diproses' | 'diajukan' | 'disetujui';

function getRevisionStatus(rev: StudentRevisionItem): RevisionStatus {
  if (rev.isFinished) return 'disetujui';
  if (rev.studentSubmittedAt) return 'diajukan';
  return 'diproses';
}

function StatusBadge({ status }: { status: RevisionStatus }) {
  switch (status) {
    case 'disetujui':
      return (
        <Badge variant="success" className="text-xs gap-1">
          <CheckCircle2 className="h-3 w-3" /> Disetujui
        </Badge>
      );
    case 'diajukan':
      return (
        <Badge variant="default" className="text-xs gap-1">
          <Send className="h-3 w-3" /> Diajukan
        </Badge>
      );
    default:
      return (
        <Badge variant="warning" className="text-xs gap-1">
          <Clock className="h-3 w-3" /> Diproses
        </Badge>
      );
  }
}

export function StudentRevisiTab({ detail, onRefresh, isRefreshing }: StudentRevisiTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRevisionAction, setNewRevisionAction] = useState('');

  const [editDescription, setEditDescription] = useState('');
  const [editRevisionAction, setEditRevisionAction] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const createMutation = useCreateRevision();
  const saveMutation = useSaveRevisionAction();
  const submitMutation = useSubmitRevision();
  const cancelMutation = useCancelRevisionSubmission();
  const deleteMutation = useDeleteRevision();

  const revisions = detail.revisions;
  const examinerNotes = detail.examinerNotes;
  const summary = detail.revisionSummary;

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return revisions;
    return revisions.filter(
      (r) =>
        r.description.toLowerCase().includes(term) ||
        r.examinerName.toLowerCase().includes(term) ||
        (r.revisionAction || '').toLowerCase().includes(term)
    );
  }, [revisions, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleCreate = async () => {
    if (!selectedExaminerId || !newDescription.trim()) return;

    const created = await createMutation.mutateAsync({
      seminarExaminerId: selectedExaminerId,
      description: newDescription.trim(),
    });

    if (newRevisionAction.trim()) {
      await saveMutation.mutateAsync({
        revisionId: created.id,
        payload: {
          description: newDescription.trim(),
          revisionAction: newRevisionAction.trim(),
        },
      });
    }

    setCreateOpen(false);
    setSelectedExaminerId('');
    setNewDescription('');
    setNewRevisionAction('');
    await onRefresh();
  };

  const openEditModal = (row: StudentRevisionItem) => {
    setEditingId(row.id);
    setEditDescription(row.description || '');
    setEditRevisionAction(row.revisionAction || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDescription.trim()) return;

    await saveMutation.mutateAsync({
      revisionId: editingId,
      payload: {
        description: editDescription.trim(),
        revisionAction: editRevisionAction.trim() || undefined,
      },
    });

    setEditOpen(false);
    setEditingId(null);
    setEditDescription('');
    setEditRevisionAction('');
    await onRefresh();
  };

  const handleSubmit = async () => {
    if (!submitConfirmId) return;
    await submitMutation.mutateAsync(submitConfirmId);
    setSubmitConfirmId(null);
    await onRefresh();
  };

  const handleCancelSubmission = async () => {
    if (!cancelConfirmId) return;
    await cancelMutation.mutateAsync(cancelConfirmId);
    setCancelConfirmId(null);
    await onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteMutation.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
    await onRefresh();
  };

  const columns = useMemo<Column<StudentRevisionItem>[]>(
    () => [
      {
        key: 'examiner',
        header: 'Dosen Penguji',
        width: 140,
        render: (row) => (
          <div>
            <p className="font-medium text-sm">Penguji {row.examinerOrder}</p>
            <p className="text-xs text-muted-foreground">{toTitleCaseName(row.examinerName)}</p>
          </div>
        ),
      },
      {
        key: 'description',
        header: 'Catatan',
        render: (row) => (
          <p className="text-sm whitespace-pre-wrap break-words max-w-[200px]">{row.description}</p>
        ),
      },
      {
        key: 'revisionAction',
        header: 'Perbaikan',
        render: (row) => (
          <p className="text-sm whitespace-pre-wrap break-words max-w-[200px] text-muted-foreground">
            {row.revisionAction || '-'}
          </p>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 110,
        render: (row) => <StatusBadge status={getRevisionStatus(row)} />,
      },
      {
        key: 'approvedBy',
        header: 'Disetujui Oleh',
        width: 140,
        render: (row) => (
          <span className="text-sm">
            {row.approvedBySupervisorName ? toTitleCaseName(row.approvedBySupervisorName) : '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 130,
        className: 'text-right',
        render: (row) => {
          const status = getRevisionStatus(row);
          return (
            <div className="flex items-center justify-end gap-1">
              {status === 'diproses' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(row)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {row.revisionAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSubmitConfirmId(row.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                      title="Ajukan"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(row.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {status === 'diajukan' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCancelConfirmId(row.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                  title="Batalkan Pengajuan"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
              {status === 'disetujui' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Selesai
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {examinerNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              Catatan Penguji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {examinerNotes.map((note) => (
              <ExaminerNoteCollapsible key={note.examinerOrder} note={note} />
            ))}
          </CardContent>
        </Card>
      )}

      <CustomTable
        columns={columns}
        data={paginatedData}
        loading={isRefreshing && revisions.length === 0}
        isRefreshing={isRefreshing && revisions.length > 0}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Belum ada item revisi"
        rowKey={(row) => row.id}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {summary.finished}/{summary.total} selesai
            </Badge>
            <RefreshButton onClick={() => void onRefresh()} isRefreshing={!!isRefreshing} />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
          </div>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Revisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dosen Penguji</Label>
              <select
                value={selectedExaminerId}
                onChange={(event) => setSelectedExaminerId(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih dosen penguji</option>
                {detail.examiners.map((examiner) => (
                  <option key={examiner.id} value={examiner.id}>
                    Penguji {examiner.order} - {toTitleCaseName(examiner.lecturerName)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Revisi</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Tuliskan catatan revisi dari penguji..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Perbaikan Yang Dilakukan</Label>
              <Textarea
                value={newRevisionAction}
                onChange={(e) => setNewRevisionAction(e.target.value)}
                placeholder="Isi perbaikan yang sudah Anda lakukan (opsional)..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={!selectedExaminerId || !newDescription.trim() || createMutation.isPending || saveMutation.isPending}
            >
              {createMutation.isPending || saveMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Revisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Catatan Revisi</Label>
              <Textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Tuliskan catatan revisi..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Perbaikan Yang Dilakukan</Label>
              <Textarea
                value={editRevisionAction}
                onChange={(event) => setEditRevisionAction(event.target.value)}
                placeholder="Tuliskan perbaikan yang sudah Anda lakukan..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={!editDescription.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!submitConfirmId} onOpenChange={(open) => !open && setSubmitConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan Perbaikan?</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah diajukan, perbaikan akan menunggu persetujuan dari dosen pembimbing. Pastikan perbaikan sudah benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Mengajukan...
                </>
              ) : (
                'Ya, Ajukan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelConfirmId} onOpenChange={(open) => !open && setCancelConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Pengajuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Perbaikan akan kembali ke status &quot;Diproses&quot; dan Anda bisa mengedit ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubmission} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Membatalkan...
                </>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Revisi?</AlertDialogTitle>
            <AlertDialogDescription>
              Item revisi yang belum diajukan akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ExaminerNoteProps {
  note: { examinerOrder: number; lecturerName: string; revisionNotes: string };
}

function ExaminerNoteCollapsible({ note }: ExaminerNoteProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-3 rounded-md border text-sm hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Penguji {note.examinerOrder}</span>
            <span className="text-muted-foreground">- {toTitleCaseName(note.lecturerName)}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-2 border-x border-b rounded-b-md text-sm whitespace-pre-wrap">
          {note.revisionNotes}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
