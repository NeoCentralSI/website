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
import { Loading, Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateRevision,
  useSaveRevisionAction,
  useSubmitRevision,
  useCancelRevisionSubmission,
  useDeleteRevision,
  useSeminarRevisionBoard,
  useSupervisorFinalizationData,
  useApproveRevision,
  useUnapproveRevision,
  useFinalizeSeminarRevisions,
} from '@/hooks/thesis-seminar';
import { useRole } from '@/hooks/shared/useRole';
import { toTitleCaseName } from '@/lib/text';
import type { StudentRevisionItem, SeminarRevisionBoardItem } from '@/types/seminar.types';

interface Props {
  seminarId: string;
  detail: any;
  onRefresh: () => Promise<unknown> | unknown;
  isRefreshing?: boolean;
}

export function ThesisSeminarDetailRevisionPanel({ seminarId, detail, onRefresh, isRefreshing }: Props) {
  const { isStudent, isDosen } = useRole();

  const showSupervisorActions = true;
  const showStudentActions = true;

  return (
    <div className="space-y-6">
      {/* 1. Catatan Penguji (Dari Rekap Penilaian) */}
      <ExaminerNotesSection seminarId={seminarId} />

      {/* 2. Board Revisi (Main Table) */}
      <RevisionBoardSection
        seminarId={seminarId}
        detail={detail}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        showStudentActions={showStudentActions}
        showSupervisorActions={showSupervisorActions}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 1: Catatan Penguji
// ──────────────────────────────────────────────────────────────

function ExaminerNotesSection({ seminarId }: { seminarId: string }) {
  const { data: finalizationData, isLoading } = useSupervisorFinalizationData(seminarId);

  const examinerNotes = useMemo(
    () => (finalizationData?.examiners ?? []).filter((e) => e.revisionNotes),
    [finalizationData],
  );

  if (isLoading) return <Loading size="sm" />;
  if (examinerNotes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquareText className="h-4 w-4" />
          Catatan Penguji dari Berita Acara
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {examinerNotes.map((examiner) => (
          <ExaminerNoteCollapsible key={examiner.id} examiner={examiner} />
        ))}
      </CardContent>
    </Card>
  );
}

function ExaminerNoteCollapsible({ examiner }: { examiner: any }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-3 rounded-md border text-sm hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Penguji {examiner.order}</span>
            <span className="text-muted-foreground">— {toTitleCaseName(examiner.lecturerName)}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-2 border-x border-b rounded-b-md text-sm whitespace-pre-wrap">
          {examiner.revisionNotes}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 2: Revision Board Section
// ──────────────────────────────────────────────────────────────

function RevisionBoardSection({
  seminarId,
  detail,
  onRefresh,
  isRefreshing,
  showStudentActions,
  showSupervisorActions,
}: {
  seminarId: string;
  detail: any;
  onRefresh: () => Promise<unknown> | unknown;
  isRefreshing?: boolean;
  showStudentActions: boolean;
  showSupervisorActions: boolean;
}) {
  const { data: board, isLoading, refetch } = useSeminarRevisionBoard(seminarId);
  const { data: finalizationData } = useSupervisorFinalizationData(seminarId);

  // Mutations
  const createMutation = useCreateRevision();
  const saveMutation = useSaveRevisionAction();
  const submitMutation = useSubmitRevision();
  const cancelMutation = useCancelRevisionSubmission();
  const deleteMutation = useDeleteRevision();
  const approveMutation = useApproveRevision();
  const unapproveMutation = useUnapproveRevision();
  const finalizeRevisionsMutation = useFinalizeSeminarRevisions();

  // Local State
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [unapproveConfirmId, setUnapproveConfirmId] = useState<string | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);

  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRevisionAction, setNewRevisionAction] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRevisionAction, setEditRevisionAction] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const revisions = Array.isArray(board) ? board : (board as any)?.revisions || [];
  const isRevisionFinalized = !!finalizationData?.seminar?.revisionFinalizedAt;

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    const visibleItems = showStudentActions ? revisions : revisions.filter(r => r.studentSubmittedAt || r.isFinished);
    if (!term) return visibleItems;
    return visibleItems.filter(
      (r) =>
        r.description.toLowerCase().includes(term) ||
        (r.revisionAction || '').toLowerCase().includes(term) ||
        (r.examinerName || '').toLowerCase().includes(term)
    );
  }, [revisions, search, showStudentActions]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const summary = (board as any)?.summary || {
    total: revisions.length,
    finished: revisions.filter((r: any) => r.isFinished).length,
  };

  const canFinalizeBoard = !isRevisionFinalized && summary.total > 0 && summary.total === summary.finished;

  const handleCreate = async () => {
    if (!selectedExaminerId || !newDescription.trim()) return;
    const created = await createMutation.mutateAsync({
      seminarExaminerId: selectedExaminerId,
      description: newDescription.trim(),
    });
    if (newRevisionAction.trim()) {
      await saveMutation.mutateAsync({
        revisionId: created.id,
        payload: { description: newDescription.trim(), revisionAction: newRevisionAction.trim() },
      });
    }
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
      payload: { description: editDescription.trim(), revisionAction: editRevisionAction.trim() || undefined },
    });
    setEditOpen(false);
    setEditingId(null);
    refetch();
    await onRefresh();
  };

  const handleFinalizeRevisions = async () => {
    await finalizeRevisionsMutation.mutateAsync({ seminarId });
    setFinalizeConfirmOpen(false);
    await onRefresh();
  };

  const columns = useMemo<Column<any>[]>(() => [
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
      render: (row) => <p className="text-sm whitespace-pre-wrap break-words max-w-[200px]">{row.description}</p>,
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
      render: (row) => {
        if (row.isFinished) return <Badge variant="success" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Disetujui</Badge>;
        if (row.studentSubmittedAt) return <Badge variant="default" className="text-xs gap-1"><Send className="h-3 w-3" /> Diajukan</Badge>;
        return <Badge variant="warning" className="text-xs gap-1"><Clock className="h-3 w-3" /> Diproses</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 130,
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* Student Actions */}
          {showStudentActions && !row.studentSubmittedAt && !row.isFinished && (
            <>
              <Button variant="ghost" size="icon" onClick={() => {
                setEditingId(row.id);
                setEditDescription(row.description);
                setEditRevisionAction(row.revisionAction || '');
                setEditOpen(true);
              }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
              {row.revisionAction && (
                <Button variant="ghost" size="icon" onClick={() => setSubmitConfirmId(row.id)} className="h-8 w-8 text-emerald-600"><Send className="h-4 w-4" /></Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(row.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
          {showStudentActions && row.studentSubmittedAt && !row.isFinished && (
            <Button variant="ghost" size="icon" onClick={() => setCancelConfirmId(row.id)} className="h-8 w-8 text-amber-600"><Undo2 className="h-4 w-4" /></Button>
          )}

          {/* Supervisor Actions */}
          {showSupervisorActions && row.studentSubmittedAt && !row.isFinished && (
            <Button size="sm" onClick={() => approveMutation.mutate({ seminarId, revisionId: row.id })} disabled={approveMutation.isPending} className="h-7 px-2 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Setujui
            </Button>
          )}
          {showSupervisorActions && row.isFinished && !isRevisionFinalized && (
            <Button variant="outline" size="sm" onClick={() => setUnapproveConfirmId(row.id)} className="h-7 px-2 text-xs">
              <Undo2 className="h-3 w-3 mr-1" /> Batalkan
            </Button>
          )}
          
          {row.isFinished && isRevisionFinalized && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        </div>
      ),
    },
  ], [showStudentActions, showSupervisorActions, isRevisionFinalized, approveMutation, seminarId]);

  if (isLoading) return <Loading size="lg" text="Memuat board revisi..." />;

  return (
    <div className="space-y-4">
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
            <Badge variant="outline" className="text-xs">{summary.finished}/{summary.total} selesai</Badge>
            <RefreshButton onClick={() => { refetch(); onRefresh(); }} isRefreshing={!!isRefreshing} />
            
            {showStudentActions && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            )}

            {showSupervisorActions && (
              <Button
                size="sm"
                variant={canFinalizeBoard ? "default" : "outline"}
                onClick={() => setFinalizeConfirmOpen(true)}
                disabled={!canFinalizeBoard || isRevisionFinalized || finalizeRevisionsMutation.isPending}
              >
                {isRevisionFinalized ? 'Sudah Difinalisasi' : 'Selesaikan Revisi'}
              </Button>
            )}
          </div>
        }
      />

      {/* Dialogs & Alerts */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Item Revisi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dosen Penguji</Label>
              <select value={selectedExaminerId} onChange={(e) => setSelectedExaminerId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Pilih dosen penguji</option>
                {detail.examiners?.map((ex: any) => (
                  <option key={ex.id} value={ex.id}>Penguji {ex.order} - {toTitleCaseName(ex.lecturerName)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Revisi</Label>
              <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Tuliskan catatan revisi..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Perbaikan Yang Dilakukan</Label>
              <Textarea value={newRevisionAction} onChange={(e) => setNewRevisionAction(e.target.value)} placeholder="Isi perbaikan yang sudah dilakukan (opsional)..." rows={3} />
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
      <AlertDialog open={!!submitConfirmId} onOpenChange={open => !open && setSubmitConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ajukan Perbaikan?</AlertDialogTitle><AlertDialogDescription>Perbaikan akan menunggu persetujuan pembimbing.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await submitMutation.mutateAsync(submitConfirmId!); setSubmitConfirmId(null); refetch(); onRefresh(); }}>Ajukan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Item Revisi?</AlertDialogTitle><AlertDialogDescription>Data akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await deleteMutation.mutateAsync(deleteConfirmId!); setDeleteConfirmId(null); refetch(); onRefresh(); }}>Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={finalizeConfirmOpen} onOpenChange={setFinalizeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Finalisasi Revisi?</AlertDialogTitle><AlertDialogDescription>Menandai seluruh revisi selesai dan siap untuk sidang.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleFinalizeRevisions}>Ya, Finalisasi</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unapproveConfirmId} onOpenChange={open => !open && setUnapproveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Batalkan Persetujuan?</AlertDialogTitle><AlertDialogDescription>Status akan kembali ke diajukan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await unapproveMutation.mutateAsync({ seminarId, revisionId: unapproveConfirmId! }); setUnapproveConfirmId(null); refetch(); onRefresh(); }}>Ya, Batalkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
