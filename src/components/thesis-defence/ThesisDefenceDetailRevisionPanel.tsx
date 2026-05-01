import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';

import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loading, Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCancelDefenceRevisionSubmit,
  useCreateDefenceRevision,
  useDeleteDefenceRevision,
  useSaveDefenceRevisionAction,
  useSubmitDefenceRevisionAction,
  useApproveDefenceRevision,
  useUnapproveDefenceRevision,
  useFinalizeDefenceRevisions,
  useDefenceRevisionBoard,
} from '@/hooks/thesis-defence';
import { useAuth, useRole } from '@/hooks/shared';
import { toTitleCaseName } from '@/lib/text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ThesisDefenceDetailRevisionPanelProps {
  defenceId: string;
  detail: any;
  onRefresh: () => Promise<unknown> | unknown;
  isRefreshing?: boolean;
}

type RevisionStatus = 'diproses' | 'diajukan' | 'disetujui';

function getRevisionStatus(revision: any): RevisionStatus {
  if (revision.isFinished) return 'disetujui';
  if (revision.studentSubmittedAt) return 'diajukan';
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

export function ThesisDefenceDetailRevisionPanel({
  defenceId,
  detail,
  onRefresh,
  isRefreshing: isParentRefreshing,
}: ThesisDefenceDetailRevisionPanelProps) {
  const { user } = useAuth();
  const { isStudent } = useRole();

  // Role detection
  const _isStudent = isStudent() && (detail.student?.id === user?.student?.id || detail.student?.nim === user?.identityNumber);
  const _isSupervisor = !!user?.lecturer?.id && detail.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);

  // Data fetching
  const { data: board, isLoading, isFetching, refetch } = useDefenceRevisionBoard(defenceId);
  const isRefreshing = isParentRefreshing || isFetching;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);

  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRevisionAction, setNewRevisionAction] = useState('');

  const [editDescription, setEditDescription] = useState('');
  const [editRevisionAction, setEditRevisionAction] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const createMutation = useCreateDefenceRevision(defenceId);
  const saveMutation = useSaveDefenceRevisionAction(defenceId);
  const submitMutation = useSubmitDefenceRevisionAction(defenceId);
  const cancelMutation = useCancelDefenceRevisionSubmit(defenceId);
  const deleteMutation = useDeleteDefenceRevision(defenceId);
  const approveMutation = useApproveDefenceRevision();
  const unapproveMutation = useUnapproveDefenceRevision();
  const finalizeMutation = useFinalizeDefenceRevisions();

  const revisions = (board as any)?.revisions || [];
  const isFinalized = (board as any)?.isFinalized || !!detail.revisionFinalizedAt;

  const summary = useMemo(() => {
    const total = revisions.length;
    const finished = revisions.filter((item: any) => item.isFinished).length;
    return { total, finished };
  }, [revisions]);

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    const visibleItems = _isStudent ? revisions : revisions.filter((r: any) => r.studentSubmittedAt || r.isFinished);
    
    if (!term) return visibleItems;

    return visibleItems.filter(
      (r: any) =>
        r.description.toLowerCase().includes(term) ||
        (r.examinerName || '').toLowerCase().includes(term) ||
        (r.revisionAction || '').toLowerCase().includes(term)
    );
  }, [revisions, search, _isStudent]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleCreate = async () => {
    if (!selectedExaminerId || !newDescription.trim()) return;

    await createMutation.mutateAsync({
      defenceExaminerId: selectedExaminerId,
      description: newDescription.trim(),
      revisionAction: newRevisionAction.trim() || undefined,
    });

    setCreateOpen(false);
    setSelectedExaminerId('');
    setNewDescription('');
    setNewRevisionAction('');
    refetch();
    await onRefresh();
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
    refetch();
    await onRefresh();
  };

  const handleFinalize = async () => {
    await finalizeMutation.mutateAsync({ defenceId });
    setFinalizeConfirmOpen(false);
    refetch();
    await onRefresh();
  };

  const columns = useMemo<Column<any>[]>(() => {
    // RowSpan calculation for examiner
    const examinerRowSpans = new Map<string, number>();
    filteredData.forEach((item, idx) => {
      const key = `${item.examinerOrder}-${item.examinerId}`;
      if (idx > 0) {
        const prev = filteredData[idx - 1];
        if (`${prev.examinerOrder}-${prev.examinerId}` === key) return;
      }
      let count = 1;
      for (let j = idx + 1; j < filteredData.length; j++) {
        const next = filteredData[j];
        if (`${next.examinerOrder}-${next.examinerId}` === key) count++;
        else break;
      }
      examinerRowSpans.set(`${idx}-${key}`, count);
    });

    return [
      {
        key: 'examiner',
        header: 'Dosen Penguji',
        width: 140,
        onCell: (row, index) => {
          const key = `${row.examinerOrder}-${row.examinerId}`;
          const span = examinerRowSpans.get(`${index}-${key}`);
          if (span === undefined) return { className: 'hidden' };
          return { rowSpan: span, className: 'align-middle font-semibold' };
        },
        render: (row, index) => {
          const key = `${row.examinerOrder}-${row.examinerId}`;
          const span = examinerRowSpans.get(`${index}-${key}`);
          if (span === undefined) return null;
          return (
            <div>
              <p className="font-medium text-sm">Penguji {row.examinerOrder}</p>
              <p className="text-xs text-muted-foreground">{toTitleCaseName(row.examinerName || '-')}</p>
            </div>
          );
        },
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
        key: 'actions',
        header: 'Aksi',
        width: 130,
        className: 'text-right',
        render: (row) => {
          const status = getRevisionStatus(row);

          return (
            <div className="flex items-center justify-end gap-1">
              {/* Student Actions */}
              {_isStudent && !row.isFinished && (
                <div className="flex items-center gap-1">
                  {status === 'diproses' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditDescription(row.description);
                          setEditRevisionAction(row.revisionAction || '');
                          setEditOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                </div>
              )}

              {/* Supervisor Actions */}
              {_isSupervisor && !isFinalized && (
                <div className="flex items-center gap-1">
                  {status === 'diajukan' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => approveMutation.mutate({ defenceId, revisionId: row.id })}
                      disabled={approveMutation.isPending}
                      className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                      title="Setujui"
                    >
                      {approveMutation.isPending ? <Spinner className="h-3 w-3" /> : <Check className="h-4 w-4" />}
                    </Button>
                  )}
                  {status === 'disetujui' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unapproveMutation.mutate({ defenceId, revisionId: row.id })}
                      disabled={unapproveMutation.isPending}
                      className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                      title="Batalkan Persetujuan"
                    >
                      {unapproveMutation.isPending ? <Spinner className="h-3 w-3" /> : <RotateCcw className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              )}

              {row.isFinished && isFinalized && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            </div>
          );
        },
      },
    ];
  }, [_isStudent, _isSupervisor, isFinalized, filteredData, defenceId, approveMutation, unapproveMutation]);

  if (isLoading) {
    return (
      <div className="flex h-52 items-center justify-center">
        <Loading size="lg" text="Memuat data revisi..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Catatan Penguji Collapsibles */}
      {detail.examinerNotes && detail.examinerNotes.length > 0 && (
        <div className="space-y-2">
          {detail.examinerNotes.map((note: any) => (
            <ExaminerNoteCollapsible key={note.examinerOrder} note={note} />
          ))}
        </div>
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
            {_isStudent && (
              <Badge variant="outline" className="text-xs">
                {summary.finished}/{summary.total} selesai
              </Badge>
            )}

            {isFinalized && (
              <Badge variant="success" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Revisi Selesai
              </Badge>
            )}

            <RefreshButton onClick={() => refetch()} isRefreshing={isFetching} />

            {_isStudent && !isFinalized && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            )}

            {_isSupervisor && !isFinalized && summary.finished > 0 && (
              <Button
                size="sm"
                onClick={() => setFinalizeConfirmOpen(true)}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Finalisasi Revisi
              </Button>
            )}
          </div>
        }
      />

      {/* Student Create/Edit Dialogs */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Revisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dosen Penguji</Label>
              <Select value={selectedExaminerId} onValueChange={setSelectedExaminerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dosen penguji" />
                </SelectTrigger>
                <SelectContent>
                  {detail.examiners?.map((ex: any) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      Penguji {ex.order} - {toTitleCaseName(ex.lecturerName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder="Isi perbaikan yang sudah Anda lakukan..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={!selectedExaminerId || !newDescription.trim() || createMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Revisi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Catatan Revisi</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label>Perbaikan Yang Dilakukan</Label><Textarea value={editRevisionAction} onChange={(e) => setEditRevisionAction(e.target.value)} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={!editDescription.trim() || saveMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modals */}
      <AlertDialog open={!!submitConfirmId} onOpenChange={(open) => !open && setSubmitConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan Perbaikan?</AlertDialogTitle>
            <AlertDialogDescription>Setelah diajukan, perbaikan akan menunggu persetujuan pembimbing.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await submitMutation.mutateAsync({ revisionId: submitConfirmId!, payload: { description: revisions.find((r:any) => r.id === submitConfirmId).description, revisionAction: revisions.find((r:any) => r.id === submitConfirmId).revisionAction } }); setSubmitConfirmId(null); refetch(); }}>Ajukan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={finalizeConfirmOpen} onOpenChange={setFinalizeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Revisi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menandai seluruh revisi selesai. Mahasiswa akan dapat melanjutkan ke tahap berikutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>Ya, Finalisasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Item Revisi?</AlertDialogTitle><AlertDialogDescription>Data akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => { await deleteMutation.mutateAsync(deleteConfirmId!); setDeleteConfirmId(null); refetch(); }}>Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelConfirmId} onOpenChange={(open) => !open && setCancelConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Batalkan Pengajuan?</AlertDialogTitle><AlertDialogDescription>Status akan kembali menjadi "Diproses".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await cancelMutation.mutateAsync(cancelConfirmId!); setCancelConfirmId(null); refetch(); }}>Ya, Batalkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExaminerNoteCollapsible({ note }: { note: any }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-3 rounded-md border text-sm hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Catatan Penguji {note.examinerOrder}</span>
            <span className="text-muted-foreground">- {toTitleCaseName(note.lecturerName)}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-2 border-x border-b rounded-b-md text-sm whitespace-pre-wrap leading-relaxed bg-muted/10">
          {note.revisionNotes || 'Tidak ada catatan khusus.'}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
