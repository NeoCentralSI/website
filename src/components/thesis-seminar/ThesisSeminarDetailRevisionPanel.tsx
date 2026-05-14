import { useMemo, useState } from 'react'; // Re-trigger compile
import { useRole, useAuth } from '@/hooks/shared';
import {
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Spinner, Loading } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateRevision,
  useSaveRevisionAction,
  useSubmitRevision,
  useDeleteRevision,
  useSeminarRevisionBoard,
  useApproveRevision,
  useUnapproveRevision,
  useFinalizeSeminarRevisions,
  useUnfinalizeSeminarRevisions,
  useCancelRevisionSubmission,
} from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';

interface Props {
  seminarId: string;
  detail: any;
  onRefresh: () => Promise<unknown> | unknown;
  isRefreshing?: boolean;
}

export function ThesisSeminarDetailRevisionPanel({ seminarId, detail, onRefresh, isRefreshing }: Props) {
  const { user } = useAuth();
  const { isStudent } = useRole();

  const _isStudent = isStudent() && !!user?.student?.id && (detail?.student?.id === user?.student?.id || detail?.student?.nim === user?.identityNumber);
  const _isSupervisor = !!user?.lecturer?.id && detail?.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);

  const showSupervisorActions = _isSupervisor;
  const showStudentActions = _isStudent;

  return (
    <div className="space-y-6">
      {/* 1. Catatan Penguji (Dari Rekap Penilaian) */}
      <ExaminerNotesSection detail={detail} />

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

function ExaminerNotesSection({ detail }: { detail: any }) {
  const notes = detail?.examinerNotes || [];
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  if (notes.length === 0) return null;

  return (
    <div className="space-y-3">
      {notes.map((note: any, idx: number) => {
        const isExpanded = expandedNotes[idx] ?? false;
        return (
          <Collapsible
            key={idx}
            open={isExpanded}
            onOpenChange={(open) => setExpandedNotes(prev => ({ ...prev, [idx]: open }))}
          >
            <Card className="bg-muted/10">
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    Catatan — Penguji {note.examinerOrder} ({toTitleCaseName(note.lecturerName)})
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="py-4 px-5 text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                  {note.revisionNotes?.trim() || 'Tidak ada catatan.'}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
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

  const isRevisionFinalized = !!detail?.revisionFinalizedAt || !!(board as any)?.isFinalized;
  const createMutation = useCreateRevision();
  const saveMutation = useSaveRevisionAction();
  const submitMutation = useSubmitRevision();
  const deleteMutation = useDeleteRevision();
  const approveMutation = useApproveRevision();
  const unapproveMutation = useUnapproveRevision();
  const finalizeRevisionsMutation = useFinalizeSeminarRevisions();
  const unfinalizeRevisionsMutation = useUnfinalizeSeminarRevisions();
  const cancelSubmitMutation = useCancelRevisionSubmission();

  // Local State
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [unapproveConfirmId, setUnapproveConfirmId] = useState<string | null>(null);
  const [cancelSubmitConfirmId, setCancelSubmitConfirmId] = useState<string | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [unfinalizeConfirmOpen, setUnfinalizeConfirmOpen] = useState(false);

  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRevisionAction, setNewRevisionAction] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRevisionAction, setEditRevisionAction] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const revisions: any[] = Array.isArray(board) ? board : (board as any)?.revisions || [];

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
    pendingApproval: revisions.filter((r: any) => r.studentSubmittedAt && !r.isFinished).length,
  };

  const hasSubmittedItems = revisions.some(r => r.studentSubmittedAt || r.isFinished);
  const allSubmittedApproved = revisions.every(r => !r.studentSubmittedAt || r.isFinished);
  const canFinalizeBoard = !isRevisionFinalized && revisions.length > 0 && hasSubmittedItems && allSubmittedApproved;

  const handleCreate = async () => {
    if (!selectedExaminerId || !newDescription.trim()) return;
    await createMutation.mutateAsync({
      seminarId,
      payload: {
        seminarExaminerId: selectedExaminerId,
        description: newDescription.trim(),
        revisionAction: newRevisionAction.trim() || undefined,
      }
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
      seminarId,
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

  const handleUnfinalizeRevisions = async () => {
    await unfinalizeRevisionsMutation.mutateAsync({ seminarId });
    setUnfinalizeConfirmOpen(false);
    await onRefresh();
  };

  const columns = useMemo<Column<any>[]>(() => {
    // Calculate rowSpan for examiner column
    const examinerRowSpans = new Map<string, number>();
    filteredData.forEach((item, idx) => {
      const key = `${item.examinerOrder}-${item.examinerLecturerId}`;
      if (idx > 0) {
        const prev = filteredData[idx - 1];
        const prevKey = `${prev.examinerOrder}-${prev.examinerLecturerId}`;
        if (key === prevKey) return; // Skip
      }
      // Count subsequent matches
      let count = 1;
      for (let j = idx + 1; j < filteredData.length; j++) {
        const next = filteredData[j];
        if (`${next.examinerOrder}-${next.examinerLecturerId}` === key) {
          count++;
        } else {
          break;
        }
      }
      examinerRowSpans.set(`${idx}-${key}`, count);
    });

    return [
      {
        key: 'examiner',
        header: 'Dosen Penguji',
        width: 140,
        onCell: (row, index) => {
          const key = `${row.examinerOrder}-${row.examinerLecturerId}`;
          const span = examinerRowSpans.get(`${index}-${key}`);
          if (span === undefined) {
            return { className: 'hidden' };
          }
          return {
            rowSpan: span,
            className: 'align-middle font-semibold',
          };
        },
        render: (row, index) => {
          const key = `${row.examinerOrder}-${row.examinerLecturerId}`;
          const span = examinerRowSpans.get(`${index}-${key}`);
          if (span === undefined) return null;

          return (
            <div className="py-1">
              <p className="font-medium text-sm">Penguji {row.examinerOrder}</p>
              <p className="text-xs text-muted-foreground">{toTitleCaseName(row.examinerName)}</p>
            </div>
          );
        },
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
            {showStudentActions && !row.isFinished && !isRevisionFinalized && (
              <div className="flex items-center gap-1">
                {!row.studentSubmittedAt ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingId(row.id);
                      setEditDescription(row.description);
                      setEditRevisionAction(row.revisionAction || '');
                      setEditOpen(true);
                    }} className="h-8 w-8 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                    {row.revisionAction && (
                      <Button variant="ghost" size="icon" onClick={() => setSubmitConfirmId(row.id)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Ajukan"><Send className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(row.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setCancelSubmitConfirmId(row.id)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Batalkan Pengajuan"><RotateCcw className="h-4 w-4" /></Button>
                )}
              </div>
            )}
            {/* Supervisor Actions */}
            {showSupervisorActions && row.studentSubmittedAt && !row.isFinished && !isRevisionFinalized && (
              <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate({ seminarId, revisionId: row.id })} disabled={approveMutation.isPending} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Setujui">
                {approveMutation.isPending ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
            )}
            {showSupervisorActions && row.isFinished && !isRevisionFinalized && (
              <Button variant="ghost" size="icon" onClick={() => setUnapproveConfirmId(row.id)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Batalkan Persetujuan">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            {row.isFinished && isRevisionFinalized && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
        ),
      },
    ];
  }, [showStudentActions, showSupervisorActions, isRevisionFinalized, approveMutation, seminarId, filteredData]);

  if (isLoading) return <Loading size="lg" text="Memuat board revisi..." />;

  return (
    <div className="space-y-4">
      {showStudentActions && !isRevisionFinalized && revisions.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <MessageSquareText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 leading-relaxed">
            <p className="font-bold text-primary mb-1">Informasi Perbaikan</p>
            Daftar perbaikan di bawah ini telah dibuat secara otomatis berdasarkan catatan dari para penguji. 
            Silakan lengkapi kolom <b>"Perbaikan"</b> untuk setiap item, lalu klik ikon <b>"Ajukan"</b> (<Send className="h-3 w-3 inline" />) agar dapat diperiksa oleh Pembimbing.
          </div>
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
            {showStudentActions && (
              <Badge variant="outline" className="text-xs">{summary.finished}/{summary.total} selesai</Badge>
            )}

            {isRevisionFinalized && (
              <div className="flex flex-col items-end">
                <Badge variant="success" className="text-xs px-2 py-1">
                  <CheckCircle2 className="mr-1.5 h-3 w-3" /> Revisi Selesai
                </Badge>
              </div>
            )}

            {showStudentActions && !isRevisionFinalized && (
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            )}

            {showSupervisorActions && (
              <>
                {isRevisionFinalized ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => setUnfinalizeConfirmOpen(true)}
                    disabled={unfinalizeRevisionsMutation.isPending}
                  >
                    {unfinalizeRevisionsMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Batalkan Finalisasi
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={canFinalizeBoard ? "default" : "outline"}
                    onClick={() => setFinalizeConfirmOpen(true)}
                    disabled={!canFinalizeBoard || finalizeRevisionsMutation.isPending}
                  >
                    {finalizeRevisionsMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Selesaikan Revisi
                  </Button>
                )}
              </>
            )}

            <RefreshButton onClick={() => { refetch(); onRefresh(); }} isRefreshing={!!isRefreshing} />
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
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await submitMutation.mutateAsync({ seminarId, revisionId: submitConfirmId! }); setSubmitConfirmId(null); refetch(); onRefresh(); }}>Ajukan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Item Revisi?</AlertDialogTitle><AlertDialogDescription>Data akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => { await deleteMutation.mutateAsync({ seminarId, revisionId: deleteConfirmId! }); setDeleteConfirmId(null); refetch(); onRefresh(); }}>Hapus</AlertDialogAction></AlertDialogFooter>
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
          <AlertDialogHeader><AlertDialogTitle>Batalkan Persetujuan?</AlertDialogTitle><AlertDialogDescription>Status item revisi ini akan kembali menjadi "Diajukan".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await unapproveMutation.mutateAsync({ seminarId, revisionId: unapproveConfirmId! }); setUnapproveConfirmId(null); refetch(); onRefresh(); }}>Ya, Batalkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelSubmitConfirmId} onOpenChange={open => !open && setCancelSubmitConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Batalkan Pengajuan?</AlertDialogTitle><AlertDialogDescription>Status akan kembali menjadi "Diproses" dan Anda dapat mengeditnya kembali.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await cancelSubmitMutation.mutateAsync({ seminarId, revisionId: cancelSubmitConfirmId! }); setCancelSubmitConfirmId(null); refetch(); onRefresh(); }}>Ya, Batalkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unfinalizeConfirmOpen} onOpenChange={setUnfinalizeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Batal Finalisasi Revisi?</AlertDialogTitle><AlertDialogDescription>Anda akan dapat mengubah status persetujuan item revisi kembali.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleUnfinalizeRevisions}>Ya, Batalkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
