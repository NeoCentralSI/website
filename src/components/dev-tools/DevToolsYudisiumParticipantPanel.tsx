import { useMemo, useState } from 'react';
import { Check, CheckCheck, ClipboardCheck, ClipboardX, FilePlus2, FileCheck2, FileX2, Save, Trash2, UserPlus, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDevToolsMutations, useDevToolsStudentYudisium, useDevToolsYudisiumPeriods } from '@/hooks/dev-tools/useDevTools';
import { devToolsService } from '@/services/devTools.service';
import type { DevToolsCplRow, DevToolsParticipantStatus, DevToolsStudentYudisium, DevToolsYudisiumParticipant } from '@/types/devTools.types';
import {
  DevToolsEffectsDialog,
  DevToolsStudentPicker,
  PARTICIPANT_STATUS_LABELS,
  type PendingAction,
  type PickedStudent,
} from './DevToolsFinalStagesShared';
import { PERIOD_STATUS_LABELS } from './DevToolsYudisiumPeriodPanel';
import { BoolIcon, TruncatedText } from './DevToolsShared';

const PARTICIPANT_TARGETS = Object.keys(PARTICIPANT_STATUS_LABELS) as DevToolsParticipantStatus[];
const ITEM_STATUS: Record<string, { label: string; variant: 'outline' | 'success' | 'destructive' | 'warning' }> = {
  submitted: { label: 'Menunggu verifikasi', variant: 'warning' },
  approved: { label: 'Terverifikasi', variant: 'success' },
  declined: { label: 'Ditolak', variant: 'destructive' },
};
const CPL_STATUS: Record<string, string> = { calculated: 'Belum divalidasi', validated: 'Tervalidasi', finalized: 'Final' };

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label} onClick={onClick} disabled={disabled}>{children}</Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** DevTools tab "Peserta Yudisium": registration, participant status, requirement items, exit survey, and CPL. */
export function DevToolsYudisiumParticipantPanel() {
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const { data, isLoading } = useDevToolsStudentYudisium(student?.id ?? null);
  const mutations = useDevToolsMutations();
  const [pending, setPending] = useState<PendingAction | null>(null);

  return (
    <div className="space-y-4">
      <DevToolsStudentPicker value={student} onChange={setStudent} />
      {!student && <EmptyState title="Pilih Mahasiswa" description="Cari nama atau NIM untuk melihat yudisium dan CPL-nya" size="sm" />}
      {student && isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" />Memuat</div>}
      {student && data && (
        <>
          <AcademicSummary data={data} />
          <RegisterCard data={data} mutations={mutations} onAction={setPending} />
          {data.participants.map((participant) => (
            <ParticipantCard key={participant.id} participant={participant} studentName={data.student.fullName} mutations={mutations} onAction={setPending} />
          ))}
          <CplTable data={data} mutations={mutations} />
        </>
      )}
      <DevToolsEffectsDialog action={pending} onClose={() => setPending(null)} isSubmitting={mutations.isSubmitting} />
    </div>
  );
}

function AcademicSummary({ data }: { data: DevToolsStudentYudisium }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <span className="flex items-center gap-1.5"><BoolIcon value={data.academic.defencePassed} />Lulus sidang (revisi final)</span>
      <span className="flex items-center gap-1.5"><BoolIcon value={data.academic.sksMet} />146 SKS ({data.student.sksCompleted})</span>
      <span className="flex items-center gap-1.5"><BoolIcon value={data.academic.coursesMet} />Mata kuliah wajib, MKWU, KP, KKN</span>
    </div>
  );
}

