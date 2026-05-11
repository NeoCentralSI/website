import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
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
    Users,
    Settings,
    Pencil,
    ShieldCheck,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName } from '@/lib/text';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';

interface AcademicYear {
    id: string;
    year: number | string;
    semester: string;
    label?: string;
    isActive: boolean;
}

export default function KuotaBimbingan() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [selectedAyId, setSelectedAyId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
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

    // Fetch academic years from canonical admin API, not Metopen class flow.
    const { data: ayData } = useQuery({
        queryKey: ['academic-years', { pageSize: 100 }],
        queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
    });

    const academicYears: AcademicYear[] = useMemo(() => {
        if (!ayData) return [];
        return ayData.academicYears.map((item) => ({
            id: item.id,
            year: item.year,
            semester: item.semester,
            label: `${item.year} ${item.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
            isActive: item.isActive,
        }));
    }, [ayData]);

    // Auto-select active academic year
    useEffect(() => {
        if (academicYears.length > 0 && !selectedAyId) {
            const active = academicYears.find((ay) => ay.isActive);
            setSelectedAyId(active?.id || academicYears[0].id);
        }
    }, [academicYears, selectedAyId]);

    const selectedAy = academicYears.find((ay) => ay.id === selectedAyId);

    // Breadcrumbs & title
    const breadcrumbs = useMemo(() => [
        { label: 'Master Data' },
        { label: 'Kuota Bimbingan' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Kuota Bimbingan');
    }, [setBreadcrumbs, setTitle, breadcrumbs]);

    // Fetch default quota and lecturer quotas
    const { data: defaultQuota } = useDefaultQuota(selectedAyId || undefined);
    const {
        data: lecturerQuotas,
        isLoading: quotasLoading,
        isFetching: quotasFetching,
        refetch: refetchQuotas,
    } = useLecturerQuotas(selectedAyId || undefined, searchQuery || undefined);

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

    // Paginated data (client-side, API returns filtered by search)
    const allQuotas = useMemo(() => lecturerQuotas ?? [], [lecturerQuotas]);
    const total = allQuotas.length;
    const paginatedQuotas = useMemo(() => {
        const start = (page - 1) * pageSize;
        return allQuotas.slice(start, start + pageSize);
    }, [allQuotas, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const columns: Column<LecturerQuota>[] = [
        {
            key: 'no',
            header: 'No',
            className: 'text-muted-foreground w-[40px]',
            render: (_, idx) => (page - 1) * pageSize + idx + 1,
        },
        {
            key: 'fullName',
            header: 'Nama Dosen',
            render: (row) => toTitleCaseName(row.fullName),
        },
        {
            key: 'identityNumber',
            header: 'NIP',
            className: 'text-muted-foreground',
            render: (row) => row.identityNumber || '-',
        },
        {
            key: 'scienceGroup',
            header: 'Kelompok Keilmuan',
            render: (row) => row.scienceGroup || '-',
        },
        {
            key: 'activeCount',
            header: () => <span className="text-center block w-full">Aktif</span>,
            className: 'text-center',
            render: (row) => <span className="font-semibold">{row.activeCount}</span>,
        },
        {
            key: 'bookingCount',
            header: () => <span className="text-center block w-full">Booking</span>,
            className: 'text-center',
            render: (row) => row.bookingCount,
        },
        {
            key: 'pendingKadepCount',
            header: () => <span className="text-center block w-full">Pending KaDep</span>,
            className: 'text-center',
            render: (row) => row.pendingKadepCount,
        },
        {
            key: 'quotaMax',
            header: () => <span className="text-center block w-full">Kuota Max</span>,
            className: 'text-center',
            render: (row) => row.quotaMax,
        },
        {
            key: 'normalAvailable',
            header: () => <span className="text-center block w-full">Sisa Normal</span>,
            className: 'text-center',
            render: (row) => <span className="font-semibold">{row.normalAvailable}</span>,
        },
        {
            key: 'overquotaAmount',
            header: () => <span className="text-center block w-full">Overquota</span>,
            className: 'text-center',
            render: (row) => <span className={`font-semibold ${row.overquotaAmount > 0 ? 'text-red-600' : ''}`}>{row.overquotaAmount}</span>,
        },
        {
            key: 'status',
            header: () => <span className="text-center block w-full">Status</span>,
            className: 'text-center',
            render: (row) => getStatusBadge(row),
        },
        {
            key: 'actions',
            header: () => <span className="text-center block w-full">Aksi</span>,
            className: 'text-center',
            render: (row) => (
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-base font-semibold tracking-tight sm:text-lg">Kuota Bimbingan Dosen</h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
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
                                    {ay.label ?? `${ay.year} — ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`}
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

            {/* Table with CustomTable standard */}
            <CustomTable
                columns={columns}
                data={paginatedQuotas}
                loading={quotasLoading}
                isRefreshing={quotasFetching && !quotasLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                emptyText={
                    !selectedAyId
                        ? 'Pilih tahun ajaran terlebih dahulu'
                        : 'Belum ada data kuota. Klik "Set Default Kuota" untuk memulai.'
                }
                rowKey={(row) => row.id}
                actions={
                    <>
                        <RefreshButton
                            onClick={() => refetchQuotas()}
                            isRefreshing={quotasFetching && !quotasLoading}
                        />
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
                                Kuota default akan diterapkan ke seluruh dosen di tahun ajaran{' '}
                                <strong>
                                    {selectedAy ? (selectedAy.label ?? `${selectedAy.year} ${selectedAy.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`) : ''}
                                </strong>
                                . Dosen baru akan dibuatkan kuotanya, dan dosen yang sudah ada akan diperbarui sesuai nilai default ini.
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
                                {setDefaultMutation.isPending ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan & Generate'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                    </>
                }
            />

            {/* Edit Lecturer Quota Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Kuota — {editTarget ? toTitleCaseName(editTarget.fullName) : ''}</DialogTitle>
                        <DialogDescription>
                            Override kuota bimbingan individual untuk dosen ini (NIP: {editTarget?.identityNumber}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {editTarget && (
                            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
                                <p>
                                    <span className="text-muted-foreground">Beban total saat ini: </span>
                                    <span className="font-semibold tabular-nums">{editTarget.currentCount}</span>
                                    <span className="text-muted-foreground"> (aktif {editTarget.activeCount}, booking {editTarget.bookingCount})</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Pending validasi KaDep saat ini:{' '}
                                    <span className="font-medium text-foreground tabular-nums">
                                        {editTarget.pendingKadepCount}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Sisa normal jika hard limit = nilai di bawah:{' '}
                                    <span className="font-medium text-foreground tabular-nums">
                                        {Math.max(0, editMax - editTarget.currentCount)}
                                    </span>
                                </p>
                            </div>
                        )}
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
                                {updateLecturerMutation.isPending ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan'
                                )}
                            </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
