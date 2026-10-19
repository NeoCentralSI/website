import { CheckSquare, Square } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import {
  GUIDANCE_EVALUATION_OBSERVATION_LABELS,
  GUIDANCE_EVALUATION_STATUS_VARIANTS,
  getGuidanceEvaluationRecommendationLabel,
  getGuidanceEvaluationStageLabel,
  getGuidanceEvaluationStatusLabel,
  type GuidanceEvaluationObservation,
} from '@/lib/thesisLabels';
import type { ThesisGuidanceEvaluation } from '@/types/thesis-guidance-evaluation.types';

const OBSERVATIONS = Object.keys(GUIDANCE_EVALUATION_OBSERVATION_LABELS) as GuidanceEvaluationObservation[];

/**
 * Status of an evaluation. "Lanjut Bimbingan" needs no decision, so it reads "Tercatat"
 * instead of "Disetujui". `short` (a table cell) keeps the badge on one line:
 * "Menunggu Kadep", with the full label as its tooltip.
 */
export function ThesisGuidanceEvaluationStatusBadge({ evaluation, short = false }: { evaluation: ThesisGuidanceEvaluation; short?: boolean }) {
  if (!evaluation.requiresKadep) return <Badge variant="success" className="whitespace-nowrap">Tercatat</Badge>;
  const label = getGuidanceEvaluationStatusLabel(evaluation.status);
  return (
    <Badge variant={GUIDANCE_EVALUATION_STATUS_VARIANTS[evaluation.status] ?? 'outline'} className="whitespace-nowrap" title={label}>
      {short && evaluation.status === 'pending' ? 'Menunggu Kadep' : label}
    </Badge>
  );
}

/** One evaluation as the form reads: basis, observations, the supervisor's decision, the department's decision. */
export function ThesisGuidanceEvaluationSummary({ evaluation }: { evaluation: ThesisGuidanceEvaluation }) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{getGuidanceEvaluationStageLabel(evaluation.stage)}</p>
        <ThesisGuidanceEvaluationStatusBadge evaluation={evaluation} />
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Keputusan pembimbing</dt>
          <dd className="font-medium">{getGuidanceEvaluationRecommendationLabel(evaluation.recommendation)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Diisi oleh</dt>
          <dd>{formatLecturerName(evaluation.supervisor?.name) || '-'} · {formatDateTimeWib(evaluation.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Jumlah pertemuan tercatat</dt>
          <dd>{evaluation.basis.guidanceCount} sesi selesai</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Masa bimbingan saat diisi</dt>
          <dd>{evaluation.basis.elapsedDays === null ? '-' : `${evaluation.basis.elapsedDays} hari`}</dd>
        </div>
      </dl>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Hasil observasi pembimbing</p>
        <ul className="space-y-1">
          {OBSERVATIONS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm">
              {evaluation.observations[key] ? (
                <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Ya" />
              ) : (
                <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Tidak" />
              )}
              <span className={evaluation.observations[key] ? '' : 'text-muted-foreground'}>{GUIDANCE_EVALUATION_OBSERVATION_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      </div>

      {evaluation.notes && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Keterangan</p>
          <p className="text-sm whitespace-pre-line [overflow-wrap:anywhere]">{evaluation.notes}</p>
        </div>
      )}

      {evaluation.extensionUntil && (
        <p className="text-sm">Batas perpanjangan: <span className="font-medium">{formatDateTimeWib(evaluation.extensionUntil)}</span></p>
      )}

      {evaluation.decision && (
        <p className="text-xs text-muted-foreground">
          {/* An evaluation closed because the thesis became Selesai has no decider. */}
          {evaluation.decision.closedBySystem
            ? 'Ditutup oleh sistem'
            : `Keputusan Ketua Departemen: ${formatLecturerName(evaluation.decision.by?.name) || '-'}`} · {formatDateTimeWib(evaluation.decision.at)}
          {evaluation.decision.notes ? ` · ${evaluation.decision.notes}` : ''}
        </p>
      )}
    </div>
  );
}
