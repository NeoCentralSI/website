/**
 * DEV TOOLS PAGE — Admin-only development utilities for testing SIMPTA scenarios.
 * ⚠️ DELETE THIS DIRECTORY (pages/dev-tools/) when dev tools are no longer needed.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wrench,
  FileText,
  Check,
  X,
  KeyRound,
  UserPlus,
  BookOpen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  useDevToolsStudents,
  useDevToolsTheses,
  useDevToolsMutations,
  useDevToolsRoles,
  useDevToolsUsers,
} from '@/hooks/dev-tools/useDevTools';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import type {
  DevToolsMetopenEligibility,
  DevToolsStudent,
  UpdateStudentDto,
  StudentStatus,
  CreateUserDto,
} from '@/types/devTools.types';

const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'dropout', label: 'Dropout' },
  { value: 'bss', label: 'BSS' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'mengundurkan_diri', label: 'Mengundurkan Diri' },
];

function BoolIcon({ value }: { value: boolean }) {
  return value
    ? <Check className="h-4 w-4 text-emerald-600" />
    : <X className="h-4 w-4 text-red-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const v: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    lulus: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    dropout: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    bss: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    mengundurkan_diri: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v[status] || 'bg-muted text-muted-foreground'}`}>{status}</span>;
}

function formatDateTimeLabel(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetopenEligibilityBadge({ metopenEligibility }: { metopenEligibility: DevToolsMetopenEligibility }) {
  if (metopenEligibility.readOnly) {
    return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Arsip TA</Badge>;
  }

  if (!metopenEligibility.hasExternalStatus) {
    return <Badge variant="outline" className="text-xs">Belum ada status</Badge>;
  }

  if (metopenEligibility.eligibleMetopen) {
    return <Badge variant="default" className="text-xs bg-emerald-600">Eligible</Badge>;
  }

  return <Badge variant="outline" className="text-xs border-red-200 text-red-700">Tidak eligible</Badge>;
}

// ========== EDIT STUDENT DIALOG ==========
function EditStudentDialog({ student, open, onOpenChange, onSave, isSubmitting }: {
  student: DevToolsStudent | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (id: string, data: UpdateStudentDto) => Promise<unknown>; isSubmitting: boolean;
}) {
  const [form, setForm] = useState<UpdateStudentDto>({});
  useEffect(() => {
    if (student) setForm({
      sksCompleted: student.sksCompleted, currentSemester: student.currentSemester ?? undefined,
      enrollmentYear: student.enrollmentYear ?? undefined, status: student.status,
      mandatoryCoursesCompleted: student.mandatoryCoursesCompleted, mkwuCompleted: student.mkwuCompleted,
      internshipCompleted: student.internshipCompleted, kknCompleted: student.kknCompleted,
    });
  }, [student]);

  if (!student) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Edit Mahasiswa</DialogTitle>
          <DialogDescription>{student.fullName} ({student.identityNumber})</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="sks">SKS Selesai</Label>
              <Input id="sks" type="number" min={0} max={200} value={form.sksCompleted ?? 0}
                onChange={(e) => setForm({ ...form, sksCompleted: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label htmlFor="semester">Semester Saat Ini</Label>
              <Input id="semester" type="number" min={1} max={14} value={form.currentSemester ?? ''}
                onChange={(e) => setForm({ ...form, currentSemester: Number(e.target.value) || undefined })} /></div>
            <div className="space-y-1.5"><Label htmlFor="enrollmentYear">Tahun Masuk</Label>
              <Input id="enrollmentYear" type="number" min={2000} max={2030} value={form.enrollmentYear ?? ''}
                onChange={(e) => setForm({ ...form, enrollmentYear: Number(e.target.value) || undefined })} /></div>
            <div className="space-y-1.5"><Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StudentStatus })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>{STUDENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="space-y-2"><Label className="text-sm font-medium">Eligibility Flags</Label>
            <div className="grid grid-cols-2 gap-3">
              {([['mandatoryCoursesCompleted', 'MK Wajib Selesai'], ['mkwuCompleted', 'MKWU Selesai'],
                ['internshipCompleted', 'KP Selesai'], ['kknCompleted', 'KKN Selesai']] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox id={key} checked={!!form[key]} onCheckedChange={(c) => setForm({ ...form, [key]: !!c })} />
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={async () => { const ok = await onSave(student.id, form); if (ok !== null) onOpenChange(false); }} disabled={isSubmitting}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== PASSWORD DIALOG ==========
function PasswordDialog({ userId, userName, open, onOpenChange, onSave, isSubmitting }: {
  userId: string | null; userName: string; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (id: string, pw: string) => Promise<unknown>; isSubmitting: boolean;
}) {
  const [pw, setPw] = useState('');
  useEffect(() => { if (open) setPw(''); }, [open]);
  if (!userId) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Ubah Password</DialogTitle>
          <DialogDescription>{userName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Password Baru</Label>
          <Input id="new-pw" type="text" placeholder="Minimal 4 karakter" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={async () => { const ok = await onSave(userId, pw); if (ok !== null) onOpenChange(false); }}
            disabled={isSubmitting || pw.length < 4}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== CREATE USER DIALOG ==========
function CreateUserDialog({ open, onOpenChange, onSave, isSubmitting }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (data: CreateUserDto) => Promise<unknown>; isSubmitting: boolean;
}) {
  const { data: roles } = useDevToolsRoles();
  const [form, setForm] = useState<CreateUserDto>({ fullName: '', identityNumber: '', password: '', identityType: 'NIM', roles: [] });
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) { setForm({ fullName: '', identityNumber: '', password: '', identityType: 'NIM', roles: [] }); setEmail(''); }
  }, [open]);

  const toggleRole = (name: string) => {
    const current = form.roles || [];
    setForm({ ...form, roles: current.includes(name) ? current.filter((r) => r !== name) : [...current, name] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Buat User Baru</DialogTitle>
          <DialogDescription>User otomatis diverifikasi dan bisa langsung login</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2"><Label htmlFor="cu-name">Nama Lengkap *</Label>
              <Input id="cu-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cu-id">NIM / NIP *</Label>
              <Input id="cu-id" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cu-type">Tipe Identitas</Label>
              <Select value={form.identityType} onValueChange={(v) => setForm({ ...form, identityType: v as 'NIM' | 'NIP' | 'OTHER' })}>
                <SelectTrigger id="cu-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="NIM">NIM (Mahasiswa)</SelectItem><SelectItem value="NIP">NIP (Dosen)</SelectItem><SelectItem value="OTHER">Lainnya</SelectItem></SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label htmlFor="cu-email">Email (opsional)</Label>
              <Input id="cu-email" type="email" placeholder="user@unand.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="cu-pw">Password *</Label>
              <Input id="cu-pw" type="text" placeholder="Minimal 4 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Roles (kosongkan = default berdasarkan tipe)</Label>
            <div className="grid grid-cols-2 gap-2">
              {roles?.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox id={`role-${r.id}`} checked={form.roles?.includes(r.name)} onCheckedChange={() => toggleRole(r.name)} />
                  <Label htmlFor={`role-${r.id}`} className="text-sm font-normal cursor-pointer">{r.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || !form.fullName.trim() || !form.identityNumber.trim() || form.password.length < 4}
            onClick={async () => {
              const payload = { ...form, email: email.trim() || undefined };
              const ok = await onSave(payload);
              if (ok !== null) onOpenChange(false);
            }}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Membuat...</> : 'Buat User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== THESIS PANEL ==========
function ThesisPanel({ studentId, studentName, onDeleteThesis, isSubmitting }: {
  studentId: string; studentName: string; onDeleteThesis: (id: string) => Promise<unknown>; isSubmitting: boolean;
}) {
  const { data: theses, isLoading } = useDevToolsTheses(studentId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  if (isLoading) return <div className="flex justify-center py-4"><Spinner className="h-5 w-5" /></div>;
  if (!theses?.length) return <p className="text-sm text-muted-foreground py-2">Tidak ada data thesis.</p>;
  return (
    <>
      <Table>
        <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead>Status</TableHead><TableHead>Pembimbing</TableHead><TableHead className="w-20">Aksi</TableHead></TableRow></TableHeader>
        <TableBody>{theses.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm max-w-[200px] truncate">{t.title || '(tanpa judul)'}</TableCell>
            <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
            <TableCell className="text-sm">{t.supervisors.map((s) => `${s.lecturer.user.fullName} (${s.role.name})`).join(', ') || '-'}</TableCell>
            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmId(t.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Thesis?</AlertDialogTitle>
          <AlertDialogDescription>Thesis milik {studentName} akan dihapus. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}
              onClick={async () => { if (confirmId) { await onDeleteThesis(confirmId); setConfirmId(null); } }}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ========== STUDENT ROW ==========
function StudentRow({ student, isExpanded, onToggle, onEdit, onDelete, onReset, onDeleteThesis, onPasswordChange, onMetopenSetEligible, onMetopenSetIneligible, onMetopenClear, isSubmitting }: {
  student: DevToolsStudent; isExpanded: boolean; onToggle: () => void; onEdit: () => void;
  onDelete: () => void; onReset: () => void; onDeleteThesis: (id: string) => Promise<unknown>;
  onPasswordChange: () => void;
  onMetopenSetEligible: () => void;
  onMetopenSetIneligible: () => void;
  onMetopenClear: () => void;
  isSubmitting: boolean;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="text-center">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
        <TableCell><div className="font-medium text-sm">{student.fullName}</div><div className="text-xs text-muted-foreground">{student.identityNumber}</div></TableCell>
        <TableCell><StatusBadge status={student.status} /></TableCell>
        <TableCell className="text-center text-sm">{student.sksCompleted}</TableCell>
        <TableCell className="text-center text-sm">{student.currentSemester ?? '-'}</TableCell>
        <TableCell className="text-center"><BoolIcon value={student.mandatoryCoursesCompleted} /></TableCell>
        <TableCell className="text-center"><BoolIcon value={student.mkwuCompleted} /></TableCell>
        <TableCell className="text-center"><BoolIcon value={student.internshipCompleted} /></TableCell>
        <TableCell className="text-center"><BoolIcon value={student.kknCompleted} /></TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-1">
            <MetopenEligibilityBadge metopenEligibility={student.metopenEligibility} />
            <span className="text-[11px] text-muted-foreground">
              {student.metopenEligibility.source ? `Sumber: ${student.metopenEligibility.source}` : 'Belum ada snapshot'}
            </span>
          </div>
        </TableCell>
        <TableCell>
          {student.latestThesis ? (
            <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><Badge variant="outline" className="text-xs">{student.latestThesis.status}</Badge></div>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPasswordChange} title="Ubah Password"><KeyRound className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset} title="Reset"><RotateCcw className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} title="Hapus"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow><TableCell colSpan={12} className="bg-muted/30 px-6 py-4">
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50/40">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-blue-700" />
                  Snapshot Eligibility Metopen
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1"><MetopenEligibilityBadge metopenEligibility={student.metopenEligibility} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sumber backend</p>
                    <p className="text-sm font-medium">{student.metopenEligibility.source ?? 'Belum ada snapshot'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diperbarui</p>
                    <p className="text-sm font-medium">{formatDateTimeLabel(student.metopenEligibility.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Akses aktif</p>
                    <p className="text-sm font-medium">
                      {student.metopenEligibility.canAccess ? 'Bisa buka menu/guard' : 'Semua surface tertutup'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={onMetopenSetEligible} disabled={isSubmitting}>
                    Set Eligible
                  </Button>
                  <Button size="sm" variant="outline" onClick={onMetopenSetIneligible} disabled={isSubmitting}>
                    Set Tidak Eligible
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onMetopenClear} disabled={isSubmitting}>
                    Kosongkan Snapshot
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Data Thesis — {student.fullName}</div>
            <ThesisPanel studentId={student.id} studentName={student.fullName} onDeleteThesis={onDeleteThesis} isSubmitting={isSubmitting} />
          </div>
        </TableCell></TableRow>
      )}
    </>
  );
}

// ========== MAIN PAGE ==========
export default function DevTools() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [activeTab, setActiveTab] = useState('mahasiswa');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<DevToolsStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DevToolsStudent | null>(null);
  const [resetTarget, setResetTarget] = useState<DevToolsStudent | null>(null);
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const breadcrumbs = useMemo(() => [{ label: 'Admin' }, { label: 'Development Tools' }], []);
  useEffect(() => { setBreadcrumbs(breadcrumbs); setTitle('Development Tools'); }, [setBreadcrumbs, setTitle, breadcrumbs]);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

  const effectiveStatus = statusFilter === 'all' ? '' : statusFilter;
  const { data: students, isLoading } = useDevToolsStudents(debouncedSearch, effectiveStatus);
  const mutations = useDevToolsMutations();
  const toggleExpand = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Development Tools — Hanya untuk Testing</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Fitur ini mengubah data secara langsung di database. Gunakan hanya untuk menguji skenario SIMPTA.</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
            <TabsTrigger value="users">Kelola User</TabsTrigger>
          </TabsList>
          <Button onClick={() => setCreateOpen(true)} size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Buat User Baru</Button>
        </div>

        {/* ========== TAB: MAHASISWA ========== */}
        <TabsContent value="mahasiswa" className="space-y-4 mt-4">
          <Card><CardContent className="pt-4 pb-4"><div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama, NIM, atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Status</SelectItem>
                {STUDENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div></CardContent></Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" />Daftar Mahasiswa{students && <Badge variant="secondary" className="ml-1">{students.length}</Badge>}
            </CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
              : !students?.length ? <div className="text-center py-12 text-sm text-muted-foreground">Tidak ada mahasiswa ditemukan.</div>
              : <div className="overflow-x-auto"><Table><TableHeader><TableRow>
                <TableHead className="w-10" /><TableHead>Nama / NIM</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-center">SKS</TableHead><TableHead className="text-center">Sem</TableHead>
                <TableHead className="text-center">MK Wajib</TableHead><TableHead className="text-center">MKWU</TableHead>
                <TableHead className="text-center">KP</TableHead><TableHead className="text-center">KKN</TableHead>
                <TableHead className="text-center">Metopen</TableHead><TableHead>Thesis</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader><TableBody>
                {students.map((s) => (
                  <StudentRow key={s.id} student={s} isExpanded={expandedId === s.id}
                    onToggle={() => toggleExpand(s.id)} onEdit={() => setEditStudent(s)}
                    onDelete={() => setDeleteTarget(s)} onReset={() => setResetTarget(s)}
                    onDeleteThesis={mutations.deleteThesis} isSubmitting={mutations.isSubmitting}
                    onPasswordChange={() => setPwTarget({ id: s.id, name: `${s.fullName} (${s.identityNumber})` })}
                    onMetopenSetEligible={() => mutations.setMetopenEligibility(s.id, true)}
                    onMetopenSetIneligible={() => mutations.setMetopenEligibility(s.id, false)}
                    onMetopenClear={() => mutations.setMetopenEligibility(s.id, null)}
                  />
                ))}
              </TableBody></Table></div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB: KELOLA USER ========== */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <UserManagementTab onPasswordChange={(id, name) => setPwTarget({ id, name })} mutations={mutations} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditStudentDialog student={editStudent} open={!!editStudent} onOpenChange={(o) => { if (!o) setEditStudent(null); }}
        onSave={mutations.updateStudent} isSubmitting={mutations.isSubmitting} />
      <PasswordDialog userId={pwTarget?.id ?? null} userName={pwTarget?.name ?? ''} open={!!pwTarget}
        onOpenChange={(o) => { if (!o) setPwTarget(null); }} onSave={mutations.changePassword} isSubmitting={mutations.isSubmitting} />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onSave={mutations.createUser} isSubmitting={mutations.isSubmitting} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle>
          <AlertDialogDescription>User <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.identityNumber}) akan dihapus beserta seluruh data terkait. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={mutations.isSubmitting}
              onClick={async () => { if (deleteTarget) { await mutations.deleteUser(deleteTarget.id); setDeleteTarget(null); if (expandedId === deleteTarget.id) setExpandedId(null); } }}>
              {mutations.isSubmitting ? 'Menghapus...' : 'Hapus Permanen'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset Data Mahasiswa?</AlertDialogTitle>
          <AlertDialogDescription>Data <strong>{resetTarget?.fullName}</strong> akan direset ke kondisi awal: SKS=0, Semester=1, semua flag=false, status=active.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={mutations.isSubmitting} onClick={async () => { if (resetTarget) { await mutations.resetStudent(resetTarget.id); setResetTarget(null); } }}>
              {mutations.isSubmitting ? 'Mereset...' : 'Reset'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ========== USER MANAGEMENT TAB ==========
function UserManagementTab({ onPasswordChange, mutations }: {
  onPasswordChange: (id: string, name: string) => void;
  mutations: ReturnType<typeof useDevToolsMutations>;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 400); return () => clearTimeout(t); }, [search]);

  const { data: allUsers, isLoading: usersLoading } = useDevToolsUsers(debounced);

  return (
    <>
      <Card><CardContent className="pt-4 pb-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari semua user (nama, NIM/NIP, email)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      </CardContent></Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4" />Semua User{allUsers && <Badge variant="secondary" className="ml-1">{allUsers.length}</Badge>}
        </CardTitle></CardHeader>
        <CardContent className="p-0">
          {usersLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          : !allUsers?.length ? <div className="text-center py-12 text-sm text-muted-foreground">Tidak ada user ditemukan.</div>
          : <div className="overflow-x-auto"><Table><TableHeader><TableRow>
            <TableHead>Nama</TableHead><TableHead>NIM/NIP</TableHead><TableHead>Tipe</TableHead><TableHead>Email</TableHead>
            <TableHead>Roles</TableHead><TableHead className="text-center">Verified</TableHead><TableHead className="text-right">Aksi</TableHead>
          </TableRow></TableHeader><TableBody>
            {allUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-sm">{u.fullName}</TableCell>
                <TableCell className="text-sm">{u.identityNumber}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{u.identityType}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email || '-'}</TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{u.roles.map((r, i) => <Badge key={i} variant="secondary" className="text-xs">{r.name}</Badge>)}</div></TableCell>
                <TableCell className="text-center"><BoolIcon value={u.isVerified} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Ubah Password" onClick={() => onPasswordChange(u.id, `${u.fullName} (${u.identityNumber})`)}><KeyRound className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Hapus"
                      onClick={() => setDeleteId({ id: u.id, name: u.fullName })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div>}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle>
          <AlertDialogDescription>User <strong>{deleteId?.name}</strong> akan dihapus beserta seluruh data terkait.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={mutations.isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={mutations.isSubmitting}
              onClick={async () => { if (deleteId) { await mutations.deleteUser(deleteId.id); setDeleteId(null); } }}>
              {mutations.isSubmitting ? 'Menghapus...' : 'Hapus'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
