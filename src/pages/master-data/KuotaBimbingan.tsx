import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAcademicYearsAPI } from '@/services/admin.service';
import {
    useDefaultQuota,
    useSetDefaultQuota,
    useLecturerQuotas,
    useUpdateLecturerQuota,
} from '@/hooks/master-data/useSupervisionQuota';
import type { LecturerQuota } from '@/services/supervisionQuota.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    Settings,
    Search,
    Pencil,
    ShieldCheck,
    AlertTriangle,
    XCircle,
} from 'lucide-react';

interface AcademicYear {
    id: string;
    year: string;
    semester: string;
    isActive: boolean;
}

export default function KuotaBimbingan() {
    const [selectedAyId, setSelectedAyId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<LecturerQuota | null>(null);

    // Form state for default quota
    const [defaultMax, setDefaultMax] = useState(10);
    const [defaultSoft, setDefaultSoft] = useState(8);

    // Form state for lecturer edit
    const [editMax, setEditMax] = useState(10);
    const [editSoft, setEditSoft] = useState(8);
    const [editNotes, setEditNotes] = useState('');

    // Fetch academic years
    const { data: ayData } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => getAcademicYearsAPI(),
    });

    const academicYears: AcademicYear[] = useMemo(() => {
        if (!ayData) return [];
        const list = Array.isArray(ayData) ? ayData : (ayData as { academicYears?: AcademicYear[] })?.academicYears ?? [];
        return list;
    }, [ayData]);

    // Auto-select active academic year
    useMemo(() => {
        if (academicYears.length > 0 && !selectedAyId) {
            const active = academicYears.find((ay) => ay.isActive);
            setSelectedAyId(active?.id || academicYears[0].id);
        }
    }, [academicYears, selectedAyId]);

    const selectedAy = academicYears.find((ay) => ay.id === selectedAyId);

    // Fetch default quota and lecturer quotas
    const { data: defaultQuota } = useDefaultQuota(selectedAyId || undefined);
    const { data: lecturerQuotas, isLoading: quotasLoading } = useLecturerQuotas(
        selectedAyId || undefined,
        searchQuery || undefined
    );

    const setDefaultMutation = useSetDefaultQuota();
    const updateLecturerMutation = useUpdateLecturerQuota();

    // Stats
    const stats = useMemo(() => {
        if (!lecturerQuotas) return { total: 0, available: 0, nearLimit: 0, full: 0 };
        return {
            total: lecturerQuotas.length,
            available: lecturerQuotas.filter((q) => !q.isFull && !q.isNearLimit).length,
            nearLimit: lecturerQuotas.filter((q) => q.isNearLimit && !q.isFull).length,
            full: lecturerQuotas.filter((q) => q.isFull).length,
        };
    }, [lecturerQuotas]);

    // Handlers
    const handleSetDefault = () => {
        if (!selectedAyId) return;
        setDefaultMutation.mutate(
            { academicYearId: selectedAyId, data: { quotaMax: defaultMax, quotaSoftLimit: defaultSoft } },
            { onSuccess: () => setDefaultDialogOpen(false) }
        );
    };

    const handleOpenEdit = (lecturer: LecturerQuota) => {
        setEditTarget(lecturer);
        setEditMax(lecturer.quotaMax);
        setEditSoft(lecturer.quotaSoftLimit);
        setEditNotes(lecturer.notes || '');
        setEditDialogOpen(true);
    };

    const handleUpdateLecturer = () => {
        if (!editTarget || !selectedAyId) return;
        updateLecturerMutation.mutate(
            {
                lecturerId: editTarget.lecturerId,
                academicYearId: selectedAyId,
                data: { quotaMax: editMax, quotaSoftLimit: editSoft, notes: editNotes || null },
            },
            { onSuccess: () => setEditDialogOpen(false) }
        );
    };

    const handleOpenDefault = () => {
        setDefaultMax(defaultQuota?.quotaMax ?? 10);
        setDefaultSoft(defaultQuota?.quotaSoftLimit ?? 8);
        setDefaultDialogOpen(true);
    };

    const getStatusBadge = (lecturer: LecturerQuota) => {
        if (lecturer.isFull) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Penuh</Badge>;
        if (lecturer.isNearLimit) return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"><AlertTriangle className="h-3 w-3" /> Hampir Penuh</Badge>;
        return <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><ShieldCheck className="h-3 w-3" /> Tersedia</Badge>;
    };

    return (
        <div className="space-y-6 p-1">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kuota Bimbingan Dosen</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola kuota bimbingan dosen per tahun ajaran
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={selectedAyId} onValueChange={setSelectedAyId}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            {academicYears.map((ay) => (
                                <SelectItem key={ay.id} value={ay.id}>
                                    {ay.year}/{(ay.year ?? 0) + 1} — {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                    {ay.isActive ? ' (Aktif)' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Default Kuota</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{defaultQuota?.quotaMax ?? '-'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Soft limit: {defaultQuota?.quotaSoftLimit ?? '-'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dosen</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Terdaftar di periode ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hampir Penuh</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.nearLimit}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Mendekati batas soft limit
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Penuh</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.full}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sudah mencapai kuota max
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau NIP dosen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Dialog open={defaultDialogOpen} onOpenChange={setDefaultDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenDefault} disabled={!selectedAyId}>
                            <Settings className="mr-2 h-4 w-4" />
                            Set Default Kuota
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Default Kuota Bimbingan</DialogTitle>
                            <DialogDescription>
                                Set kuota default yang berlaku untuk semua dosen di tahun ajaran{' '}
                                <strong>
                                    {selectedAy ? `${selectedAy.year}/${(selectedAy.year ?? 0) + 1}` : ''}
                                </strong>
                                . Dosen yang belum memiliki kuota akan otomatis dibuatkan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="defaultMax">Hard Limit (Kuota Maksimum)</Label>
                                <Input
                                    id="defaultMax"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={defaultMax}
                                    onChange={(e) => setDefaultMax(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Jumlah mahasiswa bimbingan maksimal yang diizinkan
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="defaultSoft">Soft Limit (Batas Peringatan)</Label>
                                <Input
                                    id="defaultSoft"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={defaultSoft}
                                    onChange={(e) => setDefaultSoft(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Saat jumlah bimbingan mencapai ini, dosen ditandai "hampir penuh"
                                </p>
                            </div>
                            {defaultSoft > defaultMax && (
                                <p className="text-sm text-destructive">
                                    Soft limit tidak boleh lebih besar dari hard limit
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDefaultDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleSetDefault}
                                disabled={defaultSoft > defaultMax || setDefaultMutation.isPending}
                            >
                                {setDefaultMutation.isPending ? 'Menyimpan...' : 'Simpan & Generate'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">No</TableHead>
                                    <TableHead>Nama Dosen</TableHead>
                                    <TableHead>NIP</TableHead>
                                    <TableHead>Kelompok Keilmuan</TableHead>
                                    <TableHead className="text-center">Saat Ini</TableHead>
                                    <TableHead className="text-center">Soft Limit</TableHead>
                                    <TableHead className="text-center">Hard Limit</TableHead>
                                    <TableHead className="text-center">Sisa</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotasLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                                            Memuat data...
                                        </TableCell>
                                    </TableRow>
                                ) : !lecturerQuotas || lecturerQuotas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                                            {!selectedAyId
                                                ? 'Pilih tahun ajaran terlebih dahulu'
                                                : 'Belum ada data kuota. Klik "Set Default Kuota" untuk memulai.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lecturerQuotas.map((lq, idx) => (
                                        <TableRow key={lq.id}>
                                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                            <TableCell className="font-medium">{lq.fullName}</TableCell>
                                            <TableCell className="text-muted-foreground">{lq.identityNumber}</TableCell>
                                            <TableCell>{lq.scienceGroup || '-'}</TableCell>
                                            <TableCell className="text-center font-semibold">{lq.currentCount}</TableCell>
                                            <TableCell className="text-center">{lq.quotaSoftLimit}</TableCell>
                                            <TableCell className="text-center">{lq.quotaMax}</TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {lq.remaining > 0 ? lq.remaining : 0}
                                            </TableCell>
                                            <TableCell className="text-center">{getStatusBadge(lq)}</TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(lq)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Lecturer Quota Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Kuota — {editTarget?.fullName}</DialogTitle>
                        <DialogDescription>
                            Override kuota bimbingan individual untuk dosen ini (NIP: {editTarget?.identityNumber}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editMax">Hard Limit</Label>
                            <Input
                                id="editMax"
                                type="number"
                                min={0}
                                max={100}
                                value={editMax}
                                onChange={(e) => setEditMax(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editSoft">Soft Limit</Label>
                            <Input
                                id="editSoft"
                                type="number"
                                min={0}
                                max={100}
                                value={editSoft}
                                onChange={(e) => setEditSoft(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editNotes">Catatan (Opsional)</Label>
                            <Textarea
                                id="editNotes"
                                placeholder="Mis: Sedang cuti, kuota dikurangi"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        {editSoft > editMax && (
                            <p className="text-sm text-destructive">
                                Soft limit tidak boleh lebih besar dari hard limit
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdateLecturer}
                            disabled={editSoft > editMax || updateLecturerMutation.isPending}
                        >
                            {updateLecturerMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
