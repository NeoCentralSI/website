import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { LecturerDefenceDetailLayout } from '@/components/sidang/LecturerDefenceDetailLayout';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loading, Spinner } from '@/components/ui/spinner';
import {
  useApproveDefenceRevision,
  useDefenceFinalizationData,
  useDefenceRevisionBoard,
  useFinalizeDefenceRevisions,
  useUnapproveDefenceRevision,
} from '@/hooks/defence';
import { toTitleCaseName } from '@/lib/text';
import { MessageSquareText, CheckCircle2, Undo2, Send, ChevronDown } from 'lucide-react';
import type { DefenceRevisionBoardItem } from '@/types/defence.types';

export default function LecturerDefenceDetailRevision() {
  const { defenceId } = useParams<{ defenceId: string }>();

  return (
    <LecturerDefenceDetailLayout>
      {(detail) => {
        if (detail.status !== 'passed_with_revision' || !detail.canOpenSupervisorFinalization || !defenceId) {
          return (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground text-sm">Anda tidak memiliki akses ke halaman revisi ini.</p>
            </div>
          );
        }

        return <RevisionContent defenceId={defenceId} />;
      }}
    </LecturerDefenceDetailLayout>
  );
}

function RevisionContent({ defenceId }: { defenceId: string }) {
  const {
    data: finalizationData,
    isLoading: isFinalLoading,
    isFetching: isFinalFetching,
    refetch: refetchFinalization,
  } = useDefenceFinalizationData(defenceId);
  const {
    data: revisionBoard,
    isLoading: isRevisionLoading,
    isFetching: isRevisionFetching,
    refetch: refetchRevisionBoard,
  } = useDefenceRevisionBoard(defenceId);

  const approveMutation = useApproveDefenceRevision();
  const unapproveMutation = useUnapproveDefenceRevision();
  const finalizeRevisionsMutation = useFinalizeDefenceRevisions();

  const [unapproveConfirmId, setUnapproveConfirmId] = useState<string | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const isLoading = isFinalLoading || isRevisionLoading;
  const isRefreshing = (isFinalFetching || isRevisionFetching) && !isLoading;

  const examinerNotes = useMemo(
    () => (finalizationData?.examiners ?? []).filter((e) => e.revisionNotes),
    [finalizationData]
  );

  const visibleItems = useMemo(
    () => (revisionBoard ?? []).filter((item) => item.studentSubmittedAt || item.isFinished),
    [revisionBoard]
  );

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return visibleItems;

    return visibleItems.filter(
      (item) =>
        item.description.toLowerCase().includes(term) ||
        (item.revisionAction || '').toLowerCase().includes(term)
    );
  }, [visibleItems, search]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const isRevisionFinalized = !!finalizationData?.defence?.revisionFinalizedAt;
  const canFinalizeRevisions =
    !isRevisionFinalized &&
    visibleItems.length > 0 &&
    visibleItems.every((item) => item.isFinished);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-280px)] items-center justify-center">
        <Loading size="lg" text="Memuat data revisi..." />
      </div>
    );
  }

  const handleUnapprove = () => {
    if (!unapproveConfirmId) return;
    unapproveMutation.mutate(
      { defenceId, revisionId: unapproveConfirmId },
      { onSuccess: () => setUnapproveConfirmId(null) }
    );
  };

  const handleFinalizeRevisions = () => {
    finalizeRevisionsMutation.mutate(
      { defenceId },
      { onSuccess: () => setFinalizeConfirmOpen(false) }
    );
  };

  const columns: Column<DefenceRevisionBoardItem>[] = [
    {
      key: 'examiner',
      header: 'Dosen Penguji',
      width: 140,
      render: (row) => <p className="font-medium text-sm">Penguji {row.examinerOrder ?? '-'}</p>,
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
      render: (row) => {
        if (row.isFinished) {
          return (
            <Badge variant="success" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Disetujui
            </Badge>
          );
        }

        return (
          <Badge variant="default" className="text-xs gap-1">
            <Send className="h-3 w-3" /> Diajukan
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 140,
      className: 'text-right',
      render: (row) => {
        const isApproved = row.isFinished;
        const isSubmitted = !!row.studentSubmittedAt && !row.isFinished;

        return (
          <div className="flex items-center justify-end gap-1">
            {isSubmitted && (
              <Button
                size="sm"
                onClick={() => approveMutation.mutate({ defenceId, revisionId: row.id })}
                disabled={approveMutation.isPending}
                className="h-7 px-2 text-xs"
              >
                {approveMutation.isPending ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Setujui
                  </>
                )}
              </Button>
            )}

            {isApproved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUnapproveConfirmId(row.id)}
                className="h-7 px-2 text-xs"
              >
                <Undo2 className="h-3 w-3 mr-1" /> Batalkan
              </Button>
            )}
          </div>
        );
      },
    },
  ];

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
            {examinerNotes.map((examiner) => (
              <ExaminerNoteCollapsible key={examiner.id} examiner={examiner} />
            ))}
          </CardContent>
        </Card>
      )}

      <CustomTable
        columns={columns}
        data={paginatedItems}
        isRefreshing={isRefreshing}
        total={filteredItems.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Belum ada revisi yang diajukan mahasiswa"
        rowKey={(row) => row.id}
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={() => {
                void refetchFinalization();
                void refetchRevisionBoard();
              }}
              isRefreshing={isRefreshing}
            />

            {isRevisionFinalized ? (
              <Badge variant="success" className="text-xs">
                Revisi Sudah Difinalisasi
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => setFinalizeConfirmOpen(true)}
                disabled={!canFinalizeRevisions || finalizeRevisionsMutation.isPending}
              >
                {finalizeRevisionsMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" /> Memfinalisasi...
                  </>
                ) : (
                  'Selesaikan Revisi'
                )}
              </Button>
            )}
          </div>
        }
      />

      <AlertDialog open={finalizeConfirmOpen} onOpenChange={setFinalizeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Revisi Mahasiswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Konfirmasi ini menandai revisi mahasiswa sudah final dan akan menyimpan waktu finalisasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizeRevisions}
              disabled={!canFinalizeRevisions || finalizeRevisionsMutation.isPending}
            >
              {finalizeRevisionsMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Memproses...
                </>
              ) : (
                'Ya, Finalisasi'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unapproveConfirmId} onOpenChange={(open) => !open && setUnapproveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Persetujuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Status revisi akan kembali ke &quot;Diajukan&quot; dan mahasiswa perlu menunggu persetujuan ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnapprove} disabled={unapproveMutation.isPending}>
              {unapproveMutation.isPending ? (
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

function ExaminerNoteCollapsible({
  examiner,
}: {
  examiner: { id: string; order: number; lecturerName: string; revisionNotes: string | null };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-3 rounded-md border text-sm hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Penguji {examiner.order}</span>
            <span className="text-muted-foreground">- {toTitleCaseName(examiner.lecturerName)}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
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
