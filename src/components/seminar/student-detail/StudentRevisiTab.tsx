import { useState, useMemo } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  Send,
  Undo2,
  Plus,
  MessageSquareText,
  Pencil,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateRevision,
  useSaveRevisionAction,
  useSubmitRevision,
  useCancelRevisionSubmission,
} from '@/hooks/seminar';
import { toTitleCaseName } from '@/lib/text';
import type {
  StudentSeminarDetailResponse,
  StudentRevisionItem,
} from '@/types/seminar.types';

interface StudentRevisiTabProps {
  detail: StudentSeminarDetailResponse;
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

export function StudentRevisiTab({ detail }: StudentRevisiTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Create form state
  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Mutations
  const createMutation = useCreateRevision();
  const saveMutation = useSaveRevisionAction();
  const submitMutation = useSubmitRevision();
  const cancelMutation = useCancelRevisionSubmission();

  const revisions = detail.revisions;
  const examinerNotes = detail.examinerNotes;
  const summary = detail.revisionSummary;

  // Filtered + paginated data
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

  // Handlers
  const handleCreate = () => {
    if (!selectedExaminerId || !newDescription.trim()) return;
    createMutation.mutate(
      { seminarExaminerId: selectedExaminerId, description: newDescription.trim() },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setSelectedExaminerId('');
          setNewDescription('');
        },
      }
    );
  };

  const handleSave = (revisionId: string) => {
    if (!editText.trim()) return;
    saveMutation.mutate(
      { revisionId, payload: { revisionAction: editText.trim() } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditText('');
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!submitConfirmId) return;
    submitMutation.mutate(submitConfirmId, {
      onSuccess: () => setSubmitConfirmId(null),
    });
  };

  const handleCancelSubmission = () => {
    if (!cancelConfirmId) return;
    cancelMutation.mutate(cancelConfirmId, {
      onSuccess: () => setCancelConfirmId(null),
    });
  };

  // Table columns
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
        render: (row) => {
          const isEditing = editingId === row.id;
          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Tulis perbaikan..."
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave(row.id)}
                  disabled={saveMutation.isPending}
                  className="h-8 px-2 shrink-0"
                >
                  {saveMutation.isPending ? <Spinner className="h-3 w-3" /> : 'Simpan'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingId(null); setEditText(''); }}
                  className="h-8 px-2 shrink-0"
                >
                  Batal
                </Button>
              </div>
            );
          }
          return (
            <p className="text-sm whitespace-pre-wrap break-words max-w-[200px] text-muted-foreground">
              {row.revisionAction || '-'}
            </p>
          );
        },
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
        width: 160,
        className: 'text-right',
        render: (row) => {
          const status = getRevisionStatus(row);
          return (
            <div className="flex items-center justify-end gap-1">
              {status === 'diproses' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(row.id); setEditText(row.revisionAction || ''); }}
                    className="h-7 px-2 text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Perbaikan
                  </Button>
                  {row.revisionAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSubmitConfirmId(row.id)}
                      className="h-7 px-2 text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" /> Ajukan
                    </Button>
                  )}
                </>
              )}
              {status === 'diajukan' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelConfirmId(row.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Undo2 className="h-3 w-3 mr-1" /> Batalkan
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingId, editText, saveMutation.isPending]
  );

  return (
    <div className="space-y-4">
      {/* Examiner Notes (Collapsible) */}
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

      {/* Revision Table */}
      <CustomTable
        columns={columns}
        data={paginatedData}
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
          </div>
        }
      />

      {/* Create Revision Dialog */}
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
                  {detail.examiners.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      Penguji {ex.order} — {toTitleCaseName(ex.lecturerName)}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedExaminerId || !newDescription.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
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

      {/* Submit Confirmation */}
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

      {/* Cancel Submission Confirmation */}
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
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

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
            <span className="text-muted-foreground">— {toTitleCaseName(note.lecturerName)}</span>
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