function RegisterCard({ data, mutations, onAction }: { data: DevToolsStudentYudisium; mutations: ReturnType<typeof useDevToolsMutations>; onAction: (a: PendingAction) => void }) {
  const { data: periods } = useDevToolsYudisiumPeriods();
  const joined = new Set(data.participants.map((p) => p.period.id));
  const options = (periods ?? []).filter((p) => !joined.has(p.id));
  const [periodId, setPeriodId] = useState('');
  const chosen = options.find((p) => p.id === periodId) ?? null;
  const reason = !data.academic.defencePassed ? 'Mahasiswa belum lulus sidang atau revisi sidangnya belum final' : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={periodId} onValueChange={setPeriodId}>
        <SelectTrigger className="h-9 w-[320px]" aria-label="Periode yudisium"><SelectValue placeholder="Pilih periode untuk didaftarkan" /></SelectTrigger>
        <SelectContent>
          {options.map((period) => <SelectItem key={period.id} value={period.id}>{period.name} · {PERIOD_STATUS_LABELS[period.status]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button size="sm" disabled={!chosen || !!reason || mutations.isSubmitting}
              onClick={() => chosen && onAction({
                title: 'Daftarkan ke periode yudisium',
                description: `${data.student.fullName} → ${chosen.name}`,
                confirmLabel: 'Daftarkan',
                preview: () => devToolsService.previewRegisterYudisium(data.student.id, chosen.id),
                run: () => mutations.registerYudisium(data.student.id, chosen.id),
              })}>
              <UserPlus className="mr-1.5 h-4 w-4" />Daftarkan
            </Button>
          </span>
        </TooltipTrigger>
        {reason && <TooltipContent>{reason}</TooltipContent>}
      </Tooltip>
    </div>
  );
}

function ParticipantCard({ participant, studentName, mutations, onAction }: {
  participant: DevToolsYudisiumParticipant;
  studentName: string;
  mutations: ReturnType<typeof useDevToolsMutations>;
  onAction: (a: PendingAction) => void;
}) {
  const locked = ['appointed', 'finalized', 'rejected'].includes(participant.status);
  const lockedReason = locked ? 'Item persyaratan hanya bisa diubah saat peserta Terdaftar atau Memenuhi Syarat' : null;
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">{participant.period.name}</CardTitle>
        <Badge variant="outline">{PARTICIPANT_STATUS_LABELS[participant.status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5"><BoolIcon value={!!participant.exitSurveySubmittedAt} />Exit survey ({participant.exitSurveyAnswers} jawaban)</span>
          <span className="flex items-center gap-1.5"><BoolIcon value={!!participant.requirementVerifiedAt} />Berkas terverifikasi</span>
          <span className="flex items-center gap-1.5"><BoolIcon value={!!participant.cplValidatedAt} />CPL tervalidasi</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value="" onValueChange={(value) => onAction({
            title: 'Ubah status peserta',
            description: `${studentName} → ${PARTICIPANT_STATUS_LABELS[value as DevToolsParticipantStatus]}`,
            confirmLabel: 'Ubah Status',
            preview: () => devToolsService.previewParticipantStatus(participant.id, value as DevToolsParticipantStatus),
            run: () => mutations.setParticipantStatus(participant.id, value as DevToolsParticipantStatus),
          })} disabled={mutations.isSubmitting}>
            <SelectTrigger className="h-9 w-[200px]" aria-label="Ubah status peserta"><SelectValue placeholder="Ubah status" /></SelectTrigger>
            <SelectContent>
              {PARTICIPANT_TARGETS.filter((t) => t !== participant.status).map((t) => <SelectItem key={t} value={t}>{PARTICIPANT_STATUS_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={mutations.isSubmitting} onClick={() => mutations.setExitSurvey(participant.id, 'fill')}>
            <ClipboardCheck className="mr-1.5 h-4 w-4" />Isi Exit Survey
          </Button>
          <Button variant="outline" size="sm" disabled={mutations.isSubmitting || !participant.exitSurveySubmittedAt} onClick={() => mutations.setExitSurvey(participant.id, 'clear')}>
            <ClipboardX className="mr-1.5 h-4 w-4" />Kosongkan Exit Survey
          </Button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium">Item persyaratan</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button variant="outline" size="sm" disabled={locked || mutations.isSubmitting} onClick={() => mutations.setRequirementItems(participant.id, 'approve')}>
                    <CheckCheck className="mr-1.5 h-4 w-4" />Semua Terverifikasi
                  </Button>
                </span>
              </TooltipTrigger>
              {lockedReason && <TooltipContent>{lockedReason}</TooltipContent>}
            </Tooltip>
          </div>
          <ul className="divide-y rounded-md border">
            {participant.requirements.map((item) => {
              const status = item.status ? ITEM_STATUS[item.status] : null;
              return (
                <li key={item.itemId} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="min-w-0 flex-1"><TruncatedText text={item.name} /></span>
                  {status ? <Badge variant={status.variant}>{status.label}</Badge> : <Badge variant="outline">Belum diunggah</Badge>}
                  <IconAction label="Tandai terverifikasi" disabled={locked || mutations.isSubmitting} onClick={() => mutations.setRequirementItems(participant.id, 'approve', item.itemId)}><Check className="h-4 w-4" /></IconAction>
                  <IconAction label="Tandai ditolak" disabled={locked || mutations.isSubmitting} onClick={() => mutations.setRequirementItems(participant.id, 'decline', item.itemId)}><X className="h-4 w-4" /></IconAction>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="text-destructive" disabled={mutations.isSubmitting} onClick={() => onAction({
            title: 'Hapus dari periode',
            description: `${studentName} · ${participant.period.name}`,
            confirmLabel: 'Hapus',
            destructive: true,
            preview: () => devToolsService.previewRemoveParticipant(participant.id),
            run: () => mutations.removeParticipant(participant.id),
          })}>
            <Trash2 className="mr-1.5 h-4 w-4" />Hapus dari Periode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreCell({ row, onSave, disabled }: { row: DevToolsCplRow; onSave: (score: number) => void; disabled: boolean }) {
  const [value, setValue] = useState(row.score === null ? '' : String(row.score));
  const changed = value !== (row.score === null ? '' : String(row.score));
  const invalid = value === '' || Number(value) < 0 || Number(value) > 100;
  return (
    <div className="flex items-center gap-1">
      <Input type="number" min={0} max={100} value={value} onChange={(e) => setValue(e.target.value)} className="h-8 w-20" aria-label={`Nilai ${row.code}`} disabled={disabled || row.status === 'finalized'} />
      {changed && (
        <IconAction label="Simpan nilai" disabled={disabled || invalid} onClick={() => onSave(Number(value))}><Save className="h-4 w-4" /></IconAction>
      )}
    </div>
  );
}

function CplTable({ data, mutations }: { data: DevToolsStudentYudisium; mutations: ReturnType<typeof useDevToolsMutations> }) {
  const [page, setPage] = useState(1);
  const studentId = data.student.id;
  const columns = useMemo<Column<DevToolsCplRow>[]>(() => [
    { key: 'code', header: 'CPL', render: (row) => <div className="max-w-[260px]"><div className="font-medium">{row.code}</div><TruncatedText text={row.description} className="text-xs text-muted-foreground" /></div> },
    { key: 'score', header: 'Nilai', render: (row) => <ScoreCell key={`${row.cplId}-${row.score}`} row={row} disabled={mutations.isSubmitting} onSave={(score) => mutations.setCplScore(studentId, row.cplId, score)} /> },
    { key: 'minimal', header: 'Minimal', render: (row) => row.minimalScore },
    { key: 'passed', header: 'Memenuhi', render: (row) => <BoolIcon value={row.passed} /> },
    { key: 'status', header: 'Validasi', className: 'text-xs', render: (row) => (row.status ? CPL_STATUS[row.status] : 'Belum ada nilai') },
    { key: 'recommendation', header: 'Rekomendasi', className: 'text-xs', render: (row) => (row.hasSettlement ? `Selesai (nilai lama ${row.oldScore ?? '-'})` : row.hasRecommendation ? 'Dibuat' : '-') },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end">
          <IconAction label="Buat rekomendasi" disabled={mutations.isSubmitting || row.passed || row.hasRecommendation || row.status === 'finalized'} onClick={() => mutations.setCplRecommendation(studentId, row.cplId, 'create')}><FilePlus2 className="h-4 w-4" /></IconAction>
          <IconAction label="Selesaikan rekomendasi" disabled={mutations.isSubmitting || row.hasSettlement || (row.passed && !row.hasRecommendation) || row.status === 'finalized'} onClick={() => mutations.setCplRecommendation(studentId, row.cplId, 'resolve')}><FileCheck2 className="h-4 w-4" /></IconAction>
          <IconAction label="Hapus rekomendasi" disabled={mutations.isSubmitting || (!row.hasRecommendation && !row.hasSettlement && row.oldScore === null) || row.status === 'finalized'} onClick={() => mutations.setCplRecommendation(studentId, row.cplId, 'delete')}><FileX2 className="h-4 w-4" /></IconAction>
        </div>
      ),
    },
  ], [mutations, studentId]);

  return (
    <CustomTable
      columns={columns}
      data={data.cpl.slice((page - 1) * 10, page * 10)}
      total={data.cpl.length}
      page={page}
      pageSize={10}
      onPageChange={setPage}
      rowKey={(row) => row.cplId}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={mutations.isSubmitting} onClick={() => mutations.setCplPreset(studentId, 'all-pass')}>Semua Memenuhi</Button>
          <Button variant="outline" size="sm" disabled={mutations.isSubmitting} onClick={() => mutations.setCplPreset(studentId, 'one-fail')}>Buat Satu CPL Tidak Memenuhi</Button>
        </div>
      }
      emptyText="Belum ada CPL aktif."
    />
  );
}
