import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import { ComboBox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CustomTable from '@/components/layout/CustomTable';
import {
  getSeminarResultsAPI,
  createSeminarResultAPI,
  updateSeminarResultAPI,
  deleteSeminarResultAPI,
  getSeminarResultThesisOptionsAPI,
  getSeminarResultLecturerOptionsAPI,
  getSeminarResultStudentOptionsAPI,
  getSeminarResultAudienceLinksAPI,
  assignSeminarResultAudiencesAPI,
  removeSeminarResultAudienceLinkAPI,
  getRoomsAPI,
} from '@/services/admin.service';
import type {
  Room,
  SeminarResult,
  SeminarResultStatus,
  SeminarResultAudienceLink,
  SeminarResultLecturerOption,
  SeminarResultStudentOption,
  SeminarResultThesisOption,
} from '@/services/admin.service';

type SeminarResultsResponse = Awaited<ReturnType<typeof getSeminarResultsAPI>>;
type AudienceLinksResponse = Awaited<ReturnType<typeof getSeminarResultAudienceLinksAPI>>;
type AssignAudienceResponse = Awaited<ReturnType<typeof assignSeminarResultAudiencesAPI>>;

const TAB_ITEMS: TabItem[] = [
  { label: 'Kelola Seminar Hasil', to: '/master-data/seminar-hasil?tab=seminar', end: true },
  { label: 'Kaitkan Audience Seminar', to: '/master-data/seminar-hasil?tab=audience', end: true },
];

const statusLabel: Record<SeminarResultStatus, string> = {
  passed: 'Lulus',
  passed_with_revision: 'Lulus dengan Revisi',
  failed: 'Tidak Lulus',
};

function toIsoDateStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export default function SeminarHasilMasterPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { search } = useLocation();
  const queryClient = useQueryClient();

  const tab = new URLSearchParams(search).get('tab') === 'audience' ? 'audience' : 'seminar';

  const breadcrumbs = useMemo(() => ([
    { label: 'Master Data' },
    { label: 'Data Seminar Hasil' },
  ]), []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Data Seminar Hasil');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  const [seminarPage, setSeminarPage] = useState(1);
  const [seminarPageSize, setSeminarPageSize] = useState(10);
  const [seminarSearch, setSeminarSearch] = useState('');

  const [audiencePage, setAudiencePage] = useState(1);
  const [audiencePageSize, setAudiencePageSize] = useState(10);
  const [audienceSearch, setAudienceSearch] = useState('');

  const [isSeminarDialogOpen, setIsSeminarDialogOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<SeminarResult | null>(null);
  const [seminarForm, setSeminarForm] = useState({
    thesisId: '',
    date: '',
    roomId: '',
    status: 'passed' as SeminarResultStatus,
    examinerLecturerIds: [] as string[],
    examinerSearch: '',
  });

  const [deleteSeminarId, setDeleteSeminarId] = useState<string | null>(null);

  const [isAudienceDialogOpen, setIsAudienceDialogOpen] = useState(false);
  const [selectedAudienceStudentId, setSelectedAudienceStudentId] = useState('');
  const [selectedAudienceSeminarIds, setSelectedAudienceSeminarIds] = useState<string[]>([]);
  const [audienceSeminarSearch, setAudienceSeminarSearch] = useState('');
  const [deleteAudienceLink, setDeleteAudienceLink] = useState<{ seminarId: string; studentId: string } | null>(null);

  const { data: seminarData, isLoading: seminarLoading, isFetching: seminarFetching } = useQuery({
    queryKey: ['seminar-results-master', { page: seminarPage, pageSize: seminarPageSize, search: seminarSearch }],
    queryFn: () => getSeminarResultsAPI({ page: seminarPage, pageSize: seminarPageSize, search: seminarSearch }),
    placeholderData: (previousData: SeminarResultsResponse | undefined) => previousData,
    enabled: tab === 'seminar',
  });

  const { data: seminarSelectData } = useQuery({
    queryKey: ['seminar-results-select-options'],
    queryFn: () => getSeminarResultsAPI({ page: 1, pageSize: 500, search: '' }),
    enabled: tab === 'audience',
  });

  const { data: thesisOptionsData } = useQuery({
    queryKey: ['seminar-result-thesis-options'],
    queryFn: getSeminarResultThesisOptionsAPI,
  });

  const { data: lecturerOptionsData } = useQuery({
    queryKey: ['seminar-result-lecturer-options'],
    queryFn: getSeminarResultLecturerOptionsAPI,
  });

  const { data: studentOptionsData } = useQuery({
    queryKey: ['seminar-result-student-options'],
    queryFn: getSeminarResultStudentOptionsAPI,
    enabled: tab === 'audience',
  });

  const { data: roomOptionsData } = useQuery({
    queryKey: ['rooms', { page: 1, pageSize: 500, search: '' }],
    queryFn: () => getRoomsAPI({ page: 1, pageSize: 500, search: '' }),
  });

  const { data: audienceData, isLoading: audienceLoading, isFetching: audienceFetching } = useQuery({
    queryKey: ['seminar-result-audience-links', { page: audiencePage, pageSize: audiencePageSize, search: audienceSearch }],
    queryFn: () => getSeminarResultAudienceLinksAPI({ page: audiencePage, pageSize: audiencePageSize, search: audienceSearch }),
    placeholderData: (previousData: AudienceLinksResponse | undefined) => previousData,
    enabled: tab === 'audience',
  });

  useEffect(() => setSeminarPage(1), [seminarSearch]);
  useEffect(() => setAudiencePage(1), [audienceSearch]);

  const seminarMut = useMutation({
    mutationFn: async () => {
      const payload = {
        thesisId: seminarForm.thesisId,
        date: toIsoDateStart(seminarForm.date),
        roomId: seminarForm.roomId,
        status: seminarForm.status,
        examinerLecturerIds: seminarForm.examinerLecturerIds,
      };

      if (editingSeminar) {
        return updateSeminarResultAPI(editingSeminar.id, payload);
      }
      return createSeminarResultAPI(payload);
    },
    onSuccess: () => {
      toast.success(editingSeminar ? 'Data seminar hasil berhasil diperbarui' : 'Data seminar hasil berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['seminar-results-master'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-results-select-options'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-thesis-options'] });
      setIsSeminarDialogOpen(false);
      setEditingSeminar(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menyimpan seminar hasil');
    },
  });

  const deleteSeminarMut = useMutation({
    mutationFn: (id: string) => deleteSeminarResultAPI(id),
    onSuccess: () => {
      toast.success('Data seminar hasil berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['seminar-results-master'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-results-select-options'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-thesis-options'] });
      setDeleteSeminarId(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menghapus seminar hasil');
    },
  });

  const assignAudienceMut = useMutation({
    mutationFn: () => assignSeminarResultAudiencesAPI({
      studentId: selectedAudienceStudentId,
      seminarIds: selectedAudienceSeminarIds,
    }),
    onSuccess: (res: AssignAudienceResponse) => {
      const detail = res.data;
      const summaries = [
        `Berhasil ditautkan: ${detail.created}`,
        `Skip duplikat: ${detail.skippedDuplicate}`,
        `Skip seminar milik sendiri: ${detail.skippedOwnSeminarIds.length}`,
      ];
      toast.success(summaries.join(' | '));
      setIsAudienceDialogOpen(false);
      setSelectedAudienceStudentId('');
      setSelectedAudienceSeminarIds([]);
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal mengaitkan audience seminar');
    },
  });

  const removeAudienceMut = useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      removeSeminarResultAudienceLinkAPI(seminarId, studentId),
    onSuccess: () => {
      toast.success('Relasi audience seminar berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
      setDeleteAudienceLink(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menghapus relasi audience');
    },
  });

  const thesisOptions: SeminarResultThesisOption[] = thesisOptionsData?.data || [];
  const lecturerOptions: SeminarResultLecturerOption[] = lecturerOptionsData?.data || [];
  const studentOptions: SeminarResultStudentOption[] = studentOptionsData?.data || [];
  const roomOptions: Room[] = roomOptionsData?.rooms || [];

  const seminarRows = seminarData?.seminars || [];
  const seminarTotal = seminarData?.meta?.total || 0;

  const audienceRows: SeminarResultAudienceLink[] = audienceData?.links || [];
  const audienceTotal = audienceData?.meta?.total || 0;

  const openCreateSeminarDialog = () => {
    setEditingSeminar(null);
    setSeminarForm({
      thesisId: '',
      date: '',
      roomId: '',
      status: 'passed',
      examinerLecturerIds: [],
      examinerSearch: '',
    });
    setIsSeminarDialogOpen(true);
  };

  const openEditSeminarDialog = (row: SeminarResult) => {
    setEditingSeminar(row);
    setSeminarForm({
      thesisId: row.thesisId,
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
      roomId: row.room?.id || '',
      status: row.status,
      examinerLecturerIds: row.examiners.map((e) => e.lecturerId),
      examinerSearch: '',
    });
    setIsSeminarDialogOpen(true);
  };

  const seminarColumns = useMemo(() => [
    {
      key: 'thesis',
      header: 'Thesis',
      width: 300,
      render: (row: SeminarResult) => (
        <div className="max-w-[320px]">
          <div className="font-medium truncate">{row.thesisTitle}</div>
          <div className="text-xs text-muted-foreground truncate">{row.student.fullName} ({row.student.nim})</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row: SeminarResult) => row.date ? format(new Date(row.date), 'd MMM yyyy', { locale: idLocale }) : '-',
    },
    {
      key: 'room',
      header: 'Ruangan',
      width: 240,
      render: (row: SeminarResult) => row.room ? `${row.room.name}${row.room.location ? ` (${row.room.location})` : ''}` : '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 180,
      render: (row: SeminarResult) => <Badge>{statusLabel[row.status]}</Badge>,
    },
    {
      key: 'examiners',
      header: 'Penguji',
      width: 320,
      className: 'align-top',
      render: (row: SeminarResult) => (
        row.examiners.length === 0
          ? '-'
          : (
            <div className="max-w-[320px] space-y-1 text-sm leading-snug">
              {row.examiners.slice(0, 2).map((e) => (
                <div key={e.id} className="truncate" title={`${e.order}. ${e.lecturerName}`}>
                  {e.order}. {e.lecturerName}
                </div>
              ))}
              {row.examiners.length > 2 && (
                <div
                  className="text-xs text-muted-foreground"
                  title={row.examiners.slice(2).map((e) => `${e.order}. ${e.lecturerName}`).join(', ')}
                >
                  +{row.examiners.length - 2} penguji lainnya
                </div>
              )}
            </div>
          )
      ),
    },
    {
      key: 'audiences',
      header: 'Audience',
      className: 'text-center',
      render: (row: SeminarResult) => row.audienceCount,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: SeminarResult) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-black" onClick={() => openEditSeminarDialog(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteSeminarId(row.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const audienceColumns = useMemo(() => [
    {
      key: 'student',
      header: 'Mahasiswa Audience',
      render: (row: SeminarResultAudienceLink) => (
        <div>
          <div className="font-medium">{row.student.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.student.nim}</div>
        </div>
      ),
    },
    {
      key: 'seminar',
      header: 'Seminar Hasil',
      render: (row: SeminarResultAudienceLink) => (
        <div className="max-w-[360px]">
          <div className="font-medium truncate">{row.seminar.thesisTitle}</div>
          <div className="text-xs text-muted-foreground truncate">Pemilik: {row.seminar.ownerName} ({row.seminar.ownerNim})</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal Seminar',
      render: (row: SeminarResultAudienceLink) => row.seminar.date ? format(new Date(row.seminar.date), 'd MMM yyyy', { locale: idLocale }) : '-',
    },
    {
      key: 'linkedAt',
      header: 'Dikaitkan',
      render: (row: SeminarResultAudienceLink) => format(new Date(row.createdAt), 'd MMM yyyy', { locale: idLocale }),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: SeminarResultAudienceLink) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setDeleteAudienceLink({ seminarId: row.seminarId, studentId: row.studentId })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ], []);

  const filteredLecturerOptions = lecturerOptions.filter((item) => {
    const q = seminarForm.examinerSearch.trim().toLowerCase();
    if (!q) return true;
    return item.fullName.toLowerCase().includes(q) || item.nip.toLowerCase().includes(q);
  });

  const selectedAudienceStudent = studentOptions.find((s) => s.id === selectedAudienceStudentId);

  const seminarRowsForAudience = seminarSelectData?.seminars || [];

  const audienceSeminarSelectableRows = seminarRowsForAudience.filter((s: SeminarResult) => {
    if (!selectedAudienceStudent) return true;
    return s.student.id !== selectedAudienceStudent.id;
  });

  const filteredAudienceSeminars = audienceSeminarSelectableRows.filter((s) => {
    const q = audienceSeminarSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.thesisTitle.toLowerCase().includes(q)
      || s.student.fullName.toLowerCase().includes(q)
      || s.student.nim.toLowerCase().includes(q)
    );
  });

  const isSeminarFormValid = Boolean(
    seminarForm.thesisId
    && seminarForm.date
    && seminarForm.roomId
    && seminarForm.status
    && seminarForm.examinerLecturerIds.length >= 1
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Seminar Hasil</h1>
          <p className="text-muted-foreground">Manajemen data seminar hasil dan relasi audience mahasiswa</p>
        </div>
      </div>

      <TabsNav tabs={TAB_ITEMS} />

      {tab === 'seminar' ? (
        <CustomTable
          data={seminarRows}
          columns={seminarColumns as any}
          loading={seminarLoading}
          isRefreshing={seminarFetching && !seminarLoading}
          emptyText="Belum ada data seminar hasil"
          page={seminarPage}
          pageSize={seminarPageSize}
          total={seminarTotal}
          onPageChange={setSeminarPage}
          onPageSizeChange={setSeminarPageSize}
          searchValue={seminarSearch}
          onSearchChange={setSeminarSearch}
          actions={
            <Button variant="outline" size="sm" onClick={openCreateSeminarDialog}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Seminar Hasil
            </Button>
          }
        />
      ) : (
        <CustomTable
          data={audienceRows}
          columns={audienceColumns as any}
          loading={audienceLoading}
          isRefreshing={audienceFetching && !audienceLoading}
          emptyText="Belum ada relasi audience seminar"
          page={audiencePage}
          pageSize={audiencePageSize}
          total={audienceTotal}
          onPageChange={setAudiencePage}
          onPageSizeChange={setAudiencePageSize}
          searchValue={audienceSearch}
          onSearchChange={setAudienceSearch}
          actions={
            <Button variant="outline" size="sm" onClick={() => setIsAudienceDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Kaitkan Audience
            </Button>
          }
        />
      )}

      <Dialog open={isSeminarDialogOpen} onOpenChange={setIsSeminarDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSeminar ? 'Edit Seminar Hasil' : 'Tambah Seminar Hasil'}</DialogTitle>
            <DialogDescription>
              Isi data seminar hasil. Dosen penguji minimal 1 orang dan tidak boleh merupakan pembimbing thesis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Thesis</Label>
              <ComboBox
                width="w-full"
                items={thesisOptions.map((t) => ({
                  value: t.id,
                  label: `${t.studentName} (${t.studentNim}) - ${t.title}`,
                  disabled: Boolean(t.hasSeminarResult && t.seminarResultId !== editingSeminar?.id),
                }))}
                placeholder="Pilih thesis"
                defaultValue={seminarForm.thesisId}
                onChange={(value) => setSeminarForm((prev) => ({ ...prev, thesisId: value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Tanggal Seminar</Label>
                <Input
                  type="date"
                  value={seminarForm.date}
                  onChange={(e) => setSeminarForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Ruangan</Label>
                <Select value={seminarForm.roomId} onValueChange={(value) => setSeminarForm((prev) => ({ ...prev, roomId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}{room.location ? ` (${room.location})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Seminar</Label>
                <Select value={seminarForm.status} onValueChange={(value: SeminarResultStatus) => setSeminarForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Lulus</SelectItem>
                    <SelectItem value="passed_with_revision">Lulus dengan Revisi</SelectItem>
                    <SelectItem value="failed">Tidak Lulus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dosen Penguji (multi-select)</Label>
              <Input
                placeholder="Cari dosen penguji..."
                value={seminarForm.examinerSearch}
                onChange={(e) => setSeminarForm((prev) => ({ ...prev, examinerSearch: e.target.value }))}
              />
              <div className="max-h-[220px] overflow-y-auto rounded-md border p-3 space-y-2">
                {filteredLecturerOptions.map((lec) => {
                  const checked = seminarForm.examinerLecturerIds.includes(lec.id);
                  return (
                    <label key={lec.id} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const isChecked = value === true;
                          setSeminarForm((prev) => ({
                            ...prev,
                            examinerLecturerIds: isChecked
                              ? [...prev.examinerLecturerIds, lec.id]
                              : prev.examinerLecturerIds.filter((id) => id !== lec.id),
                          }));
                        }}
                      />
                      <span>{lec.fullName} ({lec.nip})</span>
                    </label>
                  );
                })}
                {filteredLecturerOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada dosen ditemukan.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Dipilih: {seminarForm.examinerLecturerIds.length} dosen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeminarDialogOpen(false)} disabled={seminarMut.isPending}>Batal</Button>
            <Button onClick={() => seminarMut.mutate()} disabled={!isSeminarFormValid || seminarMut.isPending}>
              {seminarMut.isPending ? 'Menyimpan...' : editingSeminar ? 'Simpan Perubahan' : 'Tambah Seminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteSeminarId)} onOpenChange={(open) => !open && setDeleteSeminarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Seminar Hasil</AlertDialogTitle>
            <AlertDialogDescription>
              Menghapus data seminar hasil akan sekaligus menghapus relasi dosen penguji dan audience seminar (cascade).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSeminarMut.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSeminarMut.isPending || !deleteSeminarId}
              onClick={() => deleteSeminarId && deleteSeminarMut.mutate(deleteSeminarId)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAudienceDialogOpen} onOpenChange={setIsAudienceDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kaitkan Mahasiswa ke Seminar Hasil</DialogTitle>
            <DialogDescription>
              Pilih mahasiswa audience lalu pilih satu atau banyak seminar hasil milik mahasiswa lain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Mahasiswa Audience</Label>
              <ComboBox
                width="w-full"
                items={studentOptions.map((s) => ({ value: s.id, label: `${s.fullName} (${s.nim})` }))}
                placeholder="Pilih mahasiswa"
                defaultValue={selectedAudienceStudentId}
                onChange={(value) => {
                  setSelectedAudienceStudentId(value);
                  setSelectedAudienceSeminarIds([]);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Seminar Hasil (multi-select)</Label>
              <Input
                placeholder="Cari seminar hasil..."
                value={audienceSeminarSearch}
                onChange={(e) => setAudienceSeminarSearch(e.target.value)}
              />
              <div className="max-h-[260px] overflow-y-auto rounded-md border p-3 space-y-2">
                {filteredAudienceSeminars.map((row) => {
                  const checked = selectedAudienceSeminarIds.includes(row.id);
                  return (
                    <label key={row.id} className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const isChecked = value === true;
                          setSelectedAudienceSeminarIds((prev) =>
                            isChecked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                          );
                        }}
                      />
                      <span>
                        <span className="font-medium">{row.thesisTitle}</span>
                        <span className="block text-xs text-muted-foreground">
                          Pemilik: {row.student.fullName} ({row.student.nim})
                        </span>
                      </span>
                    </label>
                  );
                })}
                {filteredAudienceSeminars.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada seminar yang dapat dipilih.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Dipilih: {selectedAudienceSeminarIds.length} seminar</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAudienceDialogOpen(false)} disabled={assignAudienceMut.isPending}>Batal</Button>
            <Button
              onClick={() => assignAudienceMut.mutate()}
              disabled={!selectedAudienceStudentId || selectedAudienceSeminarIds.length < 1 || assignAudienceMut.isPending}
            >
              {assignAudienceMut.isPending ? 'Menyimpan...' : 'Kaitkan Audience'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteAudienceLink)} onOpenChange={(open) => !open && setDeleteAudienceLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Relasi Audience</AlertDialogTitle>
            <AlertDialogDescription>
              Relasi mahasiswa dengan seminar hasil akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAudienceMut.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={removeAudienceMut.isPending || !deleteAudienceLink}
              onClick={() => deleteAudienceLink && removeAudienceMut.mutate(deleteAudienceLink)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
