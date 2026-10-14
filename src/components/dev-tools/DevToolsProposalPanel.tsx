import { useMemo, useState } from 'react';
import { History, Loader2, PlayCircle } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDevToolsMutations, useDevToolsSemesterFlags, useDevToolsStudents, useDevToolsSupervisorRequests } from '@/hooks/dev-tools/useDevTools';
import { usePromotionPreview, useRunPromotion } from '@/hooks/research-method/useResearchMethod';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { formatDateTimeWib } from '@/lib/text';
import { getPromotionDecisionLabel, getPromotionDecisionVariant } from '@/lib/thesisLabels';
import type { DevToolsSemesterFlags, DevToolsSupervisorRequest } from '@/types/devTools.types';
import { TruncatedText } from './DevToolsShared';

const FLAG_OPTIONS = [
  { value: 'true', label: 'Ya' },
  { value: 'false', label: 'Tidak' },
  { value: 'null', label: 'Kosong' },
];
const flagValue = (value: boolean | null) => (value === null ? 'null' : String(value));
const parseFlag = (value: string) => (value === 'null' ? null : value === 'true');
const SOURCE_LABELS: Record<string, string> = { sia: 'SIA', devtools: 'DevTools' };

/** The sending time that opens "Tarik Pengajuan" now (72 hours plus a minute). */
export function backdatedTime(now = new Date()): string {
  return new Date(now.getTime() - (72 * 60 + 1) * 60 * 1000).toISOString();
}

