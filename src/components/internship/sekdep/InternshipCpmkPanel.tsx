import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Plus, 
    Pencil, 
    Trash2, 
    ListChecks, 
    Loader2, 
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    getInternshipCpmks,
    createInternshipCpmk,
    updateInternshipCpmk,
    deleteInternshipCpmk,
    deleteInternshipRubric,
    type InternshipCpmk,
} from '@/services/internship.service';
import { getAcademicYearsAPI } from '@/services/admin.service';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function InternshipCpmkPanel() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [cpmkDialogOpen, setCpmkDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<{ id: string, type: 'CPMK' | 'RUBRIC' } | null>(null);
    const [editingCpmk, setEditingCpmk] = useState<InternshipCpmk | null>(null);
    
    // UI states
    const [expandedCpmkId, setExpandedCpmkId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // CPMK Form
    const [cpmkForm, setCpmkForm] = useState({
        code: '',
        name: '',
        weight: '',
        assessorType: 'LECTURER' as 'LECTURER' | 'FIELD'
    });

    // Academic Year states
    const [searchParams, setSearchParams] = useSearchParams();
    const academicYearId = searchParams.get('academicYearId') || 'all';

    const updateParams = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    const { data: ayData } = useQuery({
        queryKey: ['academic-years-all'],
        queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
    });
    const academicYears = ayData?.academicYears || [];

    useEffect(() => {
        if (academicYears.length > 0 && academicYearId === 'all') {
            const active = academicYears.find(ay => ay.isActive);
            if (active) updateParams({ academicYearId: active.id });
        }
    }, [academicYears, academicYearId]);

    const { data: cpmks = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['internship-cpmks', academicYearId],
        queryFn: () => getInternshipCpmks(academicYearId),
    });

    const totalWeight = useMemo(() => {
        return cpmks.reduce((acc, curr) => acc + curr.weight, 0);
    }, [cpmks]);

    // Mutations
    const cpmkMutation = useMutation({
        mutationFn: (data: { id?: string, payload: Partial<InternshipCpmk> & { academicYearId?: string } }) => 
            data.id ? updateInternshipCpmk(data.id, data.payload) : createInternshipCpmk(data.payload),
        onSuccess: (_, variables) => {
            toast.success(variables.id ? "CPMK berhasil diperbarui" : "CPMK berhasil ditambahkan");
            qc.invalidateQueries({ queryKey: ['internship-cpmks', academicYearId] });
            closeCpmkDialog();
        },
        onError: (e: any) => toast.error(e.message || "Gagal menyimpan CPMK"),
    });

    const deleteCpmkMutation = useMutation({
        mutationFn: (id: string) => deleteInternshipCpmk(id),
        onSuccess: () => {
            toast.success("CPMK berhasil dihapus");
            qc.invalidateQueries({ queryKey: ['internship-cpmks', academicYearId] });
            setDeleteId(null);
        },
        onError: (e: any) => toast.error(e.message || "Gagal menghapus CPMK"),
    });

    const deleteRubricMutation = useMutation({
        mutationFn: (id: string) => deleteInternshipRubric(id),
        onSuccess: () => {
            toast.success("Rubrik berhasil dihapus");
            qc.invalidateQueries({ queryKey: ['internship-cpmks', academicYearId] });
            setDeleteId(null);
        },
        onError: (e: any) => toast.error(e.message || "Gagal menghapus rubrik"),
    });

    // Handlers
    const openCreateCpmk = () => {
        setEditingCpmk(null);
        setCpmkForm({ code: '', name: '', weight: '', assessorType: 'LECTURER' });
        setCpmkDialogOpen(true);
    };

    const openEditCpmk = (item: InternshipCpmk) => {
        setEditingCpmk(item);
        setCpmkForm({
            code: item.code,
            name: item.name,
            weight: String(item.weight),
            assessorType: item.assessorType
        });
        setCpmkDialogOpen(true);
    };

    const closeCpmkDialog = () => {
        setCpmkDialogOpen(false);
        setEditingCpmk(null);
    };

    const handleCpmkSubmit = () => {
        const weight = parseFloat(cpmkForm.weight);
        if (isNaN(weight) || weight <= 0) {
            toast.error("Bobot harus berupa angka positif");
            return;
        }

        // Calculate if new total would exceed 100%
        const currentTotalExcludeSelf = cpmks
            .filter(c => c.id !== editingCpmk?.id)
            .reduce((acc, curr) => acc + curr.weight, 0);

        if (currentTotalExcludeSelf + weight > 100) {
            toast.error(`Total bobot melebihi 100% (Saat ini: ${currentTotalExcludeSelf}%, Sisa maksimal: ${100 - currentTotalExcludeSelf}%)`);
            return;
        }

        cpmkMutation.mutate({
            id: editingCpmk?.id,
            payload: {
                ...cpmkForm,
                weight: weight,
                academicYearId: editingCpmk ? undefined : academicYearId // Only for create
            }
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        if (deleteId.type === 'CPMK') {
            deleteCpmkMutation.mutate(deleteId.id);
        } else {
            deleteRubricMutation.mutate(deleteId.id);
        }
    };

    const columns: Column<InternshipCpmk>[] = useMemo(() => [
        {
            key: 'code',
            header: 'Kode',
            width: 100,
            render: (row) => <span className="font-mono font-medium">{row.code}</span>
        },
        {
            key: 'name',
            header: 'CPMK',
            render: (row) => <span className="font-medium">{row.name}</span>
        },
        {
            key: 'weight',
            header: 'Bobot',
            width: 100,
            className: 'text-center',
            render: (row) => (
                <Badge variant="secondary" className="font-semibold">
                    {row.weight}%
                </Badge>
            )
        },
        {
            key: 'assessorType',
            header: 'Assessor',
            width: 120,
            render: (row) => (
                <Badge variant="outline" className={cn(
                    row.assessorType === 'LECTURER' 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "bg-orange-50 text-orange-700 border-orange-200"
                )}>
                    {row.assessorType === 'LECTURER' ? 'Dosen' : 'Lapangan'}
                </Badge>
            )
        },
        {
            key: 'rubrics',
            header: 'Rubrik',
            width: 120,
            className: 'text-center',
            render: (row) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCpmkId(expandedCpmkId === row.id ? null : row.id);
                    }}
                >
                    <ListChecks className="size-3.5" />
                    <span>{row.rubrics?.length || 0}</span>
                    {expandedCpmkId === row.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
            )
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 80,
            className: 'text-center',
            render: (row) => (
                <div className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditCpmk(row); }}>
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId({ id: row.id, type: 'CPMK' }); }}>
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            )
        }
    ], [expandedCpmkId, navigate]);

    const renderRubricSection = (row: InternshipCpmk) => {
        return (
            <div className="p-4 bg-muted/20 border-t animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                             <ListChecks className="size-4" />
                             Rincian Rubrik Penilaian
                        </h4>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 gap-1.5 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => navigate(`/kelola/kerja-praktik/pendaftaran/cpmk/${row.id}/rubrik`)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Kelola Rubrik
                        </Button>
                    </div>
                    
                    {row.rubrics && row.rubrics.length > 0 ? (
                        <div className="border rounded-lg bg-card overflow-hidden mx-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead>Level Penilaian</TableHead>
                                        <TableHead className="w-[120px] text-center">Range Skor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {row.rubrics.map((rubric: any, idx: number) => (
                                        <TableRow key={rubric.id} className="transition-colors">
                                            <TableCell className="text-center text-muted-foreground font-medium">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-primary text-xs tracking-tight">
                                                    {rubric.levelName || 'Tanpa Nama'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono font-medium">
                                                    {rubric.minScore} - {rubric.maxScore}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-background/50 mx-2">
                            <p className="text-sm text-muted-foreground font-medium">Belum ada rubrik untuk CPMK ini.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const filteredCpmks = useMemo(() => {
        if (!searchTerm) return cpmks;
        const s = searchTerm.toLowerCase();
        return cpmks.filter(c => 
            c.code.toLowerCase().includes(s) || 
            c.name.toLowerCase().includes(s)
        );
    }, [cpmks, searchTerm]);

    const isPending = cpmkMutation.isPending || deleteCpmkMutation.isPending || deleteRubricMutation.isPending;

    return (
        <div className="space-y-6">
            <InternshipTable
                columns={columns as any}
                data={filteredCpmks}
                loading={isLoading}
                total={filteredCpmks.length}
                page={1}
                pageSize={filteredCpmks.length || 10}
                onPageChange={() => { }}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                emptyText="Belum ada data CPMK Internship."
                rowKey={(row) => row.id}
                onRowClick={(row: InternshipCpmk) => setExpandedCpmkId(expandedCpmkId === row.id ? null : row.id)}
                expandedRowRender={(row: InternshipCpmk) => renderRubricSection(row)}
                isRowExpanded={(row: InternshipCpmk) => expandedCpmkId === row.id}
                actions={
                    <div className="flex items-center gap-3">
                        <Select value={academicYearId} onValueChange={(v) => updateParams({ academicYearId: v })}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                {academicYears.map((ay) => (
                                    <SelectItem key={ay.id} value={ay.id}>
                                        <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                            {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 mr-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bobot:</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border">
                                <span className={cn(
                                    "text-sm font-bold tracking-tight",
                                    totalWeight === 100 ? "text-green-600" : totalWeight > 100 ? "text-destructive" : "text-primary"
                                )}>
                                    {totalWeight}%
                                </span>
                                {totalWeight > 100 && (
                                    <div className="size-1.5 rounded-full bg-destructive animate-pulse" title="Over weight!" />
                                )}
                                {totalWeight === 100 && (
                                    <div className="size-1.5 rounded-full bg-green-500" title="Perfect 100%" />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
                            <Button size="sm" onClick={openCreateCpmk} className="gap-1">
                                <Plus className="size-4" />
                                Tambah CPMK
                            </Button>
                        </div>
                    </div>
                }
            />

            {/* CPMK Dialog */}
            <Dialog open={cpmkDialogOpen} onOpenChange={setCpmkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCpmk ? "Edit CPMK Internship" : "Tambah CPMK Internship"}</DialogTitle>
                        <DialogDescription>
                            Gunakan kode unik untuk setiap CPMK dan tentukan siapa yang menilai.
                        </DialogDescription>

                        {/* Weight Budget Summary */}
                        <div className="mt-3 p-3 rounded-lg border bg-muted/30 space-y-2">
                             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Alokasi Bobot</span>
                                <span className={cn(
                                    (cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0) + (parseFloat(cpmkForm.weight) || 0)) > 100 
                                        ? "text-destructive" 
                                        : "text-primary"
                                )}>
                                    {cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0) + (parseFloat(cpmkForm.weight) || 0)}% / 100%
                                </span>
                             </div>
                             
                             <div className="relative h-2 bg-muted rounded-full overflow-hidden border">
                                {/* Base weight (other CPMKs) */}
                                <div 
                                    className="absolute inset-y-0 left-0 bg-primary/40 transition-all duration-500"
                                    style={{ width: `${Math.min(cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0), 100)}%` }}
                                />
                                {/* Current input weight */}
                                <div 
                                    className={cn(
                                        "absolute inset-y-0 transition-all duration-500",
                                        (cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0) + (parseFloat(cpmkForm.weight) || 0)) > 100 
                                            ? "bg-destructive" 
                                            : "bg-primary"
                                    )}
                                    style={{ 
                                        left: `${Math.min(cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0), 100)}%`,
                                        width: `${Math.min(parseFloat(cpmkForm.weight) || 0, 100 - cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0))}%` 
                                    }}
                                />
                             </div>

                             <div className="flex justify-between items-center text-[10px] italic">
                                <span className="text-muted-foreground">
                                    Sisa bobot tersedia: <span className="font-bold text-foreground">
                                        {Math.max(0, 100 - cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0))} %
                                    </span>
                                </span>
                                {(cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0) + (parseFloat(cpmkForm.weight) || 0)) > 100 && (
                                    <span className="text-destructive font-bold animate-pulse">Melebihi batas!</span>
                                )}
                             </div>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kode CPMK</Label>
                                <Input 
                                    placeholder="Contoh: CPMK-1" 
                                    value={cpmkForm.code}
                                    onChange={e => setCpmkForm(f => ({ ...f, code: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bobot (%)</Label>
                                <Input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Contoh: 20" 
                                    value={cpmkForm.weight}
                                    onChange={e => setCpmkForm(f => ({ ...f, weight: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama/Deskripsi CPMK</Label>
                            <Textarea 
                                placeholder="Tuliskan capaian pembelajaran..." 
                                value={cpmkForm.name}
                                onChange={e => setCpmkForm(f => ({ ...f, name: e.target.value }))}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Penilai Utama</Label>
                            <Select value={cpmkForm.assessorType} onValueChange={(v) => setCpmkForm(f => ({ ...f, assessorType: v as any }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LECTURER">Dosen Pembimbing</SelectItem>
                                    <SelectItem value="FIELD">Pembimbing Lapangan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeCpmkDialog} disabled={isPending}>Batal</Button>
                        <Button 
                            onClick={handleCpmkSubmit} 
                            disabled={
                                isPending || 
                                !cpmkForm.code || 
                                !cpmkForm.name || 
                                !cpmkForm.weight ||
                                (cpmks.filter(c => c.id !== editingCpmk?.id).reduce((acc, curr) => acc + curr.weight, 0) + (parseFloat(cpmkForm.weight) || 0)) > 100
                            }
                        >
                            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {deleteId?.type === 'CPMK' ? 'CPMK' : 'Rubrik'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini permanen. {deleteId?.type === 'CPMK' ? 'Seluruh rubrik terkait juga akan terhapus.' : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
