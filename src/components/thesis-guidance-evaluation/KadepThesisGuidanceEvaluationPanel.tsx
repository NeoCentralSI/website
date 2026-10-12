import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Textarea } from '@/components/ui/textarea';
import { SearchField, STALE_RESULT_CLASS } from '@/components/shared/SearchField';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { useDecideEvaluation, useDepartmentEvaluations } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { toTitleCaseName } from '@/lib/text';
import { cn } from '@/lib/utils';
import { GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS, getGuidanceEvaluationRecommendationLabel } from '@/lib/thesisLabels';
import type { ThesisGuidanceEvaluation } from '@/types/thesis-guidance-evaluation.types';
import { ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

type Scope = 'pending' | 'history';
const PAGE_SIZE = 20;

/**
 * Ketua Departemen: guidance evaluations waiting for a decision, and the decided ones.
 * Approving applies the supervisor's recommendation; rejecting needs notes and changes nothing.
 */
export function KadepThesisGuidanceEvaluationPanel() {
  const [scope, setScope] = useState<Scope>('pending');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [dialog, setDialog] = useState<{ evaluation: ThesisGuidanceEvaluation; approve: boolean } | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { if (dialog) setNotes(''); }, [dialog]);

  const { data, isLoading, isFetching, isPlaceholderData } = useDepartmentEvaluations({ scope, search: debouncedSearch, page, pageSize: PAGE_SIZE });
  const decide = useDecideEvaluation();
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const notesMissing = !!dialog && !dialog.approve && !notes.trim();

  return (
    <Card className="p-4">
      <CardContent className="space-y-3 p-0">
        <LocalTabsNav
          tabs={[{ value: 'pending', label: 'Menunggu Keputusan' }, { value: 'history', label: 'Riwayat' }]}
          activeTab={scope}
          onTabChange={(value) => { setScope(value as Scope); setPage(1); }}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, NIM, atau judul..."
          isSearching={isFetching && !isLoading}
        />

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <EmptyState
            size="sm"
            title="Tidak Ada Data"
            description={scope === 'pending' ? 'Tidak ada evaluasi bimbingan yang menunggu keputusan.' : 'Belum ada evaluasi bimbingan yang diputuskan.'}
            className="py-8"
          />
        ) : (
          <div className={cn('space-y-4', isPlaceholderData && STALE_RESULT_CLASS)}>
            {rows.map((evaluation) => (
              <div key={evaluation.id} className="space-y-2">
                <p className="min-w-0 font-medium truncate" title={evaluation.student?.name ?? ''}>
                  {toTitleCaseName(evaluation.student?.name) || '-'}
                  <span className="font-normal text-muted-foreground"> · {evaluation.student?.identityNumber ?? '-'}</span>
                </p>
                <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{evaluation.thesisTitle || '(belum ada judul)'}</p>
                <ThesisGuidanceEvaluationSummary evaluation={evaluation} />
                {scope === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[evaluation.recommendation]}</span>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => setDialog({ evaluation, approve: false })}>Tolak</Button>
                    <Button size="sm" onClick={() => setDialog({ evaluation, approve: true })}>Setujui</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Halaman {page} dari {totalPages} · {data?.meta.total ?? 0} evaluasi</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya</Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) setDialog(null); }}>
        {dialog && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog.approve ? 'Setujui evaluasi?' : 'Tolak evaluasi?'}</DialogTitle>
              <DialogDescription>
                {dialog.approve
                  ? `Keputusan pembimbing "${getGuidanceEvaluationRecommendationLabel(dialog.evaluation.recommendation)}" untuk ${toTitleCaseName(dialog.evaluation.student?.name) || 'mahasiswa'} diterapkan. ${GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[dialog.evaluation.recommendation]}`
                  : 'Evaluasi ditolak tanpa akibat apa pun. Pembimbing dapat mengisi evaluasi baru.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="evaluation-decision-notes">{dialog.approve ? 'Catatan (opsional)' : 'Catatan penolakan'}</Label>
              <Textarea id="evaluation-decision-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
              {notesMissing && <p className="text-xs text-muted-foreground">Catatan penolakan wajib diisi.</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)} disabled={decide.isPending}>Batal</Button>
              <Button
                variant={dialog.approve ? 'default' : 'destructive'}
                disabled={decide.isPending || notesMissing}
                onClick={() =>
                  decide.mutate(
                    { evaluationId: dialog.evaluation.id, approve: dialog.approve, notes: notes.trim() || null },
                    { onSuccess: () => setDialog(null) },
                  )
                }
              >
                {decide.isPending && <Spinner className="mr-2 h-4 w-4" />}
                {dialog.approve ? 'Setujui' : 'Tolak'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