function SemesterFlagsCard() {
  const mutations = useDevToolsMutations();
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const { data: students = [], isFetching } = useDevToolsStudents(search, '');
  const { data: flags = [], isLoading } = useDevToolsSemesterFlags(studentId);
  const [drafts, setDrafts] = useState<Record<string, { rm: string; ta: string }>>({});

  const draftOf = (row: DevToolsSemesterFlags) => drafts[row.academicYearId ?? ''] ?? { rm: flagValue(row.eligibleResearchMethod), ta: flagValue(row.takingThesisCourse) };
  const save = async (row: DevToolsSemesterFlags) => {
    const draft = draftOf(row);
    await mutations.setPeriodFlags(studentId!, {
      academicYearId: row.academicYearId ?? undefined,
      eligibleResearchMethod: parseFlag(draft.rm),
      takingThesisCourse: parseFlag(draft.ta),
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.academicYearId ?? ''];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Penanda SIA per Semester</CardTitle>
        <CardDescription>
          Mengambil Metode Penelitian dan mengambil Tugas Akhir untuk satu mahasiswa di setiap semester. Sinkronisasi SIA berikutnya menimpa penanda mahasiswa yang ada di SIA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-[1fr_20rem]">
          <Input placeholder="Cari nama atau NIM mahasiswa" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={studentId ?? ''} onValueChange={setStudentId}>
            <SelectTrigger aria-label="Mahasiswa"><SelectValue placeholder={isFetching ? 'Memuat...' : 'Pilih mahasiswa'} /></SelectTrigger>
            <SelectContent>
              {students.slice(0, 30).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.identityNumber})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!studentId ? null : isLoading ? (
          <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Semester</TableHead>
                <TableHead className="w-40">Metode Penelitian</TableHead>
                <TableHead className="w-40">Tugas Akhir</TableHead>
                <TableHead className="w-32">Sumber</TableHead>
                <TableHead className="w-28 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((row) => {
                const draft = draftOf(row);
                const changed = draft.rm !== flagValue(row.eligibleResearchMethod) || draft.ta !== flagValue(row.takingThesisCourse);
                const set = (patch: Partial<{ rm: string; ta: string }>) => setDrafts((prev) => ({ ...prev, [row.academicYearId ?? '']: { ...draft, ...patch } }));
                return (
                  <TableRow key={row.academicYearId}>
                    <TableCell>{row.academicYearLabel}{row.isActive && <Badge variant="info" className="ml-2">Berjalan</Badge>}</TableCell>
                    {(['rm', 'ta'] as const).map((key) => (
                      <TableCell key={key}>
                        <Select value={draft[key]} onValueChange={(value) => set({ [key]: value })}>
                          <SelectTrigger aria-label={`${key === 'rm' ? 'Metode Penelitian' : 'Tugas Akhir'} ${row.academicYearLabel}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{FLAG_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    ))}
                    <TableCell className="text-xs text-muted-foreground">
                      {[row.eligibilitySource, row.thesisCourseSource].filter(Boolean).map((s) => SOURCE_LABELS[s as string] ?? s).join(' / ') || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span title={changed ? undefined : 'Belum ada perubahan.'}>
                        <Button size="sm" variant="outline" disabled={!changed || mutations.isSubmitting} onClick={() => save(row)}>Simpan</Button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SupervisorRequestCard() {
  const mutations = useDevToolsMutations();
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isFetching } = useDevToolsSupervisorRequests({ search: debouncedSearch, page, pageSize });

  const columns = useMemo<Column<DevToolsSupervisorRequest>[]>(() => [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="max-w-[190px]">
          <TruncatedText text={row.student.fullName} className="font-medium text-sm" />
          <div className="text-xs text-muted-foreground">{row.student.nim ?? '-'}</div>
        </div>
      ),
    },
    { key: 'lecturer', header: 'Dosen', render: (row) => <div className="max-w-[170px] text-sm"><TruncatedText text={row.lecturerName ?? 'Lewat departemen'} /></div> },
    { key: 'status', header: 'Status', render: (row) => <SupervisorRequestStatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Dikirim', className: 'text-xs', render: (row) => formatDateTimeWib(row.createdAt) },
    { key: 'withdraw', header: 'Bisa Ditarik', className: 'text-xs', render: (row) => formatDateTimeWib(row.withdrawAvailableAt) },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <Button variant="outline" size="sm" className="h-8" disabled={mutations.isSubmitting} onClick={() => mutations.setSupervisorRequestTime(row.id, backdatedTime())}>
          <History className="mr-1.5 h-3.5 w-3.5" />Mundurkan 72 Jam
        </Button>
      ),
    },
  ], [mutations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Waktu Pengajuan Pembimbing</CardTitle>
        <CardDescription>Memundurkan waktu kirim pengajuan agar aturan "tarik setelah 72 jam" dan pengingatnya bisa diuji sekarang.</CardDescription>
      </CardHeader>
      <CardContent>
        <CustomTable
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          subtleRefresh
          total={data?.meta.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={setSearch}
          emptyText="Tidak ada pengajuan pembimbing ditemukan."
        />
      </CardContent>
    </Card>
  );
}

function PromotionCard() {
  const { data, isLoading } = usePromotionPreview(true);
  const run = useRunPromotion();
  const rows = data?.rows ?? [];
  const reason = rows.some((r) => r.decision === 'promote') ? null : 'Belum ada mahasiswa yang memenuhi syarat naik ke Penelitian.';
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Proses Kelulusan</CardTitle>
          <CardDescription>Menjalankan langkah naik ke Penelitian sekarang (biasanya berjalan otomatis setiap enam jam).</CardDescription>
        </div>
        <span title={reason ?? undefined}>
          <Button size="sm" disabled={Boolean(reason) || run.isPending} onClick={() => run.mutate()}>
            {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}Jalankan
          </Button>
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada mahasiswa lulus yang masih di fase proposal.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {rows.map((r) => (
              <li key={r.thesisId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span>{r.student.fullName} · {r.student.identityNumber} <span className="block text-xs text-muted-foreground">{r.reason}</span></span>
                <Badge variant={getPromotionDecisionVariant(r.decision)}>{getPromotionDecisionLabel(r.decision)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** DevTools tab "Proposal" (rencana 10.8). */
export function DevToolsProposalPanel() {
  return (
    <div className="space-y-4">
      <SemesterFlagsCard />
      <SupervisorRequestCard />
      <PromotionCard />
    </div>
  );
}
